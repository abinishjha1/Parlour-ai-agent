"use server";

import { db } from "@/lib/db";
import { serviceSchema } from "@/validators";
import { revalidatePath } from "next/cache";

export async function getServices(salonId: string) {
  return db.service.findMany({
    where: { salonId, deletedAt: null },
    orderBy: { createdAt: "desc" }
  });
}

export async function createService(salonId: string, formData: FormData) {
  const data = Object.fromEntries(formData.entries());
  
  const parsed = serviceSchema.safeParse({
    name: data.name,
    description: data.description,
    price: parseFloat(data.price as string),
    duration: parseInt(data.duration as string, 10),
    categoryId: data.categoryId,
  });

  if (!parsed.success) {
    return { error: parsed.error.flatten() };
  }

  await db.service.create({
    data: {
      ...parsed.data,
      salonId,
    }
  });

  revalidatePath("/dashboard/services");
  return { success: true };
}

export async function deleteService(serviceId: string) {
  await db.service.update({
    where: { id: serviceId },
    data: { deletedAt: new Date() }
  });
  revalidatePath("/dashboard/services");
  return { success: true };
}
