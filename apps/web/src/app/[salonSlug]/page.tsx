import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Phone, Clock } from "lucide-react";
import { AIChatbox } from "@/components/AIChatbox";

const TEMP_SALON_ID = "cm0x2a3b4000008l9k1j2h3g4"; 

export default async function PublicBookingPage({ params }: { params: Promise<{ salonSlug: string }> }) {
  const { salonSlug } = await params;
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center">
      <AIChatbox salonId={TEMP_SALON_ID} />
      {/* Header / Hero */}
      <div className="w-full h-64 bg-slate-900 relative">
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 max-w-5xl mx-auto px-4 h-full flex items-end pb-8">
          <div className="text-white">
            <h1 className="text-4xl font-bold mb-2 capitalize">{salonSlug.replace(/-/g, " ")}</h1>
            <div className="flex items-center gap-4 text-sm text-gray-200">
              <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> 123 Main St, NY</span>
              <span className="flex items-center gap-1"><Phone className="w-4 h-4" /> (555) 123-4567</span>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-5xl w-full mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-3 gap-8 relative -top-12">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Select a Service</CardTitle>
              <CardDescription>Choose from our available services.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg hover:border-primary cursor-pointer transition-colors">
                <div>
                  <h4 className="font-medium">Men's Haircut</h4>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Clock className="w-4 h-4" /> 30 mins
                  </p>
                </div>
                <div className="text-right">
                  <div className="font-bold">$35</div>
                  <Button variant="outline" size="sm">Select</Button>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg hover:border-primary cursor-pointer transition-colors">
                <div>
                  <h4 className="font-medium">Women's Haircut & Styling</h4>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Clock className="w-4 h-4" /> 60 mins
                  </p>
                </div>
                <div className="text-right">
                  <div className="font-bold">$65</div>
                  <Button variant="outline" size="sm">Select</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Choose Staff</CardTitle>
            </CardHeader>
            <CardContent className="flex gap-4 overflow-x-auto pb-2">
               <div className="flex flex-col items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-slate-50 border-2 border-transparent">
                 <Avatar className="w-16 h-16">
                   <AvatarImage src="https://i.pravatar.cc/150?u=1" />
                   <AvatarFallback>JD</AvatarFallback>
                 </Avatar>
                 <span className="text-sm font-medium">Any Available</span>
               </div>
               <div className="flex flex-col items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-slate-50 border-2 border-primary bg-slate-50">
                 <Avatar className="w-16 h-16">
                   <AvatarImage src="https://i.pravatar.cc/150?u=2" />
                   <AvatarFallback>SM</AvatarFallback>
                 </Avatar>
                 <span className="text-sm font-medium">Sarah M.</span>
               </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Select Date & Time</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col md:flex-row gap-8">
              <div>
                <Calendar
                  mode="single"
                  className="rounded-md border"
                />
              </div>
              <div className="flex-1 grid grid-cols-3 gap-2 h-fit max-h-[300px] overflow-y-auto pr-2">
                {["09:00 AM", "09:30 AM", "10:00 AM", "11:30 AM", "01:00 PM", "02:30 PM", "04:00 PM"].map(time => (
                  <Button key={time} variant="outline" className="w-full">{time}</Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Your Appointment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm">
                <div className="text-muted-foreground">Service</div>
                <div className="font-medium">Men's Haircut</div>
              </div>
              <div className="text-sm">
                <div className="text-muted-foreground">Date</div>
                <div className="font-medium">Please select a date</div>
              </div>
              <div className="text-sm">
                <div className="text-muted-foreground">Staff</div>
                <div className="font-medium">Sarah M.</div>
              </div>
              <div className="border-t pt-4 flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>$35.00</span>
              </div>
            </CardContent>
            <div className="p-4 bg-slate-50 border-t rounded-b-lg">
              <Button className="w-full">Continue to Details</Button>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
