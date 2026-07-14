# Cookus — technická architektura

> Verze dokumentu: 1.0 · Datum: 2026-07-14

## 1. Stack a zdůvodnění

| Vrstva | Volba | Zdůvodnění |
|---|---|---|
| Framework | **Next.js 15 (App Router) + React 19 + TypeScript** | Jediný framework pro SSR marketing homepage (SEO, konverze) i interaktivní aplikaci; první třída na Vercelu |
| Styling | **Tailwind CSS v4** | Design tokeny přes `@theme` přímo v CSS → design system replikovatelný bez konfigu |
| DB | **PostgreSQL** (lokálně nativní PG16, produkce Neon/Vercel Postgres) | Relace (lajky, komentáře, konverzace) si říkají o SQL; serverless-friendly přes pooled připojení |
| ORM | **Prisma** | Typová bezpečnost end-to-end, migrace, seed |
| Auth | **Vlastní: jose (JWT) v httpOnly cookie + bcryptjs** | Bez závislosti na beta verzích NextAuth; plná kontrola; credentials flow je pro MVP jediný potřebný |
| Obrázky | **Postgres (bytea) + `/api/img/[id]` s immutable cache** | Nulové externí závislosti pro MVP; abstrakce `ImageStore` umožňuje výměnu za Vercel Blob bez zásahu do features (viz §5) |
| Crop | **react-easy-crop + canvas export na klientu** | IG-style crop 1:1 / 4:5, komprese před uploadem šetří přenos i DB |
| Data fetching | **Server Components (čtení) + Server Actions (mutace) + SWR polling (zprávy, notifikace)** | Minimum boilerplate, built-in CSRF ochrana server actions |
| Validace | **Zod** na hranici všech server actions a route handlers | |
| Testy | **Playwright e2e** proti seedované DB | Testuje reálné flow uživatele, ne implementační detail |
| Deploy | **Vercel** + Neon Postgres | Zadání |

## 2. Datový model

```prisma
enum UserKind { PERSON INSTITUTION }
enum InstitutionCategory { RESTAURACE KAVARNA BAR HOTEL BISTRO CATERING CUKRARNA PIVOVAR SKOLA JINE }
enum ExperienceStatus { PENDING CONFIRMED DECLINED }
enum PostAspect { SQUARE PORTRAIT }
enum JobCategory { KUCHAR CISNIK BARISTA BARMAN CUKRAR SOMELIER PROVOZNI RECEPCNI POMOCNA_SILA MANAZER JINE }
enum EmploymentType { PLNY_UVAZEK ZKRACENY_UVAZEK BRIGADA SEZONNI STAZ }
enum SalaryPeriod { HODINA MESIC }
enum JobStatus { OPEN CLOSED }
enum ApplicationStatus { SENT VIEWED SHORTLISTED REJECTED HIRED }
enum NotificationType { LIKE COMMENT MESSAGE APPLICATION APPLICATION_STATUS EXPERIENCE_REQUEST EXPERIENCE_CONFIRMED EXPERIENCE_DECLINED }

model User {
  id            String   @id @default(cuid())
  email         String   @unique
  passwordHash  String
  kind          UserKind
  handle        String   @unique            // URL slug, a-z0-9-, 3–30 znaků
  name          String
  headline      String?                     // „Šéfkuchař · moderní česká kuchyně“
  bio           String?                     // krátké resumé (max 2000 znaků)
  location      String?
  openToWork    Boolean  @default(false)    // jen PERSON
  category      InstitutionCategory?        // jen INSTITUTION
  website       String?                     // jen INSTITUTION
  avatarImageId String?
  createdAt     DateTime @default(now())
  skills        Skill[]
  posts         Post[]
  // ... zpětné relace
}

model Skill { id, userId → User(cascade), name (max 40), position Int; @@unique([userId, name]) }

model Experience {
  id            String @id @default(cuid())
  personId      String   // vlastník záznamu (PERSON)
  institutionId String   // potvrzující podnik (INSTITUTION)
  role          String
  startDate     DateTime
  endDate       DateTime?          // null = trvá
  description   String?
  status        ExperienceStatus @default(PENDING)
  report        String?            // reference od podniku, vyplněna při potvrzení
  respondedAt   DateTime?
  createdAt     DateTime @default(now())
}

model ImageBlob { id, ownerId, mime, data Bytes, width Int, height Int, createdAt }

model Post {
  id        String @id @default(cuid())
  authorId  String → User(cascade)
  imageId   String
  caption   String?  // max 2200 znaků (IG limit)
  aspect    PostAspect
  createdAt DateTime @default(now())
  likes     Like[]
  comments  Comment[]
}

model Like    { id, postId → Post(cascade), userId → User(cascade), createdAt; @@unique([postId, userId]) }
model Comment { id, postId → Post(cascade), authorId → User(cascade), body (max 1000), createdAt }

model Job {
  id             String @id @default(cuid())
  institutionId  String → User(cascade)
  title          String
  category       JobCategory
  employmentType EmploymentType
  location       String
  salaryMin      Int?
  salaryMax      Int?
  salaryPeriod   SalaryPeriod?
  description    String       // max 10000
  status         JobStatus @default(OPEN)
  createdAt      DateTime @default(now())
  applications   Application[]
}

model Application {
  id          String @id @default(cuid())
  jobId       String → Job(cascade)
  applicantId String → User(cascade)
  message     String?   // průvodní zpráva, max 2000
  status      ApplicationStatus @default(SENT)
  createdAt   DateTime @default(now())
  @@unique([jobId, applicantId])   // 1 přihláška na osobu a inzerát
}

model Conversation {
  id            String @id @default(cuid())
  userAId       String   // KANONICKÉ POŘADÍ: userAId < userBId (řetězcové porovnání)
  userBId       String
  lastMessageAt DateTime @default(now())
  messages      Message[]
  @@unique([userAId, userBId])
}

model Message { id, conversationId → Conversation(cascade), senderId, body (max 4000), createdAt }
// „přečteno“ řešeno per-user ukazatelem:
model ConversationRead { conversationId, userId, lastReadAt; @@id([conversationId, userId]) }

model Notification {
  id        String @id @default(cuid())
  userId    String → User(cascade)   // příjemce
  actorId   String                    // kdo akci vyvolal
  type      NotificationType
  postId    String?
  jobId     String?
  applicationId String?
  experienceId  String?
  conversationId String?
  readAt    DateTime?
  createdAt DateTime @default(now())
  @@index([userId, readAt, createdAt])
}
```

### Klíčová pravidla integrity

- `Experience.personId` musí být PERSON a `institutionId` musí být INSTITUTION → vynucováno v aplikační vrstvě (Prisma nemá podmíněné FK), pokryto testy.
- `Conversation`: dvojice se ukládá v kanonickém pořadí (menší id první) → unikátnost konverzace zaručena DB indexem, ne aplikací.
- Lajk je idempotentní (`@@unique([postId, userId])` + upsert), unlike = delete.
- Notifikace typu MESSAGE se **deduplikuje**: max 1 nepřečtená na konverzaci (upsert dle `[userId, conversationId, type, readAt=null]` v aplikační logice) — jinak by chat o 50 zprávách vygeneroval 50 notifikací.

## 3. Struktura aplikace (routy)

```
/                      marketing homepage (SSR, veřejná)
/login /register       auth (veřejné)
/feed                  globální feed postů (přihlášení)
/jobs                  job board s filtry (veřejný — SEO; přihláška vyžaduje login)
/jobs/[id]             detail inzerátu + přihláška
/jobs/new              nový inzerát (jen INSTITUTION)
/jobs/[id]/applicants  správa uchazečů (jen vlastník)
/p/[handle]            veřejný profil (grid fotek / praxe / skills / inzeráty podniku)
/settings              úprava profilu, skills
/messages              seznam konverzací
/messages/[id]         chat
/notifications         seznam notifikací
/styleguide            živá dokumentace design systemu (dev)
/api/img/[id]          servírování obrázků (GET, immutable cache)
/api/upload            upload obrázku (POST, auth)
/api/poll/*            polling endpoints: unread counts, nové zprávy
```

### Rozhraní mutací

Server Actions (formuláře a klientské mutace): registrace, login, úprava profilu, skills CRUD, praxe (přidání/potvrzení/odmítnutí s reportem), post CRUD, like/unlike, komentáře, job CRUD, přihláška, změna stavu přihlášky, odeslání zprávy, označení notifikací jako přečtené. Každá akce: `zod` validace vstupu → autorizační kontrola (vlastnictví/role) → mutace → `revalidatePath`.

## 4. Autentizace a autorizace

- Registrace: e-mail + heslo (bcryptjs, cost 10) + druh účtu + jméno + handle (auto-návrh ze jména, kontrola unikátnosti).
- Session: JWT (jose, HS256, `AUTH_SECRET`) v httpOnly + Secure + SameSite=Lax cookie, expirace 30 dní. Payload: `{ sub: userId, kind, handle }`.
- Middleware chrání app routy (`/feed`, `/messages`, …) → redirect na `/login?next=…`.
- Autorizace v akcích: vlastnictví záznamu (posty, joby, praxe) + role (inzerát smí vystavit jen INSTITUTION, praxi potvrdit jen cílový podnik, stav přihlášky mění jen vlastník jobu).
- CSRF: server actions mají built-in origin check (Next.js); `/api/upload` kontroluje `Origin` hlavičku + auth cookie.

## 5. Obrázky

**MVP: bytea v Postgres.** Zdůvodnění: nulová další infrastruktura (deploy = Vercel + 1 DB), obrázky komprimujeme na klientu (canvas → JPEG q0.82, max hrana 1080 px ≈ 100–350 kB), demo škála (tisíce obrázků) je pro PG neproblematická.

- Klient: výběr souboru → react-easy-crop (1:1 nebo 4:5; avatar 1:1) → canvas export JPEG → POST `/api/upload` (limit 2 MB po kompresi, server znovu validuje mime + velikost).
- Server: uloží `ImageBlob`, vrátí `id`. `GET /api/img/[id]` → `Content-Type` + `Cache-Control: public, max-age=31536000, immutable` (id je nehádatelné cuid; obrázky jsou v MVP veřejné, což odpovídá veřejným profilům).
- **Výměnná vrstva:** modul `lib/images.ts` exportuje `saveImage(buffer, meta) → id` a `imageUrl(id)`. Přechod na Vercel Blob = reimplementace tohoto modulu + migrační skript; features se nemění.
- Riziko a mitigace: velikost DB roste ~0,3 MB/foto → limit 100 fotek/účet v MVP; monitorovat, migrace na Blob je připravená.

## 6. „Realtime“: polling strategie

MVP nepoužívá WebSockets (serverless friction). Polling přes SWR:

| Data | Interval | Endpoint |
|---|---|---|
| Badge nepřečtených notifikací + zpráv | 30 s (globální layout) | `/api/poll/badges` |
| Nové zprávy v otevřeném chatu | 5 s | `/api/poll/messages?conversationId=&after=` |
| Feed, komentáře | při navigaci / akci (revalidace) | — |

Trade-off: latence zpráv do 5 s je pro MVP přijatelná; upgrade path = Pusher/Ably nebo SSE, izolováno v jednom hooku `useMessagesPoll`.

## 7. Nasazení (Vercel)

- Build: `prisma generate && next build`; migrace: `prisma migrate deploy` (jednorázově při release).
- Env: `DATABASE_URL` (pooled, Neon `-pooler` host), `DIRECT_URL` (pro migrace), `AUTH_SECRET`.
- Prisma na serverless: singleton klient přes `globalThis`, pooled connection string (PgBouncer/Neon pooler) — bez toho dojdou connections.
- `/api/img` a upload: Node.js runtime (Buffer), ne Edge.
- Lokální vývoj a CI testy: nativní PostgreSQL 16, stejné migrace.

## 8. Bezpečnost (MVP checklist)

- Hesla: bcryptjs (cost 10), nikdy nelogovat; generická chybová hláška při loginu.
- Vstupy: zod na každé hranici; délkové limity dle datového modelu; HTML se nikdy neinterpretuje (React escapuje, žádný `dangerouslySetInnerHTML` s uživatelským obsahem).
- Cookies: httpOnly, Secure (prod), SameSite=Lax.
- Autorizace na serveru pro každou mutaci (nikdy jen skrytím UI).
- Upload: mime whitelist (image/jpeg, image/png, image/webp), max 2 MB, dekódování rozměrů na serveru.
- Rate-limity (jednoduché, in-memory per instance): login 10/min/IP, upload 20/hod/uživatel, zprávy 60/min/uživatel. (Poznámka: na serverless je in-memory limit per-instance — pro MVP přijatelné, v produkci Upstash.)
