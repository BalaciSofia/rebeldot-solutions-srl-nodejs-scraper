import fetch from "node-fetch";
import fs from "fs";
import { querySOLR, deleteJobsByCIF } from "./solr.js";
import { getCompanyFromANAFWithFallback, searchCompany } from "./demoanaf.js";

const Peviitor_API_URL = "https://api.peviitor.ro/v1/company/";
const COMPANY_BRAND = "RebelDot";

export function getCompanyBrand() {
  return COMPANY_BRAND;
}

const COMPANY_MODEL_FIELDS = [
  { name: "id", required: true, type: "string" },
  { name: "company", required: true, type: "string" },
  { name: "brand", required: false, type: "string" },
  { name: "group", required: false, type: "string" },
  { name: "status", required: false, type: "string", allowed: ["activ", "suspendat", "inactiv", "radiat"] },
  { name: "location", required: false, type: "array" },
  { name: "website", required: false, type: "array" },
  { name: "career", required: false, type: "array" },
  { name: "lastScraped", required: false, type: "string" },
  { name: "scraperFile", required: false, type: "string" }
];

async function getCompanyFromPeviitor(companyName) {
  const url = `${Peviitor_API_URL}?name=${encodeURIComponent(companyName)}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0" }
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
    brand: COMPANY_BRAND,
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
    } catch (e) {}
  }
  return null;
}

export async function getCompanyData() {
  const cachedData = loadCachedCompanyData();

  if (!cachedData?.summary?.cif) {
    const searchResults = await searchCompany(COMPANY_BRAND);

    if (!searchResults || searchResults.length === 0) {
      throw new Error(`No companies found for brand: ${COMPANY_BRAND}`);
    }

    const exactMatch = searchResults.find(c =>
      (c.name.toUpperCase().startsWith(COMPANY_BRAND.toUpperCase() + " ") ||
       c.name.toUpperCase().includes(" " + COMPANY_BRAND.toUpperCase() + " ")) &&
      c.statusLabel === "Funcțiune"
    );

    let selectedCIF;
    if (!exactMatch) {
      const activeMatch = searchResults.find(c => c.statusLabel === "Funcțiune");
      if (!activeMatch) {
        throw new Error(`No active company found for brand: ${COMPANY_BRAND}`);
      }
      selectedCIF = activeMatch.cui;
    } else {
      selectedCIF = exactMatch.cui;
    }

    const anafData = await getCompanyFromANAFWithFallback(selectedCIF, cachedData?.anaf);

    if (!anafData) {
      throw new Error("No data from ANAF and no cache - cannot proceed with scraping");
    }
    if (!anafData.name) {
      throw new Error("ANAF returned no company name - cannot proceed with scraping");
    }
    if (!anafData.cui) {
      throw new Error("ANAF returned no CUI - cannot proceed with scraping");
    }

    const company = anafData.name.toUpperCase();
    const cif = anafData.cui.toString();
    const active = !anafData.inactive;

    return { company, cif, active, anafData };
  } else {
    const anafData = cachedData.anaf;
    const company = anafData.name.toUpperCase();
    const cif = anafData.cui.toString();
    const active = !anafData.inactive;

    return { company, cif, active, anafData };
  }
}

export async function validateAndGetCompany() {
  const { company, cif, active, anafData } = await getCompanyData();

  const solrResult = await querySOLR(cif);

  let peviitorData = null;
  try {
    peviitorData = await getCompanyFromPeviitor(COMPANY_BRAND);
  } catch (e) {}

  saveCompanyData(anafData, peviitorData);

  if (!active) {
    if (solrResult.numFound > 0) {
      await deleteJobsByCIF(cif);
    }
    return { status: "inactive", company, cif, existingJobsCount: solrResult.numFound };
  }

  return { status: "active", company, cif, existingJobsCount: solrResult.numFound };
}
