import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const lat = parseFloat(searchParams.get('lat') || '0');
  const lng = parseFloat(searchParams.get('lng') || '0');
  const radius = parseFloat(searchParams.get('radius') || '25'); // Default 25 miles

  if (!lat || !lng) {
    return NextResponse.json({ error: 'Latitude and longitude are required' }, { status: 400 });
  }

  try {
    const salons = await db.$queryRaw`
      WITH DistanceCalc AS (
        SELECT id, name, slug, "logoUrl", address, city, state, "zipCode", latitude, longitude,
               ( 3959 * acos( cos( radians(${lat}) ) * cos( radians( latitude ) ) * cos( radians( longitude ) - radians(${lng}) ) + sin( radians(${lat}) ) * sin( radians( latitude ) ) ) ) AS distance
        FROM "Salon"
        WHERE "isListed" = true AND latitude IS NOT NULL AND longitude IS NOT NULL
      )
      SELECT * FROM DistanceCalc
      WHERE distance < ${radius}
      ORDER BY distance ASC
      LIMIT 50;
    `;

    return NextResponse.json(salons);
  } catch (error) {
    console.error('Error fetching nearby salons:', error);
    return NextResponse.json({ error: 'Failed to fetch salons' }, { status: 500 });
  }
}
