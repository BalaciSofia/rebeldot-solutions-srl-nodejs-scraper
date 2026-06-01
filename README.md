# REBELDOT SOLUTIONS S.R.L. - Job Scraper

[![WebScraper RebelDot to Peviitor](https://github.com/BalaciSofia/rebeldot-solutions-srl-nodejs-scraper/actions/workflows/scrape.yml/badge.svg)](https://github.com/BalaciSofia/rebeldot-solutions-srl-nodejs-scraper/actions/workflows/scrape.yml)
[![Automation Tests](https://github.com/BalaciSofia/rebeldot-solutions-srl-nodejs-scraper/actions/workflows/test.yml/badge.svg)](https://github.com/BalaciSofia/rebeldot-solutions-srl-nodejs-scraper/actions/workflows/test.yml)
[![GitHub Pages](https://github.com/BalaciSofia/rebeldot-solutions-srl-nodejs-scraper/actions/workflows/deploy.yml/badge.svg)](https://github.com/BalaciSofia/rebeldot-solutions-srl-nodejs-scraper/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![JavaScript](https://img.shields.io/badge/javascript-ESM-F7DF1E?logo=javascript&logoColor=black)](https://ecma-international.org/)
[![Node.js](https://img.shields.io/badge/node-24-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)

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
├── demoanaf.js        # ANAF CLI wrapper
├── solr.js            # Solr database operations
├── validate-jobs.js   # Job URL validator
├── src/
│   └── anaf.js        # Core ANAF library
├── company.json       # Cached company data
├── tests/             # Test suite
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── .github/
│   └── workflows/
│       ├── scrape.yml     # Daily scraping workflow
│       ├── test.yml      # Test automation
│       └── deploy.yml    # GitHub Pages deploy
├── AGENTS.md           # AI agent rules
├── ISSUES.md           # Issue process
├── ROBOTS.md           # Robots.txt analysis
├── CONTRIBUTING.md     # Contribution guide
├── SECURITY.md         # Security policy
├── CHANGELOG.md        # Version history
├── instructions.md     # Workflow documentation
├── files.md            # File roles
├── company-model.md    # Company schema
└── job-model.md        # Job schema
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
