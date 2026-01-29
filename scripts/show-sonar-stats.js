#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const issuesFile = path.join(__dirname, '..', 'sonar-results', 'issues.json');

if (!fs.existsSync(issuesFile)) {
  console.error('sonar-results/issues.json not found');
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(issuesFile, 'utf8'));

console.log('='.repeat(80));
console.log('SonarCloud 最新掃描結果');
console.log('='.repeat(80));
console.log();
console.log('總 Code Smells:', data.total);
console.log();

// 按規則分類
const byRule = {};
const bySeverity = { CRITICAL: 0, MAJOR: 0, MINOR: 0, INFO: 0 };

data.issues.forEach(issue => {
  const rule = issue.rule.replace('typescript:', '');
  if (!byRule[rule]) {
    byRule[rule] = { count: 0, severity: issue.severity, message: issue.message };
  }
  byRule[rule].count++;
  bySeverity[issue.severity] = (bySeverity[issue.severity] || 0) + 1;
});

// 按數量排序
const sorted = Object.entries(byRule).sort((a, b) => b[1].count - a[1].count);

console.log('規則統計 (依數量排序):');
console.log('');
console.log('數量 | 規則      | 嚴重度   | 訊息');
console.log('-'.repeat(80));

sorted.forEach(([rule, info]) => {
  const msg = info.message.length > 50 ? info.message.slice(0, 50) + '...' : info.message;
  console.log(`${String(info.count).padStart(4)} | ${rule.padEnd(9)} | ${info.severity.padEnd(8)} | ${msg}`);
});

console.log();
console.log('='.repeat(80));
console.log('嚴重度統計:');
console.log('-'.repeat(40));
Object.entries(bySeverity).forEach(([sev, count]) => {
  console.log(`  ${sev}: ${count}`);
});
console.log('-'.repeat(40));
console.log('  總計:', data.total);
console.log('='.repeat(80));
