import { db } from "@/lib/db";

/**
 * Notification service for sending emails via QStash + Resend.
 * Creates a Notification record in DB and dispatches via QStash.
 */
export async function sendNotification(params: {
  salonId: string;
  appointmentId: string;
  type: "CONFIRMATION" | "CANCELLATION" | "RESCHEDULE" | "REMINDER";
  recipientEmail: string;
  recipientName: string;
  appointmentDate: string;
  serviceName: string;
  staffName: string;
}) {
  // 1. Create notification record
  const notification = await db.notification.create({
    data: {
      salonId: params.salonId,
      type: params.type,
      channel: "EMAIL",
      recipient: params.recipientEmail,
      subject: getSubject(params.type, params.serviceName),
      body: getBody(params),
      status: "PENDING",
      appointmentId: params.appointmentId,
    },
  });

  // 2. Dispatch email via QStash → /api/webhooks/qstash
  if (process.env.QSTASH_TOKEN) {
    try {
      const res = await fetch("https://qstash.upstash.io/v2/publish/", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.QSTASH_TOKEN}`,
          "Content-Type": "application/json",
          "Upstash-Forward-Url": `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/webhooks/qstash`,
        },
        body: JSON.stringify({
          type: "SEND_CONFIRMATION_EMAIL",
          notificationId: notification.id,
          customerEmail: params.recipientEmail,
          customerName: params.recipientName,
          appointmentDate: params.appointmentDate,
          serviceName: params.serviceName,
          staffName: params.staffName,
          emailType: params.type,
        }),
      });

      if (res.ok) {
        await db.notification.update({
          where: { id: notification.id },
          data: { status: "SENT" },
        });
      }
    } catch (error) {
      console.error("QStash dispatch error:", error);
      await db.notification.update({
        where: { id: notification.id },
        data: { status: "FAILED" },
      });
    }
  }

  return notification;
}

/**
 * Schedule reminder notifications for an appointment.
 * Fires 24h and 2h before the appointment time.
 */
export async function scheduleReminders(params: {
  salonId: string;
  appointmentId: string;
  recipientEmail: string;
  recipientName: string;
  appointmentDate: string;
  serviceName: string;
  staffName: string;
  startTime: Date;
}) {
  if (!process.env.QSTASH_TOKEN) return;

  const now = new Date();
  const appointmentTime = new Date(params.startTime);

  // 24h reminder
  const reminder24h = new Date(appointmentTime.getTime() - 24 * 60 * 60 * 1000);
  if (reminder24h > now) {
    try {
      await fetch("https://qstash.upstash.io/v2/publish/", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.QSTASH_TOKEN}`,
          "Content-Type": "application/json",
          "Upstash-Forward-Url": `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/webhooks/qstash`,
          "Upstash-Not-Before": Math.floor(reminder24h.getTime() / 1000).toString(),
        },
        body: JSON.stringify({
          type: "SEND_CONFIRMATION_EMAIL",
          customerEmail: params.recipientEmail,
          customerName: params.recipientName,
          appointmentDate: params.appointmentDate,
          serviceName: params.serviceName,
          staffName: params.staffName,
          emailType: "REMINDER",
        }),
      });
    } catch (e) {
      console.error("Failed to schedule 24h reminder:", e);
    }
  }

  // 2h reminder
  const reminder2h = new Date(appointmentTime.getTime() - 2 * 60 * 60 * 1000);
  if (reminder2h > now) {
    try {
      await fetch("https://qstash.upstash.io/v2/publish/", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.QSTASH_TOKEN}`,
          "Content-Type": "application/json",
          "Upstash-Forward-Url": `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/webhooks/qstash`,
          "Upstash-Not-Before": Math.floor(reminder2h.getTime() / 1000).toString(),
        },
        body: JSON.stringify({
          type: "SEND_CONFIRMATION_EMAIL",
          customerEmail: params.recipientEmail,
          customerName: params.recipientName,
          appointmentDate: params.appointmentDate,
          serviceName: params.serviceName,
          staffName: params.staffName,
          emailType: "REMINDER",
        }),
      });
    } catch (e) {
      console.error("Failed to schedule 2h reminder:", e);
    }
  }
}

function getSubject(type: string, serviceName: string): string {
  switch (type) {
    case "CONFIRMATION": return `Appointment Confirmed — ${serviceName}`;
    case "CANCELLATION": return `Appointment Cancelled — ${serviceName}`;
    case "RESCHEDULE": return `Appointment Rescheduled — ${serviceName}`;
    case "REMINDER": return `Reminder: Your ${serviceName} appointment is coming up!`;
    default: return "SalonFlow AI Notification";
  }
}

function getBody(params: { type: string; recipientName: string; appointmentDate: string; serviceName: string; staffName: string }): string {
  switch (params.type) {
    case "CONFIRMATION":
      return `Hi ${params.recipientName}, your ${params.serviceName} appointment with ${params.staffName} on ${params.appointmentDate} is confirmed!`;
    case "CANCELLATION":
      return `Hi ${params.recipientName}, your ${params.serviceName} appointment on ${params.appointmentDate} has been cancelled.`;
    case "RESCHEDULE":
      return `Hi ${params.recipientName}, your ${params.serviceName} appointment has been rescheduled to ${params.appointmentDate} with ${params.staffName}.`;
    case "REMINDER":
      return `Hi ${params.recipientName}, just a reminder — your ${params.serviceName} appointment with ${params.staffName} is on ${params.appointmentDate}. See you soon!`;
    default:
      return "";
  }
}
