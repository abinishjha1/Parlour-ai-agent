import { getCurrentSalon } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { updateAppointmentStatus } from "./actions";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
  NO_SHOW: "bg-gray-100 text-gray-800",
};

export default async function AppointmentsPage() {
  const { salonId } = await getCurrentSalon();

  const appointments = await db.appointment.findMany({
    where: { salonId },
    include: {
      customer: true,
      service: true,
      staff: true,
    },
    orderBy: { startTime: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Appointments</h2>
        <p className="text-muted-foreground">View and manage all your bookings.</p>
      </div>

      <div className="border rounded-md bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Service</TableHead>
              <TableHead>Staff</TableHead>
              <TableHead>Date & Time</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {appointments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No appointments yet. They'll appear once customers start booking.
                </TableCell>
              </TableRow>
            ) : (
              appointments.map((apt) => (
                <TableRow key={apt.id}>
                  <TableCell className="font-medium">
                    {apt.customer.firstName} {apt.customer.lastName || ""}
                    <div className="text-xs text-muted-foreground">{apt.customer.phone}</div>
                  </TableCell>
                  <TableCell>{apt.service.name}</TableCell>
                  <TableCell>{apt.staff.name}</TableCell>
                  <TableCell>
                    <div>{format(new Date(apt.startTime), "MMM d, yyyy")}</div>
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(apt.startTime), "h:mm a")} – {format(new Date(apt.endTime), "h:mm a")}
                    </div>
                  </TableCell>
                  <TableCell>₹{apt.totalPrice.toLocaleString("en-IN")}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[apt.status] || ""}`}>
                      {apt.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    {apt.status === "PENDING" && (
                      <div className="flex gap-1">
                        <form action={async () => { "use server"; await updateAppointmentStatus(apt.id, salonId, "CONFIRMED"); }}>
                          <Button variant="outline" size="sm" type="submit">Confirm</Button>
                        </form>
                        <form action={async () => { "use server"; await updateAppointmentStatus(apt.id, salonId, "CANCELLED"); }}>
                          <Button variant="ghost" size="sm" type="submit" className="text-red-500">Cancel</Button>
                        </form>
                      </div>
                    )}
                    {apt.status === "CONFIRMED" && (
                      <div className="flex gap-1">
                        <form action={async () => { "use server"; await updateAppointmentStatus(apt.id, salonId, "COMPLETED"); }}>
                          <Button variant="outline" size="sm" type="submit">Complete</Button>
                        </form>
                        <form action={async () => { "use server"; await updateAppointmentStatus(apt.id, salonId, "NO_SHOW"); }}>
                          <Button variant="ghost" size="sm" type="submit">No Show</Button>
                        </form>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
