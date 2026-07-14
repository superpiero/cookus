# Nasazení Cookus na Vercel

Kód je na GitHubu (`superpiero/cookus`, větev `claude/gastro-job-marketplace-yll7ea`).
Build si sám spustí migrace (`prisma migrate deploy && next build`), takže stačí propojit repo,
přidat databázi a nastavit 2–3 proměnné. **~3 minuty.**

## 1. Databáze (Vercel Postgres / Neon)

Nejjednodušší je **Vercel Postgres** (běží na Neonu) — provisioní se přímo v projektu:

1. Ve Vercelu otevři projekt → záložka **Storage** → **Create Database** → **Postgres**.
2. Připoj ho k projektu. Vercel automaticky vloží proměnné `POSTGRES_PRISMA_URL`
   (pooled) a `POSTGRES_URL_NON_POOLING` (přímé).

> Alternativa: vlastní Neon/Supabase/RDS — jen si připrav dva connection stringy
> (pooled + přímý).

## 2. Import projektu do Vercelu

1. **Add New… → Project** → vyber repo `superpiero/cookus`.
2. **Root Directory** = kořen repa, framework se detekuje jako **Next.js**.
3. **Production Branch**: použij `main` (obsahuje kompletní kód; je to výchozí větev pro deploy).

## 3. Environment Variables

Přidej v **Settings → Environment Variables** (Production i Preview):

| Proměnná | Hodnota |
|---|---|
| `DATABASE_URL` | zkopíruj hodnotu z `POSTGRES_PRISMA_URL` (pooled) |
| `DIRECT_URL` | zkopíruj hodnotu z `POSTGRES_URL_NON_POOLING` (přímé, pro migrace) |
| `AUTH_SECRET` | `openssl rand -hex 32` (vygeneruj a vlož) |
| `APP_URL` | `https://<tvuj-projekt>.vercel.app` (uprav po prvním deploy) |
| `RESEND_API_KEY` | *(volitelné)* klíč z resend.com — bez něj se e-maily jen logují |
| `MAIL_FROM` | *(volitelné)* `Cookus <noreply@tvojedomena.cz>` |

> Pokud máš vlastní DB, dej do `DATABASE_URL` pooled string a do `DIRECT_URL` přímý.

## 4. Deploy

Klikni **Deploy**. Build provede `prisma migrate deploy` (vytvoří schéma včetně
partial indexu pro dedup notifikací) a `next build`. Po dokončení uprav `APP_URL`
na skutečnou doménu a případně redeployni.

## 5. Demo data (volitelné)

Aplikace funguje i s prázdnou databází (má ošetřené prázdné stavy). Pro demo obsah
spusť seed z počítače proti produkční DB:

```bash
vercel env pull .env.production.local      # stáhne DATABASE_URL/DIRECT_URL
DATABASE_URL="$POSTGRES_PRISMA_URL" DIRECT_URL="$POSTGRES_URL_NON_POOLING" npm run db:seed
```

Seed vytvoří 12 účtů, fotky, inzeráty, praxe i konverzace. Demo login (heslo `cookus123`):
`karel@cookus.cz` (osoba), `bistro@cookus.cz` (podnik), `admin@cookus.cz` (admin).

## Poznámky k produkci

- **Prisma + serverless:** používá se pooled `DATABASE_URL` (PgBouncer/Neon pooler),
  migrace jedou přes `DIRECT_URL` — bez toho dojdou connections.
- **Homepage** je cachovaná na 5 min (Neon cold start neblokuje LCP).
- **Obrázky** jsou v MVP v Postgresu (`bytea`), servírované přes `/api/img/[id]` s
  immutable cache. Výměna za Vercel Blob je izolovaná v `src/lib/images.ts`.
- **Rate-limity** jsou DB-backed (funkční i na serverless); pro vysoký provoz zvaž Upstash.
