# Cookus — revize a stress-test dokumentace

> Verze: 1.0 · Datum: 2026-07-14 · Vstup: adversariální revize dokumentů 01–03 (v1.0) nezávislým reviewerem.
> Výstup: 25 nálezů → rozhodnutí níže, dokumenty 01–03 aktualizovány na v1.1.

## Shrnutí

Nejnebezpečnější kombinace nálezů: **ověřená praxe (differentiator) by při reálném startu nefungovala** —
(a) praxi šlo přidat jen výběrem existujícího účtu podniku (cold start → nikdo nemá koho vybrat),
(b) podniky nebyly nijak ověřené (fake „Hotel Imperial" si potvrdí vlastní praxi),
(c) bez e-mailů se podnik o žádosti nedozví → uchazeči bez odpovědi → smrt marketplace.
Dále schéma neumělo splnit sliby specs (onDelete, dedup notifikací, indexy) a chyběla moderace, mazání účtu (GDPR) a discovery lidí pro podniky.

## Rozhodnutí po nálezech

| # | Sev. | Nález (zkráceně) | Rozhodnutí |
|---|---|---|---|
| 1 | CRIT | Experience: SetNull na non-nullable FK, chybí snapshot názvu | **Přijato.** `institutionId` nullable + `onDelete: SetNull`, `institutionName` snapshot, `personId` cascade. |
| 2 | CRIT | Cold start: praxe jen výběrem účtu podniku | **Přijato — změna designu.** Základem je **neověřený záznam praxe** (volný text názvu podniku). Propojení na účet podniku je volitelné; potvrzením vzniká „Ověřeno podnikem“. Metrika v 01 upravena. |
| 3 | CRIT | Podniky bez verifikace → fake reference | **Přijato (MVP verze).** Admin ručně uděluje badge **„Ověřený podnik“**; neověřený podnik potvrzovat praxi může, ale badge ověření nese i jméno podniku bez badge — návštěvník vidí obojí. E-mail verifikace v roadmapě. |
| 4 | CRIT | Žádný reset hesla, žádné transakční e-maily | **Přijato (s abstrakcí).** `lib/mail.ts`: Resend, když je `RESEND_API_KEY`, jinak log transport (vývoj/demo). Flow zapomenutého hesla v MVP. Transakční e-mail pro APPLICATION a EXPERIENCE_REQUEST. Denní digest → v2. |
| 5 | MAJ | Dedup notifikací neproveditelný Prisma upsertem | **Přijato.** Ruční migrace: partial unique index (`WHERE "readAt" IS NULL`) + `ON CONFLICT DO NOTHING`. Unlike maže nepřečtenou LIKE notifikaci. |
| 6 | MAJ | Notification bez FK → osiřelé záznamy | **Přijato.** Všechny reference relacemi s `onDelete: Cascade`. |
| 7 | MAJ | Chybějící indexy (Message, Conversation, Experience, Post, Job, Application) | **Přijato.** Doplněno do schématu v 02. |
| 8 | MAJ | Unread badge = N+1 / neexistující ConversationRead | **Přijato.** Jeden raw SQL (LEFT JOIN + COALESCE na epoch), předepsán v 02 §6. |
| 9 | MAJ | IDOR na `/api/poll/*` | **Přijato.** Pravidlo: každý route handler ověřuje členství/vlastnictví; participant-check u zpráv explicitně. |
| 10 | MAJ | Registrace bez rate limitu; e-mail enumeration | **Přijato částečně.** DB-backed rate limit i pro registraci (5/hod/IP). Enumeration u registrace **vědomě akceptováno** (UX > riziko, mitigováno limitem); login hláška zůstává generická. |
| 11 | MAJ | In-memory rate limit neúčinný na serverless | **Přijato.** Rate limit login+registrace přes DB tabulku (sliding window). In-memory jen jako doplněk pro zprávy/upload. |
| 12 | MAJ | Seed čísla na homepage jako social proof | **Přijato.** Čísla se zobrazí až nad prahem (50 lidí / 10 podniků / 10 pozic); pod prahem kvalitativní proof (persony, citace). |
| 13 | MAJ | Žádná moderace/admin | **Přijato (minimum).** `isAdmin`: smí smazat libovolný post/komentář/job a zablokovat účet (`isBlocked` → nelze login). Report tlačítko → v2. |
| 14 | MAJ | Open-to-work bez discovery | **Přijato.** Nová routa `/people`: adresář lidí s filtry (hledám práci, dovednost, město). |
| 15 | MAJ | PENDING žádost bez timeoutu | **Přijato částečně.** Díky #2 je záznam viditelný jako neověřený i během PENDING. Osoba může žádost stáhnout a poslat znovu. Automatické remindery → v2. |
| 16 | MAJ | Smazání účtu nedesignováno (GDPR) | **Přijato.** Akce „Smazat účet“ v nastavení; onDelete definováno pro všechny modely (02 §2.1). Konverzace obou stran se mažou (dokumentovaný trade-off MVP). |
| 17 | MAJ | Lokalita volný text | **Přijato.** Číselník měst/krajů (konstanta v kódu, ~20 položek) + volitelný upřesňující text. Filtr = přesná shoda města. |
| 18 | min | Upload: spoofovatelný mime, chybí dekodér rozměrů | **Přijato.** Magic-bytes kontrola (JPEG/PNG/WebP), rozměry přes `image-size`, `X-Content-Type-Options: nosniff`, Content-Type jen z whitelistu. |
| 19 | min | ILIKE bez indexu | **Přijato (dokumentace).** Upgrade path: `pg_trgm` GIN index, připravená migrace, bez změny kódu. |
| 20 | min | LCP vs. Neon cold start | **Přijato.** Homepage ISR `revalidate: 300`. |
| 21 | min | lastReadAt při pollu na pozadí | **Přijato.** Aktualizace jen při `visibilityState === 'visible'` a jen při nových zprávách. |
| 22 | min | Smazání jobu ničí historii přihlášek | **Přijato.** V UI nelze job smazat, jen uzavřít. Cascade zůstává pro admin zásah. |
| 23 | min | Chybějící routy (moje přihlášky, žádosti o potvrzení) | **Přijato.** `/applications` (osoba) a `/verifications` (podnik) doplněny do 02 §3. |
| 24 | min | Handle v JWT zastará | **Přijato.** JWT nese jen `sub` + `kind`; profil se čte z DB (React `cache()` per request). Handle lze měnit. |
| 25 | min | Scope creep (picker, 2 komentáře ve feedu) vs. chybějící testy | **Přijato částečně.** Feed karta: jen počty, komentáře na detailu postu. Emoji: nativní vstup + mini quick-bar (8 emoji) — explicitní požadavek zadání. `/styleguide` zůstává (dokumentace design systemu). Přidány unit testy (vitest) na kanonizaci konverzací, validace a autorizační helpery. |

## Co revize potvrdila jako správné

2MB upload pod Vercel 4.5MB limitem přes route handler; Prisma singleton + pooled Neon + `DIRECT_URL`;
`/api/img` immutable cache + Node runtime; kanonické pořadí Conversation s DB unique; index Notification `[userId, readAt, createdAt]`.

## Zbytková rizika (vědomě akceptovaná v MVP)

1. **Obrázky v Postgres** — limit 100 fotek/účet, připravená výměna za Vercel Blob (izolováno v `lib/images.ts`).
2. **Polling místo realtime** — latence zpráv ≤ 5 s; upgrade path SSE/Pusher v jednom hooku.
3. **E-mail enumeration při registraci** — akceptováno, mitigace rate limitem.
4. **Fake podniky bez badge ověření** — reference od neověřeného podniku je viditelně slabší; plná verifikace v roadmapě.
5. **Admin moderace bez report tlačítka** — při MVP objemu stačí; report v v2.
