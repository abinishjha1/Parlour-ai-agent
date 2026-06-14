import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";

/**
 * Gets the current authenticated user's salon.
 * Redirects to onboarding if no salon is linked.
 * Redirects to sign-in if not authenticated.
 */
export async function getCurrentSalon() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const user = await db.user.findUnique({
    where: { clerkId: userId },
    include: { salon: true },
  });

  if (!user || !user.salon) {
    redirect("/onboarding");
  }

  return {
    user: {
      id: user.id,
      clerkId: user.clerkId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    },
    salon: user.salon,
    salonId: user.salon.id,
  };
}

/**
 * Gets the current user without requiring a salon (for onboarding).
 */
export async function getCurrentUser() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const user = await db.user.findUnique({
    where: { clerkId: userId },
  });

  return { userId, dbUser: user };
}
