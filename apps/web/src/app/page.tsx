"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Navigation, Search, Star, Clock } from "lucide-react";
import Link from "next/link";

interface SalonResult {
  id: string;
  name: string;
  slug: string;
  address: string | null;
  city: string | null;
  distance: number;
  logoUrl: string | null;
}

export default function MarketplaceHome() {
  const [salons, setSalons] = useState<SalonResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [locationError, setLocationError] = useState("");

  const handleUseLocation = () => {
    setLoading(true);
    setLocationError("");
    
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const res = await fetch(`/api/salons/nearby?lat=${position.coords.latitude}&lng=${position.coords.longitude}`);
          if (!res.ok) throw new Error("Failed to fetch salons");
          const data = await res.json();
          setSalons(data);
        } catch (err) {
          setLocationError("Failed to find salons near you.");
        } finally {
          setLoading(false);
        }
      },
      () => {
        setLocationError("Unable to retrieve your location. Please check browser permissions.");
        setLoading(false);
      }
    );
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50 selection:bg-indigo-500/30">
      {/* Navigation */}
      <nav className="absolute top-0 w-full z-50 px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center max-w-7xl mx-auto left-0 right-0">
        <div className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-neutral-400">SalonFlow AI</div>
        <div className="flex gap-4 items-center">
          <Link href="/sign-in" className="text-sm font-medium text-neutral-300 hover:text-white transition-colors">
            Sign In
          </Link>
          <Link href="/sign-up">
            <Button className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-full px-6">
              Register Salon
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden pt-32 pb-20 lg:pt-48 lg:pb-32">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-indigo-500/20 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-white via-white to-neutral-500">
            Find the perfect salon <br className="hidden md:block" /> near you.
          </h1>
          <p className="text-lg md:text-xl text-neutral-400 max-w-2xl mx-auto">
            Book appointments instantly at top-rated barbershops, spas, and beauty studios in your city.
          </p>

          <div className="max-w-2xl mx-auto bg-neutral-900/50 backdrop-blur-xl border border-neutral-800 p-2 rounded-2xl flex flex-col md:flex-row items-center gap-2 shadow-2xl">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-500" />
              <Input 
                placeholder="Search by city or zip code..." 
                className="w-full bg-transparent border-none pl-10 text-lg focus-visible:ring-0 placeholder:text-neutral-600"
              />
            </div>
            <div className="w-full md:w-auto flex gap-2">
              <Button onClick={handleUseLocation} variant="secondary" className="flex-1 md:flex-none gap-2 bg-neutral-800 hover:bg-neutral-700 text-white">
                <Navigation className="h-4 w-4" />
                Near Me
              </Button>
              <Button className="flex-1 md:flex-none bg-indigo-600 hover:bg-indigo-500 text-white">
                Search
              </Button>
            </div>
          </div>
          {locationError && <p className="text-red-400 text-sm">{locationError}</p>}
        </div>
      </div>

      {/* Results Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-32">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
          </div>
        ) : salons.length > 0 ? (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold">Salons nearby</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {salons.map((salon) => (
                <Link key={salon.id} href={`/${salon.slug}`}>
                  <Card className="bg-neutral-900/50 border-neutral-800 hover:border-indigo-500/50 transition-all hover:shadow-[0_0_30px_-5px_rgba(99,102,241,0.15)] group overflow-hidden h-full">
                    <CardContent className="p-0">
                      <div className="h-48 bg-neutral-800 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 to-transparent z-10" />
                        {/* Placeholder for salon cover image */}
                        <div className="w-full h-full bg-neutral-800 flex items-center justify-center text-neutral-600 group-hover:scale-105 transition-transform duration-500">
                          No Image
                        </div>
                        <div className="absolute bottom-4 left-4 z-20 flex gap-2">
                          <span className="px-2 py-1 bg-black/50 backdrop-blur-md rounded text-xs font-medium text-white border border-white/10 flex items-center gap-1">
                            <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" /> 4.9
                          </span>
                        </div>
                      </div>
                      <div className="p-5 space-y-3">
                        <h3 className="text-xl font-bold text-white group-hover:text-indigo-400 transition-colors">{salon.name}</h3>
                        <div className="flex items-center text-sm text-neutral-400 gap-2">
                          <MapPin className="w-4 h-4 shrink-0" />
                          <span className="truncate">{salon.address}, {salon.city}</span>
                        </div>
                        <div className="flex items-center text-sm text-neutral-400 gap-2">
                          <Navigation className="w-4 h-4 shrink-0 text-indigo-400" />
                          <span>{salon.distance.toFixed(1)} miles away</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-20 text-neutral-500">
            <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-medium mb-2">Discover Salons</h3>
            <p>Click "Near Me" to find top-rated salons in your area.</p>
          </div>
        )}
      </div>
    </div>
  );
}
