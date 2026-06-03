import fetch from "node-fetch";
import * as cheerio from "cheerio";
import fs from "fs";
import { fileURLToPath } from "url";
import CONFIG from "./config.js";
import { validateAndGetCompany } from "./company.js";
import { querySOLR, deleteJobByUrl, upsertJobs, upsertCompany } from "./solr.js";

let COMPANY_NAME = null;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchJobsPage() {
  const res = await fetch(CONFIG.JOBS_URL, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    },
    signal: AbortSignal.timeout(CONFIG.FETCH_TIMEOUT_MS)
  });

  if (!res.ok) {
    throw new Error(`Jobs page error: ${res.status}`);
  }

  return res.text();
}

function parseJobsFromHtml(html) {
  const $ = cheerio.load(html);
  const jobs = [];

  $('a[href*="/jobs/"]').each((i, el) => {
    const $el = $(el);
    let href = $el.attr("href") || "";
    const url = href.startsWith("http") ? href : CONFIG.JOBS_BASE_URL + href;

    const title = $el.contents().filter((_, n) => n.type === 'text').text().trim()
      || $el.text().trim()
      || "";

    if (!title || title.length > 100) return;

    const detailsSpan = $el.next("span.text-base");
    const detailsText = detailsSpan.length ? detailsSpan.text().trim() : "";

    let workmode = "hybrid";
    const workSpan = detailsSpan.length ? detailsSpan.find("span.inline-flex").first().text().trim().toLowerCase() : "";
    if (workSpan.includes("remote")) workmode = "remote";
    else if (workSpan.includes("on-site") || workSpan.includes("office")) workmode = "on-site";

    const location = [];
    detailsSpan.find("span").each((_, s) => {
      const txt = $(s).text().trim();
      if (txt.includes(",") && !txt.startsWith("·") && !txt.startsWith("Hybrid") && !txt.startsWith("Remote") && !txt.startsWith("On-site")) {
        txt.split(",").forEach(part => {
          const city = part.trim();
          if (city && city !== "·") location.push(city);
        });
      }
    });
    if (location.length === 0 && detailsText.toLowerCase().includes("cluj")) location.push("Cluj-Napoca");

    const text = (title + " " + detailsText).toLowerCase();

    if (location.length === 0) {
      for (const rule of CONFIG.CITY_FALLBACK_RULES) {
        if (rule.keywords.some(k => text.includes(k))) {
          location.push(rule.city);
          break;
        }
      }
    }
    if (location.length === 0) location.push("România");

    const tags = [];
    for (const [keyword, tag] of Object.entries(CONFIG.TAG_KEYWORDS)) {
      if (text.includes(keyword)) {
        tags.push(tag);
      }
    }

    jobs.push({
      url,
      title,
      workmode,
      location: [...new Set(location)],
      tags: [...new Set(tags)]
    });
  });

  return jobs;
}

function mapToJobModel(rawJob, cif, companyName = COMPANY_NAME) {
  const now = new Date().toISOString();

  const job = {
    url: rawJob.url,
    title: rawJob.title,
    company: companyName,
    cif: cif,
    location: rawJob.location?.length ? rawJob.location : undefined,
    tags: rawJob.tags?.length ? rawJob.tags : undefined,
    workmode: rawJob.workmode || undefined,
    date: now,
    status: "scraped"
  };

  Object.keys(job).forEach((k) => job[k] === undefined && delete job[k]);

  return job;
}

function transformJobsForSOLR(payload) {
  const citySet = new Set(CONFIG.ROMANIAN_CITIES.map(c => c.toLowerCase()));

  const normalizeWorkmode = (wm) => {
    if (!wm) return undefined;
    const lower = wm.toLowerCase();
    if (lower.includes('remote')) return 'remote';
    if (lower.includes('office') || lower.includes('on-site') || lower.includes('site')) return 'on-site';
    return 'hybrid';
  };

  const transformed = {
    ...payload,
    company: payload.company?.toUpperCase(),
    jobs: payload.jobs.map(job => {
      const validLocations = (job.location || []).filter(loc => {
        const lower = loc.toLowerCase().trim();
        if (lower === 'romania' || lower === 'românia') return true;
        return citySet.has(lower);
      }).map(loc => loc.toLowerCase() === 'romania' ? 'România' : loc);

      return {
        ...job,
        location: validLocations.length > 0 ? validLocations : ['România'],
        workmode: normalizeWorkmode(job.workmode)
      };
    })
  };

  return transformed;
}

function validateJobs(jobs) {
  const required = ["url", "title", "company", "cif"];
  const errors = [];

  for (let i = 0; i < jobs.length; i++) {
    for (const field of required) {
      if (!jobs[i][field]) {
        errors.push(`Job ${i} missing required field '${field}'`);
      }
    }
  }

  if (errors.length > 0) {
    throw new Error(`Job validation failed:\n${errors.join("\n")}`);
  }
}

async function removeStaleJobs(scrapedUrls, cif) {
  console.log("\n=== Step: Remove stale jobs ===");

  const existingResult = await querySOLR(cif, 500);
  const existingJobs = existingResult.docs || [];
  console.log(`Existing jobs in SOLR: ${existingResult.numFound}`);

  const staleJobs = existingJobs.filter(job => !scrapedUrls.has(job.url));
  console.log(`Stale jobs to remove: ${staleJobs.length}`);

  if (staleJobs.length === 0) {
    console.log("No stale jobs found");
    return;
  }

  for (const job of staleJobs) {
    console.log(`Removing stale job: ${job.url}`);
    await deleteJobByUrl(job.url);
  }

  console.log(`Removed ${staleJobs.length} stale jobs`);
}

async function main() {
  const isDryRun = process.argv.includes("--dry-run");

  if (isDryRun) {
    console.log("=== DRY RUN MODE - no changes will be made ===\n");
  }

  try {
    console.log("=== Step 1: Get existing jobs count ===");
    const existingResult = await querySOLR(CONFIG.COMPANY_CIF);
    const existingCount = existingResult.numFound;
    console.log(`Found ${existingCount} existing jobs in SOLR`);

    console.log("=== Step 2: Validate company via ANAF ===");
    const { company, cif } = await validateAndGetCompany();
    COMPANY_NAME = company;

    if (!isDryRun) {
      try {
        await upsertCompany({
          id: cif,
          company,
          brand: CONFIG.COMPANY_BRAND,
          status: "activ",
          location: ["Cluj-Napoca"],
          website: ["https://www.rebeldot.com"],
          career: ["https://careers.rebeldot.com"],
          lastScraped: new Date().toISOString().split('T')[0],
          scraperFile: "https://raw.githubusercontent.com/BalaciSofia/rebeldot-solutions-srl-nodejs-scraper/main/.github/workflows/scrape.yml"
        });
      } catch (err) {
        console.log(`Note: Could not upsert company to SOLR core: ${err.message}`);
      }
    } else {
      console.log("[DRY RUN] Would upsert company to SOLR core");
    }

    console.log("=== Step 3: Scrape jobs from RebelDot careers ===");
    const html = await fetchJobsPage();
    const rawJobs = parseJobsFromHtml(html);
    console.log(`Found ${rawJobs.length} jobs on RebelDot careers page`);

    const seenUrls = new Set();
    const uniqueJobs = rawJobs.filter(job => {
      if (seenUrls.has(job.url)) return false;
      seenUrls.add(job.url);
      return true;
    });
    console.log(`Unique jobs: ${uniqueJobs.length}`);

    const jobs = uniqueJobs.map(job => mapToJobModel(job, cif));

    const payload = {
      source: CONFIG.SOURCE,
      scrapedAt: new Date().toISOString(),
      company: COMPANY_NAME,
      cif: cif,
      jobs
    };

    console.log("Transforming jobs for SOLR...");
    const transformedPayload = transformJobsForSOLR(payload);
    const validCount = transformedPayload.jobs.filter(j => j.location).length;
    console.log(`Jobs with valid Romanian locations: ${validCount}`);

    if (!isDryRun) {
      fs.writeFileSync("jobs.json", JSON.stringify(transformedPayload, null, 2), "utf-8");
      console.log("Saved jobs.json");
    } else {
      console.log("[DRY RUN] Would save jobs.json");
    }

    console.log("\n=== Step 4: Validate jobs ===");
    validateJobs(transformedPayload.jobs);
    console.log(`All ${transformedPayload.jobs.length} jobs passed validation`);

    if (!isDryRun) {
      console.log("\n=== Step 5: Upsert jobs to SOLR ===");
      await upsertJobs(transformedPayload.jobs);
      console.log("Upsert complete");
    } else {
      console.log(`\n[DRY RUN] Would upsert ${transformedPayload.jobs.length} jobs to SOLR`);
    }

    if (!isDryRun) {
      await removeStaleJobs(seenUrls, cif);
    } else {
      console.log("\n[DRY RUN] Would check and remove stale jobs");
    }

    const finalResult = isDryRun
      ? { numFound: existingCount }
      : await querySOLR(CONFIG.COMPANY_CIF);

    console.log(`\n=== SUMMARY ===`);
    console.log(`Jobs existing in SOLR before scrape: ${existingCount}`);
    console.log(`Jobs scraped from RebelDot website: ${uniqueJobs.length}`);
    console.log(`Jobs in SOLR after scrape: ${finalResult.numFound}`);
    console.log(`================`);

    if (isDryRun) {
      console.log("\n=== DRY RUN COMPLETE - no changes were made ===");
    } else {
      console.log("\n=== DONE ===");
      console.log("Scraper completed successfully!");
    }

  } catch (err) {
    console.error("Scraper failed:", err);
    process.exit(1);
  }
}

export { parseJobsFromHtml, mapToJobModel, transformJobsForSOLR };

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
