# Cookus 🍒

**Gastro žije tady.** Profesní síť a pracovní tržiště pro českou gastronomii — profil místo životopisu, praxe ověřená podniky, práce ukázaná fotkami.

## Co umí (MVP)

- **Profily** osob i podniků: avatar, headline, bio, dovednosti, město
- **Ověřená praxe** — praxi potvrzuje přímo podnik (účet v aplikaci) i s referencí; badge „✓ Ověřeno podnikem“
- **Sociální vrstva** — fotky s IG cropem (1:1 / 4:5), grid na profilu, feed, lajky, komentáře
- **Job board** — inzeráty s filtry (profese, úvazek, město, mzda), přihláška profilem za minutu, správa uchazečů se stavy
- **Adresář lidí** — podniky aktivně hledají kandidáty (filtr „hledám práci“, dovednost, město)
- **Zprávy** — 1:1 chat mezi libovolnými účty, emoji, historie, polling
- **Notifikace** — lajky, komentáře, zprávy, přihlášky, potvrzení praxe (+ transakční e-maily přes Resend)
- **Admin** — moderace obsahu, blokace účtů, ověřování podniků

## Stack

Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · Prisma · PostgreSQL · Playwright + Vitest

Dokumentace: [`docs/`](docs/) (produkt, architektura, specs, stress-test revize) · Brand: [`docs/brand/cookus-brand-guidelines.pdf`](docs/brand/cookus-brand-guidelines.pdf) · Design system: `/styleguide`

## Lokální vývoj

```bash
npm install
cp .env.example .env        # doplň DATABASE_URL, DIRECT_URL, AUTH_SECRET
npx prisma migrate dev
npm run db:seed             # demo data
npm run dev
```

Demo účty (heslo `cookus123`): `karel@cookus.cz` (osoba) · `bistro@cookus.cz` (podnik) · `admin@cookus.cz` (admin)

## Testy

```bash
npm run test:unit           # vitest — invarianty (kanonizace konverzací, handly, magic bytes…)
npm run build && npm run test:e2e   # Playwright — klíčová uživatelská flow proti seedované DB
```

## Nasazení na Vercel

Podrobný návod: **[DEPLOY.md](DEPLOY.md)**. Ve zkratce:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/superpiero/cookus)


1. Založ **Neon** (nebo Vercel Postgres) databázi.
2. Ve Vercelu importuj repo a nastav env proměnné:
   - `DATABASE_URL` — pooled connection string (Neon host s `-pooler`)
   - `DIRECT_URL` — přímé připojení (pro migrace)
   - `AUTH_SECRET` — `openssl rand -hex 32`
   - `APP_URL` — např. `https://cookus.vercel.app`
   - volitelně `RESEND_API_KEY` + `MAIL_FROM` (bez nich se e-maily jen logují)
3. Build command je výchozí (`npm run build` spouští `prisma generate && next build`).
4. Po prvním deployi spusť migrace a seed:
   ```bash
   npx prisma migrate deploy   # s DIRECT_URL
   npm run db:seed             # volitelné demo
   ```

## Struktura

```
docs/                  produktová dokumentace + brand guidelines (PDF)
prisma/                schéma, migrace (vč. partial indexu pro dedup notifikací), seed
src/app/               routy (App Router) — (auth), (app), api/
src/actions/           server actions (auth, profil, praxe, posty, joby, zprávy, admin)
src/components/        design system (ui/) + feature komponenty
src/lib/               db, auth (JWT), mail, images, rate-limit, notifikace, konstanty
tests/e2e/             Playwright specs
```
