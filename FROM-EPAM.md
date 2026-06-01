# FROM-EPAM.md — RebelDot ↔ EPAM Sync Relationship

Acest document explică relația dintre repo-urile scraper:

- **EPAM** — [`epam-systems-international-srl-nodejs-scraper`](https://github.com/sebiboga/epam-systems-international-srl-nodejs-scraper) — șablonul principal
- **RebelDot** — [`rebeldot-solutions-srl-nodejs-scraper`](https://github.com/BalaciSofia/rebeldot-solutions-srl-nodejs-scraper) — repo derivat

## Scop

Repo-ul EPAM conține șablonul de referință pentru structură, configurare și bune practici.
RebelDot este derivat din EPAM și ar trebui să rămână sincronizat.

Pentru lista completă de verificare, vezi [SYNC-CHECKLIST.md](SYNC-CHECKLIST.md).

## Diferențe cunoscute

| Aspect | EPAM | RebelDot |
|--------|------|----------|
| CIF | `33159615` | `39271439` |
| Company | `EPAM SYSTEMS INTERNATIONAL SRL` | `REBELDOT SOLUTIONS S.R.L.` |
| Brand | `EPAM` | `RebelDot` |
| Sursă job-uri | API JSON (careers.epam.com) | Teamtailor HTML (careers.rebeldot.com) |
| Metodă scraping | JSON API + paginare | HTML DOM parsing (cheerio) |
| `src/anaf.js` | Da (modular) | Da (modular, sincronizat) |
