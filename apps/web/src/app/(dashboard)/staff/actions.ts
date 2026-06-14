"use server";

import { db } from "@/lib/db";
import { staffSchema } from "@/validators";
import { revalidatePath } from "next/cache";

export async function getStaff(salonId: string) {
  return db.staff.findMany({
    where: { salonId, deletedAt: null },
    orderBy: { createdAt: "desc" }
  });
}

export async function createStaff(salonId: string, formData: FormData) {
  const data = Object.fromEntries(formData.entries());
  
  const parsed = staffSchema.safeParse({
    name: data.name,
    phone: data.phone,
  });

  if (!parsed.success) {
    return { error: parsed.error.flatten() };
  }

  await db.staff.create({
    data: {
      ...parsed.data,
      salonId,
    }
  });

  revalidatePath("/dashboard/staff");
  return { success: true };
}

export async function deleteStaff(staffId: string) {
  await db.staff.update({
    where: { id: staffId },
    data: { deletedAt: new Date() }
  });
  revalidatePath("/dashboard/staff");
  return { success: true };
}
