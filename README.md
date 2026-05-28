# REBELDOT SOLUTIONS SRL - Job Scraper

[![WebScraper RebelDot to Peviitor](https://github.com/BalaciSofia/rebeldot-solutions-srl-nodejs-scraper/actions/workflows/scrape.yml/badge.svg)](https://github.com/BalaciSofia/rebeldot-solutions-srl-nodejs-scraper/actions/workflows/scrape.yml)
[![Automation Tests](https://github.com/BalaciSofia/rebeldot-solutions-srl-nodejs-scraper/actions/workflows/test.yml/badge.svg)](https://github.com/BalaciSofia/rebeldot-solutions-srl-nodejs-scraper/actions/workflows/test.yml)

A Node.js scraper for extracting job listings from RebelDot careers and storing them in Solr for [peviitor.ro](https://peviitor.ro).

## Overview

This project automates the daily scraping of RebelDot job listings in Romania, ensuring the peviitor.ro job board stays up-to-date with the latest career opportunities.

## Features

- Scrapes job listings from RebelDot careers page (Teamtailor)
- Validates company data via ANAF
- Stores jobs in Solr with proper data validation
- GitHub Actions workflow for daily automated scraping
- Comprehensive test suite for reliability

## Project Structure

```
├── index.js           # Main scraper entry point
├── company.js         # Company validation via ANAF
├── demoanaf.js        # ANAF API integration
├── solr.js            # Solr database operations
├── company.json       # Cached company data
├── tests/             # Test suite
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── .github/
│   └── workflows/
│       ├── scrape.yml     # Daily scraping workflow
│       └── test.yml      # Test automation
└── package.json
```

## Setup

### Prerequisites

- Node.js 24+
- npm

### Installation

```bash
npm install
```

## Usage

### Run the Scraper

```bash
npm run scrape
```

### Run Tests

```bash
npm test
```

## Workflows

### Daily Scraping

The `scrape.yml` workflow runs daily at 6 AM UTC via GitHub Actions.

### Test Automation

The `test.yml` workflow runs on every push and pull request.

## License

Copyright (c) 2026 BALACI SOFIA

Licensed under the [MIT License](LICENSE).

## Managed By

This project is managed by [ASOCIATIA OPORTUNITATI SI CARIERE](https://oportunitatisicariere.ro) and used as a web scraper for the [peviitor.ro](https://peviitor.ro) job board project.
