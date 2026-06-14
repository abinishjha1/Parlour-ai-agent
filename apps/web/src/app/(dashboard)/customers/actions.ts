"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { logAudit } from "@/lib/audit";

export async function getCustomers(salonId: string, search?: string) {
  return db.customer.findMany({
    where: {
      salonId,
      ...(search
        ? {
            OR: [
              { firstName: { contains: search, mode: "insensitive" } },
              { lastName: { contains: search, mode: "insensitive" } },
              { phone: { contains: search } },
              { email: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: {
      _count: { select: { appointments: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createCustomer(salonId: string, formData: FormData) {
  const customer = await db.customer.create({
    data: {
      salonId,
      firstName: formData.get("firstName") as string,
      lastName: (formData.get("lastName") as string) || null,
      email: (formData.get("email") as string) || null,
      phone: formData.get("phone") as string,
      notes: (formData.get("notes") as string) || null,
    },
  });

  await logAudit({
    salonId,
    action: "CREATE",
    entity: "CUSTOMER",
    entityId: customer.id,
  });

  revalidatePath("/dashboard/customers");
  return customer;
}

export async function updateCustomerNotes(customerId: string, salonId: string, notes: string) {
  await db.customer.update({
    where: { id: customerId },
    data: { notes },
  });

  await logAudit({
    salonId,
    action: "UPDATE",
    entity: "CUSTOMER",
    entityId: customerId,
    metadata: { field: "notes" },
  });

  revalidatePath("/dashboard/customers");
}
