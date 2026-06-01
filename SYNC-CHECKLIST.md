# SYNC-CHECKLIST.md — Verificare sincronizare cu EPAM

Când EPAM (șablonul principal) primește actualizări, verifică dacă acestea
trebuie propagate în RebelDot. Vezi [FROM-EPAM.md](FROM-EPAM.md) pentru context.

## Checklist

- [x] `AGENTS.md` — reguli AI, comenzi test, structură module
- [x] `ISSUES.md` — proces contribuție, reguli issue
- [x] `CONTRIBUTING.md` — ghid contribuție
- [x] `SECURITY.md` — politici securitate
- [x] `ROBOTS.md` — analiză robots.txt (specific sursei)
- [x] `TOPICS.md` — topic-uri GitHub About
- [x] `UPDATE-REPO-ABOUT.md` — ghid actualizare About
- [x] `src/anaf.js` — modul ANAF modular
- [x] `validate-jobs.js` — validator URL-uri job
- [x] `tests/validate-rebeldot-jobs.js` — validator specific RebelDot
- [x] `tests/unit/` — teste unitare
- [x] `tests/integration/` — teste integrare
- [x] `tests/e2e/` — teste end-to-end
- [x] `.github/workflows/scrape.yml` — workflow scrape zilnic
- [x] `.github/workflows/test.yml` — workflow testare automată
- [x] `.github/workflows/deploy.yml` — deploy GitHub Pages
- [x] `.github/CODEOWNERS` — code owners
- [ ] `README.md` — badge-uri, features, structură proiect (actualizat structura)
- [x] `package.json` — scripts, jest config
- [x] `.gitignore` — fișiere ignorate
- [ ] `company.json` — date companie (CIF, nume) (se generează la runtime)
- [ ] `UPDATE-REPO-ABOUT.md` — descriere, website, topics (necesită owner)

## Cum se sincronizează

1. Verifică `git log` în EPAM pentru commit-uri noi
2. Pentru fiecare fișier din checklist, compară între EPAM și RebelDot
3. Dacă diferența e doar de configurare (CIF, nume companie, URL sursă),
   aplică modificarea în RebelDot
4. Dacă e o schimbare structurală, adaptează pentru specificul RebelDot
5. Rulează `npm test` înainte de commit
