"use server";

import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { logAudit } from "@/lib/audit";

export async function createSalonAction(formData: FormData) {
  const { userId, dbUser } = await getCurrentUser();

  const name = formData.get("name") as string;
  const phone = formData.get("phone") as string;

  // Generate slug from name
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();

  // Check if slug is taken
  const existing = await db.salon.findUnique({ where: { slug } });
  if (existing) {
    return { error: "This salon name is already taken. Please choose another." };
  }

  // Create salon
  const salon = await db.salon.create({
    data: {
      name,
      slug,
      phone: phone || null,
      timezone: "Asia/Kolkata",
    },
  });

  // Create default business hours (Mon-Sat 9-6, Sun closed)
  const days = [0, 1, 2, 3, 4, 5, 6];
  await db.businessHour.createMany({
    data: days.map((day) => ({
      salonId: salon.id,
      dayOfWeek: day,
      openTime: "09:00",
      closeTime: "18:00",
      isClosed: day === 0, // Sunday closed by default
    })),
  });

  // Create free subscription
  await db.subscription.create({
    data: { salonId: salon.id, plan: "FREE", status: "active" },
  });

  // Create or update user record
  if (dbUser) {
    await db.user.update({
      where: { id: dbUser.id },
      data: { salonId: salon.id, role: "SALON_OWNER" },
    });
  } else {
    await db.user.create({
      data: {
        clerkId: userId!,
        email: `${userId}@salonflow.app`, // Placeholder, will be updated from Clerk webhook
        salonId: salon.id,
        role: "SALON_OWNER",
      },
    });
  }

  await logAudit({ salonId: salon.id, action: "CREATE", entity: "SALON", entityId: salon.id });

  redirect("/dashboard");
}
