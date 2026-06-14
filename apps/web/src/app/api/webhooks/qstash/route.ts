import { verifySignatureAppRouter } from "@upstash/qstash/dist/nextjs";
import { NextResponse } from "next/server";
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || "re_placeholder");

async function handler(req: Request) {
  try {
    const body = await req.json();

    if (body.type === "SEND_CONFIRMATION_EMAIL") {
      await resend.emails.send({
        from: 'SalonFlow AI <appointments@yourdomain.com>',
        to: [body.customerEmail],
        subject: 'Appointment Confirmed!',
        html: `<p>Hi ${body.customerName},</p><p>Your appointment on ${body.appointmentDate} is confirmed.</p>`,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("QStash Webhook Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// Wrap with QStash signature verification
export const POST = verifySignatureAppRouter(handler, {
  currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY || "dummy_current_key_for_build",
  nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY || "dummy_next_key_for_build",
});
