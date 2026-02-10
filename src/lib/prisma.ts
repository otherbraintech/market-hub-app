import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const connectionString = `${process.env.DATABASE_URL}`;

const globalForPrisma = globalThis as unknown as {
  prisma_db: PrismaClient | undefined;
};

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

console.log("Initializing Prisma Client with adapter...");

export const prisma =
  globalForPrisma.prisma_db ??
  new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma_db = prisma;
}

export default prisma;
