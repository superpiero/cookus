# Cookus — backlog & TBD

> Živý seznam nápadů a restů. Připomínat při každé další práci na projektu.
> Založeno: 2026-08-10 · Stav MVP: nasazeno na cookus-phi.vercel.app, demo obsah nahraný.

## 🌟 Nápady na funkce (seřazeno dle odhadu přínosu)

### 1. AI párování a návrhy „collabů" *(nápad Piera, 2026-08-10 — priorita)*

Párování lidí mezi sebou i podniků a lidí podle kritérií + „AI" match:

- **Matching engine**: skóre kompatibility z dostupných signálů — dovednosti × požadavky pozic, město, kategorie podniku, openToWork, vzájemní přátelé, ověřené praxe (např. „pracoval v podniku stejné kategorie"), aktivita. V první verzi heuristika (vážený součet), později LLM re-ranking s vysvětlením.
- **Návrh collabu konkrétním profilům**: notifikace/karta „Myslíme, že byste si sedli" s **jednoduchým potvrzením propojení** (přijmout/odmítnout, à la žádost o přátelství). Propojení vzniká, až když potvrdí **obě strany** (double opt-in).
- **Úvodní zpráva od aplikace**: po potvrzení se otevře konverzace, kde první zprávu pošle **Cookus jako systém** — vysvětlí, *proč* mu match přišel zajímavý („Báro a Piktograme, oba žijete výběrovou kávou v Brně a Bára zrovna hledá směny — nedáte řeč?"). Vyžaduje systémové zprávy v chatu (nový typ zprávy `SYSTEM` nebo systémový účet Cookus).
- **Kadence**: max ~1 návrh týdně na profil, aby to nebyl spam; možnost vypnout v nastavení.
- Technicky navazuje na existující: Friendship (double opt-in vzor), Conversation/Message (+ systémová zpráva), Notification (+ typ MATCH_SUGGESTED, MATCH_CONFIRMED), číselník skills (už sjednocuje zápis pro matchování).

### 2. Tlačítko „Nahlásit obsah"
Report fronta pro adminy (z stress-test revize docs/04 #13). Posty, komentáře, profily, inzeráty.

### 3. Admin: mazání účtů z UI
Dnes admin jen blokuje; mazání jde přes SQL. Přidat tlačítko s potvrzením (diskutováno 2026-08-10).

### 4. Follow + personalizovaný feed
Sledování účtů bez vzájemnosti (doplněk přátel), feed „Sleduji". Z roadmapy v2 (docs/01).

### 5. Směnný marketplace (à la Poached Shifts)
Podnik vypíše jednorázovou směnu (datum, hodiny, sazba) → rychlé obsazení. Ticket vzor v brandu už existuje (guidelines kap. 05).

### 6. Připomínky čekajících žádostí o potvrzení praxe
E-mail podniku po 7 dnech bez reakce (docs/04 #15). Vyžaduje cron (Vercel Cron).

### 7. E-mailové digesty
Denní/týdenní souhrn notifikací pro neaktivní uživatele (retence). Vercel Cron + Resend.

## 🔧 Technický dluh / upgrady při růstu

| Co | Kdy | Poznámka |
|---|---|---|
| Fotky → Vercel Blob | ~1000+ fotek | izolováno v `src/lib/images.ts`, připravená výměna |
| Fulltext → pg_trgm GIN | pomalé hledání jobů | jedna migrace, beze změny kódu (docs/02 §7) |
| Rate limity → Upstash | reálný provoz | dnes DB-backed, per-IP (docs/02 §9) |
| Chat → SSE/Pusher | stížnosti na 5s latenci | izolováno v poll hooku (docs/02 §6) |
| E-mail verifikace podniků | růst fake účtů | dnes admin badge ručně |
| Monetizace inzerátů | product-market fit | Stripe, zvýhodněné pozice |

## ✅ Provozní resty (jednorázové)

- [ ] Smazat `SEED_TOKEN` z Vercel env vars (pokud ještě existuje) — dokud je, seed URL maže celou DB
- [ ] Dát admin práva reálným účtům + smazat `admin@cookus.cz` (veřejně známé heslo) — SQL v konverzaci 2026-08-10
- [ ] Zvážit změnu hesel demo účtů (`…@cookus.cz` mají všechny `cookus123`)
- [ ] Resetnout DB heslo, pokud se ještě nestalo (bylo sdíleno v chatu)
