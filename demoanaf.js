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
        headers: { "User-Agent": "Mozilla/5.0" }
      });

      if (!res.ok) {
        lastError = new Error(`ANAF API error: ${res.status}`);
        if (attempt < MAX_RETRIES) await sleep(RETRY_DELAY_MS);
        continue;
      }

      const json = await res.json();

      if (json.success === false) {
        lastError = new Error(json.error?.message || "ANAF returned error");
        if (attempt < MAX_RETRIES) await sleep(RETRY_DELAY_MS);
        continue;
      }

      return json.data || null;
    } catch (err) {
      lastError = err;
      if (attempt < MAX_RETRIES) await sleep(RETRY_DELAY_MS);
    }
  }

  throw lastError || new Error("ANAF API failed after retries");
}

export async function getCompanyFromANAFWithFallback(cif, cachedData = null) {
  try {
    return await getCompanyFromANAF(cif);
  } catch (err) {
    if (cachedData) {
      return cachedData;
    }
    throw err;
  }
}

export async function searchCompany(brandName) {
  const url = `${ANAF_SEARCH_URL}?q=${encodeURIComponent(brandName)}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0" }
  });

  if (!res.ok) {
    throw new Error(`ANAF search error: ${res.status}`);
  }

  const json = await res.json();
  return json.data || [];
}
