import fetch from "node-fetch";
import * as cheerio from "cheerio";
import fs from "fs";
import { fileURLToPath } from "url";
import { validateAndGetCompany } from "./company.js";
import { querySOLR, deleteJobByUrl, upsertJobs } from "./solr.js";

const COMPANY_CIF = "39271439";
const TIMEOUT = 10000;
const JOBS_URL = "https://careers.rebeldot.com/jobs";
let COMPANY_NAME = null;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchJobsPage() {
  const res = await fetch(JOBS_URL, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    }
  });

  if (!res.ok) {
    throw new Error(`Jobs page error: ${res.status}`);
  }

  const html = await res.text();
  return html;
}

function parseJobsFromHtml(html) {
  const $ = cheerio.load(html);
  const jobs = [];

  $('a[href*="/jobs/"]').each((i, el) => {
    const $el = $(el);
    let href = $el.attr("href") || "";
    const url = href.startsWith("http") ? href : "https://careers.rebeldot.com" + href;

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
      if (text.includes("cluj")) location.push("Cluj-Napoca");
      if (text.includes("brașov") || text.includes("brasov")) location.push("Brașov");
      if (text.includes("oradea")) location.push("Oradea");
      if (text.includes("bucurești") || text.includes("bucharest")) location.push("București");
    }
    if (location.length === 0) location.push("România");

    const tags = [];
    if (text.includes("java")) tags.push("java");
    if (text.includes("react")) tags.push("react");
    if (text.includes("python")) tags.push("python");
    if (text.includes("devops")) tags.push("devops");
    if (text.includes("azure")) tags.push("azure");
    if (text.includes("genai") || text.includes("generative ai")) tags.push("generative ai");
    if (text.includes("ai") || text.includes("artificial intelligence")) tags.push("ai");
    if (text.includes("data")) tags.push("data");
    if (text.includes(".net")) tags.push(".net");
    if (text.includes("ux") || text.includes("designer")) tags.push("ux design");
    if (text.includes("architect")) tags.push("architect");
    if (text.includes("security") || text.includes("devsecops")) tags.push("security");

    const uid = url.split("/").pop() || title.toLowerCase().replace(/\s+/g, "-");

    jobs.push({
      url,
      title,
      uid,
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
  const romanianCities = [
    'Bucharest', 'București', 'Cluj-Napoca', 'Cluj Napoca',
    'Timișoara', 'Timisoara', 'Iași', 'Iasi', 'Brașov', 'Brasov',
    'Constanța', 'Constanta', 'Craiova', 'Bacău', 'Sibiu',
    'Târgu Mureș', 'Targu Mures', 'Oradea', 'Baia Mare', 'Satu Mare',
    'Ploiești', 'Ploiesti', 'Pitești', 'Pitesti', 'Arad', 'Galați', 'Galati',
    'Brăila', 'Braila', 'Drobeta-Turnu Severin', 'Râmnicu Vâlcea', 'Ramnicu Valcea',
    'Buzău', 'Buzau', 'Botoșani', 'Botosani', 'Zalău', 'Zalau', 'Hunedoara', 'Deva',
    'Suceava', 'Bistrița', 'Bistrita', 'Tulcea', 'Călărași', 'Calarasi',
    'Giurgiu', 'Alba Iulia', 'Slatina', 'Piatra Neamț', 'Piatra Neamt', 'Roman',
    'Dumbrăvița', 'Dumbravita', 'Voluntari', 'Popești-Leordeni', 'Popesti-Leordeni',
    'Chitila', 'Mogoșoaia', 'Mogosoaia', 'Otopeni'
  ];

  const citySet = new Set(romanianCities.map(c => c.toLowerCase()));

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

async function main() {
  const testOnlyOnePage = process.argv.includes("--test");

  try {
    console.log("=== Step 1: Get existing jobs count ===");
    const existingResult = await querySOLR(COMPANY_CIF);
    const existingCount = existingResult.numFound;
    console.log(`Found ${existingCount} existing jobs in SOLR`);

    console.log("=== Step 2: Validate company via ANAF ===");
    const { company, cif } = await validateAndGetCompany();
    COMPANY_NAME = company;

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
      source: "rebeldot.com",
      scrapedAt: new Date().toISOString(),
      company: COMPANY_NAME,
      cif: cif,
      jobs
    };

    console.log("Transforming jobs for SOLR...");
    const transformedPayload = transformJobsForSOLR(payload);
    const validCount = transformedPayload.jobs.filter(j => j.location).length;
    console.log(`Jobs with valid Romanian locations: ${validCount}`);

    fs.writeFileSync("jobs.json", JSON.stringify(transformedPayload, null, 2), "utf-8");
    console.log("Saved jobs.json");

    console.log("\n=== Step 4: Upsert jobs to SOLR ===");
    await upsertJobs(transformedPayload.jobs);

    const finalResult = await querySOLR(COMPANY_CIF);
    console.log(`\n=== SUMMARY ===`);
    console.log(`Jobs existing in SOLR before scrape: ${existingCount}`);
    console.log(`Jobs scraped from RebelDot website: ${uniqueJobs.length}`);
    console.log(`Jobs in SOLR after scrape: ${finalResult.numFound}`);
    console.log(`================`);

    console.log("\n=== DONE ===");
    console.log("Scraper completed successfully!");

  } catch (err) {
    console.error("Scraper failed:", err);
    process.exit(1);
  }
}

export { parseJobsFromHtml, mapToJobModel, transformJobsForSOLR };

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
