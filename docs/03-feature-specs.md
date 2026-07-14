# Cookus — specifikace funkcí

> Verze dokumentu: 1.0 · Datum: 2026-07-14
> Formát: každý modul má chování, akceptační kritéria (AC) a edge-cases (EC).

## 1. Účty a profily

### 1.1 Registrace a přihlášení
- Registrace: volba **Jsem člověk z gastra** / **Jsme podnik** → jméno (u podniku název), e-mail, heslo (min 8 znaků), u podniku kategorie. Handle se navrhne ze jména (diakritika → ASCII, mezery → pomlčky, kolize → sufix čísla), lze upravit.
- Po registraci rovnou přihlášen, redirect na `/settings` s výzvou k dokončení profilu (avatar, headline, skills).
- **AC:** duplicitní e-mail vrátí srozumitelnou chybu; handle unikátní; po loginu redirect na `next` param nebo `/feed`.
- **EC:** handle kolize (Jan Novák ×2) → `jan-novak-2`; e-mail case-insensitive (lowercase před uložením); rezervované handly (`admin`, `api`, `jobs`, `feed`, `messages`, `settings`, `login`, `register`, `notifications`, `styleguide`, `p`) zakázané.

### 1.2 Profil
- Veřejná stránka `/p/[handle]`: hlavička (avatar, jméno, headline, lokalita, badge druhu účtu, u osoby „hledám práci" pokud openToWork, u podniku kategorie + web), tlačítka **Napsat zprávu** (přihlášeným) a **Upravit profil** (vlastník).
- Taby: **Fotky** (grid 3 sloupce, poměr dle postu), **Praxe** (osoba: timeline praxí; podnik: potvrzení lidé, kteří u něj pracovali), **Info** (bio/resumé, skills), u podniku **Pozice** (otevřené inzeráty).
- Skills: tagy, max 15, vlastník přidává/maže v nastavení.
- **AC:** profil je veřejně čitelný bez loginu (SEO); změny se projeví ihned (revalidace).
- **EC:** neexistující handle → 404; prázdné stavy všech tabů s CTA pro vlastníka („Přidej první fotku").

### 1.3 Ověřená praxe (differentiator)
Flow:
1. Osoba v nastavení přidá praxi: vybere podnik **vyhledáním mezi účty podniků** (autocomplete), roli, období, volitelný popis.
2. Podnik dostane notifikaci `EXPERIENCE_REQUEST` a v sekci „Žádosti o potvrzení" vidí kartu žádosti.
3. Podnik **potvrdí** (volitelně vyplní report/referenci, max 1000 znaků) nebo **odmítne**.
4. Osoba dostane notifikaci o výsledku. Potvrzená praxe má na profilu badge **Ověřeno podnikem** + zobrazený report; PENDING se vlastníkovi zobrazuje šedě („čeká na potvrzení"), návštěvníkům se nezobrazuje vůbec; DECLINED vidí jen vlastník.
- **AC:** potvrdit/odmítnout může výhradně cílový podnik; osoba může PENDING/DECLINED záznam smazat; CONFIRMED záznam smazat může (report tím zmizí z profilu), ale nemůže ho editovat (edit = nový cyklus potvrzení — MVP: editace zakázána, jen smazat a znovu).
- **EC:** podnik zruší účet → praxe zůstává s označením zaniklého podniku (onDelete: SetNull na institutionId + snapshot názvu podniku v záznamu); duplicitní žádost na stejný podnik a roli povolena (různá období), ale max 3 PENDING žádosti na osobu a podnik (anti-spam); podnik nemůže přidávat praxi (jen PERSON).

## 2. Sociální vrstva (IG-style)

### 2.1 Vytvoření postu
- FAB „+" / tlačítko „Přidat fotku" → výběr souboru → crop UI (přepínač formátu **1:1** / **4:5**, zoom, drag) → popisek (max 2200 znaků, emoji nativně) → publikovat.
- Klient: canvas export JPEG (1080 px šířka; 1080×1080 nebo 1080×1350), komprese q0.82.
- **AC:** post se objeví na profilu (grid) a ve feedu; autor může post smazat (kaskádově mizí lajky/komentáře/notifikace na něj vázané... notifikace s postId → onDelete cascade).
- **EC:** soubor > 10 MB před cropem → chyba na klientu; nepodporovaný formát → chyba; upload selže → post nevznikne (obrázek first, post až po úspěchu).

### 2.2 Feed
- `/feed`: chronologicky nejnovější posty všech účtů (MVP bez follow), infinite scroll (cursor pagination po 12), karta: autor (avatar, jméno, čas), fotka, akce (❤ + počet, 💬 + počet), popisek, poslední 2 komentáře, pole „Přidat komentář…".
- **AC:** like je optimistický (okamžitá odezva UI), idempotentní; komentář se objeví bez reloadu.

### 2.3 Lajky a komentáře
- Like/unlike toggle; autor postu dostane notifikaci LIKE (ne při unlike, ne při lajku vlastního postu; opakovaný like po unlike negeneruje duplicitní nepřečtenou notifikaci — dedup na [userId, actorId, postId, type, unread]).
- Komentáře: plochý seznam (bez vláken v MVP), mazat může autor komentáře i autor postu. Notifikace COMMENT autorovi postu (ne při komentáři vlastního postu).
- **EC:** komentář na smazaný post → 404/no-op; prázdný komentář zakázán.

## 3. Job board

### 3.1 Inzerát
- Podnik: formulář název, kategorie (číselník gastro pozic), typ úvazku, lokalita (text, MVP), mzda od–do + perioda (volitelné, ale UI nabádá vyplnit — inzeráty se mzdou konvertují lépe), popis (markdown ne, jen odstavce), stav OPEN/CLOSED.
- **AC:** vystavit smí jen INSTITUTION; editace/uzavření jen vlastník; uzavřený inzerát zůstává dostupný na URL s badge „Obsazeno", nelze se hlásit.
- **EC:** mzda: buď obě hodnoty, nebo jen od, nebo nic; validace min ≤ max.

### 3.2 Vyhledávání
- `/jobs`: fulltext (title + popis, PG `ILIKE` v MVP), filtry: kategorie, typ úvazku, lokalita (substring), „jen se mzdou"; řazení nejnovější. Cursor pagination. Filtry v URL (sdílitelné, SEO).
- Karta: název, podnik (avatar + jméno → profil), lokalita, úvazek, mzda, stáří. Veřejné bez loginu.

### 3.3 Přihláška (< 5 minut, reálně < 1)
- Detail: „Přihlásit se profilem" → modal s náhledem profilu (avatar, headline, počet ověřených praxí) + volitelná zpráva → odeslat. Nepřihlášený → login/registrace s návratem.
- **AC:** 1 přihláška/osobu/inzerát (druhý pokus → info „už ses přihlásil/a"); podnik dostane notifikaci APPLICATION; přihlásit se může jen PERSON; na vlastní inzerát se podnik hlásit nemůže.
- **EC:** přihláška na CLOSED job → chyba; smazaný job → přihlášky kaskádově pryč.

### 3.4 Správa uchazečů
- `/jobs/[id]/applicants` (vlastník): seznam přihlášek se stavy **Nová → Zobrazená → Užší výběr → Přijat / Zamítnut** (SENT/VIEWED/SHORTLISTED/HIRED/REJECTED). Otevření detailu přihlášky auto-přepne SENT→VIEWED. Karta: profil uchazeče (proklik), zpráva, ověřené praxe, tlačítka změny stavu + **Napsat zprávu** (otevře chat).
- Uchazeč vidí stav svých přihlášek v „Moje přihlášky"; změna stavu SHORTLISTED/HIRED/REJECTED mu pošle notifikaci APPLICATION_STATUS (VIEWED ne — ticho je lepší než „zobrazeno a nic").

## 4. Zprávy

- `/messages`: seznam konverzací (avatar, jméno, úryvek poslední zprávy, čas, badge nepřečtených), řazení dle lastMessageAt.
- `/messages/[id]`: historie (starší se donačítají), bubliny, čas, input s emoji pickerem (paleta běžných emoji + nativní vstup), Enter odešle.
- Konverzaci zakládá první zpráva („Napsat zprávu" z profilu / z přihlášky). Kdokoli může napsat komukoli (člověk↔podnik i člověk↔člověk; podnik↔podnik taky — proč ne).
- Přečtenost: `ConversationRead.lastReadAt` se aktualizuje při otevření chatu a při doručení pollem, zprávy ostatních s createdAt > lastReadAt = nepřečtené.
- **AC:** odeslání < 300 ms optimisticky; historie správně řazená; unread badge v navigaci agreguje konverzace; polling 5 s doručí zprávu protistrany bez reloadu.
- **EC:** zpráva sám sobě zakázána; prázdná zpráva zakázána; max 4000 znaků; XSS — čistý text, emoji jsou jen unicode.

## 5. Notifikace

- Zvonek v navigaci s počtem nepřečtených (poll 30 s). `/notifications`: seznam — aktér (avatar, jméno), text dle typu, cíl (proklik na post/job/chat/profil), čas, nepřečtené zvýrazněné.
- Otevření stránky označí zobrazené jako přečtené (bulk `readAt = now` při načtení).
- Typy a texty: LIKE „❤️ X se líbí tvoje fotka", COMMENT „X okomentoval/a tvou fotku: ‚…'", MESSAGE „X ti poslal/a zprávu" (dedup na konverzaci), APPLICATION „X se hlásí na Y", APPLICATION_STATUS „Tvoje přihláška na Y: užší výběr", EXPERIENCE_REQUEST „X žádá o potvrzení praxe", EXPERIENCE_CONFIRMED/DECLINED „Y potvrdil/odmítl tvou praxi".
- **EC:** aktér smazal účet → notifikace kaskádově pryč (FK na actorId cascade); smazaný cíl (post) → notifikace pryč (cascade).

## 6. Homepage (konverzní)

Struktura (dle best practices career sites + landing pages):
1. **Hero**: headline s hodnotou („Práce v gastru bez životopisu. Profil, který za tebe mluví."), sub, **duální CTA**: `Hledám práci` / `Hledáme lidi`, vizuál v brand stylu (70s diner). Lišta s čísly (podniky / lidé / pozice — ze skutečné DB).
2. **Jak to funguje** — 3 kroky pro každou stranu trhu (tab přepínač persony: kuchař / podnik).
3. **Ukázka profilu** — screenshot/mock ověřené praxe s reportem (differentiator výslovně).
4. **Persony/use-cases** — 3 karty (Karel, Bára, Simona) s citací a přínosem.
5. **Poslední pozice** — živý výřez z job boardu (3 karty) + CTA na `/jobs`.
6. **Závěrečné CTA** + patička.
- **AC:** LCP < 2,5 s (SSR, žádné klientské knihovny nad rámec potřeby), plně responzivní, oba CTA vedou na registraci s předvolbou druhu účtu (`/register?kind=person|institution`).

## 7. Přístupnost a jazyk

- Celé UI česky; datumy česky („před 2 h", „3. 7. 2026").
- Kontrast dle WCAG AA (brand tokeny s tím počítají), focus stavy, alt texty (popisek postu → alt), sémantické landmarky, klávesová dostupnost modalů.

## 8. Seed data (demo + testy)

12 účtů (8 osob: kuchaři, barista, barmanka, cukrářka, číšník…; 4 podniky: bistro, kavárna, hotel, bar), ~20 postů s vygenerovanými obrázky (SVG→JPEG placeholdery v brand stylu), lajky, komentáře, 6 inzerátů napříč kategoriemi/úvazky, přihlášky v různých stavech, potvrzené i pending praxe s reporty, 3 konverzace, notifikace. Demo login: `karel@cookus.cz` / `cookus123` (a stejné heslo pro všechny seed účty).
