const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();

async function check() {
  const salons = await db.salon.findMany({ take: 5, select: { id: true, slug: true, name: true } });
  console.log("Salons:", JSON.stringify(salons, null, 2));
  
  const users = await db.user.findMany({ take: 5, select: { id: true, clerkId: true, email: true, salonId: true, role: true } });
  console.log("Users:", JSON.stringify(users, null, 2));

  const services = await db.service.findMany({ take: 5, select: { id: true, name: true, salonId: true } });
  console.log("Services:", JSON.stringify(services, null, 2));

  const staff = await db.staff.findMany({ take: 5, select: { id: true, name: true, salonId: true } });
  console.log("Staff:", JSON.stringify(staff, null, 2));

  const bh = await db.businessHour.findMany({ take: 7 });
  console.log("BusinessHours:", JSON.stringify(bh, null, 2));

  await db.$disconnect();
}

check().catch(console.error);
