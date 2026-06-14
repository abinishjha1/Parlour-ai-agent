"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Scissors } from "lucide-react";
import { createSalonAction } from "./actions";

export default function OnboardingPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    setLoading(true);
    setError("");
    const result = await createSalonAction(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center space-y-3">
          <div className="mx-auto w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center">
            <Scissors className="w-7 h-7 text-indigo-600" />
          </div>
          <CardTitle className="text-2xl">Welcome to SalonFlow AI</CardTitle>
          <CardDescription>Let's set up your salon in under a minute. You can always change these later.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">Salon Name *</Label>
              <Input id="name" name="name" required placeholder="e.g. Glamour Beauty Studio" className="text-lg" />
              <p className="text-xs text-muted-foreground">This will be used to generate your public booking URL.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" name="phone" placeholder="e.g. 9876543210" />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">{error}</div>
            )}

            <Button type="submit" className="w-full text-lg py-6" disabled={loading}>
              {loading ? "Creating your salon..." : "Create My Salon →"}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Free plan includes 100 bookings/month. Upgrade anytime.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
