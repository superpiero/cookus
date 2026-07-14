import { PrismaClient } from "@prisma/client";

// Serverless-safe singleton — na Vercelu se moduly re-evaluují mezi invokacemi,
// globalThis přežívá v rámci téže instance a brání vyčerpání DB connections.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
