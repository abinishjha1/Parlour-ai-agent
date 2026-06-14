"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { logAudit } from "@/lib/audit";

export async function updateAppointmentStatus(appointmentId: string, salonId: string, status: string) {
  const appointment = await db.appointment.update({
    where: { id: appointmentId },
    data: { status: status as any },
    include: { customer: true, service: true },
  });

  // If completed, update customer totalSpend and lastVisit
  if (status === "COMPLETED") {
    await db.customer.update({
      where: { id: appointment.customerId },
      data: {
        totalSpend: { increment: appointment.totalPrice },
        lastVisit: new Date(),
      },
    });
  }

  await logAudit({
    salonId,
    action: status === "CANCELLED" ? "CANCEL" : "UPDATE",
    entity: "APPOINTMENT",
    entityId: appointmentId,
    metadata: { newStatus: status },
  });

  revalidatePath("/dashboard/appointments");
  revalidatePath("/dashboard");
  return appointment;
}
