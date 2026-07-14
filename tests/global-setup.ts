import { execSync } from "node:child_process";

export default function globalSetup() {
  // Čistý, deterministický stav DB pro celý běh e2e
  execSync("npx prisma migrate deploy && npm run db:seed", { stdio: "inherit" });
}
