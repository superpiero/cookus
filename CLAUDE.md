# Cookus — kontext pro Claude

Gastro job marketplace + profesní sociální síť (ČR). Produkce: https://cookus-phi.vercel.app (Vercel + Supabase, deploy = push na `main`).

## První kroky v každé session

1. **Přečti `docs/05-backlog.md`** a připomeň uživateli relevantní TBD položky a provozní resty — je to živý backlog, který chce aktivně připomínat.
2. Dokumentace: `docs/01`–`03` (produkt, architektura, specs), `docs/04` (stress-test revize + akceptovaná rizika), brand: `docs/brand/cookus-brand-guidelines.pdf`, design system: `/styleguide` + tokeny v `src/app/globals.css`.

## Konvence

- UI i dokumentace česky, uživateli tykat. Brand: 70s diner (Cherry/Vanilla/Vinyl/Mustard/Teal), komponenty v `src/components/ui`, žádné ad-hoc hex barvy.
- Mutace = server actions (`src/actions/*`): zod → auth/authz → mutace → revalidatePath. Autorizace vždy na serveru.
- Testy: `npm run test:unit` (vitest) + `npm run build && npm run test:e2e` (Playwright, seeduje DB, retry-safe; Chromium přes `PLAYWRIGHT_CHROMIUM_PATH` nebo `/opt/pw-browsers/chromium`). Před pushem obojí zelené.
- Lokální DB: PostgreSQL 16 (`service postgresql start`), `.env` dle `.env.example`. Seed testovací: `npm run db:seed`, demo svět: `npm run db:seed:live` (MAŽE VŠE).
- Push: feature větev `claude/gastro-job-marketplace-yll7ea` + fast-forward na `main` (spouští produkční deploy).
- Demo obsah = parodie (Kapřík, Řvamsay…), nikdy skutečná jména/značky.
