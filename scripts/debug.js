import fetch from "node-fetch";
import * as cheerio from "cheerio";

const res = await fetch("https://careers.rebeldot.com/jobs", {
  headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" }
});

const html = await res.text();
const $ = cheerio.load(html);

console.log("=== All <a> tags with href containing /jobs/ ===");
$('a[href*="/jobs/"]').each((i, el) => {
  const $el = $(el);
  console.log(`\n--- Job ${i + 1} ---`);
  console.log("href:", $el.attr("href"));
  console.log("text:", $el.text().trim().substring(0, 200));
  console.log("html:", $el.html()?.substring(0, 300));
});

console.log("\n\n=== Total job links found:", $('a[href*="/jobs/"]').length);
