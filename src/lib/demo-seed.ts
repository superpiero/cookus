/*
 * Živý demo obsah — pražská a brněnská gastroscéna v průhledných parodiích
 * (žádná skutečná jména/značky, ale každý z branže je pozná).
 * POZOR: maže celou DB. Sdíleno skriptem `npm run db:seed:live` a endpointem
 * `/api/admin/seed` (chráněn SEED_TOKEN), který běží přímo na Vercelu.
 *
 * Výkon: vše se vkládá DÁVKOVĚ (createMany / createManyAndReturn) — proti
 * vzdálené DB (Vercel ↔ Supabase) je počet roundtripů rozhodující; per-řádkové
 * inserty způsobovaly FUNCTION_INVOCATION_TIMEOUT.
 */
import type { PrismaClient, User } from "@prisma/client";
import bcrypt from "bcryptjs";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const IMG_DIR = join(process.cwd(), "prisma", "seed-images");

function daysAgo(days: number, hours = 0): Date {
  return new Date(Date.now() - days * 86400_000 - hours * 3600_000);
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

export async function runLiveDemoSeed(db: PrismaClient): Promise<void> {
  const t0 = Date.now();
  const phase = (label: string) => console.log(`[seed +${Math.round((Date.now() - t0) / 100) / 10}s] ${label}`);

  /** Dávkové nahrání fotek: 1 roundtrip na ~8 souborů, vrací id v pořadí vstupu. */
  async function uploadImages(specs: { ownerId: string; file: string }[]): Promise<string[]> {
    const ids: string[] = [];
    for (const batch of chunk(specs, 8)) {
      const rows = batch.map((s) => {
        const data = readFileSync(join(IMG_DIR, `${s.file}.jpg`));
        return {
          ownerId: s.ownerId,
          data,
          mime: "image/jpeg",
          width: 1080,
          height: s.file.endsWith("-pt") ? 1350 : 1080,
        };
      });
      const created = await db.imageBlob.createManyAndReturn({ data: rows, select: { id: true } });
      ids.push(...created.map((c) => c.id));
    }
    return ids;
  }

  phase("Mažu stará data…");
  await db.rateLimitHit.deleteMany();
  await db.user.deleteMany();

  const passwordHash = await bcrypt.hash("cookus123", 10);
  const mkUser = (
    data: Partial<User> & { email: string; handle: string; name: string; kind: "PERSON" | "INSTITUTION" }
  ) => db.user.create({ data: { passwordHash, ...data } });

  phase("Podniky…");
  const lokalek = await mkUser({
    email: "lokalek@cookus.cz", handle: "lokalek-u-dlouhy", name: "Lokálek U Dlouhý", kind: "INSTITUTION",
    category: "RESTAURACE", city: "Praha", verified: true,
    headline: "Tankové pivo a česká klasika bez keců",
    bio: "Knedlo-vepřo, svíčková a hladinka, na kterou se stojí fronta až za roh. Suroviny od chlapů, co známe jménem. Žádná dekonstrukce — guláš je hotový, když je hotový.",
  });
  const vasemaso = await mkUser({
    email: "vasemaso@cookus.cz", handle: "vase-maso", name: "Vaše maso", kind: "INSTITUTION",
    category: "BISTRO", city: "Praha", verified: true,
    headline: "Bourárna a bistro v Karlíně. Maso je vaše, práce naše.",
    bio: "Steak z lísky, tatarák míchaný před vámi a párky, za které se neomlouváme. Fronta je součást zážitku, u pultu se tyká.",
  });
  const savojka = await mkUser({
    email: "savojka@cookus.cz", handle: "cafe-savojka", name: "Café Savojka", kind: "INSTITUTION",
    category: "KAVARNA", city: "Praha", verified: true,
    headline: "Snídaně pod lustrem, vejce benedikt od 7:30",
    bio: "Vídeňská kavárna, jak má být: štuky, mramor a číšníci, co vám vykají, i když přijdete v teplákách. Máslo 82 %, jinak to nemá cenu.",
  });
  const esicko = await mkUser({
    email: "esicko@cookus.cz", handle: "esicko-karlin", name: "Esíčko Karlín", kind: "INSTITUTION",
    category: "BISTRO", city: "Praha",
    headline: "Pekárna a bistro. Kvásek Květoslav je člen týmu.",
    bio: "Kvásek vedeme v docházce, jmenuje se Květoslav a má víc followerů než my. Chleba v 7:00, v 9:30 je vyprodáno. Nestíháme a jsme za to rádi.",
  });
  const vosihnizdo = await mkUser({
    email: "vosihnizdo@cookus.cz", handle: "cukrarna-vosi-hnizdo", name: "Cukrárna Vosí hnízdo", kind: "INSTITUTION",
    category: "CUKRARNA", city: "Praha",
    headline: "Vosí hnízda podle receptu z roku 1952",
    bio: "Věnečky, kremrole a vosí hnízda, na která babičky vzpomínají a vnuci stojí frontu. Včely nedodáváme.",
  });
  const barmozna = await mkUser({
    email: "barmozna@cookus.cz", handle: "bar-ktery-mozna-existuje", name: "Bar, který možná existuje", kind: "INSTITUTION",
    category: "BAR", city: "Brno", verified: true,
    headline: "Najdeš nás, když nebudeš hledat",
    bio: "Koktejly bez menu — řekneš baru tři slova a on ti rozumí. Adresa se nesděluje, předává se. Brno ví.",
  });
  const piktogram = await mkUser({
    email: "piktogram@cookus.cz", handle: "piktogram-espresso", name: "Piktogram Espresso Bar", kind: "INSTITUTION",
    category: "KAVARNA", city: "Brno",
    headline: "Výběrová káva. Cortado je odpověď na všechno.",
    bio: "Dva mlýnky, brew bar a nulová tolerance k připálenému mléku. Dýňové latte neděláme a děkujeme za pochopení.",
  });
  const nomnom = await mkUser({
    email: "nomnom@cookus.cz", handle: "nomnom-kodan", name: "Nomnom (Kodaň)", kind: "INSTITUTION",
    category: "RESTAURACE", city: "Jinde v ČR", website: "https://nomnom.example.dk",
    headline: "3× nejlepší restaurace světa. Hledáme posily i v Česku.",
    bio: "Fermentujeme všechno včetně vzduchu. Menu o 20 chodech, z toho 4 jsou mech. Stážisty milujeme — někdy jim i platíme.",
  });

  phase("Lidé…");
  const kaprik = await mkUser({
    email: "kaprik@cookus.cz", handle: "tomas-kaprik", name: "Tomáš Kapřík", kind: "PERSON",
    city: "Praha",
    headline: "Dělám hospody, co dávají smysl. A pak další.",
    bio: "Začal jsem s jednou hospodou a nějak se to vymklo — teď jich je čtrnáct. Věřím, že pohostinnost je řemeslo a řemeslo se má učit. Když se u nás host necítí jak doma, děláme něco špatně.",
  });
  const pohledny = await mkUser({
    email: "pohledny@cookus.cz", handle: "zdenek-pohledny", name: "Zdeněk Pohledný", kind: "PERSON",
    city: "Praha",
    headline: "Ano, šéfe! Konzultant provozů v krizi.",
    bio: "Přijdu, ochutnám, řeknu pravdu. Někdo pláče, někdo začne vařit líp — ideálně obojí. Výsledky garantuju, slzy nevracím.",
  });
  const zpatecka = await mkUser({
    email: "zpatecka@cookus.cz", handle: "premek-zpatecka", name: "Přemek Zpátečka", kind: "PERSON",
    city: "Brno",
    headline: "Šéfkuchař & estét. Pinzeta je prodloužení ruky.",
    bio: "Detail je všechno, talíř je plátno. Mám rád, když věci ladí — barevně, chuťově i lidsky. A jo, ta pinzeta je fakt nutná.",
  });
  const puncoska = await mkUser({
    email: "puncoska@cookus.cz", handle: "honza-puncoska", name: "Honza Punčoška", kind: "PERSON",
    city: "Praha",
    headline: "Šéfkuchař. Omáčky dělám 72 hodin, zkratky nedělám vůbec.",
    bio: "Demi-glace je pro mě náboženství. Vyučil jsem se u klasiků, vařím moderně, ale základ je základ. Kdo míchá jíšku metličkou, ať radši odejde.",
  });
  const vidlicka = await mkUser({
    email: "vidlicka@cookus.cz", handle: "kaja-vidlicka", name: "Kája Vidlička", kind: "PERSON",
    city: "Praha", openToWork: true,
    headline: "Junior kuchařka. Zatím krájím cibuli, jednou budu krájet žebra.",
    bio: "Čerstvě po učňáku, ruce rychlé, ego malé, chuť obrovská. Hledám kuchyni, kde se na juniory neřve, ale učí je. Snesu i to řvaní, ale učení je lepší.",
  });
  const tuplak = await mkUser({
    email: "tuplak@cookus.cz", handle: "bara-tuplak", name: "Bára Tupláková", kind: "PERSON",
    city: "Brno", openToWork: true,
    headline: "Výčepní & barmanka. Spěch je nepřítel pěny.",
    bio: "Pivo točím pomalu, protože hladinka se nedá ošidit. Negroni namíchám poslepu. Hledám večerní směny v Brně.",
  });
  const vlachynka = await mkUser({
    email: "vlachynka@cookus.cz", handle: "jan-vlachynka", name: "Jan Vlachynka", kind: "PERSON",
    city: "Brno",
    headline: "Dělám bary, které (možná) neexistují",
    bio: "Bar je divadlo, host je publikum a barman je režisér. Brno je nejlepší barové město v Evropě, jen to ještě neví celá Evropa.",
  });
  const rvamsay = await mkUser({
    email: "rvamsay@cookus.cz", handle: "gordon-rvamsay", name: "Gordon Řvamsay", kind: "PERSON",
    city: "Jinde v ČR",
    headline: "Idiot sandwich konzultant. Křičím, dokud to není al dente.",
    bio: "Sedm michelinských hvězd, tři infarkty personálu. V Česku hledám dokonalou svíčkovou a někoho, kdo mi konečně vysvětlí, kde je ta jehněčí omáčka. WHERE IS THE LAMB SAUCE?!",
  });
  const redkvicka = await mkUser({
    email: "redkvicka@cookus.cz", handle: "rene-redkvicka", name: "René Ředkvička", kind: "PERSON",
    city: "Jinde v ČR",
    headline: "Ex-Nomnom. Sbírám mech a fermentuju vzduch.",
    bio: "Příroda je nejlepší spíž. Ráno nasbírám, večer servíruju, mezitím fermentuju. Sezónnost není trend, je to slušnost.",
  });
  const olivovy = await mkUser({
    email: "olivovy@cookus.cz", handle: "jamie-olivovy", name: "Jamie Olivový", kind: "PERSON",
    city: "Jinde v ČR",
    headline: "15minutová jídla. Video o nich: 3 hodiny.",
    bio: "Olivový olej na všechno, i na palačinky. Učím děti vařit a dospělé nebát se česneku. Pukka!",
  });
  const admin = await mkUser({
    email: "admin@cookus.cz", handle: "cookus-admin", name: "Cookus Admin", kind: "PERSON",
    isAdmin: true, headline: "Tady uklízím ✨",
  });
  void admin;

  phase("Vlna 2: lidé…");
  const anicka = await mkUser({
    email: "anicka@cookus.cz", handle: "anicka-kvedlacka", name: "Anička Kvedlačka", kind: "PERSON",
    city: "Praha", openToWork: true,
    headline: "Komí cukrárny. Kvedlám, tedy jsem.",
    bio: "Peču i o půlnoci, protože entremet nečeká. Hledám cukrárnu, kde se nebojí laminovat ve tři ráno.",
  });
  const standa = await mkUser({
    email: "standa@cookus.cz", handle: "standa-skvarek", name: "Standa Škvarek", kind: "PERSON",
    city: "Ostrava",
    headline: "Grilmistr. Uhlí je koření.",
    bio: "Low & slow je životní filozofie. Čtrnáct hodin u smokeru není práce, to je meditace s teploměrem.",
  });
  const mana = await mkUser({
    email: "mana@cookus.cz", handle: "mana-cednik", name: "Máňa Cedník", kind: "PERSON",
    city: "Brno", openToWork: true,
    headline: "Ze dřezu na plac. Dřez mě naučil pokoru.",
    bio: "Dva roky jsem myla nádobí a koukala kuchařům pod ruce. Teď chci vlastní prkénko. Rychlé ruce, čistý cedník, žádné kecy.",
  });
  const guy = await mkUser({
    email: "guy@cookus.cz", handle: "guy-friteza", name: "Guy Fritéza", kind: "PERSON",
    city: "Jinde v ČR",
    headline: "Starosta Flavortownu. Smažíme všechno včetně názorů.",
    bio: "Sluneční brýle na zátylku, plameny na košili, donut místo housky. Jednou jsem usmažil i polévku a bylo to VOLCANIC.",
  });
  const nigella = await mkUser({
    email: "nigella@cookus.cz", handle: "nigella-lzicka", name: "Nigella Lžička", kind: "PERSON",
    city: "Jinde v ČR",
    headline: "Vařím pomalu, mluvím pomaleji. Máslo nikdy nevynechám.",
    bio: "Půlnoční nájezdy na lednici považuji za legitimní chod. Recept bez másla je jen seznam surovin.",
  });
  const massimo = await mkUser({
    email: "massimo@cookus.cz", handle: "massimo-brambora", name: "Massimo Brambora", kind: "PERSON",
    city: "Jinde v ČR",
    headline: "Jejda! Upustil jsem citronový koláč. A dostal za to hvězdu.",
    bio: "Tortellini je meditace o 36 záhybech. Parmazán zraje, já taky. Chyby na talíři jsou umění, když jim dáš jméno.",
  });
  const utriskvarku = await mkUser({
    email: "utriskvarku@cookus.cz", handle: "u-tri-skvarku", name: "U Tří Škvarků", kind: "INSTITUTION",
    category: "RESTAURACE", city: "Ostrava", verified: true,
    headline: "Škvarková pomazánka, co spraví den",
    bio: "Poctivá ostravská klasika od roku 1974. Škvarky smažíme dvakrát denně a stejně dojdou. Piva máme, kolik uneseš.",
  });
  const osteria = await mkUser({
    email: "osteria@cookus.cz", handle: "osteria-frantova", name: "Osteria Frantova", kind: "INSTITUTION",
    category: "RESTAURACE", city: "Jinde v ČR",
    headline: "Tortellini jak od nonny, 12 míst, sen o třech hvězdách",
    bio: "Malá osteria, velká kuchyně. Nonna kontroluje záhyby osobně a nemilosrdně. Rezervace na půl roku dopředu, ale za rohem se občas uvolní židle.",
  });
  const vidlickanuz = await mkUser({
    email: "vidlickanuz@cookus.cz", handle: "bistro-vidlicka-nuz", name: "Bistro Vidlička & Nůž", kind: "INSTITUTION",
    category: "BISTRO", city: "Brno",
    headline: "Brunch, co tě postaví na nohy",
    bio: "Vejce benedikt od 8:00, espresso, co tě přiková zpátky k zemi. Víkendová fronta je brněnský folklór.",
  });

  phase("Avatary (dávkově)…");
  const avatarSpecs: { user: User; file: string }[] = [
    { user: lokalek, file: "dish-beer-sq" },
    { user: vasemaso, file: "dish-steak-sq" },
    { user: savojka, file: "place-cafe-sq" },
    { user: esicko, file: "dish-bread-sq" },
    { user: vosihnizdo, file: "dish-donut-sq" },
    { user: barmozna, file: "place-bar-sq" },
    { user: piktogram, file: "dish-coffee-sq" },
    { user: nomnom, file: "dish-forage-sq" },
    { user: utriskvarku, file: "dish-beer-pt" },
    { user: osteria, file: "dish-pasta-sq" },
    { user: vidlickanuz, file: "dish-eggs-sq" },
  ];
  const avatarIds = await uploadImages(avatarSpecs.map((s) => ({ ownerId: s.user.id, file: s.file })));
  await Promise.all(
    avatarSpecs.map((s, i) =>
      db.user.update({ where: { id: s.user.id }, data: { avatarImageId: avatarIds[i]! } })
    )
  );

  phase("Skills (dávkově)…");
  const skillsByUser: [User, string[]][] = [
    [kaprik, ["Koncepty podniků", "Vedení lidí", "Tankové pivo", "Pohostinnost jako řemeslo"]],
    [pohledny, ["Krizový management", "Upřímnost", "TV formáty", "Degustace"]],
    [zpatecka, ["Fine dining", "Plating", "Pinzeta", "Sezónní menu"]],
    [puncoska, ["Omáčky", "Demi-glace", "Klasická francouzská", "Vedení kuchyně"]],
    [vidlicka, ["Krájení cibule", "Mise en place", "Rychlé učení", "Pokora"]],
    [tuplak, ["Hladinka", "Klasické koktejly", "Negroni poslepu", "Klid za barem"]],
    [vlachynka, ["Barové koncepty", "Signature drinky", "Storytelling", "Brno"]],
    [rvamsay, ["Řvaní", "Beef Wellington", "Idiot sandwich", "Michelin"]],
    [redkvicka, ["Fermentace", "Foraging", "Sezónnost", "Mech"]],
    [olivovy, ["Rychlovky", "Olivový olej", "Kamera", "Česnek"]],
    [anicka, ["Jemné pečivo", "Entremety", "Noční směny", "Kvedlání"]],
    [standa, ["Gril & BBQ", "Uzení", "Low & slow", "Práce s ohněm"]],
    [mana, ["Mytí nádobí rychlostí světla", "Mise en place", "Studená kuchyně", "Pokora"]],
    [guy, ["Fritování", "Burgery", "Sluneční brýle", "Flavortown"]],
    [nigella, ["Máslo", "Pomalé vaření", "Dezerty", "Vyprávění u plotny"]],
    [massimo, ["Tortellini (36 záhybů)", "Parmazán", "Upuštěné koláče", "Michelin"]],
  ];
  await db.skill.createMany({
    data: skillsByUser.flatMap(([user, names]) =>
      names.map((name, position) => ({ userId: user.id, name, position }))
    ),
  });

  phase("Praxe s reporty (dávkově)…");
  await db.experience.createMany({
    data: [
      {
        personId: puncoska.id, institutionId: vasemaso.id, institutionName: vasemaso.name,
        role: "Šéfkuchař bistra", startDate: daysAgo(1400), endDate: daysAgo(200),
        status: "CONFIRMED", respondedAt: daysAgo(190),
        report: "Honza rozseká půlku za směnu a ještě stihne hostům vysvětlit, proč je tatarák z kýty. Řezník tělem i duší, omáčky navrch.",
      },
      {
        personId: tuplak.id, institutionId: barmozna.id, institutionName: barmozna.name,
        role: "Barmanka", startDate: daysAgo(800), endDate: null,
        status: "CONFIRMED", respondedAt: daysAgo(30),
        report: "Bára namíchá Negroni poslepu a hladinku má jak z reklamy. Kéž by takových existovalo víc — my možná taky existujeme.",
      },
      {
        personId: redkvicka.id, institutionId: nomnom.id, institutionName: nomnom.name,
        role: "Head of Fermentation", startDate: daysAgo(2500), endDate: daysAgo(400),
        status: "CONFIRMED", respondedAt: daysAgo(390),
        report: "René u nás fermentoval věci, které jsme pak museli teprve pojmenovat. Dvakrát Michelin, jednou hasiči. Doporučujeme.",
      },
      {
        personId: zpatecka.id, institutionId: barmozna.id, institutionName: barmozna.name,
        role: "Pop-up večeře „Zpátečka×Bar“", startDate: daysAgo(300), endDate: daysAgo(290),
        status: "PENDING",
      },
      {
        personId: vidlicka.id, institutionName: "Školní jídelna Ostrava-Poruba",
        role: "Praxe — studená kuchyně", startDate: daysAgo(700), endDate: daysAgo(400),
        description: "UHO omáčky, 400 porcí denně. Přežila jsem.",
        status: "UNLINKED",
      },
      {
        personId: rvamsay.id, institutionName: "Hell's Kitchen (pobočka Peklo)",
        role: "Majitel & hlavní řvoun", startDate: daysAgo(6000), endDate: null,
        status: "UNLINKED",
      },
      {
        personId: mana.id, institutionId: utriskvarku.id, institutionName: utriskvarku.name,
        role: "Myčka nádobí & příprava", startDate: daysAgo(900), endDate: daysAgo(30),
        status: "CONFIRMED", respondedAt: daysAgo(20),
        report: "Máňa umyla za směnu 800 talířů a ještě stihla krájet cibuli. Ta holka má systém. Pusťte ji na plac, i když nás to bolí.",
      },
      {
        personId: massimo.id, institutionId: osteria.id, institutionName: osteria.name,
        role: "Šéfkuchař & spolumajitel", startDate: daysAgo(4000), endDate: null,
        status: "CONFIRMED", respondedAt: daysAgo(100),
        report: "Massimo jednou upustil koláč a tři hosté plakali štěstím. Génius, co vypadá, že se ztratil, ale ví přesně, kde je.",
      },
      {
        personId: anicka.id, institutionId: vosihnizdo.id, institutionName: vosihnizdo.name,
        role: "Komí cukrárny", startDate: daysAgo(400), endDate: null,
        status: "PENDING",
      },
      {
        personId: standa.id, institutionName: "Food truck Škvarková horečka",
        role: "Pitmaster", startDate: daysAgo(1200), endDate: daysAgo(300),
        status: "UNLINKED",
      },
      {
        personId: guy.id, institutionName: "Flavortown (někde v Americe)",
        role: "Starosta & fritér", startDate: daysAgo(5000), endDate: null,
        status: "UNLINKED",
      },
    ],
  });

  phase("Posty (dávkově)…");
  const postSpecs: { author: User; file: string; caption: string; days: number }[] = [
    { author: lokalek, file: "dish-beer-pt", caption: "Hladinka jak ze žurnálu. Pátek může začít 🍺", days: 0 },
    { author: vasemaso, file: "dish-steak-sq", caption: "Dry aged 60 dní. Fotíme rychle, mizí rychlejc 🥩", days: 1 },
    { author: savojka, file: "dish-eggs-sq", caption: "Benedikt v 7:30. Lustr v ceně ✨", days: 2 },
    { author: esicko, file: "dish-bread-sq", caption: "Květoslav dnes v top formě. Chleba v 7:00, v 9:30 sorry 🥖", days: 0 },
    { author: vosihnizdo, file: "dish-donut-pt", caption: "Vosí hnízda podle babičky Růženy, ročník 1952 🐝", days: 3 },
    { author: barmozna, file: "dish-cocktail-sq", caption: "Tenhle drink nemá jméno. Vy po čtvrtém taky ne 🍸", days: 1 },
    { author: piktogram, file: "dish-coffee-pt", caption: "Cortado. Ne, nechceme se bavit o dýňovém latte ☕", days: 2 },
    { author: nomnom, file: "dish-forage-sq", caption: "Chod č. 14: mech, sníh, vzpomínka na léto 🌿", days: 4 },
    { author: kaprik, file: "place-bistro-sq", caption: "Nový projekt. Zatím jen židle, ale ta atmosféra! Otevíráme, až to bude dávat smysl.", days: 2 },
    { author: rvamsay, file: "dish-svickova-sq", caption: "Konečně. Pořádná. Svíčková. FINALLY! 🍲", days: 1 },
    { author: redkvicka, file: "dish-salad-pt", caption: "Nasbíráno dnes ráno na Petříně. Večeře pro dvanáct 🌱", days: 3 },
    { author: olivovy, file: "dish-pasta-sq", caption: "Patnáctiminutové těstoviny! (natáčení: 3 hodiny) 🍝", days: 5 },
    { author: pohledny, file: "dish-ramen-pt", caption: "Tahle polévka mě nenaštvala. To se hned tak nevidí. Ano, šéfe! 👏", days: 4 },
    { author: vidlicka, file: "dish-salad-sq", caption: "Den 47 v kuchyni: cibule už nepláču já, pláče ona 🧅💪", days: 1 },
    { author: puncoska, file: "dish-svickova-pt", caption: "Demi-glace, hodina 72 z 72. Zkratky jsou pro navigace.", days: 6 },
    { author: tuplak, file: "dish-beer-sq", caption: "Dneska večer za barem. Pěna bude, spěch ne 🍺", days: 0 },
    { author: standa, file: "dish-steak-pt", caption: "Low & slow, hodina 14 ze 14. Uhlí je koření 🔥", days: 0 },
    { author: anicka, file: "dish-cake-pt", caption: "Půlnoční směna. Entremet do svítání, kvedlačka v ruce 🌙", days: 2 },
    { author: mana, file: "dish-ramen-sq", caption: "První služba na teplé! Dřez mi drží palce 🤞", days: 1 },
    { author: guy, file: "dish-burger-pt", caption: "WELCOME TO FLAVORTOWN, PRAHO! Dneska smažíme všechno 🍔🔥", days: 1 },
    { author: nigella, file: "dish-croissant-sq", caption: "Máslo. Víc másla. Ještě víc másla. Perfektní 🧈", days: 3 },
    { author: massimo, file: "dish-pasta-pt", caption: "Tortellini jako meditace. 36 záhybů, žádný spěch.", days: 4 },
    { author: utriskvarku, file: "dish-beer-sq", caption: "Škvarky došly v 18:02. Rekord. Zítra smažíme dvojnásob 🍺", days: 0 },
    { author: osteria, file: "dish-cake-sq", caption: "Jejda! Upustili jsme citronový koláč. Zase. Schválně 🍋", days: 5 },
    { author: vidlickanuz, file: "dish-eggs-pt", caption: "Benedikt jede od 8:00. Fronta je folklór, stojí za to 🍳", days: 2 },
  ];
  const postImageIds = await uploadImages(postSpecs.map((p) => ({ ownerId: p.author.id, file: p.file })));
  const createdPosts = await db.post.createManyAndReturn({
    data: postSpecs.map((p, i) => ({
      authorId: p.author.id,
      imageId: postImageIds[i]!,
      caption: p.caption,
      aspect: p.file.endsWith("-pt") ? ("PORTRAIT" as const) : ("SQUARE" as const),
      createdAt: daysAgo(p.days, 2),
    })),
    select: { id: true, authorId: true },
  });

  phase("Lajky a komentáře (dávkově)…");
  const everyone = [kaprik, pohledny, zpatecka, puncoska, vidlicka, tuplak, vlachynka, rvamsay, redkvicka, olivovy,
    lokalek, vasemaso, savojka, esicko, vosihnizdo, barmozna, piktogram, nomnom,
    anicka, standa, mana, guy, nigella, massimo, utriskvarku, osteria, vidlickanuz];
  await db.like.createMany({
    data: createdPosts.flatMap((post, index) =>
      everyone
        .filter((u, i) => u.id !== post.authorId && (i + index) % 3 !== 0)
        .map((liker) => ({ postId: post.id, userId: liker.id }))
    ),
  });
  const commentSpecs: { post: number; author: User; body: string }[] = [
    { post: 0, author: rvamsay, body: "Finally some good pivo. FINALLY!" },
    { post: 0, author: tuplak, body: "Ta pěna… uznávám, Praha to taky umí 🙌" },
    { post: 1, author: rvamsay, body: "It's RAW! …oh wait, tatarák. Carry on. 👏" },
    { post: 3, author: olivovy, body: "Květoslav is a legend. Pukka bread! 🥖" },
    { post: 3, author: kaprik, body: "Tohle je přesně ten Karlín, který mám rád." },
    { post: 5, author: vlachynka, body: "Potvrzuju, ten bar možná existuje. Byl jsem tam. Možná." },
    { post: 7, author: redkvicka, body: "Ten mech je z jižní strany stromu? Poznám to." },
    { post: 9, author: pohledny, body: "Ano, šéfe! Konečně to někdo řekl." },
    { post: 9, author: lokalek, body: "Gordone, přijď v úterý, jehněčí omáčka bude. Slibujeme." },
    { post: 13, author: puncoska, body: "Den 48 bude lepší. Drž se, cibule se krájí sama až po deseti letech." },
    { post: 13, author: rvamsay, body: "Good. More crying = more flavour." },
    { post: 19, author: rvamsay, body: "This is an idiot sandwich. A chutná skvěle. Jsem zmatený." },
    { post: 16, author: vasemaso, body: "„Uhlí je koření“ si píšeme na tabuli. Díky, mistře." },
    { post: 18, author: kaprik, body: "Tohle je přesně ta cesta. Z dřezu na plac. Držíme!" },
    { post: 21, author: vidlicka, body: "36 záhybů?! Já jich dělám dvanáct a brečím u toho." },
    { post: 20, author: olivovy, body: "Nigello, to máslo… pukka. Respekt." },
    { post: 23, author: redkvicka, body: "Upuštěný koláč je taky fermentace osudu. Uznávám." },
  ];
  await db.comment.createMany({
    data: commentSpecs.map((c) => ({ postId: createdPosts[c.post]!.id, authorId: c.author.id, body: c.body })),
  });

  phase("Inzeráty (dávkově)…");
  const jobSpecs = [
    {
      inst: lokalek, title: "Výčepní — mistr/yně hladinky", category: "BARMAN", type: "BRIGADA",
      city: "Praha", address: "Dlouhá (kde jinde)", min: 200, max: 260, period: "HODINA",
      description:
        "Hledáme někoho, kdo ví, že hladinka není nadávka a mlíko není jen do kafe.\n\n• čepování na jeden zátah tě naučíme, respekt k pivu si přines\n• směny večer + víkendy, tuplák personální slevy\n• fronta hostů je dlouhá, nálada dobrá",
      days: 1,
    },
    {
      inst: vasemaso, title: "Řezník/bouračka se smyslem pro humor", category: "JINE", type: "PLNY_UVAZEK",
      city: "Praha", address: "Karlín", min: 45000, max: 60000, period: "MESIC",
      description:
        "Maso ti nesmí být cizí a hosté taky ne — bouráme před lidmi a u toho vyprávíme.\n\nVtipy o vegetariánech povinné, ale laskavé. Nůž dostaneš, ruce si přines.",
      days: 2,
    },
    {
      inst: savojka, title: "Číšník/servírka na snídaňové směny", category: "CISNIK", type: "ZKRACENY_UVAZEK",
      city: "Praha", address: null, min: 30000, max: 38000, period: "MESIC",
      description:
        "Ranní ptáče, co unese tác s dvanácti benedikty a neztratí úsměv ani glanc. Němčina výhodou, vykání povinné, tepláky hostů tolerujeme s grácií.",
      days: 3,
    },
    {
      inst: esicko, title: "Pekař/ka — noční směny s Květoslavem", category: "JINE", type: "PLNY_UVAZEK",
      city: "Praha", address: "Karlín", min: 38000, max: 46000, period: "MESIC",
      description:
        "Květoslav (náš kvásek) potřebuje péči každé 4 hodiny. Nekouše, ale urazí se, když přijdeš pozdě.\n\nNoční provoz, ranní sláva. Chleba, co v 9:30 není.",
      days: 0,
    },
    {
      inst: barmozna, title: "Barman/ka do baru, který možná existuje", category: "BARMAN", type: "PLNY_UVAZEK",
      city: "Brno", address: null, min: 40000, max: 55000, period: "MESIC",
      description:
        "Podmínky: umět klasiky poslepu, číst hosty jako knihu a mlčet o tom, kde pracuješ.\n\nBar nemá menu, ty budeš. Brno centrum, adresa po podpisu.",
      days: 1,
    },
    {
      inst: piktogram, title: "Barista — cortado evangelista", category: "BARISTA", type: "BRIGADA",
      city: "Brno", address: null, min: 180, max: 220, period: "HODINA",
      description:
        "Kalibrace ráno, latte art celý den, žádné dýňové kompromisy. Víkendy volné, protože i my máme rádi život.",
      days: 4,
    },
    {
      inst: nomnom, title: "Stáž — oddělení fermentace vzduchu", category: "JINE", type: "STAZ",
      city: "Jinde v ČR", address: "Kodaň (kousek za Berlínem)", min: null, max: null, period: null,
      description:
        "Nauč se fermentovat věci, o kterých jsi nevěděl/a, že existují. Odměna ve zkušenostech, mechu a řádcích do CV, které nikdo nepřečte bez slovníku. Ubytování v skleníku.",
      days: 5,
    },
    {
      inst: utriskvarku, title: "Kuchař/ka na škvarky a ostravskou klasiku", category: "KUCHAR", type: "PLNY_UVAZEK",
      city: "Ostrava", address: null, min: 35000, max: 42000, period: "MESIC",
      description:
        "Škvarková pomazánka podle receptu z roku 1974 — naučíme, ale recept se nevynáší.\n\nSměny bez nočních, pivo po směně v ceně kultury podniku. Hledáme někoho, kdo bere klasiku vážně a sebe míň.",
      days: 1,
    },
    {
      inst: osteria, title: "Tvůrce/kyně tortellin (36 záhybů)", category: "KUCHAR", type: "PLNY_UVAZEK",
      city: "Jinde v ČR", address: null, min: 50000, max: 65000, period: "MESIC",
      description:
        "Záhyb je modlitba. Hledáme ruce, které to chápou.\n\nNonna tě vyzkouší osobně — přines vlastní vál. Kdo udělá 36 záhybů pod minutu, má podepsáno.",
      days: 3,
    },
    {
      inst: vidlickanuz, title: "Brunch kuchař/ka — víkendy", category: "KUCHAR", type: "BRIGADA",
      city: "Brno", address: null, min: 190, max: 230, period: "HODINA",
      description:
        "Vejce benedikt poslepu, palačinky bez váhy, klid v ranní špičce.\n\nVíkendy 7–15, spropitné se dělí férově, káva zdarma bez limitu (budeš ji potřebovat).",
      days: 2,
    },
  ] as const;
  const createdJobs = await db.job.createManyAndReturn({
    data: jobSpecs.map((j) => ({
      institutionId: j.inst.id,
      title: j.title,
      category: j.category,
      employmentType: j.type,
      city: j.city,
      address: j.address,
      salaryMin: j.min,
      salaryMax: j.max,
      salaryPeriod: j.period,
      description: j.description,
      createdAt: daysAgo(j.days),
    })),
    select: { id: true, institutionId: true, title: true },
  });
  const jobVycepni = createdJobs[0]!, jobReznik = createdJobs[1]!, jobBarista = createdJobs[5]!,
    jobStaz = createdJobs[6]!, jobSkvarky = createdJobs[7]!;

  phase("Přihlášky (dávkově)…");
  await db.application.createMany({
    data: [
      {
        jobId: jobVycepni.id, applicantId: vidlicka.id,
        message: "Dobrý den, pivo čepovat neumím, ale učím se rychle a cibuli krájím jako nikdo. Dejte mi týden.",
        status: "SHORTLISTED", createdAt: daysAgo(1),
      },
      {
        jobId: jobReznik.id, applicantId: rvamsay.id,
        message: "Viděl jsem už lepší bourání, ale váš tatarák je skoro tak dobrý jako můj. SKORO. Beru to jako výzvu.",
        status: "VIEWED", createdAt: daysAgo(1),
      },
      {
        jobId: jobBarista.id, applicantId: tuplak.id,
        message: "Cortado umím, hladinku umím, evangelizovat začnu hned. Brno je moje.",
        status: "SENT", createdAt: daysAgo(0, 4),
      },
      {
        jobId: jobStaz.id, applicantId: redkvicka.id,
        message: "Vracím se domů. Teda do Kodaně. Mech si vezu vlastní.",
        status: "HIRED", createdAt: daysAgo(4),
      },
      {
        jobId: jobSkvarky.id, applicantId: mana.id,
        message: "Dřez mě vytrénoval, cibule mě nezlomí. Škvarky beru jako poslání.",
        status: "SHORTLISTED", createdAt: daysAgo(0, 8),
      },
    ],
  });

  phase("Přátelství (dávkově)…");
  const friendshipSpecs: { requester: User; addressee: User; accepted: boolean }[] = [
    { requester: kaprik, addressee: lokalek, accepted: true },
    { requester: kaprik, addressee: vasemaso, accepted: true },
    { requester: kaprik, addressee: esicko, accepted: true },
    { requester: kaprik, addressee: savojka, accepted: true },
    { requester: puncoska, addressee: vasemaso, accepted: true },
    { requester: vidlicka, addressee: kaprik, accepted: true },
    { requester: tuplak, addressee: barmozna, accepted: true },
    { requester: vlachynka, addressee: barmozna, accepted: true },
    { requester: vlachynka, addressee: piktogram, accepted: true },
    { requester: rvamsay, addressee: redkvicka, accepted: true },
    { requester: redkvicka, addressee: nomnom, accepted: true },
    { requester: olivovy, addressee: rvamsay, accepted: true },
    { requester: standa, addressee: utriskvarku, accepted: true },
    { requester: massimo, addressee: osteria, accepted: true },
    { requester: guy, addressee: rvamsay, accepted: true },
    { requester: nigella, addressee: olivovy, accepted: true },
    { requester: anicka, addressee: vidlicka, accepted: true },
    { requester: mana, addressee: tuplak, accepted: true },
    { requester: pohledny, addressee: kaprik, accepted: false }, // čekající žádost pro Kapříka
    { requester: guy, addressee: pohledny, accepted: false }, // čekající žádost pro Pohledného
  ];
  const createdFriendships = await db.friendship.createManyAndReturn({
    data: friendshipSpecs.map((f) => ({
      requesterId: f.requester.id,
      addresseeId: f.addressee.id,
      status: f.accepted ? ("ACCEPTED" as const) : ("PENDING" as const),
      respondedAt: f.accepted ? daysAgo(10) : null,
    })),
    select: { id: true },
  });
  const pohlednyKaprikRequest = createdFriendships[18]!;

  phase("Šťouchnutí (dávkově)…");
  await db.poke.createMany({
    data: [
      { fromId: rvamsay.id, toId: pohledny.id, createdAt: daysAgo(0, 5) },
      { fromId: kaprik.id, toId: vidlicka.id, createdAt: daysAgo(1, 2) },
      { fromId: nigella.id, toId: rvamsay.id, createdAt: daysAgo(0, 3) },
      { fromId: guy.id, toId: olivovy.id, createdAt: daysAgo(0, 7) },
    ],
  });

  phase("Konverzace…");
  const pair = (a: string, b: string) => (a < b ? { userAId: a, userBId: b } : { userAId: b, userBId: a });
  const conv1 = await db.conversation.create({ data: { ...pair(rvamsay.id, lokalek.id), lastMessageAt: daysAgo(0, 3) }, select: { id: true } });
  const conv2 = await db.conversation.create({ data: { ...pair(kaprik.id, vidlicka.id), lastMessageAt: daysAgo(0, 20) }, select: { id: true } });
  const conv3 = await db.conversation.create({ data: { ...pair(vlachynka.id, tuplak.id), lastMessageAt: daysAgo(1) }, select: { id: true } });
  const convGuy = await db.conversation.create({ data: { ...pair(guy.id, rvamsay.id), lastMessageAt: daysAgo(0, 1) }, select: { id: true } });
  await db.message.createMany({
    data: [
      { conversationId: conv1.id, senderId: rvamsay.id, body: "WHERE IS THE LAMB SAUCE?!", createdAt: daysAgo(0, 6) },
      { conversationId: conv1.id, senderId: lokalek.id, body: "Jehněčí děláme v úterý, Gordone. Dneska je svíčková. 🍲", createdAt: daysAgo(0, 5) },
      { conversationId: conv1.id, senderId: rvamsay.id, body: "…tak svíčkovou. A hladinku. Please.", createdAt: daysAgo(0, 3) },
      { conversationId: conv2.id, senderId: kaprik.id, body: "Kájo, viděl jsem tvůj profil. Přijď ve čtvrtek do Lokálku na zkušební směnu — cibule tam máme dost. 😄", createdAt: daysAgo(1, 4) },
      { conversationId: conv2.id, senderId: vidlicka.id, body: "Ve čtvrtek jsem tam! Nože si nosím vlastní 🔪", createdAt: daysAgo(0, 20) },
      { conversationId: conv3.id, senderId: vlachynka.id, body: "Báro, v sobotu tajný pop-up. Adresu ti pošlu, až bude existovat.", createdAt: daysAgo(1, 6) },
      { conversationId: conv3.id, senderId: tuplak.id, body: "Klasika. Beru shaker i trpělivost 🍸", createdAt: daysAgo(1, 1) },
      { conversationId: convGuy.id, senderId: guy.id, body: "Gordone, přijeď do Flavortownu — usmažím ti řízek v donutu 🍩🔥", createdAt: daysAgo(0, 4) },
      { conversationId: convGuy.id, senderId: rvamsay.id, body: "To je to nejodpornější, co jsem kdy slyšel. V kolik?", createdAt: daysAgo(0, 1) },
    ],
  });

  phase("Notifikace (dávkově)…");
  await db.notification.createMany({
    data: [
      { userId: pohledny.id, actorId: rvamsay.id, type: "POKE", createdAt: daysAgo(0, 5) },
      { userId: kaprik.id, actorId: pohledny.id, type: "FRIEND_REQUEST", friendshipId: pohlednyKaprikRequest.id, createdAt: daysAgo(0, 9) },
      { userId: vidlicka.id, actorId: kaprik.id, type: "POKE", createdAt: daysAgo(1, 2), readAt: daysAgo(0, 22) },
      { userId: lokalek.id, actorId: vidlicka.id, type: "APPLICATION", jobId: jobVycepni.id, createdAt: daysAgo(1) },
      { userId: vasemaso.id, actorId: rvamsay.id, type: "APPLICATION", jobId: jobReznik.id, createdAt: daysAgo(1) },
      { userId: rvamsay.id, actorId: lokalek.id, type: "MESSAGE", conversationId: conv1.id, createdAt: daysAgo(0, 5), readAt: daysAgo(0, 4) },
      { userId: redkvicka.id, actorId: nomnom.id, type: "APPLICATION_STATUS", jobId: jobStaz.id, createdAt: daysAgo(3) },
      { userId: barmozna.id, actorId: zpatecka.id, type: "EXPERIENCE_REQUEST", createdAt: daysAgo(2) },
      { userId: vosihnizdo.id, actorId: anicka.id, type: "EXPERIENCE_REQUEST", createdAt: daysAgo(1) },
      { userId: utriskvarku.id, actorId: mana.id, type: "APPLICATION", jobId: jobSkvarky.id, createdAt: daysAgo(0, 8) },
      { userId: rvamsay.id, actorId: nigella.id, type: "POKE", createdAt: daysAgo(0, 3) },
      { userId: rvamsay.id, actorId: guy.id, type: "MESSAGE", conversationId: convGuy.id, createdAt: daysAgo(0, 4), readAt: daysAgo(0, 2) },
    ],
  });

  phase("✔ Živý demo obsah nasypán.");
  console.log("  Heslo všude: cookus123 · admin: admin@cookus.cz");
  console.log("  Zkus: kaprik@cookus.cz · rvamsay@cookus.cz · lokalek@cookus.cz · barmozna@cookus.cz");
}
