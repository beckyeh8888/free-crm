#!/usr/bin/env node
/**
 * Analyze SonarCloud issues
 */

const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '..', 'sonar-results', 'issues.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

console.log('═'.repeat(80));
console.log('SonarCloud Code Smell 分類統計');
console.log('═'.repeat(80));

// Count by rule
const ruleCounts = {};
const ruleMessages = {};
const ruleSeverity = {};

const allIssues = [
  ...data.issues.codeSmells,
  ...data.issues.bugs,
  ...data.issues.vulnerabilities
];

allIssues.forEach(issue => {
  const rule = issue.rule;
  ruleCounts[rule] = (ruleCounts[rule] || 0) + 1;
  if (!ruleMessages[rule]) {
    ruleMessages[rule] = issue.message;
    ruleSeverity[rule] = issue.severity;
  }
});

// Sort by count
const sorted = Object.entries(ruleCounts).sort((a, b) => b[1] - a[1]);

console.log('\n規則統計 (依數量排序):\n');
console.log('數量 | 規則      | 嚴重度   | 訊息');
console.log('-'.repeat(80));

sorted.forEach(([rule, count]) => {
  const shortRule = rule.replace('typescript:', '');
  const severity = ruleSeverity[rule] || 'UNKNOWN';
  const msg = ruleMessages[rule].substring(0, 45);
  console.log(`${String(count).padStart(4)} | ${shortRule.padEnd(9)} | ${severity.padEnd(8)} | ${msg}...`);
});

console.log('\n' + '═'.repeat(80));
console.log('嚴重度統計:');
console.log('-'.repeat(40));
console.log(`  CRITICAL: ${data.summary.severityCounts.critical}`);
console.log(`  MAJOR:    ${data.summary.severityCounts.major}`);
console.log(`  MINOR:    ${data.summary.severityCounts.minor}`);
console.log(`  INFO:     ${data.summary.severityCounts.info}`);
console.log('-'.repeat(40));
console.log(`  總計:     ${data.summary.counts.total}`);
console.log('═'.repeat(80));
