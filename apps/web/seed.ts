import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const salon = await prisma.salon.upsert({
    where: { slug: "glamour-salon" },
    update: {},
    create: {
      id: "cm0x2a3b4000008l9k1j2h3g4",
      slug: "glamour-salon",
      name: "Glamour Salon",
      address: "123 Main St",
      phone: "555-1234",
    }
  });
  console.log("Seeded salon:", salon);
}
main();
