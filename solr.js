import fetch from "node-fetch";
import fs from "fs";
import CONFIG from "./config.js";

function getAuth() {
  const auth = process.env.SOLR_AUTH;
  if (!auth) throw new Error("SOLR_AUTH not set in environment");
  return auth;
}

function authHeaders() {
  return {
    "Authorization": "Basic " + Buffer.from(getAuth()).toString("base64"),
    "User-Agent": "job_seeker_ro_spider"
  };
}

function fetchOpts(timeoutMs = CONFIG.FETCH_TIMEOUT_MS) {
  return {
    headers: authHeaders(),
    signal: AbortSignal.timeout(timeoutMs)
  };
}

function escapeSolrValue(val) {
  return String(val).replace(/[+\-!(){}\[\]^~*?:\\\/" ]/g, "\\$&");
}

export function getSolrAuth() {
  return getAuth();
}

export async function querySOLR(cif, rows = 200) {
  const params = new URLSearchParams({
    q: `cif:${escapeSolrValue(cif)}`,
    rows,
    wt: "json"
  });

  const res = await fetch(`${CONFIG.SOLR_URL}/select?${params}`, fetchOpts());

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`SOLR query error: ${res.status} - ${text}`);
  }

  const data = await res.json();
  return data.response;
}

export async function upsertCompany(companyDoc) {
  const params = new URLSearchParams({ commit: "true" });

  const res = await fetch(`${CONFIG.SOLR_COMPANY_URL}/update?${params}`, {
    method: "POST",
    headers: {
      ...authHeaders(),
      "Content-Type": "application/json"
    },
    body: JSON.stringify([companyDoc]),
    signal: AbortSignal.timeout(CONFIG.FETCH_TIMEOUT_MS)
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`SOLR company upsert error: ${res.status} - ${text}`);
  }

  const data = await res.json();
  if (data.errors && data.errors.length > 0) {
    throw new Error(`SOLR company upsert partial error: ${JSON.stringify(data.errors)}`);
  }

  console.log(`Company "${companyDoc.company}" upserted to SOLR company core.`);
}

export async function queryCompanySOLR(query) {
  const params = new URLSearchParams({
    q: query,
    rows: 10,
    wt: "json"
  });

  const res = await fetch(`${CONFIG.SOLR_COMPANY_URL}/select?${params}`, fetchOpts());

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`SOLR company query error: ${res.status} - ${text}`);
  }

  const data = await res.json();
  return data.response;
}

async function solrDelete(queryBody, label = "delete") {
  const params = new URLSearchParams({ commit: "true" });

  const res = await fetch(`${CONFIG.SOLR_URL}/update?${params}`, {
    method: "POST",
    headers: {
      ...authHeaders(),
      "Content-Type": "application/json"
    },
    body: JSON.stringify(queryBody),
    signal: AbortSignal.timeout(CONFIG.FETCH_TIMEOUT_MS)
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`SOLR ${label} error: ${res.status} - ${text}`);
  }

  const data = await res.json();
  if (data.errors && data.errors.length > 0) {
    throw new Error(`SOLR ${label} partial error: ${JSON.stringify(data.errors)}`);
  }
}

export async function deleteJobsByCIF(cif) {
  await solrDelete({ delete: { query: `cif:${escapeSolrValue(cif)}` } }, "delete by CIF");
  console.log("Jobs deleted from SOLR.");
}

export async function deleteJobByUrl(url) {
  await solrDelete({ delete: { query: `url:${escapeSolrValue(url)}` } }, "delete by URL");
}

export async function upsertJobs(jobs) {
  const params = new URLSearchParams({ commit: "true" });

  const res = await fetch(`${CONFIG.SOLR_URL}/update?${params}`, {
    method: "POST",
    headers: {
      ...authHeaders(),
      "Content-Type": "application/json"
    },
    body: JSON.stringify(jobs),
    signal: AbortSignal.timeout(CONFIG.FETCH_TIMEOUT_MS)
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`SOLR upsert error: ${res.status} - ${text}`);
  }

  const data = await res.json();
  if (data.errors && data.errors.length > 0) {
    throw new Error(`SOLR upsert partial error: ${JSON.stringify(data.errors)}`);
  }

  console.log(`Upserted ${jobs.length} jobs to SOLR.`);
}

async function checkUrl(url) {
  try {
    const res = await fetch(url, {
      method: "HEAD",
      headers: { "User-Agent": "job_seeker_ro_spider" },
      signal: AbortSignal.timeout(CONFIG.FETCH_TIMEOUT_MS)
    });
    return { url, status: res.status, valid: res.ok };
  } catch (err) {
    return { url, status: 0, valid: false, error: err.message };
  }
}

async function runVerification(cif) {
  console.log("=== Verify SOLR Jobs ===\n");

  const result = await querySOLR(cif);
  console.log(`Total jobs in SOLR for CIF ${cif}: ${result.numFound}`);

  console.log("\nFirst 5 jobs:");
  result.docs.slice(0, 5).forEach((job, i) => {
    console.log(`${i+1}. ${job.title} (${job.location?.join(', ')}) - ${job.workmode}`);
  });

  if (fs.existsSync("jobs_existing.json")) {
    console.log("\n=== Verify existing URLs ===\n");
    const existing = JSON.parse(fs.readFileSync("jobs_existing.json", "utf-8"));
    const existingJobs = existing.jobs || [];
    console.log(`Checking ${existingJobs.length} URLs...`);

    const invalidUrls = [];
    for (let i = 0; i < existingJobs.length; i++) {
      const job = existingJobs[i];
      const res = await checkUrl(job.url);
      console.log(`[${i+1}/${existingJobs.length}] ${res.status > 0 ? res.status : 'ERR'} - ${job.url}`);
      if (!res.valid) invalidUrls.push(job.url);
    }

    if (invalidUrls.length > 0) {
      console.log(`\n ${invalidUrls.length} invalid URLs found - deleting from SOLR...`);
      for (const url of invalidUrls) {
        await deleteJobByUrl(url);
      }
      console.log(`Deleted ${invalidUrls.length} invalid jobs from SOLR`);
    }

    if (invalidUrls.length === 0) {
      console.log("\nAll URLs valid - deleting jobs_existing.json");
      fs.unlinkSync("jobs_existing.json");
    } else {
      console.log("Keeping jobs_existing.json for reference");
    }
  }
}

async function runExtract(cif) {
  console.log("=== Extract existing jobs from SOLR ===\n");

  try {
    const result = await querySOLR(cif);
    console.log(`Found ${result.numFound} existing jobs in SOLR for CIF ${cif}`);

    if (result.numFound === 0) {
      console.log("No existing jobs to backup.");
      return;
    }

    const backup = {
      extractedAt: new Date().toISOString(),
      cif: cif,
      count: result.numFound,
      jobs: result.docs
    };

    fs.writeFileSync("jobs_existing.json", JSON.stringify(backup, null, 2), "utf-8");
    console.log("\nSaved existing jobs to jobs_existing.json\n");
  } catch (err) {
    console.error("Failed to extract existing jobs:", err.message);
    process.exit(1);
  }
}

async function runCompanyQuery(args) {
  console.log("=== Query Company in SOLR ===\n");

  const query = args[1] || "company:RebelDot*";
  console.log(`Query: ${query}`);

  const result = await queryCompanySOLR(query);
  console.log(`Found ${result.numFound} companies`);

  if (result.docs?.length) {
    console.log("\nFirst company:");
    console.log(JSON.stringify(result.docs[0], null, 2));
  }
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith("solr.js")) {
  const args = process.argv.slice(2);

  if (args.includes("extract")) {
    const cif = args[1] || null;
    if (!cif) {
      console.error("Error: CIF required. Usage: node solr.js extract <CIF>");
      process.exit(1);
    }
    await runExtract(cif);
  } else if (args.includes("company")) {
    await runCompanyQuery(args);
  } else {
    const cif = args[0] || null;
    if (!cif) {
      console.error("Error: CIF required. Usage: node solr.js <CIF>");
      process.exit(1);
    }
    await runVerification(cif);
  }
}
