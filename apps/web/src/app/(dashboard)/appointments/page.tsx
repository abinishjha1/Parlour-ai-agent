import { db } from "@/lib/db";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

const TEMP_SALON_ID = "cm0x2a3b4000008l9k1j2h3g4"; 

export default async function AppointmentsPage() {
  const appointments = await db.appointment.findMany({
    where: { salonId: TEMP_SALON_ID },
    include: {
      customer: true,
      service: true,
      staff: true,
    },
    orderBy: { startTime: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Appointments</h2>
        <p className="text-muted-foreground">View and manage your upcoming bookings.</p>
      </div>

      <div className="border rounded-md bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Service</TableHead>
              <TableHead>Staff</TableHead>
              <TableHead>Date & Time</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {appointments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No appointments booked yet.
                </TableCell>
              </TableRow>
            ) : (
              appointments.map((apt) => (
                <TableRow key={apt.id}>
                  <TableCell className="font-medium">
                    {apt.customer.name}
                    <div className="text-xs text-muted-foreground">{apt.customer.phone}</div>
                  </TableCell>
                  <TableCell>{apt.service.name}</TableCell>
                  <TableCell>{apt.staff?.name || "Any"}</TableCell>
                  <TableCell>
                    {format(new Date(apt.startTime), "PPp")}
                  </TableCell>
                  <TableCell>
                    <Badge variant={apt.status === "CONFIRMED" ? "default" : "secondary"}>
                      {apt.status}
                    </Badge>
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
