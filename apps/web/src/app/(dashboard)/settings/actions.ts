"use server";

import { db } from "@/lib/db";
import { geocodeAddress } from "@/lib/geocode";
import { revalidatePath } from "next/cache";

export async function updateSalonLocation(salonId: string, formData: FormData) {
  const address = formData.get("address") as string;
  const city = formData.get("city") as string;
  const state = formData.get("state") as string;
  const zipCode = formData.get("zipCode") as string;

  // 1. Fetch exact map coordinates from OpenStreetMap
  const coords = await geocodeAddress(address, city, state, zipCode);

  // 2. Update Database with new location and map coordinates
  await db.salon.update({
    where: { id: salonId },
    data: {
      address,
      city,
      state,
      zipCode,
      latitude: coords?.lat || null,
      longitude: coords?.lng || null,
      isListed: true // List on the marketplace
    }
  });

  revalidatePath("/dashboard/settings");
  revalidatePath("/"); // Revalidate marketplace homepage
  return { success: true };
}
