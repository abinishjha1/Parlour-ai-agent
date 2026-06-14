import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateCSV } from "@/lib/csv";
import { startOfMonth, endOfMonth, format } from "date-fns";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const salonId = searchParams.get("salonId");

  if (!salonId) {
    return NextResponse.json({ error: "salonId required" }, { status: 400 });
  }

  const now = new Date();
  const appointments = await db.appointment.findMany({
    where: {
      salonId,
      startTime: { gte: startOfMonth(now), lte: endOfMonth(now) },
    },
    include: { customer: true, service: true, staff: true },
    orderBy: { startTime: "desc" },
  });

  const csvData = appointments.map((a) => ({
    date: format(new Date(a.startTime), "yyyy-MM-dd"),
    time: format(new Date(a.startTime), "HH:mm"),
    customer: `${a.customer.firstName} ${a.customer.lastName || ""}`.trim(),
    phone: a.customer.phone,
    service: a.service.name,
    staff: a.staff.name,
    amount: a.totalPrice,
    status: a.status,
  }));

  const csv = generateCSV(csvData, [
    { key: "date", label: "Date" },
    { key: "time", label: "Time" },
    { key: "customer", label: "Customer" },
    { key: "phone", label: "Phone" },
    { key: "service", label: "Service" },
    { key: "staff", label: "Staff" },
    { key: "amount", label: "Amount (₹)" },
    { key: "status", label: "Status" },
  ]);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="salonflow-report-${format(now, "yyyy-MM")}.csv"`,
    },
  });
}
