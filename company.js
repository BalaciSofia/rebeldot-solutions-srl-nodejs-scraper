import fetch from "node-fetch";
import fs from "fs";
import CONFIG from "./config.js";
import { querySOLR, deleteJobsByCIF } from "./solr.js";
import { getCompanyFromANAFWithFallback } from "./src/anaf.js";

export function getCompanyBrand() {
  return CONFIG.COMPANY_BRAND;
}

async function getCompanyFromPeviitor(companyName) {
  const url = `${CONFIG.PEVIITOR_API_URL}?name=${encodeURIComponent(companyName)}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "job_seeker_ro_spider" },
    signal: AbortSignal.timeout(CONFIG.FETCH_TIMEOUT_MS)
  });

  if (!res.ok) {
    throw new Error(`Peviitor API error: ${res.status}`);
  }

  const data = await res.json();
  return data.companies?.[0] || null;
}

function saveCompanyData(anafData, peviitorData) {
  const companyData = {
    validatedAt: new Date().toISOString(),
    source: "ANAF",
    brand: CONFIG.COMPANY_BRAND,
    anaf: anafData,
    peviitor: peviitorData,
    summary: {
      company: anafData?.name || null,
      cif: anafData?.cui?.toString() || null,
      active: !anafData?.inactive,
      inactiveSince: anafData?.inactiveSince || null,
      reactivatedSince: anafData?.reactivatedSince || null,
      address: anafData?.address || null,
      registrationNumber: anafData?.registrationNumber || null,
      caenCode: anafData?.caenCode || null,
      vatRegistered: anafData?.vatRegistered || false,
      eFacturaRegistered: anafData?.eFacturaRegistered || false
    }
  };

  fs.writeFileSync("company.json", JSON.stringify(companyData, null, 2), "utf-8");
  return companyData;
}

function loadCachedCompanyData() {
  if (fs.existsSync("company.json")) {
    try {
      const data = JSON.parse(fs.readFileSync("company.json", "utf-8"));
      if (data?.anaf?.cui && data?.anaf?.name) {
        return data;
      }
    } catch (e) {
      console.warn("Corrupted company.json, re-fetching from ANAF:", e.message);
    }
  }
  return null;
}

export async function getCompanyData() {
  const cachedData = loadCachedCompanyData();
  const targetCif = CONFIG.COMPANY_CIF;

  if (!cachedData?.summary?.cif || cachedData.summary.cif !== targetCif) {
    const anafData = await getCompanyFromANAFWithFallback(targetCif, cachedData?.anaf);

    if (!anafData) {
      throw new Error("No data from ANAF and no cache - cannot proceed with scraping");
    }
    if (!anafData.name) {
      throw new Error("ANAF returned no company name - cannot proceed with scraping");
    }
    if (!anafData.cui) {
      throw new Error("ANAF returned no CUI - cannot proceed with scraping");
    }

    console.log(`ANAF returned name: ${anafData.name}`);
    console.log(`ANAF returned CUI: ${anafData.cui}`);
    console.log(`ANAF status: ${anafData.inactive ? "INACTIVE" : "ACTIVE"}`);

    const company = anafData.name.toUpperCase();
    const cif = anafData.cui.toString();
    const active = !anafData.inactive;

    return { company, cif, active, anafData };
  }

  console.log(`Using cached company data for CIF: ${cachedData.summary.cif}`);
  const anafData = cachedData.anaf;

  console.log(`Cached name: ${anafData.name}`);
  console.log(`Cached CUI: ${anafData.cui}`);
  console.log(`Cached status: ${anafData.inactive ? "INACTIVE" : "ACTIVE"}`);

  const company = anafData.name.toUpperCase();
  const cif = anafData.cui.toString();
  const active = !anafData.inactive;

  return { company, cif, active, anafData };
}

export async function validateAndGetCompany() {
  const { company, cif, active, anafData } = await getCompanyData();

  const solrResult = await querySOLR(cif);

  let peviitorData = null;
  try {
    peviitorData = await getCompanyFromPeviitor(CONFIG.COMPANY_BRAND);
  } catch (e) {
    console.warn("Peviitor API unavailable, proceeding without:", e.message);
  }

  saveCompanyData(anafData, peviitorData);

  if (!active) {
    if (solrResult.numFound > 0) {
      await deleteJobsByCIF(cif);
    }
    return { status: "inactive", company, cif, existingJobsCount: solrResult.numFound };
  }

  return { status: "active", company, cif, existingJobsCount: solrResult.numFound };
}
