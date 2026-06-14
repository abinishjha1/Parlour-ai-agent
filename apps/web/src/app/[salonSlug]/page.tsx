import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { MapPin, Phone } from "lucide-react";
import { BookingFlow } from "./BookingFlow";
import { AIChatbox } from "@/components/AIChatbox";

export default async function PublicBookingPage({ params }: { params: Promise<{ salonSlug: string }> }) {
  const { salonSlug } = await params;

  // Fetch real salon data from DB
  const salon = await db.salon.findUnique({
    where: { slug: salonSlug },
    include: {
      services: { where: { deletedAt: null }, orderBy: { name: "asc" } },
      staff: { where: { deletedAt: null }, orderBy: { name: "asc" } },
    },
  });

  if (!salon) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AIChatbox salonId={salon.id} />

      {/* Header */}
      <div className="w-full bg-slate-900 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/30 to-transparent" />
        <div className="relative z-10 max-w-5xl mx-auto px-4 py-12 md:py-16">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">{salon.name}</h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-300">
            {salon.address && (
              <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {salon.address}{salon.city ? `, ${salon.city}` : ""}</span>
            )}
            {salon.phone && (
              <span className="flex items-center gap-1"><Phone className="w-4 h-4" /> {salon.phone}</span>
            )}
          </div>
        </div>
      </div>

      {/* Booking Flow */}
      <main className="max-w-3xl mx-auto px-4 py-8 -mt-4 relative z-10">
        {salon.services.length === 0 ? (
          <div className="bg-white rounded-lg border p-12 text-center text-muted-foreground">
            <p className="text-lg font-medium mb-2">This salon hasn't added any services yet.</p>
            <p>Please check back later!</p>
          </div>
        ) : (
          <BookingFlow
            salonId={salon.id}
            salonName={salon.name}
            services={salon.services.map((s) => ({
              id: s.id,
              name: s.name,
              price: s.price,
              duration: s.duration,
              categoryId: s.categoryId,
            }))}
            staff={salon.staff.map((s) => ({
              id: s.id,
              name: s.name,
            }))}
          />
        )}
      </main>
    </div>
  );
}
