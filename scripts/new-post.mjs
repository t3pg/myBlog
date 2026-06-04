import { readdirSync, mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";

const root = join(fileURLToPath(import.meta.url), "..", "..");
const blogDir = join(root, "src", "content", "blog");

function findMaxNumber(dir) {
  let max = 0;
  for (const year of readdirSync(dir, { withFileTypes: true })) {
    if (!year.isDirectory() || !/^\d{4}$/.test(year.name)) continue;
    for (const month of readdirSync(join(dir, year.name), { withFileTypes: true })) {
      if (!month.isDirectory()) continue;
      for (const file of readdirSync(join(dir, year.name, month.name))) {
        const n = parseInt(file, 10);
        if (!isNaN(n) && n > max) max = n;
      }
    }
  }
  return max;
}

const now = new Date();
// 午前5時未満は前日とみなす
if (now.getHours() < 5) {
  now.setDate(now.getDate() - 1);
}

const yyyy = now.getFullYear().toString();
const mm = String(now.getMonth() + 1).padStart(2, "0");
const dd = String(now.getDate()).padStart(2, "0");

const next = findMaxNumber(blogDir) + 1;
const targetDir = join(blogDir, yyyy, mm);
mkdirSync(targetDir, { recursive: true });

const filePath = join(targetDir, `${next}.md`);
const content = `---
title: ""
pubDate: ${yyyy}-${mm}-${dd}
description: ""
tags: [""]
---
`;

writeFileSync(filePath, content, "utf-8");
console.log(`Created: src/content/blog/${yyyy}/${mm}/${next}.md`);
