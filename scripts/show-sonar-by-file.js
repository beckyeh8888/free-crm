#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const issuesFile = path.join(__dirname, '..', 'sonar-results', 'issues.json');
const data = JSON.parse(fs.readFileSync(issuesFile, 'utf8'));

const byFile = {};
data.issues.forEach(i => {
  const file = i.component.replace('beckyeh8888_free-crm:', '');
  if (!byFile[file]) byFile[file] = 0;
  byFile[file]++;
});

const sorted = Object.entries(byFile).sort((a, b) => b[1] - a[1]);

console.log('問題檔案分布:');
console.log('');
console.log('數量 | 檔案');
console.log('-'.repeat(80));

sorted.forEach(([file, count]) => {
  console.log(`${String(count).padStart(4)} | ${file}`);
});

// 分類統計
const categories = {
  'scripts/': 0,
  'src/app/api/': 0,
  'src/components/': 0,
  'src/lib/': 0,
  'tests/': 0,
  'other': 0
};

sorted.forEach(([file, count]) => {
  let found = false;
  for (const cat of Object.keys(categories)) {
    if (cat !== 'other' && file.startsWith(cat)) {
      categories[cat] += count;
      found = true;
      break;
    }
  }
  if (!found) categories['other'] += count;
});

console.log('');
console.log('='.repeat(40));
console.log('分類統計:');
Object.entries(categories).forEach(([cat, count]) => {
  if (count > 0) {
    console.log(`  ${cat.padEnd(20)} ${count}`);
  }
});
