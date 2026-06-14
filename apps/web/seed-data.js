const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();

async function seed() {
  const salonId = "cm0x2a3b4000008l9k1j2h3g4";
  
  // 1. Create Business Hours
  const days = [0, 1, 2, 3, 4, 5, 6];
  for (const day of days) {
    await db.businessHour.upsert({
      where: { salonId_dayOfWeek: { salonId, dayOfWeek: day } },
      update: {},
      create: {
        salonId,
        dayOfWeek: day,
        openTime: "09:00",
        closeTime: "18:00",
        isClosed: day === 0, // Sunday closed
      }
    });
  }

  // 2. Create Services
  const services = [
    { name: "Haircut", price: 500, duration: 30, categoryId: "Hair" },
    { name: "Hair Color", price: 1500, duration: 90, categoryId: "Hair" },
    { name: "Facial", price: 1000, duration: 60, categoryId: "Spa" },
  ];

  for (const s of services) {
    await db.service.create({
      data: { ...s, salonId }
    });
  }

  // 3. Create Staff
  const staff = await db.staff.create({
    data: { name: "John Stylist", salonId, phone: "9998887776" }
  });

  // 4. Create Staff Hours (match business hours for simplicity)
  for (const day of days) {
    await db.staffHour.upsert({
      where: { staffId_dayOfWeek: { staffId: staff.id, dayOfWeek: day } },
      update: {},
      create: {
        staffId: staff.id,
        dayOfWeek: day,
        openTime: "09:00",
        closeTime: "18:00",
        isOff: day === 0,
      }
    });
  }

  console.log("Seeding complete for salon:", salonId);
  await db.$disconnect();
}

seed().catch(console.error);
