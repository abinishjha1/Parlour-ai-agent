export async function geocodeAddress(address: string, city: string, state: string, zipCode: string) {
  const query = `${address}, ${city}, ${state} ${zipCode}`;
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`;
  
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "SalonFlow-AI-Marketplace/1.0"
      }
    });
    
    if (!res.ok) return null;
    
    const data = await res.json();
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon)
      };
    }
    return null;
  } catch (error) {
    console.error("Geocoding error:", error);
    return null;
  }
}
