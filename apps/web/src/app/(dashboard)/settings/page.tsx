import { getCurrentSalon } from "@/lib/auth";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2 } from "lucide-react";
import { format } from "date-fns";
import { updateSalonDetails, updateSalonLocation, updateBusinessHours, addHoliday, deleteHoliday } from "./actions";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default async function SettingsPage() {
  const { salon, salonId } = await getCurrentSalon();

  const [businessHours, holidays] = await Promise.all([
    db.businessHour.findMany({
      where: { salonId },
      orderBy: { dayOfWeek: "asc" },
    }),
    db.holiday.findMany({
      where: { salonId, staffId: null },
      orderBy: { date: "asc" },
    }),
  ]);

  const hoursMap = Object.fromEntries(businessHours.map((h) => [h.dayOfWeek, h]));

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Salon Settings</h2>
        <p className="text-muted-foreground">Configure your salon profile, business hours, and holidays.</p>
      </div>

      {/* General Info */}
      <Card>
        <CardHeader>
          <CardTitle>General Information</CardTitle>
          <CardDescription>Your salon's basic details.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={async (formData) => {
            "use server";
            await updateSalonDetails(salonId, formData);
          }} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Salon Name</Label>
                <Input id="name" name="name" defaultValue={salon.name} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" name="phone" defaultValue={salon.phone || ""} placeholder="9876543210" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Input id="timezone" name="timezone" defaultValue={salon.timezone} placeholder="Asia/Kolkata" />
            </div>
            <Button type="submit">Save Changes</Button>
          </form>
        </CardContent>
      </Card>

      {/* Location */}
      <Card>
        <CardHeader>
          <CardTitle>Location</CardTitle>
          <CardDescription>Your address is used for the "Nearby Salons" marketplace. It will be automatically geocoded.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={async (formData) => {
            "use server";
            await updateSalonLocation(salonId, formData);
          }} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address">Street Address</Label>
              <Input id="address" name="address" defaultValue={salon.address || ""} placeholder="123 Main Street" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input id="city" name="city" defaultValue={salon.city || ""} placeholder="Mumbai" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input id="state" name="state" defaultValue={salon.state || ""} placeholder="Maharashtra" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zipCode">Zip Code</Label>
                <Input id="zipCode" name="zipCode" defaultValue={salon.zipCode || ""} placeholder="400001" />
              </div>
            </div>
            {salon.latitude && salon.longitude && (
              <p className="text-xs text-muted-foreground">📍 Coordinates: {salon.latitude.toFixed(4)}, {salon.longitude.toFixed(4)}</p>
            )}
            <Button type="submit">Update Location</Button>
          </form>
        </CardContent>
      </Card>

      {/* Business Hours */}
      <Card>
        <CardHeader>
          <CardTitle>Business Hours</CardTitle>
          <CardDescription>Set your salon's opening and closing times for each day of the week.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={async (formData) => {
            "use server";
            await updateBusinessHours(salonId, formData);
          }} className="space-y-3">
            {DAY_NAMES.map((name, i) => {
              const hours = hoursMap[i];
              return (
                <div key={i} className="flex items-center gap-4 p-3 border rounded-lg">
                  <span className="w-24 font-medium text-sm">{name}</span>
                  <Input name={`open_${i}`} type="time" defaultValue={hours?.openTime || "09:00"} className="w-32" />
                  <span className="text-muted-foreground">to</span>
                  <Input name={`close_${i}`} type="time" defaultValue={hours?.closeTime || "18:00"} className="w-32" />
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" name={`closed_${i}`} defaultChecked={hours?.isClosed || false} className="rounded" />
                    Closed
                  </label>
                </div>
              );
            })}
            <Button type="submit">Save Business Hours</Button>
          </form>
        </CardContent>
      </Card>

      {/* Holidays */}
      <Card>
        <CardHeader>
          <CardTitle>Holidays</CardTitle>
          <CardDescription>Mark days when your salon is closed.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form action={async (formData) => {
            "use server";
            await addHoliday(salonId, formData);
          }} className="flex gap-4 items-end">
            <div className="space-y-2 flex-1">
              <Label htmlFor="date">Date</Label>
              <Input id="date" name="date" type="date" required />
            </div>
            <div className="space-y-2 flex-1">
              <Label htmlFor="reason">Reason</Label>
              <Input id="reason" name="reason" placeholder="e.g. Diwali" />
            </div>
            <Button type="submit">Add Holiday</Button>
          </form>

          {holidays.length > 0 && (
            <div className="border rounded-md divide-y">
              {holidays.map((h) => (
                <div key={h.id} className="flex items-center justify-between p-3">
                  <div>
                    <span className="font-medium text-sm">{format(new Date(h.date), "EEEE, MMM d, yyyy")}</span>
                    {h.reason && <span className="text-muted-foreground text-sm ml-2">— {h.reason}</span>}
                  </div>
                  <form action={async () => {
                    "use server";
                    await deleteHoliday(h.id, salonId);
                  }}>
                    <Button variant="ghost" size="icon" type="submit" className="text-red-500">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
