#!/usr/bin/env node
/**
 * 第三方元件每日審查腳本
 * ISO 27001 A.12.6.1 技術弱點管理合規
 *
 * 功能：
 * 1. 執行 npm audit 安全掃描
 * 2. 檢查過期套件
 * 3. 驗證授權合規
 * 4. 產生 JSON 報告
 *
 * 使用方式：
 *   node scripts/audit-dependencies.js
 *   node scripts/audit-dependencies.js --json
 *   node scripts/audit-dependencies.js --markdown
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 允許的授權清單 (ISO 27001 A.18.1.2 智慧財產權合規)
const ALLOWED_LICENSES = [
  'MIT',
  'Apache-2.0',
  'ISC',
  'BSD-2-Clause',
  'BSD-3-Clause',
  'CC0-1.0',
  '0BSD',
  'Unlicense',
  'UNLICENSED', // 專案本身
  'WTFPL',
  'MPL-2.0', // 需審核但可接受
  'CC-BY-4.0', // 常用於資料/文件，如 caniuse-lite
  'CC-BY-3.0',
];

// 需要審核的授權
const REVIEW_LICENSES = [
  'GPL-2.0',
  'GPL-3.0',
  'LGPL-2.1',
  'LGPL-3.0',
  'AGPL-3.0',
];

/**
 * 執行命令並返回結果
 */
function runCommand(cmd, options = {}) {
  try {
    const result = execSync(cmd, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
      ...options
    });
    return { success: true, output: result };
  } catch (error) {
    return {
      success: false,
      output: error.stdout || '',
      error: error.stderr || error.message
    };
  }
}

/**
 * 執行 npm audit 安全掃描
 */
function runSecurityAudit() {
  console.log('執行安全掃描...');
  const result = runCommand('npm audit --json');

  try {
    const auditData = JSON.parse(result.output || '{}');
    return {
      vulnerabilities: auditData.vulnerabilities || {},
      metadata: auditData.metadata || {},
      summary: {
        total: auditData.metadata?.vulnerabilities?.total || 0,
        critical: auditData.metadata?.vulnerabilities?.critical || 0,
        high: auditData.metadata?.vulnerabilities?.high || 0,
        moderate: auditData.metadata?.vulnerabilities?.moderate || 0,
        low: auditData.metadata?.vulnerabilities?.low || 0,
        info: auditData.metadata?.vulnerabilities?.info || 0,
      }
    };
  } catch (e) {
    return {
      vulnerabilities: {},
      metadata: {},
      summary: { total: 0, critical: 0, high: 0, moderate: 0, low: 0, info: 0 },
      error: e.message
    };
  }
}

/**
 * 檢查過期套件
 */
function checkOutdatedPackages() {
  console.log('檢查過期套件...');
  const result = runCommand('npm outdated --json');

  try {
    const outdated = JSON.parse(result.output || '{}');
    const packages = [];

    for (const [name, info] of Object.entries(outdated)) {
      packages.push({
        name,
        current: info.current,
        wanted: info.wanted,
        latest: info.latest,
        type: info.type,
        location: info.location,
        needsUpdate: info.current !== info.latest
      });
    }

    return {
      count: packages.length,
      packages
    };
  } catch (e) {
    return { count: 0, packages: [], error: e.message };
  }
}

/**
 * 讀取 package.json 並分析依賴
 */
function analyzeDependencies() {
  console.log('分析依賴清單...');
  const packageJsonPath = path.join(process.cwd(), 'package.json');

  if (!fs.existsSync(packageJsonPath)) {
    return { error: 'package.json not found' };
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const dependencies = packageJson.dependencies || {};
  const devDependencies = packageJson.devDependencies || {};

  return {
    production: {
      count: Object.keys(dependencies).length,
      packages: Object.entries(dependencies).map(([name, version]) => ({ name, version }))
    },
    development: {
      count: Object.keys(devDependencies).length,
      packages: Object.entries(devDependencies).map(([name, version]) => ({ name, version }))
    },
    total: Object.keys(dependencies).length + Object.keys(devDependencies).length
  };
}

/**
 * 檢查授權合規 (需要安裝 license-checker)
 */
function checkLicenseCompliance() {
  console.log('檢查授權合規...');

  // 先檢查 license-checker 是否可用 (note: --version exits with code 1 but outputs version)
  const checkResult = runCommand('npx license-checker --version');
  const versionOutput = checkResult.output || checkResult.error || '';
  if (!versionOutput.match(/\d+\.\d+\.\d+/)) {
    return {
      available: false,
      message: '請安裝 license-checker: npm install -D license-checker'
    };
  }

  const result = runCommand('npx license-checker --json --production');

  try {
    const licenses = JSON.parse(result.output || '{}');
    const compliant = [];
    const needsReview = [];
    const nonCompliant = [];

    for (const [pkg, info] of Object.entries(licenses)) {
      const license = info.licenses || 'Unknown';
      const licenseArray = Array.isArray(license) ? license : [license];

      const entry = {
        package: pkg,
        licenses: licenseArray,
        repository: info.repository,
        path: info.path
      };

      // 檢查是否有任何允許的授權
      const hasAllowed = licenseArray.some(l =>
        ALLOWED_LICENSES.some(allowed => l.includes(allowed))
      );
      const hasReview = licenseArray.some(l =>
        REVIEW_LICENSES.some(review => l.includes(review))
      );

      if (hasAllowed) {
        compliant.push(entry);
      } else if (hasReview) {
        needsReview.push(entry);
      } else {
        nonCompliant.push(entry);
      }
    }

    return {
      available: true,
      total: Object.keys(licenses).length,
      compliant: compliant.length,
      needsReview: needsReview.length,
      nonCompliant: nonCompliant.length,
      details: {
        compliant,
        needsReview,
        nonCompliant
      }
    };
  } catch (e) {
    return { available: true, error: e.message };
  }
}

/**
 * 產生完整審查報告
 */
function generateReport() {
  const timestamp = new Date().toISOString();
  const date = timestamp.split('T')[0];

  const report = {
    meta: {
      reportId: `AUDIT-${date.replace(/-/g, '')}-${Date.now().toString(36).toUpperCase()}`,
      generatedAt: timestamp,
      projectName: 'Free-CRM',
      nodeVersion: process.version,
      npmVersion: runCommand('npm --version').output.trim(),
    },
    dependencies: analyzeDependencies(),
    security: runSecurityAudit(),
    outdated: checkOutdatedPackages(),
    licenses: checkLicenseCompliance(),
    summary: {}
  };

  // 計算總體摘要
  report.summary = {
    totalPackages: report.dependencies.total,
    productionPackages: report.dependencies.production?.count || 0,
    developmentPackages: report.dependencies.development?.count || 0,
    vulnerabilities: report.security.summary,
    outdatedPackages: report.outdated.count,
    licenseCompliance: report.licenses.available
      ? `${report.licenses.compliant}/${report.licenses.total} compliant`
      : 'Not checked',
    overallStatus: getOverallStatus(report),
  };

  return report;
}

/**
 * 計算整體狀態
 */
function getOverallStatus(report) {
  const { security, licenses } = report;

  if (security.summary.critical > 0 || security.summary.high > 0) {
    return 'CRITICAL';
  }
  if (licenses.nonCompliant > 0) {
    return 'WARNING';
  }
  if (security.summary.moderate > 0 || licenses.needsReview > 0) {
    return 'REVIEW';
  }
  return 'PASS';
}

/**
 * 輸出 Markdown 格式報告
 */
function formatMarkdown(report) {
  const statusEmoji = {
    PASS: '✅',
    REVIEW: '⚠️',
    WARNING: '🟠',
    CRITICAL: '🔴'
  };

  let md = `# 第三方元件審查報告

## 文件資訊

| 項目 | 內容 |
|------|------|
| 報告編號 | ${report.meta.reportId} |
| 產生時間 | ${report.meta.generatedAt} |
| 專案名稱 | ${report.meta.projectName} |
| Node 版本 | ${report.meta.nodeVersion} |
| npm 版本 | ${report.meta.npmVersion} |

## 執行摘要

| 項目 | 數值 | 狀態 |
|------|------|------|
| 整體狀態 | ${report.summary.overallStatus} | ${statusEmoji[report.summary.overallStatus]} |
| 總套件數 | ${report.summary.totalPackages} | - |
| 生產依賴 | ${report.summary.productionPackages} | - |
| 開發依賴 | ${report.summary.developmentPackages} | - |
| 過期套件 | ${report.summary.outdatedPackages} | ${report.summary.outdatedPackages > 10 ? '⚠️' : '✅'} |

## 安全掃描結果

| 嚴重度 | 數量 |
|--------|------|
| Critical | ${report.security.summary.critical} |
| High | ${report.security.summary.high} |
| Moderate | ${report.security.summary.moderate} |
| Low | ${report.security.summary.low} |
| Info | ${report.security.summary.info} |

`;

  if (report.outdated.packages.length > 0) {
    md += `## 過期套件清單

| 套件名稱 | 目前版本 | 最新版本 | 類型 |
|----------|----------|----------|------|
`;
    for (const pkg of report.outdated.packages.slice(0, 20)) {
      md += `| ${pkg.name} | ${pkg.current} | ${pkg.latest} | ${pkg.type} |\n`;
    }
    if (report.outdated.packages.length > 20) {
      md += `\n... 還有 ${report.outdated.packages.length - 20} 個過期套件\n`;
    }
  }

  if (report.licenses.available && report.licenses.needsReview > 0) {
    md += `\n## 需審核的授權

| 套件 | 授權 |
|------|------|
`;
    for (const pkg of report.licenses.details.needsReview) {
      md += `| ${pkg.package} | ${pkg.licenses.join(', ')} |\n`;
    }
  }

  if (report.licenses.available && report.licenses.nonCompliant > 0) {
    md += `\n## 不合規授權 (需立即處理)

| 套件 | 授權 |
|------|------|
`;
    for (const pkg of report.licenses.details.nonCompliant) {
      md += `| ${pkg.package} | ${pkg.licenses.join(', ')} |\n`;
    }
  }

  md += `\n---
*此報告由 audit-dependencies.js 自動產生，符合 ISO 27001 A.12.6.1 技術弱點管理要求*
`;

  return md;
}

/**
 * 主程式
 */
function main() {
  const args = process.argv.slice(2);
  const outputJson = args.includes('--json');
  const outputMarkdown = args.includes('--markdown');

  console.log('='.repeat(60));
  console.log('Free-CRM 第三方元件審查');
  console.log('ISO 27001 A.12.6.1 合規掃描');
  console.log('='.repeat(60));
  console.log('');

  const report = generateReport();

  if (outputJson) {
    console.log(JSON.stringify(report, null, 2));
  } else if (outputMarkdown) {
    console.log(formatMarkdown(report));
  } else {
    // 預設：簡易摘要輸出
    console.log('');
    console.log('📊 審查結果摘要');
    console.log('-'.repeat(40));
    console.log(`報告編號: ${report.meta.reportId}`);
    console.log(`整體狀態: ${report.summary.overallStatus}`);
    console.log('');
    console.log('📦 依賴統計');
    console.log(`  總套件數: ${report.summary.totalPackages}`);
    console.log(`  生產依賴: ${report.summary.productionPackages}`);
    console.log(`  開發依賴: ${report.summary.developmentPackages}`);
    console.log('');
    console.log('🔒 安全掃描');
    console.log(`  Critical: ${report.security.summary.critical}`);
    console.log(`  High: ${report.security.summary.high}`);
    console.log(`  Moderate: ${report.security.summary.moderate}`);
    console.log(`  Low: ${report.security.summary.low}`);
    console.log('');
    console.log('📋 過期套件');
    console.log(`  數量: ${report.outdated.count}`);
    console.log('');
    console.log('📜 授權合規');
    if (report.licenses.available) {
      console.log(`  合規: ${report.licenses.compliant}`);
      console.log(`  需審核: ${report.licenses.needsReview}`);
      console.log(`  不合規: ${report.licenses.nonCompliant}`);
    } else {
      console.log(`  ${report.licenses.message}`);
    }
    console.log('');
    console.log('='.repeat(60));
    console.log('使用 --json 輸出完整 JSON 報告');
    console.log('使用 --markdown 輸出 Markdown 格式報告');
  }

  // 根據結果設定退出碼
  if (report.summary.overallStatus === 'CRITICAL') {
    process.exit(2);
  } else if (report.summary.overallStatus === 'WARNING') {
    process.exit(1);
  }
  process.exit(0);
}

main();
