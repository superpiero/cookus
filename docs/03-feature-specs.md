# Cookus — specifikace funkcí

> Verze dokumentu: 1.2 (v1.1 po stress-test revizi; v1.2 přidává přátele, feed přátel a šťouchnutí) · Datum: 2026-07-14
> Formát: každý modul má chování, akceptační kritéria (AC) a edge-cases (EC).

## 1. Účty a profily

### 1.1 Registrace, přihlášení, obnova hesla
- Registrace: volba **Jsem člověk z gastra** / **Jsme podnik** → jméno (u podniku název), e-mail, heslo (min 8 znaků), u podniku kategorie. Handle se navrhne ze jména (diakritika → ASCII, mezery → pomlčky, kolize → sufix čísla), lze upravit i později v nastavení.
- Po registraci rovnou přihlášen, redirect na `/settings` s výzvou k dokončení profilu.
- Zapomenuté heslo: `/forgot-password` → e-mail s odkazem (token TTL 1 h, jednorázový) → `/reset-password?token=…` → nové heslo. Bez `RESEND_API_KEY` se odkaz loguje na server (dev/demo režim).
- **AC:** duplicitní e-mail vrátí srozumitelnou chybu (akceptovaný trade-off, rate limit 5 registrací/hod/IP); e-mail lowercase; po loginu redirect na `next` nebo `/feed`; zablokovaný účet (`isBlocked`) se nepřihlásí — generická hláška.
- **EC:** handle kolize → `jan-novak-2`; rezervované handly (`admin`, `api`, `jobs`, `feed`, `messages`, `settings`, `login`, `register`, `notifications`, `styleguide`, `p`, `people`, `post`, `applications`, `verifications`) zakázané; reset token použitý/expirovaný → srozumitelná chyba + odkaz na nové vyžádání.

### 1.2 Profil
- Veřejná stránka `/p/[handle]`: hlavička (avatar, jméno, headline, město, badge druhu účtu; osoba: „hledám práci“ při openToWork; podnik: kategorie, web, badge **„Ověřený podnik“** pokud `verified`), tlačítka **Napsat zprávu** (přihlášeným, ne sobě) a **Upravit profil** (vlastník).
- Taby: **Fotky** (grid 3 sloupce), **Praxe** (osoba: timeline; podnik: potvrzení lidé, kteří u něj pracovali), **Info** (bio/resumé, skills), u podniku **Pozice** (otevřené inzeráty).
- Skills: tagy, max 15. Vstup našeptává z kurátorovaného katalogu ~100 gastro dovedností (`src/lib/skills.ts`, 8 kategorií: kuchyně, pekárna & cukrárna, bar, káva, servis, vedení & provoz, jazyky, certifikace) — sjednocuje zápis pro filtr v `/people`; vlastní text zůstává povolen.
- **AC:** profil veřejně čitelný bez loginu (SEO); změny ihned (revalidace).
- **EC:** neexistující handle → 404; prázdné stavy všech tabů s CTA pro vlastníka.

### 1.3 Praxe a její ověření (differentiator)
Základem je **záznam praxe** — funguje i bez účtu druhé strany (řeší cold start):

1. Osoba přidá praxi: název podniku **volným textem** (`institutionName`), role, období, popis → stav `UNLINKED`, na profilu viditelná bez badge.
2. Volitelně (hned či později) **propojí s účtem podniku** (autocomplete mezi INSTITUTION účty) → stav `PENDING`, podniku vzniká notifikace `EXPERIENCE_REQUEST` + e-mail (je-li mail aktivní). Na profilu stále viditelná jako neověřená.
3. Podnik na `/verifications` **potvrdí** (volitelný report/reference, max 1000 znaků) → `CONFIRMED`, badge **„✓ Ověřeno podnikem“** + citovaný report na profilu; nebo **odmítne** → `DECLINED`, viditelné jen vlastníkovi (může smazat či znovu propojit jinam).
4. Osoba dostane notifikaci o výsledku.

- **AC:** potvrdit/odmítnout smí výhradně cílový podnik; osoba může žádost stáhnout (PENDING → UNLINKED); CONFIRMED záznam nelze editovat (jen smazat); praxi přidává jen PERSON; propojený podnik bez `verified` badge se u ověření zobrazuje bez „Ověřený podnik“ štítku (síla reference je viditelně odstupňovaná).
- **EC:** podnik smaže účet → záznam přežije se snapshotem názvu, badge ověření zaniká (zobrazí se jako neověřený); max 3 PENDING žádosti na osobu a podnik (anti-spam); duplicitní období povolena.

## 2. Sociální vrstva (IG-style)

### 2.1 Vytvoření postu
- „Přidat fotku“ → výběr souboru → crop UI (formát **1:1** / **4:5**, zoom, drag) → popisek (max 2200 znaků, emoji nativně) → publikovat.
- Klient: canvas export JPEG (1080×1080 / 1080×1350, q0.82). Upload first, post po úspěchu.
- **AC:** post ihned na profilu (grid) a ve feedu; autor může smazat (cascade lajky/komentáře/notifikace).
- **EC:** > 10 MB před cropem → chyba; nepodporovaný formát → chyba; limit 100 fotek/účet → srozumitelná hláška.

### 2.2 Feed a detail postu
- `/feed`: nejnovější posty všech účtů, infinite scroll (cursor po 12). Karta: autor (avatar, jméno, čas), fotka, ❤ + počet (optimistický toggle), 💬 + počet → proklik na `/post/[id]`.
- `/post/[id]`: fotka, popisek, všechny komentáře (od nejstarších), pole pro komentář.
- **AC:** like idempotentní; komentář bez reloadu; feed funguje i nepřihlášeným? — NE, feed je za loginem (homepage je výkladní skříň).

### 2.3 Lajky a komentáře
- Like → notifikace LIKE autorovi (ne vlastní post). Unlike → smaže nepřečtenou LIKE notifikaci (dedup index, viz 02 §2.2).
- Komentáře: plochý seznam; mazat smí autor komentáře i autor postu; notifikace COMMENT autorovi postu (ne vlastní).
- **EC:** komentář na smazaný post → no-op s hláškou; prázdný komentář zakázán.

### 2.4 Přátelé a feed přátel

- Přátelství je **vzájemné** a funguje mezi libovolnými účty (člověk↔člověk, člověk↔podnik, podnik↔podnik): žádost → přijetí/odmítnutí. Opačná žádost od druhé strany = automatické přijetí (vzájemný zájem netřeba schvalovat dvakrát).
- Profil: tlačítko dle stavu — **Přidat do přátel** → **Žádost odeslána (zrušit)** / **Přijmout žádost** → **Přátelé ✓ (odebrat)**.
- `/friends`: příchozí žádosti (přijmout/odmítnout), odeslané žádosti (zrušit), seznam přátel (odebrat).
- **Feed přátel**: `/feed` má taby **Přátelé** / **Vše**. Tab Přátelé = posty přátel + vlastní, **čistě chronologicky** (IG layout, žádný algoritmus). Výchozí tab: Přátelé, pokud uživatel aspoň jednoho přítele má; jinak Vše.
- Notifikace: FRIEND_REQUEST (→ `/friends`), FRIEND_ACCEPTED (→ profil aktéra).
- **AC:** žádost nelze poslat sám sobě ani duplicitně (ani obráceným směrem); přijmout/odmítnout smí jen adresát; zrušit jen žadatel; odebrat kterákoli strana; feed přátel vidí jen přihlášený a jen svůj.
- **EC:** smazaný účet → cascade přátelství i žádostí; odmítnutí žádost smaže (lze požádat znovu); prázdný feed přátel → CTA na `/people`.

### 2.5 Šťouchnutí (poke & pokeback)

Nízkoprahový signál zájmu à la klasický Facebook poke — „všiml/a jsem si tě“ bez nutnosti psát zprávu. V gastro kontextu: podnik šťouchne kuchaře, kterého by rád, kuchař šťouchne podnik, kam by chtěl.

- **Šťouchnout** jde z profilu (tlačítko 👉) — komukoli, ne jen přátelům.
- Příjemce dostane notifikaci „👉 X tě šťouchl/a“ s tlačítkem **Šťouchnout zpátky** přímo v seznamu notifikací (pokeback = poke opačným směrem, jedno kliknutí).
- **AC:** poke sám sobě zakázán; opakované šťouchnutí negeneruje další nepřečtenou notifikaci (dedup partial indexem, docs/02 §2.2); rate limit 30 šťouchnutí/hod/uživatel; poke se loguje (tabulka Poke) pro budoucí statistiky.
- **EC:** šťouchnutí smazaného účtu → no-op; pokeback z notifikace, jejíž aktér mezitím smazal účet → notifikace zmizela cascadem, nic se nestane.

## 3. Job board

### 3.1 Inzerát
- Podnik: název, kategorie (gastro číselník), typ úvazku, **město z číselníku CITIES** + volitelná adresa, mzda od–do + perioda (UI nabádá vyplnit), popis. Stav OPEN/CLOSED.
- **AC:** vystavit smí jen INSTITUTION; editace/uzavření jen vlastník; CLOSED zůstává na URL s badge „Obsazeno“, nelze se hlásit; **job nelze v UI smazat** (historie přihlášek), jen uzavřít.
- **EC:** mzda: obě, jen od, nebo nic; min ≤ max.

### 3.2 Vyhledávání
- `/jobs`: fulltext (`ILIKE` title+popis), filtry kategorie / úvazek / město (přesná shoda) / „jen se mzdou“; řazení nejnovější; cursor pagination; filtry v URL. Veřejné bez loginu (SEO).
- Karta: název, podnik (avatar + jméno + badge ověření), město, úvazek, mzda, stáří.

### 3.3 Přihláška (< 5 minut, reálně < 1)
- Detail: „Přihlásit se profilem“ → modal s náhledem profilu (avatar, headline, počet ověřených praxí) + volitelná zpráva → odeslat. Nepřihlášený → login s návratem.
- **AC:** 1 přihláška/osoba/inzerát; notifikace APPLICATION podniku + e-mail (je-li aktivní); hlásit se smí jen PERSON; na CLOSED nelze.
- **EC:** opakovaná přihláška → „už ses přihlásil/a“ + stav.

### 3.4 Správa uchazečů a moje přihlášky
- `/jobs/[id]/applicants` (vlastník): stavy **Nová → Zobrazená → Užší výběr → Přijat / Zamítnut**; otevření detailu auto SENT→VIEWED; karta: profil, zpráva, ověřené praxe, změna stavu, **Napsat zprávu**.
- `/applications` (osoba): moje přihlášky se stavy. Notifikace APPLICATION_STATUS při SHORTLISTED/HIRED/REJECTED (VIEWED ne).

## 4. Zprávy

- `/messages`: konverzace (avatar, jméno, úryvek, čas, unread badge), řazení dle lastMessageAt.
- `/messages/[id]`: historie (donačítání starších), bubliny, input: nativní emoji + **quick-bar 8 běžných emoji**, Enter odešle.
- Konverzaci zakládá první zpráva; psát si mohou libovolné dva účty. Kanonické pořadí dvojice → jedna konverzace na pár (DB unique).
- Přečtenost: `ConversationRead.lastReadAt`; aktualizace při otevření a pak jen při `visibilityState === 'visible'` s novými zprávami.
- **AC:** optimistické odeslání; polling 5 s doručí odpověď bez reloadu; participant-check na každém čtení (IDOR); badge agregace jedním SQL (02 §6).
- **EC:** zpráva sám sobě zakázána; prázdná zakázána; max 4000 znaků.

## 5. Notifikace

- Zvonek s počtem (poll 30 s). `/notifications`: aktér (avatar, jméno), text dle typu, proklik na cíl, čas; nepřečtené zvýrazněné; otevření stránky = bulk přečtení.
- Dedup: partial unique index (02 §2.2) — od téhož aktéra, typu a cíle max 1 nepřečtená.
- Typy: LIKE, COMMENT, MESSAGE (1/konverzace), APPLICATION, APPLICATION_STATUS, EXPERIENCE_REQUEST, EXPERIENCE_CONFIRMED, EXPERIENCE_DECLINED.
- **EC:** smazaný aktér/cíl → cascade (FK, viz 02).

## 6. Homepage (konverzní)

1. **Hero**: „Práce v gastru bez životopisu. Profil, který za tebe mluví.“ + sub + duální CTA `Hledám práci` / `Hledáme lidi` (→ `/register?kind=…`), vizuál 70s diner.
2. **Čísla z DB až nad prahem** (≥50 lidí / ≥10 podniků / ≥10 pozic), jinak kvalitativní proof.
3. **Jak to funguje** — 3 kroky, tab kuchař/podnik.
4. **Ukázka ověřené praxe** — mock karta s reportem (differentiator).
5. **Persony** — Karel, Bára, Simona s citací.
6. **Poslední pozice** — 3 živé karty + CTA `/jobs`.
7. **Závěrečné CTA** + patička (kontakt, GDPR/privacy).
- **AC:** ISR (revalidate 300) → LCP < 2,5 s i po Neon idle; responzivní; oba CTA předvyplní druh účtu.

## 7. Administrace, moderace, GDPR

- `/admin` (jen `isAdmin`): seznam posledního obsahu (posty, komentáře, joby, účty) + akce: smazat post/komentář/job, (od)blokovat účet, udělit/odebrat **„Ověřený podnik“**.
- Smazání účtu: `/settings` → potvrzení heslem → cascade dle 02 §2.1. (Právo na výmaz.)
- Privacy policy stránka `/privacy` (stručná, česky).

## 8. Přístupnost a jazyk

- Celé UI česky; relativní časy („před 2 h“); kontrast WCAG AA dle brand tokenů; focus stavy; alt = popisek postu; klávesová dostupnost modalů; touch targety ≥ 44 px.

## 9. Seed data (demo + testy)

12 účtů (8 osob, 4 podniky — z toho 2 `verified`), 1 admin, ~20 postů (brand-style generované obrázky), lajky, komentáře, 6 inzerátů, přihlášky ve všech stavech, praxe ve stavech UNLINKED/PENDING/CONFIRMED (s reporty), 3 konverzace, notifikace. Demo login: `karel@cookus.cz` / `cookus123`.
