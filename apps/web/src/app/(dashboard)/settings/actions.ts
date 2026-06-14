"use server";

import { db } from "@/lib/db";
import { geocodeAddress } from "@/lib/geocode";
import { revalidatePath } from "next/cache";
import { logAudit } from "@/lib/audit";

export async function updateSalonDetails(salonId: string, formData: FormData) {
  const name = formData.get("name") as string;
  const phone = formData.get("phone") as string;
  const timezone = formData.get("timezone") as string;

  await db.salon.update({
    where: { id: salonId },
    data: { name, phone, timezone },
  });

  await logAudit({ salonId, action: "UPDATE", entity: "SALON", entityId: salonId });
  revalidatePath("/dashboard/settings");
  return { success: true };
}

export async function updateSalonLocation(salonId: string, formData: FormData) {
  const address = formData.get("address") as string;
  const city = formData.get("city") as string;
  const state = formData.get("state") as string;
  const zipCode = formData.get("zipCode") as string;

  const coords = await geocodeAddress(address, city, state, zipCode);

  await db.salon.update({
    where: { id: salonId },
    data: {
      address, city, state, zipCode,
      latitude: coords?.lat || null,
      longitude: coords?.lng || null,
      isListed: true,
    },
  });

  await logAudit({ salonId, action: "UPDATE", entity: "SALON", entityId: salonId, metadata: { field: "location" } });
  revalidatePath("/dashboard/settings");
  revalidatePath("/");
  return { success: true };
}

export async function updateBusinessHours(salonId: string, formData: FormData) {
  const days = [0, 1, 2, 3, 4, 5, 6];

  for (const day of days) {
    const isClosed = formData.get(`closed_${day}`) === "on";
    const openTime = (formData.get(`open_${day}`) as string) || "09:00";
    const closeTime = (formData.get(`close_${day}`) as string) || "18:00";

    await db.businessHour.upsert({
      where: { salonId_dayOfWeek: { salonId, dayOfWeek: day } },
      update: { openTime, closeTime, isClosed },
      create: { salonId, dayOfWeek: day, openTime, closeTime, isClosed },
    });
  }

  await logAudit({ salonId, action: "UPDATE", entity: "SALON", entityId: salonId, metadata: { field: "businessHours" } });
  revalidatePath("/dashboard/settings");
  return { success: true };
}

export async function addHoliday(salonId: string, formData: FormData) {
  const dateStr = formData.get("date") as string;
  const reason = formData.get("reason") as string;

  await db.holiday.create({
    data: {
      salonId,
      date: new Date(dateStr),
      reason: reason || null,
    },
  });

  await logAudit({ salonId, action: "CREATE", entity: "HOLIDAY" });
  revalidatePath("/dashboard/settings");
  return { success: true };
}

export async function deleteHoliday(holidayId: string, salonId: string) {
  await db.holiday.delete({ where: { id: holidayId } });
  await logAudit({ salonId, action: "DELETE", entity: "HOLIDAY", entityId: holidayId });
  revalidatePath("/dashboard/settings");
}
