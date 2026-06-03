import fetch from "node-fetch";
import * as cheerio from "cheerio";

const res = await fetch("https://careers.rebeldot.com/jobs", {
  headers: { "User-Agent": "Mozilla/5.0" }
});

const html = await res.text();
const $ = cheerio.load(html);

const firstJobLink = $('a[href*="/jobs/"]').first();
const parentDiv = firstJobLink.closest("div");
const grandparent = parentDiv.parent();

console.log("=== Grandparent HTML (first 2000 chars) ===");
console.log(grandparent.html()?.substring(0, 2000));

console.log("\n\n=== Parent div HTML ===");
console.log(parentDiv.html()?.substring(0, 2000));

console.log("\n\n=== First job link text via text() ===");
console.log(">%s<", firstJobLink.text().trim());

console.log("\n=== First job link contents (text nodes only):");
firstJobLink.contents().each((i, n) => {
  if (n.type === "text") {
    console.log("  text[%d]: >%s<", i, n.data?.trim());
  } else {
    console.log("  node[%d]: type=%s name=%s", i, n.type, n.name);
  }
});
