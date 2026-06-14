import { AppointmentRepository } from "../repositories/AppointmentRepository";
import { db } from "@/lib/db";
import { addMinutes, isBefore, isAfter, parse, format, startOfDay } from "date-fns";

export class AppointmentService {
  /**
   * Generates available time slots for a specific staff member and service on a specific date.
   */
  static async getAvailableSlots(salonId: string, staffId: string, serviceId: string, date: Date) {
    const dayOfWeek = date.getDay();

    // 1. Fetch Service details (duration)
    const service = await db.service.findUnique({ where: { id: serviceId } });
    if (!service) throw new Error("Service not found");

    // 2. Fetch Business Hours & Staff Hours
    const [businessHour, staffHour] = await Promise.all([
      db.businessHour.findUnique({ where: { salonId_dayOfWeek: { salonId, dayOfWeek } } }),
      db.staffHour.findUnique({ where: { staffId_dayOfWeek: { staffId, dayOfWeek } } }),
    ]);

    if (!businessHour || businessHour.isClosed || !staffHour || staffHour.isOff) {
      return []; // Salon or staff is closed/off today
    }

    // Determine actual open and close times for the staff (intersection of business and staff hours)
    const dateStr = format(date, "yyyy-MM-dd");
    const bizOpen = parse(`${dateStr} ${businessHour.openTime}`, "yyyy-MM-dd HH:mm", new Date());
    const bizClose = parse(`${dateStr} ${businessHour.closeTime}`, "yyyy-MM-dd HH:mm", new Date());
    const stfOpen = parse(`${dateStr} ${staffHour.openTime}`, "yyyy-MM-dd HH:mm", new Date());
    const stfClose = parse(`${dateStr} ${staffHour.closeTime}`, "yyyy-MM-dd HH:mm", new Date());

    const actualOpen = isAfter(stfOpen, bizOpen) ? stfOpen : bizOpen;
    const actualClose = isBefore(stfClose, bizClose) ? stfClose : bizClose;

    if (isBefore(actualClose, actualOpen)) return []; // Invalid hours

    // 3. Fetch existing appointments for the day
    const dayStart = startOfDay(date);
    const dayEnd = addMinutes(dayStart, 24 * 60);
    const existingAppointments = await AppointmentRepository.getStaffSchedule(staffId, dayStart, dayEnd);

    // 4. Generate Slots
    const slots: Date[] = [];
    let currentSlot = actualOpen;
    const now = new Date();

    while (addMinutes(currentSlot, service.duration) <= actualClose) {
      const slotEnd = addMinutes(currentSlot, service.duration);

      // Check if slot is in the past
      if (isBefore(currentSlot, now)) {
        currentSlot = addMinutes(currentSlot, 15); // advance by 15 mins
        continue;
      }

      // Check for overlap with existing appointments
      const isOverlapping = existingAppointments.some((appt) => {
        return (
          (currentSlot >= appt.startTime && currentSlot < appt.endTime) ||
          (slotEnd > appt.startTime && slotEnd <= appt.endTime) ||
          (currentSlot <= appt.startTime && slotEnd >= appt.endTime)
        );
      });

      if (!isOverlapping) {
        slots.push(currentSlot);
      }

      // Step by 15 mins intervals (configurable)
      currentSlot = addMinutes(currentSlot, 15);
    }

    return slots;
  }

  /**
   * Books an appointment with transactional safety to prevent double booking.
   */
  static async bookAppointment(
    salonId: string,
    customerId: string,
    staffId: string,
    serviceId: string,
    startTime: Date
  ) {
    // Note: To handle 10,000 req/s, this would ideally be guarded by a Redis Redlock 
    // to prevent DB hitting constraints and serializable deadlocks on high concurrency.
    return db.$transaction(async (tx) => {
      const service = await tx.service.findUnique({ where: { id: serviceId } });
      if (!service) throw new Error("Service not found");

      const endTime = addMinutes(startTime, service.duration);

      // Check overlap in transaction
      const overlap = await tx.appointment.findFirst({
        where: {
          staffId,
          status: { notIn: ["CANCELLED"] },
          OR: [
            { startTime: { gte: startTime, lt: endTime } },
            { endTime: { gt: startTime, lte: endTime } },
            { startTime: { lte: startTime }, endTime: { gte: endTime } },
          ],
        },
      });

      if (overlap) {
        throw new Error("This slot is already booked.");
      }

      return tx.appointment.create({
        data: {
          salonId,
          customerId,
          staffId,
          serviceId,
          startTime,
          endTime,
          totalPrice: service.price,
          status: "CONFIRMED", // Or PENDING if payment required
        },
      });
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });
  }
}
