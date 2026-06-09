// Tek bir PrismaClient örneği (singleton).
// Next.js dev modunda hot-reload her seferinde yeni bir client (ve bağlantı havuzu)
// oluşturmasın diye global üzerinde önbelleğe alıyoruz.
// Prisma 7: çalışma zamanı bağlantısı driver adapter (PrismaPg) ile verilir.
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
