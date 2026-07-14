/* Seed demo dat (docs/03 §9). Spuštění: npm run db:seed */
import { PrismaClient, type User } from "@prisma/client";
import bcrypt from "bcryptjs";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const db = new PrismaClient();
const IMG_DIR = join(__dirname, "seed-images");

function daysAgo(days: number, hours = 0): Date {
  return new Date(Date.now() - days * 86400_000 - hours * 3600_000);
}

async function image(ownerId: string, file: string): Promise<string> {
  const data = readFileSync(join(IMG_DIR, `${file}.jpg`));
  const portrait = file.endsWith("-pt");
  const created = await db.imageBlob.create({
    data: {
      ownerId,
      data,
      mime: "image/jpeg",
      width: 1080,
      height: portrait ? 1350 : 1080,
    },
    select: { id: true },
  });
  return created.id;
}

async function main() {
  console.log("Mažu stará data…");
  await db.rateLimitHit.deleteMany();
  await db.user.deleteMany(); // cascade smaže zbytek

  const passwordHash = await bcrypt.hash("cookus123", 10);

  console.log("Zakládám účty…");
  const mkUser = (data: Partial<User> & { email: string; handle: string; name: string; kind: "PERSON" | "INSTITUTION" }) =>
    db.user.create({ data: { passwordHash, ...data } });

  // ---- Podniky ----
  const bistro = await mkUser({
    email: "bistro@cookus.cz", handle: "bistro-u-chroma", name: "Bistro U Chroma", kind: "INSTITUTION",
    category: "BISTRO", city: "Praha", verified: true,
    headline: "Bistro s otevřenou kuchyní na Letné",
    bio: "Od rána mačkáme pomeranče, od poledne saháme po lokálních surovinách. Malý tým, žádná hierarchie z hotelu, sobotní brunch je u nás svátek.",
    website: "https://bistro-u-chroma.example.cz",
  });
  const kavarna = await mkUser({
    email: "kavarna@cookus.cz", handle: "kavarna-pomada", name: "Kavárna Pomáda", kind: "INSTITUTION",
    category: "KAVARNA", city: "Brno", verified: true,
    headline: "Specialty kávа a pomáda ve vlasech",
    bio: "Výběrová káva, vinylové desky a nejlepší cheesecake v Brně. Hledáme lidi, co se nebojí ranních směn.",
  });
  const hotel = await mkUser({
    email: "hotel@cookus.cz", handle: "hotel-imperial", name: "Hotel Imperial", kind: "INSTITUTION",
    category: "HOTEL", city: "Karlovy Vary",
    headline: "Lázeňská klasika s fine dining restaurací",
    bio: "130 pokojů, dvě restaurace, lobby bar. Nabíráme celoročně, sezónu jedeme naplno.",
  });
  const bar = await mkUser({
    email: "bar@cookus.cz", handle: "bar-neon", name: "Bar Neon", kind: "INSTITUTION",
    category: "BAR", city: "Praha",
    headline: "Koktejlový bar, co svítí do noci",
    bio: "Signature drinky, otevřeno do 3. Hledáme rychlé ruce a klidné hlavy.",
  });

  // ---- Lidé ----
  const karel = await mkUser({
    email: "karel@cookus.cz", handle: "karel-dvorak", name: "Karel Dvořák", kind: "PERSON",
    city: "Praha", openToWork: true,
    headline: "Sous chef · moderní česká kuchyně",
    bio: "8 let v kuchyni, od učňáku přes hotel po bistro. Nejradši dělám z podhoubí české klasiky něco, co lidi překvapí. Hledám kuchyni, kde se nezastaví růst.",
  });
  const bara = await mkUser({
    email: "bara@cookus.cz", handle: "bara-mala", name: "Bára Malá", kind: "PERSON",
    city: "Brno", openToWork: true,
    headline: "Barmanka & studentka — brigády a víkendy",
    bio: "Třetím rokem za barem, miluju klasiky i vlastní twisty. Přes týden škola, víkendy a večery jsem vaše.",
  });
  const klara = await mkUser({
    email: "klara@cookus.cz", handle: "klara-cukrarka", name: "Klára Veselá", kind: "PERSON",
    city: "Praha",
    headline: "Cukrářka · entremety a svatební dorty",
    bio: "Vyučená v Paříži (no dobře, na YouTube, ale poctivě). Entremety, laminovaná těsta, svatby. Beru i zakázky.",
  });
  const tomas = await mkUser({
    email: "tomas@cookus.cz", handle: "tomas-barista", name: "Tomáš Král", kind: "PERSON",
    city: "Brno", openToWork: true,
    headline: "Barista · latte art & brewing",
    bio: "Dva roky u výběrovky, rád učím lidi kávu chápat, ne jen pít.",
  });
  const eva = await mkUser({
    email: "eva@cookus.cz", handle: "eva-servirka", name: "Eva Horká", kind: "PERSON",
    city: "Praha",
    headline: "Servírka s úsměvem i pod tlakem",
    bio: "5 let na place, od snídaňovek po fine dining. Angličtina plynně, němčina obstojně.",
  });
  const jirka = await mkUser({
    email: "jirka@cookus.cz", handle: "jirka-kuchar", name: "Jirka Novák", kind: "PERSON",
    city: "Ostrava", openToWork: true,
    headline: "Kuchař — česká klasika, poctivé omáčky",
    bio: "Svíčková, co si pamatujete z neděle u babičky. Hledám stálou práci v Ostravě a okolí.",
  });
  const marta = await mkUser({
    email: "marta@cookus.cz", handle: "marta-provozni", name: "Marta Fialová", kind: "PERSON",
    city: "Praha",
    headline: "Provozní · 10 let v gastru",
    bio: "Od servírky po provozní dvou podniků. Umím směny, sklady, lidi i čísla.",
  });
  const ondra = await mkUser({
    email: "ondra@cookus.cz", handle: "ondra-somelier", name: "Ondřej Vlk", kind: "PERSON",
    city: "Karlovy Vary",
    headline: "Sommelier — moravská vína & pairing",
    bio: "WSET 2, vinařství beru jako řemeslo i vyprávění. Rád stavím vinné lístky od nuly.",
  });
  const admin = await mkUser({
    email: "admin@cookus.cz", handle: "cookus-admin", name: "Cookus Admin", kind: "PERSON",
    isAdmin: true, headline: "Tady uklízím ✨",
  });

  console.log("Nahrávám avatary a fotky…");
  await db.user.update({ where: { id: bistro.id }, data: { avatarImageId: await image(bistro.id, "place-bistro-sq") } });
  await db.user.update({ where: { id: kavarna.id }, data: { avatarImageId: await image(kavarna.id, "place-cafe-sq") } });
  await db.user.update({ where: { id: bar.id }, data: { avatarImageId: await image(bar.id, "place-bar-sq") } });
  await db.user.update({ where: { id: hotel.id }, data: { avatarImageId: await image(hotel.id, "place-hotel-sq") } });

  console.log("Skills…");
  const skills: [User, string[]][] = [
    [karel, ["Moderní česká kuchyně", "Sous-vide", "Vedení směny", "Menu development", "HACCP"]],
    [bara, ["Klasické koktejly", "Flair", "Rychlý servis", "Angličtina"]],
    [klara, ["Entremety", "Laminovaná těsta", "Svatební dorty", "Čokoláda"]],
    [tomas, ["Latte art", "V60 & aeropress", "Kalibrace espressa", "Školení baristů"]],
    [eva, ["Fine dining servis", "Angličtina C1", "Němčina B2", "Someliérské minimum"]],
    [jirka, ["Česká klasika", "Omáčky", "Minutky", "Práce v páře"]],
    [marta, ["Provoz & směny", "Skladové hospodářství", "Nábor", "Reporting"]],
    [ondra, ["Vinný lístek", "Pairing", "Moravská vína", "WSET 2"]],
  ];
  for (const [user, names] of skills) {
    await db.skill.createMany({
      data: names.map((name, position) => ({ userId: user.id, name, position })),
    });
  }

  console.log("Praxe (UNLINKED / PENDING / CONFIRMED)…");
  await db.experience.create({
    data: {
      personId: karel.id, institutionId: bistro.id, institutionName: bistro.name,
      role: "Sous chef", startDate: daysAgo(900), endDate: daysAgo(60),
      description: "Večerní servis, tvorba sezónního menu, zaučování juniorů.",
      status: "CONFIRMED", respondedAt: daysAgo(50),
      report: "Karel táhl večerní servis i při plné rezervaci. Menu, které postavil, nám zvedlo tržby o pětinu. Kdykoli znovu.",
    },
  });
  await db.experience.create({
    data: {
      personId: karel.id, institutionId: hotel.id, institutionName: hotel.name,
      role: "Chef de partie", startDate: daysAgo(1800), endDate: daysAgo(950),
      status: "PENDING",
    },
  });
  await db.experience.create({
    data: {
      personId: karel.id, institutionName: "Hospoda U Lípy (zaniklá)",
      role: "Kuchař", startDate: daysAgo(2900), endDate: daysAgo(1900),
      status: "UNLINKED",
    },
  });
  await db.experience.create({
    data: {
      personId: bara.id, institutionId: bar.id, institutionName: bar.name,
      role: "Barmanka", startDate: daysAgo(700), endDate: null,
      description: "Páteční a sobotní směny, signature menu.",
      status: "CONFIRMED", respondedAt: daysAgo(10),
      report: "Nejrychlejší ruce na baru, co jsme kdy měli. Hosté si ji pamatují jménem.",
    },
  });
  await db.experience.create({
    data: {
      personId: tomas.id, institutionId: kavarna.id, institutionName: kavarna.name,
      role: "Barista", startDate: daysAgo(500), endDate: null,
      status: "CONFIRMED", respondedAt: daysAgo(30),
      report: "Tomáš dokáže vysvětlit kávu tak, že si host objedná ještě jednu. Latte art bez chyby.",
    },
  });
  await db.experience.create({
    data: {
      personId: eva.id, institutionId: hotel.id, institutionName: hotel.name,
      role: "Servírka fine dining", startDate: daysAgo(1200), endDate: daysAgo(300),
      status: "PENDING",
    },
  });
  await db.experience.create({
    data: {
      personId: jirka.id, institutionName: "Restaurace Haldovka",
      role: "Samostatný kuchař", startDate: daysAgo(1500), endDate: daysAgo(90),
      status: "UNLINKED",
    },
  });

  console.log("Posty…");
  const posts: { author: User; file: string; caption: string; days: number }[] = [
    { author: karel, file: "dish-steak-sq", caption: "Dry aged rib eye, 45 dní. Sobotní specialita 🔥", days: 2 },
    { author: karel, file: "dish-pasta-pt", caption: "Domácí tagliatelle, máslo, šalvěj. Jednoduchost vyhrává.", days: 8 },
    { author: karel, file: "dish-salad-sq", caption: "Jarní talíř — chřest, ředkev, kozí sýr 🌱", days: 15 },
    { author: bara, file: "dish-cocktail-sq", caption: "Nový signature: Pomáda Sour 🍹 kdo ochutná první?", days: 1 },
    { author: bara, file: "dish-wine-pt", caption: "Víno večer, klasika. Frankovka z Moravy.", days: 12 },
    { author: klara, file: "dish-cake-sq", caption: "Entremet: malina × čokoláda 70 %. Svatba v sobotu 🍰", days: 3 },
    { author: klara, file: "dish-croissant-pt", caption: "Ranní laminace. 82% máslo, žádné kompromisy 🥐", days: 6 },
    { author: tomas, file: "dish-coffee-sq", caption: "Flat white a rosetta, pondělí může začít ☕", days: 0 },
    { author: tomas, file: "dish-coffee-pt", caption: "Nová Etiopie na brew baru. Jasmín, broskev, bergamot.", days: 9 },
    { author: eva, file: "dish-oyster-sq", caption: "Servis ústřic na terase. Léto, jaké má být 🦪", days: 4 },
    { author: jirka, file: "dish-burger-sq", caption: "Smash burger z hovězího z Beskyd. Poctivá práce 🍔", days: 5 },
    { author: ondra, file: "dish-wine-sq", caption: "Degustace: ryzlinky tří vinařů vedle sebe 🍷", days: 7 },
    { author: bistro, file: "place-bistro-sq", caption: "Sobotní brunch od 9:00. Rezervace letí, pospěšte 🍽️", days: 2 },
    { author: bistro, file: "dish-ramen-pt", caption: "Týdenní speciál: ramen s trhaným vepřovým. Vývar 48 h 🍜", days: 10 },
    { author: kavarna, file: "place-cafe-sq", caption: "Nová várka z pražírny právě dorazila ☕✨", days: 3 },
    { author: bar, file: "place-bar-sq", caption: "Pátek. Neon svítí, led cinká. Uvidíme se? 🍸", days: 1 },
  ];

  const createdPosts: { id: string; authorId: string }[] = [];
  for (const p of posts) {
    const imageId = await image(p.author.id, p.file);
    const post = await db.post.create({
      data: {
        authorId: p.author.id,
        imageId,
        caption: p.caption,
        aspect: p.file.endsWith("-pt") ? "PORTRAIT" : "SQUARE",
        createdAt: daysAgo(p.days, 3),
      },
      select: { id: true, authorId: true },
    });
    createdPosts.push(post);
  }

  console.log("Lajky a komentáře…");
  const everyone = [karel, bara, klara, tomas, eva, jirka, marta, ondra, bistro, kavarna, hotel, bar];
  for (const [index, post] of createdPosts.entries()) {
    const likers = everyone.filter((u, i) => u.id !== post.authorId && (i + index) % 3 !== 0);
    await db.like.createMany({
      data: likers.map((liker) => ({ postId: post.id, userId: liker.id })),
    });
  }
  const comments: { post: number; author: User; body: string }[] = [
    { post: 0, author: bistro, body: "Tohle chceme na menu! 😍" },
    { post: 0, author: eva, body: "Sobotní směna bude stát za to 🔥" },
    { post: 3, author: tomas, body: "Jdu ochutnat hned po směně 🙌" },
    { post: 3, author: bar, body: "Pátek na baru, přijď si pro první!" },
    { post: 5, author: eva, body: "Krása! Kolik pater je uvnitř?" },
    { post: 5, author: klara, body: "Tři + malinové křupavé jádro 😄" },
    { post: 7, author: kavarna, body: "Ranní směna s tebou je radost ☕" },
    { post: 12, author: karel, body: "Brunch u vás = nejlepší začátek soboty." },
  ];
  for (const c of comments) {
    await db.comment.create({
      data: { postId: createdPosts[c.post]!.id, authorId: c.author.id, body: c.body },
    });
  }

  console.log("Inzeráty…");
  const jobSeed = [
    {
      inst: bistro, title: "Šéfkuchař/ka pro večerní provoz", category: "KUCHAR", type: "PLNY_UVAZEK",
      city: "Praha", address: "Letná", min: 55000, max: 70000, period: "MESIC",
      description:
        "Hledáme šéfkuchaře/ku, který/á převezme večerní servis a sezónní menu.\n\nCo u nás najdeš:\n• otevřenou kuchyni a hosty, co se ptají\n• volnou ruku v menu (4 chody, obměna co 6 týdnů)\n• tým 5 lidí, žádná hotelová hierarchie\n\nCo čekáme: 3+ roky na pozici sous chef a výš, chuť učit mladší, klid pod tlakem.",
      days: 3,
    },
    {
      inst: bistro, title: "Servírka / číšník na brunche (víkendy)", category: "CISNIK", type: "BRIGADA",
      city: "Praha", address: "Letná", min: 180, max: 220, period: "HODINA",
      description:
        "Sobotní a nedělní brunche 8:00–16:00. Rychlý servis, pohodoví hosté, spropitné se dělí férově. Ideální ke škole.",
      days: 5,
    },
    {
      inst: kavarna, title: "Barista/ka — specialty coffee", category: "BARISTA", type: "PLNY_UVAZEK",
      city: "Brno", min: 32000, max: 40000, period: "MESIC",
      description:
        "Výběrová káva, dva mlýnky, brew bar. Zaučíme, ale základ (mléko, kalibrace) už musíš mít. Neděle zavřeno — vážně.",
      days: 1,
    },
    {
      inst: hotel, title: "Chef de partie — fine dining", category: "KUCHAR", type: "PLNY_UVAZEK",
      city: "Karlovy Vary", min: 42000, max: 52000, period: "MESIC",
      description:
        "Do restaurace Imperial hledáme chef de partie na teplou kuchyni. Ubytování pro mimopražské zajistíme. Sezóna = bonusy.",
      days: 8,
    },
    {
      inst: hotel, title: "Recepční se znalostí NJ", category: "RECEPCNI", type: "ZKRACENY_UVAZEK",
      city: "Karlovy Vary", min: 28000, max: 32000, period: "MESIC",
      description: "Ranní/odpolední směny, německy hovořící klientela. Příjemné vystupování nutností.",
      days: 12,
    },
    {
      inst: bar, title: "Barman/ka na pátky a soboty", category: "BARMAN", type: "BRIGADA",
      city: "Praha", min: 200, max: 260, period: "HODINA",
      description:
        "Koktejlový bar, směny pá+so 18:00–03:00. Klasiky musíš mít v ruce, signature tě naučíme. Taxi domů platíme.",
      days: 2,
    },
  ] as const;

  const createdJobs = [];
  for (const j of jobSeed) {
    createdJobs.push(
      await db.job.create({
        data: {
          institutionId: j.inst.id,
          title: j.title,
          category: j.category,
          employmentType: j.type,
          city: j.city,
          address: "address" in j ? j.address : null,
          salaryMin: j.min,
          salaryMax: j.max,
          salaryPeriod: j.period,
          description: j.description,
          createdAt: daysAgo(j.days),
        },
        select: { id: true, institutionId: true, title: true },
      })
    );
  }

  console.log("Přihlášky…");
  await db.application.create({
    data: {
      jobId: createdJobs[0]!.id, applicantId: karel.id,
      message: "Dobrý den, večerní servis u vás znám z druhé strany baru — rád bych ho vedl. Portfolio menu mám na profilu.",
      status: "SHORTLISTED", createdAt: daysAgo(2),
    },
  });
  await db.application.create({
    data: {
      jobId: createdJobs[0]!.id, applicantId: jirka.id,
      message: "Zdravím, jsem z Ostravy, ale za dobrou kuchyní se přestěhuju.",
      status: "VIEWED", createdAt: daysAgo(1),
    },
  });
  await db.application.create({
    data: { jobId: createdJobs[1]!.id, applicantId: eva.id, status: "SENT", createdAt: daysAgo(0, 5) },
  });
  await db.application.create({
    data: {
      jobId: createdJobs[2]!.id, applicantId: tomas.id,
      message: "Ahoj, u vás už brigádně vypomáhám — rád bych naplno!",
      status: "HIRED", createdAt: daysAgo(6),
    },
  });
  await db.application.create({
    data: { jobId: createdJobs[5]!.id, applicantId: bara.id, message: "Pátky a soboty jsou moje. 🍸", status: "SENT", createdAt: daysAgo(1) },
  });

  console.log("Konverzace…");
  const pair = (a: string, b: string) => (a < b ? { userAId: a, userBId: b } : { userAId: b, userBId: a });

  const conv1 = await db.conversation.create({
    data: { ...pair(bistro.id, karel.id), lastMessageAt: daysAgo(0, 2) },
  });
  const conv1Messages = [
    { sender: bistro.id, body: "Ahoj Karle, přihláška vypadá skvěle. Stavíš se ve čtvrtek na zkušební směnu?", days: 1, hours: 5 },
    { sender: karel.id, body: "Dobrý den! Čtvrtek je super, dorazím na 15:00. Mám přinést vlastní nože? 🔪", days: 1, hours: 4 },
    { sender: bistro.id, body: "Klidně, ale máme tu všechno. Těšíme se! 🙌", days: 0, hours: 2 },
  ];
  for (const m of conv1Messages) {
    await db.message.create({
      data: { conversationId: conv1.id, senderId: m.sender, body: m.body, createdAt: daysAgo(m.days, m.hours) },
    });
  }
  await db.conversationRead.create({
    data: { conversationId: conv1.id, userId: bistro.id, lastReadAt: daysAgo(0, 1) },
  });

  const conv2 = await db.conversation.create({
    data: { ...pair(bara.id, bar.id), lastMessageAt: daysAgo(0, 20) },
  });
  for (const m of [
    { sender: bar.id, body: "Báro, v sobotu velká rezervace — zvládneš přijít už na 17:00?", days: 1, hours: 2 },
    { sender: bara.id, body: "Jasně, počítejte se mnou 🔥", days: 0, hours: 20 },
  ]) {
    await db.message.create({
      data: { conversationId: conv2.id, senderId: m.sender, body: m.body, createdAt: daysAgo(m.days, m.hours) },
    });
  }

  const conv3 = await db.conversation.create({
    data: { ...pair(klara.id, kavarna.id), lastMessageAt: daysAgo(2) },
  });
  for (const m of [
    { sender: kavarna.id, body: "Kláro, nechceš nám péct cheesecaky? Týdně cca 6 kusů.", days: 3, hours: 0 },
    { sender: klara.id, body: "Zní to dobře! Pošlu vzorky příští týden 🍰", days: 2, hours: 0 },
  ]) {
    await db.message.create({
      data: { conversationId: conv3.id, senderId: m.sender, body: m.body, createdAt: daysAgo(m.days, m.hours) },
    });
  }

  console.log("Notifikace…");
  const karelPost = createdPosts[0]!;
  await db.notification.createMany({
    data: [
      { userId: karel.id, actorId: bistro.id, type: "LIKE", postId: karelPost.id, createdAt: daysAgo(1, 6) },
      { userId: karel.id, actorId: eva.id, type: "COMMENT", postId: karelPost.id, createdAt: daysAgo(1, 5) },
      { userId: karel.id, actorId: bistro.id, type: "MESSAGE", conversationId: conv1.id, createdAt: daysAgo(0, 2) },
      { userId: karel.id, actorId: hotel.id, type: "EXPERIENCE_CONFIRMED", createdAt: daysAgo(4), readAt: daysAgo(3) },
      { userId: bistro.id, actorId: karel.id, type: "APPLICATION", jobId: createdJobs[0]!.id, createdAt: daysAgo(2) },
      { userId: bistro.id, actorId: jirka.id, type: "APPLICATION", jobId: createdJobs[0]!.id, createdAt: daysAgo(1) },
      { userId: hotel.id, actorId: karel.id, type: "EXPERIENCE_REQUEST", createdAt: daysAgo(5) },
      { userId: hotel.id, actorId: eva.id, type: "EXPERIENCE_REQUEST", createdAt: daysAgo(3) },
      { userId: tomas.id, actorId: kavarna.id, type: "APPLICATION_STATUS", jobId: createdJobs[2]!.id, createdAt: daysAgo(5), readAt: daysAgo(4) },
      { userId: bara.id, actorId: bar.id, type: "MESSAGE", conversationId: conv2.id, createdAt: daysAgo(1, 2), readAt: daysAgo(0, 20) },
    ],
  });

  console.log("✔ Seed hotový.");
  console.log("  Demo účty (heslo všude: cookus123):");
  console.log("  osoba:  karel@cookus.cz · bara@cookus.cz · tomas@cookus.cz …");
  console.log("  podnik: bistro@cookus.cz · kavarna@cookus.cz · bar@cookus.cz · hotel@cookus.cz");
  console.log("  admin:  admin@cookus.cz");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
