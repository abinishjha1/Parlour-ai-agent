"use server";

import { db } from "@/lib/db";
import { startOfDay, endOfDay, subDays, startOfMonth, endOfMonth } from "date-fns";

export async function getRevenueReport(salonId: string, period: "today" | "week" | "month" = "month") {
  const now = new Date();
  let start: Date;
  let end = endOfDay(now);

  if (period === "today") {
    start = startOfDay(now);
  } else if (period === "week") {
    start = startOfDay(subDays(now, 7));
  } else {
    start = startOfMonth(now);
  }

  const appointments = await db.appointment.findMany({
    where: {
      salonId,
      status: "COMPLETED",
      startTime: { gte: start, lte: end },
    },
    include: { service: true, staff: true, customer: true },
    orderBy: { startTime: "desc" },
  });

  const totalRevenue = appointments.reduce((sum, a) => sum + a.totalPrice, 0);

  // Revenue by service
  const byService: Record<string, { name: string; revenue: number; count: number }> = {};
  appointments.forEach((a) => {
    if (!byService[a.serviceId]) {
      byService[a.serviceId] = { name: a.service.name, revenue: 0, count: 0 };
    }
    byService[a.serviceId].revenue += a.totalPrice;
    byService[a.serviceId].count += 1;
  });

  return {
    totalRevenue,
    appointmentCount: appointments.length,
    byService: Object.values(byService).sort((a, b) => b.revenue - a.revenue),
    appointments,
  };
}

export async function getAppointmentReport(salonId: string) {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const [total, completed, cancelled, noShow, pending] = await Promise.all([
    db.appointment.count({ where: { salonId, startTime: { gte: monthStart, lte: monthEnd } } }),
    db.appointment.count({ where: { salonId, status: "COMPLETED", startTime: { gte: monthStart, lte: monthEnd } } }),
    db.appointment.count({ where: { salonId, status: "CANCELLED", startTime: { gte: monthStart, lte: monthEnd } } }),
    db.appointment.count({ where: { salonId, status: "NO_SHOW", startTime: { gte: monthStart, lte: monthEnd } } }),
    db.appointment.count({ where: { salonId, status: "PENDING", startTime: { gte: monthStart, lte: monthEnd } } }),
  ]);

  return {
    total,
    completed,
    cancelled,
    noShow,
    pending,
    completionRate: total > 0 ? ((completed / total) * 100).toFixed(1) : "0",
    cancellationRate: total > 0 ? ((cancelled / total) * 100).toFixed(1) : "0",
  };
}

export async function getCustomerReport(salonId: string) {
  const now = new Date();
  const monthStart = startOfMonth(now);

  const [totalCustomers, newThisMonth, topSpenders] = await Promise.all([
    db.customer.count({ where: { salonId } }),
    db.customer.count({ where: { salonId, createdAt: { gte: monthStart } } }),
    db.customer.findMany({
      where: { salonId },
      orderBy: { totalSpend: "desc" },
      take: 10,
      include: { _count: { select: { appointments: true } } },
    }),
  ]);

  return { totalCustomers, newThisMonth, topSpenders };
}
