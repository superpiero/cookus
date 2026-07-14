# Cookus — produktový brief

> Pracovní název: **Cookus** · Verze dokumentu: 1.1 (po stress-test revizi, viz `04-review-stress-test.md`) · Datum: 2026-07-14

## 1. Vize

Cookus je webová platforma, která propojuje **celou českou gastroscénu** — restaurace, kavárny, bary, hotely, cateringy a lidi, kteří v nich pracují nebo pracovat chtějí. Není to jen pracovní portál a není to jen sociální síť: je to **profesní síť pro gastro**, kde profil nahrazuje životopis, praxe je **ověřená přímo podniky** a práce se ukazuje fotkami, ne frázemi.

**Tagline:** *„Gastro žije tady."* / EN: *"Where hospitality works."*

### Proč teď a proč my

- Český trh obsluhují generické portály (Jobs.cz, Práce.cz) a jeden specializovaný inzertní web (GastroJobs.cz, od 2001) — všechny fungují modelem „inzerát → e-mail s CV". Žádný nemá profily, portfolio, ověřenou praxi ani komunitu.
- V USA tento posun už proběhl: **Culinary Agents** (2M+ členů, „LinkedIn pro gastro"), **Poached** (rychlé směny i stálé pozice), **Harri** (hiring + workforce management). Silné vzory, žádný lokální ekvivalent.
- Gastro je vizuální a fluktuační obor: lidé střídají podniky často, reference se předávají ústně, kvalita se ukazuje na talíři. Cookus tohle převádí do produktu: **ověřená praxe s referencí od podniku** + **fotografické portfolio**.

## 2. Persony

| Persona | Kdo to je | Co potřebuje | Klíčová funkce |
|---|---|---|---|
| **Kuchař Karel (27)** | 8 let praxe, střídá podniky, žádné CV | Ukázat co umí, najít lepší místo bez psaní CV | Profil = živé CV, ověřená praxe, portfolio jídel |
| **Barmanka Bára (22)** | Studentka, hledá brigády a sezónní práci | Rychle najít směny/brigády poblíž, přihlásit se na pár kliknutí | Filtry (brigáda, lokalita), 1-klik přihláška profilem |
| **Šéfová Simona (38)** | Provozní bistra, 2 pobočky, průběžně nabírá | Vidět reálnou praxi a reference uchazečů, ne nafouknutá CV | Ověřené profily, správa uchazečů, chat |
| **Hotel Imperial (HR)** | Řetězec, nabírá desítky pozic | Employer branding, dosah, důvěryhodná prezentace | Profil podniku s fotkami a týmem, více inzerátů |
| **Cukrářka Klára (31)** | Buduje osobní značku, chce zakázky i nabídky | Vizuální portfolio, sledovanost, síť kontaktů | IG-style grid, lajky/komentáře, zprávy |

## 3. Analýza konkurence a best practices

### 3.1 Job boardy / marketplace

| Platforma | Co dělá dobře | Co si bereme |
|---|---|---|
| **Culinary Agents** (US) | Profesní síť: profily s reálnou praxí a skills, employer hledá aktivně talenty, ne jen čeká na přihlášky | Profil jako CV; obousměrnost (podnik může oslovit člověka zprávou) |
| **Poached** (US) | Jednoduchost: inzerát za minuty, filtry podle typu (směna/stálá pozice), kategorie, lokalita | Rychlé podání inzerátu, filtr typu úvazku vč. brigád |
| **Harri** (US) | Celý lifecycle: hiring → komunikace s týmem v jedné aplikaci | Chat mezi podnikem a uchazečem přímo v platformě |
| **GastroJobs.cz** (CZ) | 25 let na trhu, zdarma pro uchazeče, pokrývá i hory/venkov | Zdarma pro uchazeče; kategorie pozic přesně dle českého gastra |
| **LinkedIn** | Potvrzování dovedností, doporučení, notifikace udržující engagement | Ověřená praxe s referencí (naše silnější verze „recommendation") |
| **Instagram** | Grid portfolia, formáty 1:1 a 4:5, lajky/komentáře, jednoduchost postování | Celá sociální vrstva: crop, grid, engagement |

### 3.2 Ověřené vzorce, které implementujeme (z výzkumu)

1. **Přihláška pod 5 minut** — hlavní příčina drop-off je dlouhá přihláška. U nás: přihlášení uživatelé se hlásí profilem + volitelná zpráva. Jedna obrazovka.
2. **Skills-based hiring** (85 % firem v 2025) — profily stavíme na dovednostech a ověřené praxi, ne na PDF životopisech.
3. **Employer branding rozhoduje** (75 % uchazečů zkoumá značku před přihláškou) — profil podniku = fotky, tým, otevřené pozice, reference od bývalých zaměstnanců (reporty u praxe fungují oběma směry: zviditelňují i podnik).
4. **Niche > generické** — konverze visitor→applicant u oborových boardů 3–8 % vs. 1–5 % u generických. Vše (kategorie, mzdy, typy úvazků) šijeme na gastro.
5. **Obousměrný marketplace** — podnik může kandidáta aktivně oslovit (zprávou), kandidát může nastavit „hledám práci" (open-to-work).
6. **Mobile-first** — celé UI responzivní, klíčové flow použitelné palcem.

### 3.3 Čím se odlišíme (differentiators)

- **Ověřená praxe s reportem**: praxi v profilu potvrzuje přímo podnik (účet v Cookus) a přidává krátký report/referenci. Vzniká důvěryhodná síť referencí, kterou generický portál nemá a nemůže mít.
- **Vizuální portfolio**: gastro se prodává očima. Grid fotek jídel, drinků, interiérů — u lidí i podniků.
- **Jeden profil pro obě role trhu**: podnik i člověk mají stejné sociální možnosti (postují, lajkují, píšou si).

## 4. Rozsah MVP

### In scope (MVP)

1. **Účty a profily** — registrace osoba/podnik, profil: avatar, headline, bio/resumé, město, dovednosti (tagy), u podniku kategorie a web; obnova zapomenutého hesla; smazání účtu (GDPR).
2. **Praxe s ověřením** — osoba přidá praxi (volný text podniku = funguje od prvního dne); volitelně ji propojí s účtem podniku → podnik potvrdí/odmítne + report. Potvrzené záznamy = badge „Ověřeno podnikem" na profilu. Podniky může admin označit „Ověřený podnik".
3. **Sociální vrstva** — fotopost s client-side cropem (1:1 čtverec, 4:5 portrét), popisek, grid na profilu, globální feed, detail postu, lajky, komentáře.
4. **Job board** — podnik vystaví inzerát (název, kategorie, úvazek, město z číselníku, mzda od–do, popis); vyhledávání s filtry; přihláška profilem + zpráva; správa uchazečů se stavy (nová → zobrazená → užší výběr → přijat/zamítnut); „moje přihlášky" pro uchazeče.
5. **Adresář lidí** — `/people`: podnik aktivně hledá kandidáty (filtr „hledám práci", dovednost, město) → obousměrný marketplace.
6. **Zprávy** — 1:1 konverzace mezi libovolnými profily (člověk↔podnik, člověk↔člověk), historie, emoji.
7. **Notifikace** — lajk, komentář, nová zpráva, nová přihláška, změna stavu přihlášky, žádost o potvrzení praxe, výsledek potvrzení. Zvonek s počtem nepřečtených. Transakční e-maily (přihláška, žádost o potvrzení) přes abstrakci s Resend.
8. **Konverzní homepage** — hero s hodnotovou propozicí, persony/use-cases, výhody, sociální důkaz (čísla až nad prahem důvěryhodnosti), dvojité CTA (Hledám práci / Hledám lidi).
9. **Minimální administrace** — moderace obsahu, blokace účtů, udělování badge ověřeného podniku.
10. **Přátelé a šťouchnutí** *(v1.2)* — vzájemná přátelství mezi libovolnými účty (lidé i podniky), feed přátel čistě chronologický à la Instagram, poke/pokeback jako nízkoprahový signál zájmu (podnik ↔ kandidát).

### Out of scope (roadmapa v2+)

Sledování účtů (follow) a personalizovaný feed, push notifikace a e-mailové digesty, směnný marketplace (à la Poached shifts), placené inzeráty a monetizace, video, vícejazyčnost (MVP je česky), mobilní aplikace, ATS integrace, doporučovací algoritmus, tlačítko nahlášení obsahu, plná e-mailová verifikace podniků.

## 5. Metriky úspěchu (severní hvězdy MVP)

- Registrace → vyplněný profil (avatar + ≥3 skills): **> 60 %**
- Zobrazení inzerátu → přihláška: **> 5 %** (benchmark niche boardů 3–8 %)
- Podíl osobních profilů s ≥1 záznamem praxe po 30 dnech: **> 40 %**; z toho propojených s účtem podniku: **> 25 %** (ověření roste s hustotou sítě podniků)
- D7 retence (návrat kvůli feedu/zprávám/notifikacím): **> 20 %**

## 6. Zdroje

- [Truffle: The 9 best restaurant hiring platforms](https://www.hiretruffle.com/blog/restaurant-hiring-platforms)
- [DesignRush: 11 Best Restaurant Job Boards 2026](https://www.designrush.com/agency/hr-outsourcing/trends/best-restaurant-job-boards)
- [Job Boardly: Job Board Conversion Metrics](https://www.jobboardly.com/blog/ultimate-guide-to-job-board-conversion-metrics)
- [Job Boardly: Niche Job Boards](https://www.jobboardly.com/blog/niche-job-boards)
- [ejobsitesoftware: Top 10 Must-Have Features in Job Board 2025](https://ejobsitesoftware.com/blog/top-10-must-have-features-in-job-board-2025-edition/)
- [Phenom: Career Site Best Practices](https://www.phenom.com/blog/career-site-best-practices)
- [GastroJobs.cz](https://gastrojobs.cz/cs/)
- [Jobs.cz — gastro sekce](https://www.jobs.cz/prace/gastronomie-a-pohostinstvi/)
