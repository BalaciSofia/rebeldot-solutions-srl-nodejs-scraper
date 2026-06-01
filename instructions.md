# Instructions

## Project Purpose

This scraper extracts job listings from RebelDot careers page (Romania only) and imports them to peviitor.ro.

Target: https://careers.rebeldot.com/jobs

## Technologies

- **Node.js & JavaScript** - For scraping and data extraction
- **Apache SOLR** - For data storage and indexing
- **Cheerio** - For HTML parsing
- **Teamtailor** - RebelDot's ATS platform

## Workflow Steps

1. **Start with brand** - We know the brand ("RebelDot")
2. **Search in DemoANAF** - Find company by brand, get CIF from search results
3. **Get company details from ANAF** - Using CIF, fetch full company data from ANAF
4. **Validate with Peviitor** - Verify company exists in Peviitor
5. **Check existing jobs in SOLR** - Query SOLR by CIF to see what jobs already exist
6. **Check company status** - If ANAF status = "inactive" → DELETE existing jobs from SOLR and STOP
7. **Save company.json** - Save all ANAF + Peviitor data for backup
8. **Scrape new jobs** - Extract jobs from RebelDot careers page
9. **Transform for SOLR** - Validate and fix job data
10. **Upsert to SOLR** - Import/update jobs in SOLR

## File Responsibilities

| File | Role |
|------|------|
| `index.js` | Main entry point - full workflow |
| `company.js` | Validates company via ANAF + Peviitor |
| `solr.js` | SOLR operations module |
| `src/anaf.js` | Core ANAF API module |
| `demoanaf.js` | CLI wrapper around src/anaf.js |
| `validate-jobs.js` | Job URL validator |

## API Endpoints

- **DemoANAF Search**: `https://demoanaf.ro/api/search?q=BRAND`
- **DemoANAF Company**: `https://demoanaf.ro/api/company/:cui`
- **Peviitor API**: `https://api.peviitor.ro/v1/company/`
- **Solr**: `https://solr.peviitor.ro/solr/job`
- **RebelDot Careers**: `https://careers.rebeldot.com/jobs`

## Environment Variables

| Variable | Description |
|----------|-------------|
| `SOLR_AUTH` | SOLR credentials in format `user:password` |
