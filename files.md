# Project Files

## JavaScript Files

| File | Description |
|------|-------------|
| `index.js` | Main scraper - full workflow: extract existing → validate company → scrape → transform → validate → upsert → remove stale → verify URLs |
| `company.js` | Validates company via ANAF + Peviitor APIs, checks if company is active/inactive |
| `solr.js` | SOLR operations module - query, delete, upsert with timeout and injection-safe queries |
| `demoanaf.js` | CLI wrapper for `src/anaf.js` - re-exports ANAF functions |
| `src/anaf.js` | ANAF API module - getCompanyFromANAF(cif) and searchCompany(brandName), with retry logic |
| `config.js` | Centralized configuration - URLs, timeouts, tag mappings, city rules |

## Markdown Files

| File | Description |
|------|-------------|
| `instructions.md` | Project documentation - workflow, technologies, API endpoints, how to update models |
| `job-model.md` | Job schema definition (Peviitor Core) - fields, types, validation rules |
| `company-model.md` | Company schema definition (Peviitor Core) - fields, types, validation rules |
| `files.md` | This file - documents role of each project file |
| `CHANGELOG.md` | Release history and feature changelog |
| `CONTRIBUTING.md` | Contribution guidelines |
| `SECURITY.md` | Security policy and vulnerability reporting |

## Configuration Files

| File | Description |
|------|-------------|
| `package.json` | Node.js project config - dependencies (node-fetch, cheerio), scripts |
| `package-lock.json` | Locked dependency versions |
| `.gitignore` | Ignores node_modules/, jobs.json, company.json, *.log, etc. |
| `.npmrc` | npm configuration - engine strict, audit, registry |
| `.nvmrc` | Node.js version file (Node 18+) |

## Data Files

| File | Description |
|------|-------------|
| `company.json` | Company backup - all ANAF + Peviitor data (generated at runtime, NOT committed) |

## Documentation

| File | Description |
|------|-------------|
| `docs/index.html` | GitHub Pages landing page - scraper status, live job count, company info |

## Utility Scripts

| File | Description |
|------|-------------|
| `scripts/debug.js` | Development-only debug helper for job extraction |
| `scripts/debug2.js` | Development-only HTML structure inspector |

## Dependencies (node_modules/)

Installed via npm:
- `node-fetch` - HTTP requests
- `cheerio` - HTML parsing

## Notes

- All `.md` files contain dynamic schemas that may change over time
- Check peviitor_core README.md for latest model definitions
- Full workflow: check count → validate company (ANAF+Peviitor) → scrape Teamtailor → transform (fix locations) → validate → upsert → remove stale jobs → log summary
- Use `npm run scrape:dry` for dry-run mode (no SOLR mutations)
