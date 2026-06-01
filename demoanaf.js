#!/usr/bin/env node

import { getCompanyFromANAF, getCompanyFromANAFWithFallback, searchCompany } from "./src/anaf.js";

export { getCompanyFromANAF, getCompanyFromANAFWithFallback, searchCompany };

const args = process.argv.slice(2);

if (args[0] === "search") {
  const brand = args[1] || "RebelDot";
  console.log(`=== Searching for: ${brand} ===\n`);

  searchCompany(brand)
    .then(results => {
      console.log(`Found ${results.length} results:\n`);
      results.forEach((c, i) => {
        console.log(`${i+1}. ${c.name} (CIF: ${c.cui}) - ${c.statusLabel || 'N/A'}`);
      });
    })
    .catch(err => {
      console.error("Error:", err.message);
      process.exit(1);
    });
} else {
  const cif = args[0] || "39271439";
  console.log(`=== Testing ANAF API for CIF: ${cif} ===\n`);

  getCompanyFromANAF(cif)
    .then(data => {
      console.log("Company data:");
      console.log(JSON.stringify(data, null, 2));
    })
    .catch(err => {
      console.error("Error:", err.message);
      process.exit(1);
    });
}
