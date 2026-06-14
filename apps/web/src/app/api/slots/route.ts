import { NextResponse } from "next/server";
import { AppointmentService } from "@/services/AppointmentService";
import { withCache } from "@/lib/redis";
import { format } from "date-fns";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const salonId = searchParams.get("salonId");
  const staffId = searchParams.get("staffId");
  const serviceId = searchParams.get("serviceId");
  const dateStr = searchParams.get("date");

  if (!salonId || !staffId || !serviceId || !dateStr) {
    return NextResponse.json({ error: "salonId, staffId, serviceId, and date are required" }, { status: 400 });
  }

  try {
    const cacheKey = `slots:${salonId}:${staffId}:${serviceId}:${dateStr}`;

    const slots = await withCache(
      cacheKey,
      async () => {
        const rawSlots = await AppointmentService.getAvailableSlots(salonId, staffId, serviceId, new Date(dateStr));
        return rawSlots.map((d) => ({
          time: format(d, "HH:mm"),
          label: format(d, "h:mm a"),
          iso: d.toISOString(),
        }));
      },
      60 // 60 second cache TTL
    );

    return NextResponse.json(slots);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch slots" }, { status: 500 });
  }
}
