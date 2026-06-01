import fetch from "node-fetch";

const ANAF_API_URL = "https://demoanaf.ro/api/company/";
const ANAF_SEARCH_URL = "https://demoanaf.ro/api/search";
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function getCompanyFromANAF(cif) {
  let lastError = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const url = `${ANAF_API_URL}${cif}`;
      const res = await fetch(url, {
        headers: { "User-Agent": "job_seeker_ro_spider" }
      });

      if (!res.ok) {
        lastError = new Error(`ANAF API error: ${res.status}`);
        if (attempt < MAX_RETRIES) {
          console.log(`  ANAF attempt ${attempt}/${MAX_RETRIES} failed: ${res.status}, retrying...`);
          await sleep(RETRY_DELAY_MS);
        }
        continue;
      }

      const json = await res.json();

      if (json.success === false) {
        if (json.data === null && json.message?.includes("not found")) {
          return null;
        }
        throw new Error(`ANAF API error: ${json.message || "Unknown error"}`);
      }

      const data = json.data || json;

      if (data && data.cui) {
        parseAdministratorsIfNeeded(data);
        return data;
      }

      const found = findCompanyByCIF(data, cif);
      if (found) return found;

      return data || null;
    } catch (err) {
      lastError = err;
      if (attempt < MAX_RETRIES) {
        console.log(`  ANAF attempt ${attempt}/${MAX_RETRIES} failed: ${err.message}, retrying...`);
        await sleep(RETRY_DELAY_MS);
      }
    }
  }

  throw lastError || new Error(`Failed to fetch company data for CIF ${cif}`);
}

export async function getCompanyFromANAFWithFallback(cif, cachedData = null) {
  try {
    const data = await getCompanyFromANAF(cif);
    return data;
  } catch (err) {
    console.log(`  ANAF API failed (${err.message})`);
    if (cachedData) {
      console.log("  Using cached company data...");
      return cachedData;
    }
    throw err;
  }
}

export async function searchCompany(brand) {
  const url = `${ANAF_SEARCH_URL}?q=${encodeURIComponent(brand)}&f=name`;
  const res = await fetch(url, {
    headers: { "User-Agent": "job_seeker_ro_spider" }
  });

  if (!res.ok) {
    throw new Error(`ANAF search error: ${res.status}`);
  }

  const json = await res.json();

  const results = json.data || json.results || json;

  const items = Array.isArray(results) ? results : [];

  return items.map(item => ({
    name: item.name || item.company || "",
    cui: item.cui || item.cif || "",
    registrationNumber: item.registrationNumber || item.nrReg || "",
    county: item.county || item.judet || "",
    locality: item.locality || item.localitate || "",
    legalForm: item.legalForm || item.formaJuridica || "",
    statusLabel: item.statusLabel || item.status || item.stare || null,
    isInsolvent: item.isInsolvent || item.insolventa || false
  }));
}

function parseAdministratorsIfNeeded(data) {
  if (data.administrators && typeof data.administrators === "string") {
    try {
      data.administrators = JSON.parse(data.administrators);
    } catch {
      data.administrators = [];
    }
  }
  if (data.administrators && typeof data.administrators === "object" && !Array.isArray(data.administrators)) {
    data.administrators = Object.entries(data.administrators).map(([name, role]) => ({
      name,
      role: role || "administrator"
    }));
  }
}

function findCompanyByCIF(data, cif) {
  if (!data || typeof data !== "object") return null;
  const searchStr = cif.toString();

  for (const key of Object.keys(data)) {
    const val = data[key];
    if (Array.isArray(val)) {
      for (const item of val) {
        if (item && (item.cui?.toString() === searchStr || item.cif?.toString() === searchStr)) {
          return item;
        }
      }
    }
  }
  return null;
}
