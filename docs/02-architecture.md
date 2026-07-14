# Cookus — technická architektura

> Verze dokumentu: 1.1 (po stress-test revizi, viz `04-review-stress-test.md`) · Datum: 2026-07-14

## 1. Stack a zdůvodnění

| Vrstva | Volba | Zdůvodnění |
|---|---|---|
| Framework | **Next.js 15 (App Router) + React 19 + TypeScript** | Jediný framework pro SSR marketing homepage (SEO, konverze) i interaktivní aplikaci; první třída na Vercelu |
| Styling | **Tailwind CSS v4** | Design tokeny přes `@theme` přímo v CSS → design system replikovatelný bez konfigu |
| DB | **PostgreSQL** (lokálně nativní PG16, produkce Neon/Vercel Postgres) | Relace (lajky, komentáře, konverzace) si říkají o SQL; serverless-friendly přes pooled připojení |
| ORM | **Prisma** | Typová bezpečnost end-to-end, migrace, seed |
| Auth | **Vlastní: jose (JWT) v httpOnly cookie + bcryptjs** | Bez závislosti na beta verzích NextAuth; plná kontrola; credentials flow je pro MVP jediný potřebný |
| E-mail | **Abstrakce `lib/mail.ts`**: Resend při nastaveném `RESEND_API_KEY`, jinak log transport | Reset hesla + transakční notifikace fungují hned, produkčně po dodání klíče |
| Obrázky | **Postgres (bytea) + `/api/img/[id]` s immutable cache** | Nulové externí závislosti pro MVP; abstrakce `lib/images.ts` umožňuje výměnu za Vercel Blob (viz §5) |
| Crop | **react-easy-crop + canvas export na klientu** | IG-style crop 1:1 / 4:5, komprese před uploadem šetří přenos i DB |
| Data fetching | **Server Components (čtení) + Server Actions (mutace) + SWR polling (zprávy, notifikace)** | Minimum boilerplate, built-in CSRF ochrana server actions |
| Validace | **Zod** na hranici všech server actions a route handlers | |
| Testy | **Playwright e2e** (klíčová flow) + **vitest** (kanonizace konverzací, validace, autorizační helpery) | E2E na uživatelská flow, unit na bezpečnostní invarianty |
| Deploy | **Vercel** + Neon Postgres | Zadání |

## 2. Datový model

```prisma
enum UserKind { PERSON INSTITUTION }
enum InstitutionCategory { RESTAURACE KAVARNA BAR HOTEL BISTRO CATERING CUKRARNA PIVOVAR SKOLA JINE }
enum ExperienceStatus { UNLINKED PENDING CONFIRMED DECLINED }
enum PostAspect { SQUARE PORTRAIT }
enum JobCategory { KUCHAR CISNIK BARISTA BARMAN CUKRAR SOMELIER PROVOZNI RECEPCNI POMOCNA_SILA MANAZER JINE }
enum EmploymentType { PLNY_UVAZEK ZKRACENY_UVAZEK BRIGADA SEZONNI STAZ }
enum SalaryPeriod { HODINA MESIC }
enum JobStatus { OPEN CLOSED }
enum ApplicationStatus { SENT VIEWED SHORTLISTED REJECTED HIRED }
enum NotificationType { LIKE COMMENT MESSAGE APPLICATION APPLICATION_STATUS EXPERIENCE_REQUEST EXPERIENCE_CONFIRMED EXPERIENCE_DECLINED POKE FRIEND_REQUEST FRIEND_ACCEPTED }
enum FriendshipStatus { PENDING ACCEPTED }

model User {
  id            String   @id @default(cuid())
  email         String   @unique              // lowercase
  passwordHash  String
  kind          UserKind
  handle        String   @unique              // a-z0-9-, 3–30 znaků, lze měnit
  name          String
  headline      String?
  bio           String?                       // max 2000
  city          String?                       // z číselníku CITIES (konstanta v kódu)
  openToWork    Boolean  @default(false)      // jen PERSON
  category      InstitutionCategory?          // jen INSTITUTION
  website       String?                       // jen INSTITUTION
  verified      Boolean  @default(false)      // jen INSTITUTION, uděluje admin
  isAdmin       Boolean  @default(false)
  isBlocked     Boolean  @default(false)      // blokace loginu (moderace)
  avatarImageId String?
  createdAt     DateTime @default(now())
  // relace: skills, posts, likes, comments, jobs, applications, experiences (jako osoba
  // i jako podnik), messages, notifications (příjemce i aktér), images, resetTokens
}

model Skill {
  id String @id @default(cuid())
  userId String; user User @relation(onDelete: Cascade)
  name String            // max 40
  position Int @default(0)
  @@unique([userId, name])
}

model Experience {
  id              String   @id @default(cuid())
  personId        String;  person User @relation("expPerson", onDelete: Cascade)
  institutionId   String?; institution User? @relation("expInstitution", onDelete: SetNull)
  institutionName String   // snapshot názvu (drží i free-text neexistujícího podniku)
  role            String
  startDate       DateTime
  endDate         DateTime?          // null = trvá
  description     String?            // max 1000
  status          ExperienceStatus @default(UNLINKED)
  report          String?            // reference od podniku (max 1000), při CONFIRMED
  respondedAt     DateTime?
  createdAt       DateTime @default(now())
  @@index([personId])
  @@index([institutionId, status])
}
// Stavová logika: UNLINKED = bez propojení na účet podniku (viditelné, „neověřeno“);
// PENDING = žádost odeslána (viditelné jako neověřené); CONFIRMED = badge + report;
// DECLINED = vidí jen vlastník. institutionId != null ⇔ status != UNLINKED.

model ImageBlob {
  id String @id @default(cuid())
  ownerId String; owner User @relation(onDelete: Cascade)
  mime String; data Bytes; width Int; height Int
  createdAt DateTime @default(now())
  @@index([ownerId])
}

model Post {
  id String @id @default(cuid())
  authorId String; author User @relation(onDelete: Cascade)
  imageId String
  caption String?        // max 2200
  aspect PostAspect
  createdAt DateTime @default(now())
  @@index([createdAt])
  @@index([authorId, createdAt])
}

model Like {
  id String @id @default(cuid())
  postId String; post Post @relation(onDelete: Cascade)
  userId String; user User @relation(onDelete: Cascade)
  createdAt DateTime @default(now())
  @@unique([postId, userId])
}

model Comment {
  id String @id @default(cuid())
  postId String; post Post @relation(onDelete: Cascade)
  authorId String; author User @relation(onDelete: Cascade)
  body String            // max 1000
  createdAt DateTime @default(now())
  @@index([postId, createdAt])
}

model Job {
  id String @id @default(cuid())
  institutionId String; institution User @relation(onDelete: Cascade)
  title String
  category JobCategory
  employmentType EmploymentType
  city String            // z číselníku CITIES
  address String?        // upřesnění (volný text)
  salaryMin Int?; salaryMax Int?; salaryPeriod SalaryPeriod?
  description String     // max 10000
  status JobStatus @default(OPEN)
  createdAt DateTime @default(now())
  @@index([status, createdAt])
  @@index([institutionId])
}
// V UI nelze job smazat — jen uzavřít (CLOSED). Cascade delete jen pro admin/smazání účtu.

model Application {
  id String @id @default(cuid())
  jobId String; job Job @relation(onDelete: Cascade)
  applicantId String; applicant User @relation(onDelete: Cascade)
  message String?        // max 2000
  status ApplicationStatus @default(SENT)
  createdAt DateTime @default(now())
  @@unique([jobId, applicantId])
  @@index([applicantId, createdAt])
}

model Conversation {
  id String @id @default(cuid())
  userAId String; userA User @relation("convA", onDelete: Cascade)   // KANONICKY: userAId < userBId
  userBId String; userB User @relation("convB", onDelete: Cascade)
  lastMessageAt DateTime @default(now())
  @@unique([userAId, userBId])
  @@index([userAId, lastMessageAt])
  @@index([userBId, lastMessageAt])
}

model Message {
  id String @id @default(cuid())
  conversationId String; conversation Conversation @relation(onDelete: Cascade)
  senderId String; sender User @relation(onDelete: Cascade)
  body String            // max 4000
  createdAt DateTime @default(now())
  @@index([conversationId, createdAt])
}

model ConversationRead {
  conversationId String; conversation Conversation @relation(onDelete: Cascade)
  userId String; user User @relation(onDelete: Cascade)
  lastReadAt DateTime
  @@id([conversationId, userId])
}

model Notification {
  id String @id @default(cuid())
  userId String; user User @relation("notifRecipient", onDelete: Cascade)
  actorId String; actor User @relation("notifActor", onDelete: Cascade)
  type NotificationType
  postId String?; post Post? @relation(onDelete: Cascade)
  jobId String?; job Job? @relation(onDelete: Cascade)
  applicationId String?; application Application? @relation(onDelete: Cascade)
  experienceId String?; experience Experience? @relation(onDelete: Cascade)
  conversationId String?; conversation Conversation? @relation(onDelete: Cascade)
  readAt DateTime?
  createdAt DateTime @default(now())
  @@index([userId, readAt, createdAt])
}

model Friendship {
  id String @id @default(cuid())
  requesterId String; requester User @relation("friendRequester", onDelete: Cascade)
  addresseeId String; addressee User @relation("friendAddressee", onDelete: Cascade)
  status FriendshipStatus @default(PENDING)
  createdAt DateTime @default(now())
  respondedAt DateTime?
  @@unique([requesterId, addresseeId])   // opačný směr hlídá aplikace (auto-accept)
  @@index([addresseeId, status])
  @@index([requesterId, status])
}

model Poke {
  id String @id @default(cuid())
  fromId String; from User @relation("pokesSent", onDelete: Cascade)
  toId String; to User @relation("pokesReceived", onDelete: Cascade)
  createdAt DateTime @default(now())
  @@index([toId, createdAt])
}

model PasswordResetToken {
  id String @id @default(cuid())
  userId String; user User @relation(onDelete: Cascade)
  tokenHash String @unique   // sha256 tokenu
  expiresAt DateTime          // +1 h
  usedAt DateTime?
}

model RateLimitHit {
  id String @id @default(cuid())
  key String                 // např. "login:1.2.3.4" / "register:1.2.3.4"
  createdAt DateTime @default(now())
  @@index([key, createdAt])
}
```

### 2.1 Pravidla integrity a mazání

- `Experience.personId` = PERSON, `institutionId` = INSTITUTION → aplikační vrstva + unit testy.
- **Smazání účtu** (GDPR): cascade smaže skills, posty (→ lajky/komentáře/notifikace), obrázky, joby (→ přihlášky), přihlášky, konverzace obou stran (dokumentovaný trade-off), zprávy, notifikace (přijaté i vyvolané). Experience u podniku: SetNull — záznam osoby přežije se snapshotem `institutionName`, badge zaniká (status zůstává CONFIRMED, ověření se zobrazuje jen s existujícím podnikem — viz specs §1.3).
- Lajk idempotentní (`@@unique` + upsert), unlike = delete + smazání nepřečtené LIKE notifikace.
- `Conversation` kanonicky (menší id první) → unikátnost zaručuje DB.

### 2.2 Dedup notifikací (ruční migrace)

Prisma partial index neumí → SQL v migraci:

```sql
CREATE UNIQUE INDEX notif_dedup_unread ON "Notification"
  ("userId", "actorId", "type", coalesce("postId",''), coalesce("conversationId",''))
  WHERE "readAt" IS NULL;
```

Insert notifikací přes `INSERT … ON CONFLICT DO NOTHING` (raw). Efekt: max 1 nepřečtená notifikace od téhož aktéra téhož typu k témuž cíli (50 zpráv v chatu = 1 notifikace).

## 3. Struktura aplikace (routy)

```
/                      marketing homepage (ISR revalidate 300, veřejná)
/login /register       auth (veřejné) · /forgot-password /reset-password
/feed                  feed postů: taby Přátelé / Vše, chronologicky (přihlášení)
/friends               žádosti o přátelství + seznam přátel (přihlášení)
/invite                pozvánky do aplikace: e-mail + sdílitelný odkaz (přihlášení)
/post/[id]             detail postu s komentáři
/people                adresář lidí: filtry openToWork / dovednost / město (veřejný)
/jobs                  job board s filtry (veřejný — SEO)
/jobs/[id]             detail inzerátu + přihláška
/jobs/new              nový inzerát (jen INSTITUTION) · /jobs/[id]/edit
/jobs/[id]/applicants  správa uchazečů (jen vlastník)
/applications          moje přihlášky (jen PERSON)
/verifications         žádosti o potvrzení praxe (jen INSTITUTION)
/p/[handle]            veřejný profil
/settings              úprava profilu, skills, praxe, smazání účtu
/messages              seznam konverzací · /messages/[id] chat
/notifications         seznam notifikací
/styleguide            živá dokumentace design systemu
/admin                 moderace (jen isAdmin): mazání obsahu, blokace, ověření podniků
/api/img/[id]          servírování obrázků (GET, immutable cache, nosniff)
/api/upload            upload obrázku (POST, auth, origin check)
/api/poll/badges       nepřečtené notifikace + zprávy (30 s)
/api/poll/messages     nové zprávy v konverzaci (5 s) — VŽDY participant-check
```

**Pravidlo:** každý route handler, který čte nebo mění data vázaná na uživatele, ověřuje vlastnictví/členství na serveru (žádné spoléhání na nehádatelné id).

### Rozhraní mutací

Server Actions: registrace, login/logout, reset hesla, úprava profilu, skills CRUD, praxe (přidat/upravit UNLINKED/propojit/stáhnout žádost/potvrdit s reportem/odmítnout/smazat), post (vytvořit/smazat), like/unlike, komentáře (přidat/smazat), job CRUD (bez delete), přihláška + změna stavu, odeslání zprávy, přečtení notifikací, admin akce. Každá akce: zod → auth/authz → mutace → `revalidatePath`.

## 4. Autentizace a autorizace

- Registrace: e-mail (lowercase) + heslo (bcryptjs cost 10) + druh účtu + jméno (+ kategorie u podniku). Handle auto-návrh, kolize → sufix.
- Session: JWT (jose HS256, `AUTH_SECRET`) v httpOnly + Secure + SameSite=Lax cookie, 30 dní. Payload **jen `{ sub, kind }`** — profil (handle, jméno, avatar) se čte z DB per request přes React `cache()`. `isBlocked` → login odmítnut a session neplatná.
- Reset hesla: token (32 B random, v DB sha256 hash, TTL 1 h, jednorázový) → e-mail přes `lib/mail.ts`.
- Middleware chrání privátní routy → redirect `/login?next=…`; role-check v layoutech (`/jobs/new`, `/verifications`, `/admin`…) + vždy v akcích.
- CSRF: server actions built-in; `/api/upload` kontroluje Origin + auth.

## 5. Obrázky

**MVP: bytea v Postgres**, komprese na klientu (canvas → JPEG q0.82, max 1080 px, ≈ 100–350 kB), limit 100 fotek/účet.

- `POST /api/upload`: auth → limit 2 MB (bezpečně pod Vercel 4.5 MB) → **magic bytes** kontrola (JPEG `FF D8 FF`, PNG, WebP `RIFF….WEBP`) → rozměry přes `image-size` → uložit → `{ id }`.
- `GET /api/img/[id]`: `Content-Type` z whitelistu dle uložené mime, `Cache-Control: public, max-age=31536000, immutable`, `X-Content-Type-Options: nosniff`. Node runtime.
- Výměnná vrstva `lib/images.ts` (`saveImage`, `imageUrl`) → přechod na Vercel Blob bez zásahu do features.

## 6. „Realtime“: polling strategie

| Data | Interval | Endpoint |
|---|---|---|
| Badge notifikací + zpráv | 30 s (layout) | `/api/poll/badges` |
| Nové zprávy v otevřeném chatu | 5 s | `/api/poll/messages?conversationId=&after=` |

- `lastReadAt` se aktualizuje **jen** při `document.visibilityState === 'visible'` a jen když přišly nové zprávy (nebo při otevření chatu).
- Unread zpráv — jeden raw SQL (žádné N+1):

```sql
SELECT count(*)::int FROM "Message" m
JOIN "Conversation" c ON c.id = m."conversationId"
LEFT JOIN "ConversationRead" r ON r."conversationId" = c.id AND r."userId" = $1
WHERE (c."userAId" = $1 OR c."userBId" = $1)
  AND m."senderId" <> $1
  AND m."createdAt" > coalesce(r."lastReadAt", 'epoch'::timestamptz);
```

Upgrade path: SSE/Pusher izolované v hooku `useMessagesPoll`.

## 7. Vyhledávání

- Joby: `ILIKE` na title+description, filtry kategorie/úvazek/město (přesná shoda z číselníku)/„jen se mzdou“. Upgrade path: `pg_trgm` GIN index (jedna migrace, beze změny kódu).
- Lidé (`/people`): filtr openToWork, město, dovednost (`Skill.name ILIKE`).
- Číselník měst: konstanta `CITIES` (~20 měst/krajů ČR) sdílená formuláři i filtry.

## 8. Nasazení (Vercel)

- Build: `prisma generate && next build`; migrace `prisma migrate deploy` při release.
- Env: `DATABASE_URL` (pooled), `DIRECT_URL` (migrace), `AUTH_SECRET`, volitelně `RESEND_API_KEY`, `MAIL_FROM`, `APP_URL`.
- Prisma singleton přes `globalThis`; pooled connection string.
- Homepage ISR (`revalidate: 300`) → Neon cold start neblokuje LCP.

## 9. Bezpečnost (MVP checklist)

- Hesla bcryptjs cost 10; generická hláška při loginu; reset tokeny hashované, TTL 1 h.
- Zod na každé hranici; délkové limity; žádný `dangerouslySetInnerHTML` s uživatelským obsahem.
- Cookies httpOnly + Secure + SameSite=Lax.
- Autorizace na serveru pro **každou** mutaci i čtecí route handler (participant/owner check).
- Upload: magic bytes, 2 MB, `image-size`, nosniff; mime whitelist.
- Rate limity **DB-backed** (RateLimitHit, sliding window): login 10/15 min/IP, registrace 5/hod/IP, reset hesla 5/hod/IP; in-memory doplněk: zprávy 60/min, upload 20/hod, komentáře 30/min.
- E-mail enumeration při registraci: akceptovaný trade-off (viz 04 §10), mitigace rate limitem.
- Moderace: admin maže obsah a blokuje účty (`/admin`).
