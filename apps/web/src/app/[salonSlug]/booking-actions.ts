"use server";

import { db } from "@/lib/db";
import { AppointmentService } from "@/services/AppointmentService";
import { revalidatePath } from "next/cache";
import { sendNotification, scheduleReminders } from "@/lib/notifications";
import { logAudit } from "@/lib/audit";
import { format } from "date-fns";

export async function bookAppointmentAction(
  salonId: string,
  data: {
    serviceId: string;
    staffId: string;
    startTime: string;
    firstName: string;
    lastName?: string;
    phone: string;
    email?: string;
  }
) {
  // 1. Find or create customer
  let customer = await db.customer.findUnique({
    where: { salonId_phone: { salonId, phone: data.phone } },
  });

  if (!customer) {
    customer = await db.customer.create({
      data: {
        salonId,
        firstName: data.firstName,
        lastName: data.lastName || null,
        phone: data.phone,
        email: data.email || null,
      },
    });
  }

  // 2. Book the appointment (transaction-safe)
  try {
    const appointment = await AppointmentService.bookAppointment(
      salonId,
      customer.id,
      data.staffId,
      data.serviceId,
      new Date(data.startTime)
    );

    // 3. Fetch service and staff names for notifications
    const [service, staff] = await Promise.all([
      db.service.findUnique({ where: { id: data.serviceId } }),
      db.staff.findUnique({ where: { id: data.staffId } }),
    ]);

    // 4. Send confirmation notification
    if (customer.email) {
      await sendNotification({
        salonId,
        appointmentId: appointment.id,
        type: "CONFIRMATION",
        recipientEmail: customer.email,
        recipientName: customer.firstName,
        appointmentDate: format(new Date(data.startTime), "EEEE, MMM d 'at' h:mm a"),
        serviceName: service?.name || "Service",
        staffName: staff?.name || "Staff",
      });

      // 5. Schedule reminders (24h + 2h before)
      await scheduleReminders({
        salonId,
        appointmentId: appointment.id,
        recipientEmail: customer.email,
        recipientName: customer.firstName,
        appointmentDate: format(new Date(data.startTime), "EEEE, MMM d 'at' h:mm a"),
        serviceName: service?.name || "Service",
        staffName: staff?.name || "Staff",
        startTime: new Date(data.startTime),
      });
    }

    await logAudit({ salonId, action: "CREATE", entity: "APPOINTMENT", entityId: appointment.id });

    revalidatePath(`/`);
    return { success: true, appointmentId: appointment.id };
  } catch (error: any) {
    return { success: false, error: error.message || "Booking failed" };
  }
}

export async function cancelAppointmentAction(appointmentId: string, salonId: string) {
  const appointment = await db.appointment.update({
    where: { id: appointmentId },
    data: { status: "CANCELLED" },
    include: { customer: true, service: true, staff: true },
  });

  if (appointment.customer.email) {
    await sendNotification({
      salonId,
      appointmentId: appointment.id,
      type: "CANCELLATION",
      recipientEmail: appointment.customer.email,
      recipientName: appointment.customer.firstName,
      appointmentDate: format(new Date(appointment.startTime), "EEEE, MMM d 'at' h:mm a"),
      serviceName: appointment.service.name,
      staffName: appointment.staff.name,
    });
  }

  await logAudit({ salonId, action: "CANCEL", entity: "APPOINTMENT", entityId: appointmentId });
  return { success: true };
}
