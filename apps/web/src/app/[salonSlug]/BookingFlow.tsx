"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Clock, CheckCircle2, ArrowLeft } from "lucide-react";
import { bookAppointmentAction } from "./booking-actions";

interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
  categoryId: string | null;
}

interface Staff {
  id: string;
  name: string;
}

interface Slot {
  time: string;
  label: string;
  iso: string;
}

export function BookingFlow({
  salonId,
  salonName,
  services,
  staff,
}: {
  salonId: string;
  salonName: string;
  services: Service[];
  staff: Staff[];
}) {
  const [step, setStep] = useState<"service" | "staff" | "date" | "time" | "details" | "success">("service");
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState("");
  const [appointmentId, setAppointmentId] = useState("");

  const fetchSlots = async (staffId: string, serviceId: string, date: string) => {
    setLoadingSlots(true);
    setSlots([]);
    try {
      const res = await fetch(`/api/slots?salonId=${salonId}&staffId=${staffId}&serviceId=${serviceId}&date=${date}`);
      if (!res.ok) throw new Error("Failed to fetch slots");
      const data = await res.json();
      setSlots(data);
    } catch (e) {
      setError("Could not load available times. Please try another date.");
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    if (selectedStaff && selectedService) {
      fetchSlots(selectedStaff.id, selectedService.id, date);
    }
  };

  const handleBook = async (formData: FormData) => {
    if (!selectedService || !selectedStaff || !selectedSlot) return;
    setBooking(true);
    setError("");

    const result = await bookAppointmentAction(salonId, {
      serviceId: selectedService.id,
      staffId: selectedStaff.id,
      startTime: selectedSlot.iso,
      firstName: formData.get("firstName") as string,
      lastName: (formData.get("lastName") as string) || undefined,
      phone: formData.get("phone") as string,
      email: (formData.get("email") as string) || undefined,
    });

    setBooking(false);
    if (result.success) {
      setAppointmentId(result.appointmentId || "");
      setStep("success");
    } else {
      setError(result.error || "Booking failed. Please try again.");
    }
  };

  if (step === "success") {
    return (
      <Card className="max-w-lg mx-auto">
        <CardContent className="py-12 text-center space-y-4">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
          <h3 className="text-2xl font-bold">Booking Confirmed!</h3>
          <p className="text-muted-foreground">
            Your {selectedService?.name} appointment with {selectedStaff?.name} on{" "}
            {selectedDate} at {selectedSlot?.label} is confirmed.
          </p>
          <p className="text-xs text-muted-foreground">Appointment ID: {appointmentId}</p>
          <Button onClick={() => { setStep("service"); setSelectedService(null); setSelectedStaff(null); setSelectedDate(""); setSelectedSlot(null); }}>
            Book Another
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Step indicators */}
      <div className="flex items-center gap-2 text-sm">
        {["Service", "Staff", "Date & Time", "Your Details"].map((label, i) => {
          const stepKeys = ["service", "staff", "date", "details"];
          const currentIdx = stepKeys.indexOf(step);
          const isActive = i === currentIdx;
          const isDone = i < currentIdx;
          return (
            <div key={label} className="flex items-center gap-2">
              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${isDone ? "bg-green-500 text-white" : isActive ? "bg-indigo-600 text-white" : "bg-gray-200 text-gray-500"}`}>
                {isDone ? "✓" : i + 1}
              </span>
              <span className={isActive ? "font-medium" : "text-muted-foreground"}>{label}</span>
              {i < 3 && <span className="text-gray-300 mx-1">→</span>}
            </div>
          );
        })}
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">{error}</div>}

      {/* Step 1: Select Service */}
      {step === "service" && (
        <Card>
          <CardHeader><CardTitle>Choose a Service</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {services.map((s) => (
              <button
                key={s.id}
                onClick={() => { setSelectedService(s); setStep("staff"); }}
                className="w-full flex items-center justify-between p-4 border rounded-lg hover:border-indigo-500 hover:bg-indigo-50/50 transition-all text-left"
              >
                <div>
                  <h4 className="font-medium">{s.name}</h4>
                  <p className="text-sm text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" /> {s.duration} mins</p>
                </div>
                <span className="font-bold text-lg">₹{s.price}</span>
              </button>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Step 2: Select Staff */}
      {step === "staff" && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => setStep("service")}><ArrowLeft className="w-4 h-4" /></Button>
              <CardTitle>Choose a Stylist</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {staff.map((s) => (
              <button
                key={s.id}
                onClick={() => { setSelectedStaff(s); setStep("date"); }}
                className="flex flex-col items-center gap-2 p-4 border rounded-lg hover:border-indigo-500 hover:bg-indigo-50/50 transition-all"
              >
                <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-lg">
                  {s.name.charAt(0)}
                </div>
                <span className="text-sm font-medium">{s.name}</span>
              </button>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Step 3: Select Date & Time */}
      {step === "date" && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => setStep("staff")}><ArrowLeft className="w-4 h-4" /></Button>
              <CardTitle>Pick a Date & Time</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Select Date</Label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
              />
            </div>

            {loadingSlots && (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
              </div>
            )}

            {!loadingSlots && selectedDate && slots.length === 0 && (
              <p className="text-center text-muted-foreground py-4">No available slots for this date. Try another day.</p>
            )}

            {slots.length > 0 && (
              <div>
                <Label>Available Times</Label>
                <div className="grid grid-cols-3 md:grid-cols-4 gap-2 mt-2">
                  {slots.map((slot) => (
                    <Button
                      key={slot.time}
                      variant={selectedSlot?.time === slot.time ? "default" : "outline"}
                      onClick={() => setSelectedSlot(slot)}
                      className="w-full"
                    >
                      {slot.label}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {selectedSlot && (
              <Button className="w-full mt-4" onClick={() => setStep("details")}>
                Continue → Enter Your Details
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 4: Customer Details */}
      {step === "details" && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => setStep("date")}><ArrowLeft className="w-4 h-4" /></Button>
              <CardTitle>Your Details</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <form action={handleBook} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input id="firstName" name="firstName" required placeholder="Priya" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" name="lastName" placeholder="Sharma" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input id="phone" name="phone" required placeholder="9876543210" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email (for confirmation)</Label>
                <Input id="email" name="email" type="email" placeholder="priya@email.com" />
              </div>

              {/* Summary */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                <h4 className="font-bold">Booking Summary</h4>
                <div className="flex justify-between"><span className="text-muted-foreground">Service</span><span>{selectedService?.name}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Stylist</span><span>{selectedStaff?.name}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span>{selectedDate}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Time</span><span>{selectedSlot?.label}</span></div>
                <div className="flex justify-between font-bold text-base border-t pt-2 mt-2">
                  <span>Total</span><span>₹{selectedService?.price}</span>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={booking}>
                {booking ? "Booking..." : "Confirm Booking"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
