import { getCurrentSalon } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Calendar, Users, TrendingUp, Download } from "lucide-react";
import { getRevenueReport, getAppointmentReport, getCustomerReport } from "./actions";
import { generateCSV } from "@/lib/csv";
import { format } from "date-fns";
import Link from "next/link";

export default async function ReportsPage() {
  const { salonId } = await getCurrentSalon();

  const [revenue, appointments, customers] = await Promise.all([
    getRevenueReport(salonId, "month"),
    getAppointmentReport(salonId),
    getCustomerReport(salonId),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Reports</h2>
          <p className="text-muted-foreground">Business analytics for this month.</p>
        </div>
        <Link href={`/api/reports/csv?salonId=${salonId}`}>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{revenue.totalRevenue.toLocaleString("en-IN")}</div>
            <p className="text-xs text-muted-foreground">{revenue.appointmentCount} completed appointments</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{appointments.total}</div>
            <p className="text-xs text-muted-foreground">{appointments.completionRate}% completion rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cancellations</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{appointments.cancelled}</div>
            <p className="text-xs text-muted-foreground">{appointments.cancellationRate}% cancellation rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customers.totalCustomers}</div>
            <p className="text-xs text-muted-foreground">{customers.newThisMonth} new this month</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Revenue by Service */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Service</CardTitle>
          </CardHeader>
          <CardContent>
            {revenue.byService.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No data yet.</p>
            ) : (
              <div className="space-y-4">
                {revenue.byService.map((s, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{s.name}</p>
                      <p className="text-xs text-muted-foreground">{s.count} appointments</p>
                    </div>
                    <Badge variant="secondary">₹{s.revenue.toLocaleString("en-IN")}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Appointment Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Appointment Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Completed</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: `${appointments.total ? (appointments.completed / appointments.total) * 100 : 0}%` }} />
                  </div>
                  <span className="text-sm font-medium w-8">{appointments.completed}</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Cancelled</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div className="bg-red-500 h-2 rounded-full" style={{ width: `${appointments.total ? (appointments.cancelled / appointments.total) * 100 : 0}%` }} />
                  </div>
                  <span className="text-sm font-medium w-8">{appointments.cancelled}</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">No Show</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div className="bg-gray-500 h-2 rounded-full" style={{ width: `${appointments.total ? (appointments.noShow / appointments.total) * 100 : 0}%` }} />
                  </div>
                  <span className="text-sm font-medium w-8">{appointments.noShow}</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Pending</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div className="bg-yellow-500 h-2 rounded-full" style={{ width: `${appointments.total ? (appointments.pending / appointments.total) * 100 : 0}%` }} />
                  </div>
                  <span className="text-sm font-medium w-8">{appointments.pending}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Customers */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Top Customers by Spend</CardTitle>
          </CardHeader>
          <CardContent>
            {customers.topSpenders.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No data yet.</p>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {customers.topSpenders.map((c, i) => (
                  <div key={c.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-muted-foreground w-5">#{i + 1}</span>
                      <div>
                        <p className="text-sm font-medium">{c.firstName} {c.lastName || ""}</p>
                        <p className="text-xs text-muted-foreground">{c._count.appointments} visits</p>
                      </div>
                    </div>
                    <Badge>₹{c.totalSpend.toLocaleString("en-IN")}</Badge>
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
