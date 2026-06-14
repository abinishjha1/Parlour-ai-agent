import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const text = await req.text();
    const signature = req.headers.get("x-razorpay-signature");

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET || "placeholder")
      .update(text)
      .digest("hex");

    if (signature !== expectedSignature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const event = JSON.parse(text);

    if (event.event === "subscription.charged") {
      const subscriptionId = event.payload.subscription.entity.id;
      
      // Find salon by razorpaySubscriptionId and update status
      await db.subscription.updateMany({
        where: { razorpayId: subscriptionId },
        data: { 
          status: "ACTIVE",
          currentPeriodEnd: new Date(event.payload.subscription.entity.current_end * 1000)
        }
      });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Razorpay webhook error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
