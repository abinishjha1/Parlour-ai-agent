import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";

export default function BillingPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Billing & Plans</h2>
        <p className="text-muted-foreground">Manage your salon's subscription and billing details.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Starter Plan</CardTitle>
            <CardDescription>Perfect for solo professionals and small shops.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-3xl font-bold">₹999<span className="text-sm font-normal text-muted-foreground">/month</span></div>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Up to 3 Staff Members</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> 500 Appointments/month</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Standard AI Receptionist</li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button className="w-full" variant="outline">Subscribe with Razorpay</Button>
          </CardFooter>
        </Card>

        <Card className="border-primary">
          <CardHeader>
            <CardTitle>Pro Plan</CardTitle>
            <CardDescription>For growing salons and beauty centers.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-3xl font-bold">₹2,999<span className="text-sm font-normal text-muted-foreground">/month</span></div>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Unlimited Staff</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Unlimited Appointments</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Advanced AI Receptionist</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Priority Support</li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button className="w-full">Upgrade to Pro</Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
