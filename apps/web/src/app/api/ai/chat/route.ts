import { openai } from '@ai-sdk/openai';
import { streamText, tool } from 'ai';
import { z } from 'zod';
import { AppointmentService } from '@/services/AppointmentService';
import { db } from '@/lib/db';
import { format } from 'date-fns';

export const maxDuration = 30; // 30 seconds for AI execution

export async function POST(req: Request) {
  const { messages, salonId } = await req.json();

  if (!salonId) {
    return new Response("salonId is required", { status: 400 });
  }

  const result = streamText({
    model: openai('gpt-4o-mini'),
    system: `You are a helpful, professional AI Receptionist for a salon. 
    Your goal is to help customers book appointments, check availability, and list services.
    Always be polite and concise.
    Today's date is ${format(new Date(), 'yyyy-MM-dd')}.
    If a user wants to book, always ask for the service and staff member (or no preference). 
    Check availability before confirming anything.
    If you successfully book an appointment, give them their appointment details.`,
    messages,
    tools: {
      getServices: tool({
        description: 'Get a list of all services offered at this salon.',
        parameters: z.object({}),
        execute: async () => {
          const services = await db.service.findMany({ where: { salonId } });
          return services.map(s => ({ id: s.id, name: s.name, price: s.price, duration: s.duration }));
        },
      }),
      checkAvailability: tool({
        description: 'Check available time slots for a specific service and staff member on a specific date.',
        parameters: z.object({
          serviceId: z.string().uuid().describe('The ID of the service'),
          staffId: z.string().uuid().describe('The ID of the staff member'),
          date: z.string().describe('The date to check in YYYY-MM-DD format'),
        }),
        execute: async ({ serviceId, staffId, date }) => {
          try {
            const slots = await AppointmentService.getAvailableSlots(salonId, staffId, serviceId, new Date(date));
            return slots.map(d => format(d, 'HH:mm'));
          } catch (error) {
            return { error: 'Failed to fetch availability. Please check the date.' };
          }
        },
      }),
      bookAppointment: tool({
        description: 'Book an appointment for a customer.',
        parameters: z.object({
          serviceId: z.string().uuid(),
          staffId: z.string().uuid(),
          customerId: z.string().uuid(),
          startTime: z.string().datetime(),
        }),
        execute: async ({ serviceId, staffId, customerId, startTime }) => {
          try {
            const appointment = await AppointmentService.bookAppointment(salonId, customerId, staffId, serviceId, new Date(startTime));
            return { success: true, appointmentId: appointment.id, status: appointment.status };
          } catch (error: any) {
            return { error: error.message };
          }
        },
      })
    },
  });

  return result.toDataStreamResponse();
}
