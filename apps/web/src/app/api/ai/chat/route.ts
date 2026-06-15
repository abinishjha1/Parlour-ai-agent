import { openai } from '@ai-sdk/openai';
import { streamText, tool } from 'ai';
import { z } from 'zod';
import { AppointmentService } from '@/services/AppointmentService';
import { db } from '@/lib/db';
import { format } from 'date-fns';

export const maxDuration = 30;

export async function POST(req: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return new Response(
      JSON.stringify({ error: "AI Receptionist is not configured yet. Please add an OPENAI_API_KEY to your environment variables." }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }

  const { messages, salonId } = await req.json();

  if (!salonId) {
    return new Response("salonId is required", { status: 400 });
  }

  const result = streamText({
    model: openai('gpt-4o-mini'),
    system: `You are a helpful, professional AI Receptionist for a salon. 
    Your goal is to help customers book appointments, check availability, cancel or reschedule bookings, and list services.
    Always be polite, concise, and helpful.
    Today's date is ${format(new Date(), 'yyyy-MM-dd')}.
    When a user wants to book, ask for:
    1. Which service they want (use getServices to show options)
    2. Which staff member they prefer (use listStaff to show options)
    3. What date they'd like
    Then check availability and confirm.
    If they want to cancel, ask for their phone number to find their booking.
    Always confirm before making changes.`,
    messages,
    tools: {
      getServices: tool({
        description: 'Get a list of all services offered at this salon with prices and durations.',
        parameters: z.object({}),
        // @ts-expect-error AI SDK type issue with empty parameters
        execute: async (_args) => {
          const services = await db.service.findMany({
            where: { salonId, deletedAt: null },
          });
          return services.map(s => ({
            id: s.id, name: s.name, price: s.price, duration: s.duration,
          }));
        },
      }),
      listStaff: tool({
        description: 'Get a list of all staff members available at this salon.',
        parameters: z.object({}),
        // @ts-expect-error AI SDK type issue with empty parameters
        execute: async (_args) => {
          const staff = await db.staff.findMany({
            where: { salonId, deletedAt: null },
          });
          return staff.map(s => ({ id: s.id, name: s.name }));
        },
      }),
      checkAvailability: tool({
        description: 'Check available time slots for a specific service and staff member on a specific date.',
        parameters: z.object({
          serviceId: z.string().uuid().describe('The ID of the service'),
          staffId: z.string().uuid().describe('The ID of the staff member'),
          date: z.string().describe('The date to check in YYYY-MM-DD format'),
        }),
        // @ts-ignore AI SDK type issue
        execute: async ({ serviceId, staffId, date }) => {
          try {
            const slots = await AppointmentService.getAvailableSlots(salonId, staffId, serviceId, new Date(date));
            if (slots.length === 0) return { message: 'No slots available on this date.' };
            return slots.map(d => format(d, 'HH:mm'));
          } catch (error) {
            return { error: 'Failed to fetch availability. Please check the date.' };
          }
        },
      }),
      bookAppointment: tool({
        description: 'Book an appointment for a customer. Requires a customer to already exist or their details.',
        parameters: z.object({
          serviceId: z.string().uuid(),
          staffId: z.string().uuid(),
          customerPhone: z.string().describe('Customer phone number'),
          customerName: z.string().describe('Customer first name'),
          startTime: z.string().describe('ISO datetime string for the appointment start'),
        }),
        // @ts-ignore AI SDK type issue
        execute: async ({ serviceId, staffId, customerPhone, customerName, startTime }) => {
          try {
            // Find or create customer
            let customer = await db.customer.findUnique({
              where: { salonId_phone: { salonId, phone: customerPhone } },
            });
            if (!customer) {
              customer = await db.customer.create({
                data: { salonId, firstName: customerName, phone: customerPhone },
              });
            }

            const appointment = await AppointmentService.bookAppointment(
              salonId, customer.id, staffId, serviceId, new Date(startTime)
            );
            return {
              success: true,
              appointmentId: appointment.id,
              message: `Appointment booked! ID: ${appointment.id}. Status: ${appointment.status}.`,
            };
          } catch (error: any) {
            return { error: error.message };
          }
        },
      }),
      cancelAppointment: tool({
        description: 'Cancel an upcoming appointment. Looks up by customer phone number.',
        parameters: z.object({
          customerPhone: z.string().describe('The customer phone number to look up'),
        }),
        // @ts-ignore AI SDK type issue
        execute: async ({ customerPhone }) => {
          try {
            const customer = await db.customer.findUnique({
              where: { salonId_phone: { salonId, phone: customerPhone } },
            });
            if (!customer) return { error: 'No customer found with this phone number.' };

            const upcoming = await db.appointment.findMany({
              where: {
                customerId: customer.id,
                salonId,
                startTime: { gte: new Date() },
                status: { notIn: ['CANCELLED'] },
              },
              include: { service: true, staff: true },
              orderBy: { startTime: 'asc' },
              take: 5,
            });

            if (upcoming.length === 0) return { message: 'No upcoming appointments found.' };

            if (upcoming.length === 1) {
              await db.appointment.update({
                where: { id: upcoming[0].id },
                data: { status: 'CANCELLED' },
              });
              return {
                success: true,
                message: `Cancelled your ${upcoming[0].service.name} appointment on ${format(new Date(upcoming[0].startTime), 'MMM d at h:mm a')}.`,
              };
            }

            // Multiple upcoming — return list for user to pick
            return {
              message: 'Multiple upcoming appointments found. Please specify which one to cancel:',
              appointments: upcoming.map(a => ({
                id: a.id,
                service: a.service.name,
                staff: a.staff.name,
                date: format(new Date(a.startTime), 'EEEE, MMM d at h:mm a'),
              })),
            };
          } catch (error: any) {
            return { error: error.message };
          }
        },
      }),
      rescheduleAppointment: tool({
        description: 'Reschedule an existing appointment to a new date and time.',
        parameters: z.object({
          appointmentId: z.string().uuid().describe('The appointment ID to reschedule'),
          newStartTime: z.string().describe('The new ISO datetime for the appointment'),
        }),
        // @ts-ignore AI SDK type issue
        execute: async ({ appointmentId, newStartTime }) => {
          try {
            const existing = await db.appointment.findUnique({
              where: { id: appointmentId },
              include: { service: true },
            });
            if (!existing) return { error: 'Appointment not found.' };

            // Cancel old
            await db.appointment.update({
              where: { id: appointmentId },
              data: { status: 'CANCELLED' },
            });

            // Book new
            const newAppointment = await AppointmentService.bookAppointment(
              salonId,
              existing.customerId,
              existing.staffId,
              existing.serviceId,
              new Date(newStartTime)
            );

            return {
              success: true,
              message: `Rescheduled! New appointment ID: ${newAppointment.id} on ${format(new Date(newStartTime), 'EEEE, MMM d at h:mm a')}.`,
            };
          } catch (error: any) {
            return { error: error.message };
          }
        },
      }),
    },
  });

  return result.toTextStreamResponse();
}
