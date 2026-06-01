# Robots.txt Analysis — RebelDot Careers (Teamtailor)

Sursa: https://careers.rebeldot.com/robots.txt

## Reguli

```
User-agent: *
Disallow: /jobs/*/edit
Disallow: /jobs/*/applications
Disallow: /api
Disallow: /api/*
```

## Interpretare

| Cale | Accesibil? | Ce conține |
|---|---|---|
| `/` (landing) | ✅ Da | Pagina principală cu listări de job-uri |
| `/jobs` | ✅ Da | Listări de job-uri (front-end HTML) |
| `/jobs/*` (individual) | ✅ Da | Pagini individuale de job |
| `/jobs/*/edit` | ❌ **Disallowed** | Editare job-uri (admin) |
| `/jobs/*/applications` | ❌ **Disallowed** | Aplicări la job-uri |
| `/api/*` | ❌ **Disallowed** | API-ul Teamtailor |

## Recomandare

- Scraperul accesează pagina `/jobs` (front-end HTML, **allowed**)
- Paginile individuale de job (`/jobs/*`) sunt și ele **allowed**
- Rate limiting: 500ms delay între cereri
- User-Agent: `job_seeker_ro_spider`
- Risc minim — scraperul e politicos și non-agresiv
