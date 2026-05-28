# Job Model Schema

## Required Fields

| Field   | Type   | Description |
|---------|--------|-------------|
| url     | string | Unique job URL |
| title   | string | Job title |
| company | string | Company name (uppercase, diacritics required) |
| cif     | string | Company CIF/CUI |

## Optional Fields

| Field     | Type     | Description |
|-----------|----------|-------------|
| location  | string[] | Romanian cities (diacritics accepted) |
| tags      | string[] | Skill tags (lowercase, no diacritics) |
| workmode  | string   | "remote", "on-site", or "hybrid" |
| date      | string   | ISO8601 date of scrape |
| status    | string   | Job status (e.g. "scraped") |
