import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// We use Prisma Client normally.
// For production scale (10,000 req/s), we would use Prisma Accelerate
// by replacing the PrismaClient instance with one that has the `withAccelerate()` extension.
// Example: new PrismaClient().$extends(withAccelerate())
export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
