/* Živý demo obsah — CLI wrapper. Spuštění: npm run db:seed:live (POZOR: maže celou DB). */
import { PrismaClient } from "@prisma/client";
import { runLiveDemoSeed } from "../src/lib/demo-seed";

const db = new PrismaClient();

runLiveDemoSeed(db)
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
