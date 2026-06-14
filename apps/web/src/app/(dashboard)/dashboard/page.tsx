import { getCurrentSalon } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, DollarSign, Activity, TrendingUp } from "lucide-react";
import { db } from "@/lib/db";
import { startOfDay, endOfDay, format } from "date-fns";

export default async function DashboardPage() {
  const { salonId } = await getCurrentSalon();
  const todayStart = startOfDay(new Date());
  const todayEnd = endOfDay(new Date());

  const [appointmentsToday, staffCount, servicesCount, revenueToday, upcomingAppointments, topServices] = await Promise.all([
    db.appointment.count({
      where: {
        salonId,
        startTime: { gte: todayStart, lte: todayEnd },
        status: { notIn: ["CANCELLED"] },
      },
    }),
    db.staff.count({ where: { salonId, deletedAt: null } }),
    db.service.count({ where: { salonId, deletedAt: null } }),
    db.appointment.aggregate({
      where: {
        salonId,
        startTime: { gte: todayStart, lte: todayEnd },
        status: "COMPLETED",
      },
      _sum: { totalPrice: true },
    }),
    db.appointment.findMany({
      where: {
        salonId,
        startTime: { gte: new Date() },
        status: { notIn: ["CANCELLED"] },
      },
      include: { customer: true, service: true, staff: true },
      orderBy: { startTime: "asc" },
      take: 5,
    }),
    db.appointment.groupBy({
      by: ["serviceId"],
      where: { salonId, status: { notIn: ["CANCELLED"] } },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 5,
    }),
  ]);

  // Fetch service names for top services
  const serviceIds = topServices.map((s) => s.serviceId);
  const serviceNames = await db.service.findMany({
    where: { id: { in: serviceIds } },
    select: { id: true, name: true },
  });
  const serviceMap = Object.fromEntries(serviceNames.map((s) => [s.id, s.name]));

  const revenue = revenueToday._sum.totalPrice || 0;

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
            <CardTitle className="text-sm font-medium">Revenue Today</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{revenue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
            <p className="text-xs text-muted-foreground">From completed appointments</p>
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
            <p className="text-xs text-muted-foreground">Registered team members</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Services Offered</CardTitle>
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
            {upcomingAppointments.length === 0 ? (
              <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
                No upcoming appointments.
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingAppointments.map((apt) => (
                  <div key={apt.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{apt.customer.firstName} {apt.customer.lastName || ""}</p>
                      <p className="text-sm text-muted-foreground">{apt.service.name} with {apt.staff.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{format(new Date(apt.startTime), "h:mm a")}</p>
                      <p className="text-xs text-muted-foreground">{format(new Date(apt.startTime), "MMM d")}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> Top Services
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topServices.length === 0 ? (
              <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
                Not enough data yet.
              </div>
            ) : (
              <div className="space-y-4">
                {topServices.map((s, i) => (
                  <div key={s.serviceId} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-muted-foreground w-5">#{i + 1}</span>
                      <span className="text-sm font-medium">{serviceMap[s.serviceId] || "Unknown"}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{s._count.id} bookings</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
