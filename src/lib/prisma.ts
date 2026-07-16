import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const connectionString = `${process.env.DATABASE_URL}`;

const globalForPrisma = globalThis as unknown as {
  prisma_db: PrismaClient | undefined;
  pg_pool: Pool | undefined;
};

// Reutilizar el pool de conexiones en desarrollo para evitar saturar PostgreSQL en cada hot reload.
// En producción, configuramos límites estrictos en el pool para prevenir agotamiento de conexiones (P1008/Timeout)
const pool = globalForPrisma.pg_pool ?? new Pool({ 
  connectionString,
  max: process.env.NODE_ENV === "production" ? 8 : 15, // Límite de conexiones simultáneas por instancia
  idleTimeoutMillis: 15000, // Cerrar conexiones inactivas tras 15 segundos
  connectionTimeoutMillis: 8000, // Tiempo máximo de espera para obtener una conexión (8s) antes de arrojar un error controlado
});

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.pg_pool = pool;
}

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
