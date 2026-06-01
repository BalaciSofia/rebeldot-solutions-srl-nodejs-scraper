# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- `src/anaf.js` — modular ANAF library extracted from demoanaf.js
- `validate-jobs.js` — job URL validator (active/expired detection)
- `tests/validate-rebeldot-jobs.js` — peviitor API-based job validation
- `.github/CODEOWNERS` — code ownership configuration
- `.github/workflows/deploy.yml` — GitHub Pages deployment
- Template docs: AGENTS.md, ISSUES.md, ROBOTS.md, TOPICS.md, FROM-EPAM.md, SYNC-CHECKLIST.md, UPDATE-REPO-ABOUT.md
- `upsertCompany()` in solr.js — company core upsert on scrape

### Changed
- `demoanaf.js` — rewritten as thin CLI wrapper around src/anaf.js
- `company.js` — import from src/anaf.js instead of demoanaf.js
- `index.js` — wired upsertCompany into scrape workflow
- `package.json` — `defaultTimeout` → `testTimeout`, `--no-deprecation` flag
- All User-Agents standardized to `job_seeker_ro_spider`

## [1.0.0] - 2026-05-28

### Added
- Initial release
- Job scraping from careers.rebeldot.com (Teamtailor ATS)
- Company validation via ANAF
- Solr integration for job storage
- GitHub Actions workflows for daily scraping and testing
- Comprehensive test suite (unit, integration, E2E)
- ANAF API fallback with cached data support
- Node 24 compatibility

### Features
- Automated daily job scraping
- Company core validation and management
- Job URL validation
- Data integrity checks
- Romanian location filtering
- Work mode normalization
- Cheerio-based HTML parsing

## License

Copyright (c) 2026 BALACI SOFIA
Licensed under MIT License
