import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, DollarSign, Activity } from "lucide-react";
import { db } from "@/lib/db";
import { startOfDay, endOfDay } from "date-fns";

const TEMP_SALON_ID = "cm0x2a3b4000008l9k1j2h3g4"; 

export default async function DashboardPage() {
  const todayStart = startOfDay(new Date());
  const todayEnd = endOfDay(new Date());

  // Run DB queries in parallel
  const [appointmentsToday, staffCount, servicesCount] = await Promise.all([
    db.appointment.count({
      where: {
        salonId: TEMP_SALON_ID,
        startTime: { gte: todayStart, lte: todayEnd },
        status: { notIn: ["CANCELLED"] }
      }
    }),
    db.staff.count({ where: { salonId: TEMP_SALON_ID, deletedAt: null } }),
    db.service.count({ where: { salonId: TEMP_SALON_ID, deletedAt: null } })
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Welcome back. Here's an overview of your salon today.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue Today</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$0.00</div>
            <p className="text-xs text-muted-foreground">Will be calculated from completed appointments</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Appointments Today</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{appointmentsToday}</div>
            <p className="text-xs text-muted-foreground">Total bookings for today</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Staff</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{staffCount}</div>
            <p className="text-xs text-muted-foreground">Registered staff members</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Services</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{servicesCount}</div>
            <p className="text-xs text-muted-foreground">Available to book</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Upcoming Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
              No upcoming appointments.
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Top Services</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
              Not enough data yet.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
