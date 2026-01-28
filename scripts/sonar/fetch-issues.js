#!/usr/bin/env node
/**
 * SonarCloud Issues Fetcher
 * ISO 27001 A.12.6.1 技術弱點管理
 *
 * 從 SonarCloud API 取得程式碼品質問題
 *
 * 使用方式:
 *   node scripts/sonar/fetch-issues.js
 *
 * 環境變數:
 *   SONAR_TOKEN - SonarCloud API Token
 *   SONAR_PROJECT_KEY - 專案 Key (預設: beckyeh8888_free-crm)
 *   SONAR_ORGANIZATION - 組織 ID (預設: beckyeh8888)
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// 設定
const CONFIG = {
  baseUrl: 'sonarcloud.io',
  projectKey: process.env.SONAR_PROJECT_KEY || 'beckyeh8888_free-crm',
  organization: process.env.SONAR_ORGANIZATION || 'beckyeh8888',
  token: process.env.SONAR_TOKEN,
  outputDir: path.join(__dirname, '../../sonar-results'),
};

/**
 * 發送 API 請求到 SonarCloud
 */
function apiRequest(endpoint, params = {}) {
  return new Promise((resolve, reject) => {
    const queryParams = new URLSearchParams({
      ...params,
      organization: CONFIG.organization,
    });

    const options = {
      hostname: CONFIG.baseUrl,
      path: `/api/${endpoint}?${queryParams}`,
      method: 'GET',
      headers: {
        'Authorization': `Basic ${Buffer.from(CONFIG.token + ':').toString('base64')}`,
        'Accept': 'application/json',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          if (res.statusCode >= 400) {
            reject(new Error(`API Error ${res.statusCode}: ${data}`));
          } else {
            resolve(JSON.parse(data));
          }
        } catch (e) {
          reject(new Error(`Parse Error: ${e.message}`));
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

/**
 * 取得所有 Issues (Bugs, Vulnerabilities, Code Smells)
 */
async function fetchIssues() {
  const issues = [];
  let page = 1;
  const pageSize = 100;

  console.log('📥 正在取得 Issues...');

  while (true) {
    const response = await apiRequest('issues/search', {
      componentKeys: CONFIG.projectKey,
      ps: pageSize,
      p: page,
      statuses: 'OPEN,CONFIRMED,REOPENED',
      resolved: 'false',
    });

    issues.push(...response.issues);
    console.log(`   第 ${page} 頁: ${response.issues.length} 筆`);

    if (page * pageSize >= response.total) break;
    page++;
  }

  return issues;
}

/**
 * 取得 Security Hotspots
 */
async function fetchHotspots() {
  const hotspots = [];
  let page = 1;
  const pageSize = 100;

  console.log('🔥 正在取得 Security Hotspots...');

  while (true) {
    const response = await apiRequest('hotspots/search', {
      projectKey: CONFIG.projectKey,
      ps: pageSize,
      p: page,
      status: 'TO_REVIEW',
    });

    hotspots.push(...(response.hotspots || []));
    console.log(`   第 ${page} 頁: ${(response.hotspots || []).length} 筆`);

    if (!response.paging || page * pageSize >= response.paging.total) break;
    page++;
  }

  return hotspots;
}

/**
 * 取得品質指標
 */
async function fetchMeasures() {
  console.log('📊 正在取得品質指標...');

  const response = await apiRequest('measures/component', {
    component: CONFIG.projectKey,
    metricKeys: [
      'coverage',
      'duplicated_lines_density',
      'bugs',
      'vulnerabilities',
      'code_smells',
      'security_hotspots',
      'sqale_rating',
      'reliability_rating',
      'security_rating',
      'ncloc',
    ].join(','),
  });

  const measures = {};
  for (const m of response.component.measures) {
    measures[m.metric] = m.value;
  }

  return measures;
}

/**
 * 分類 Issues
 */
function categorizeIssues(issues) {
  const categories = {
    bugs: [],
    vulnerabilities: [],
    codeSmells: [],
  };

  for (const issue of issues) {
    switch (issue.type) {
      case 'BUG':
        categories.bugs.push(issue);
        break;
      case 'VULNERABILITY':
        categories.vulnerabilities.push(issue);
        break;
      case 'CODE_SMELL':
        categories.codeSmells.push(issue);
        break;
    }
  }

  // 按嚴重度排序
  const severityOrder = { BLOCKER: 0, CRITICAL: 1, MAJOR: 2, MINOR: 3, INFO: 4 };
  for (const category of Object.values(categories)) {
    category.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
  }

  return categories;
}

/**
 * 判斷修復類型
 */
function classifyFixType(issue) {
  // 安全相關，需人工審查
  const securityRules = [
    'sql-injection', 'xss', 'path-traversal', 'command-injection',
    'auth', 'crypto', 'secrets', 'hardcoded',
  ];

  const ruleLower = (issue.rule || '').toLowerCase();

  if (issue.type === 'VULNERABILITY') {
    return 'SECURITY_REVIEW';
  }

  if (securityRules.some(r => ruleLower.includes(r))) {
    return 'SECURITY_REVIEW';
  }

  // 低風險 Code Smells 可自動修復
  const autoFixRules = [
    'cognitive-complexity', 'no-unused-vars', 'prefer-const',
    'no-duplicate-imports', 'no-empty', 'no-extra-semicolons',
    'prefer-template', 'object-shorthand', 'arrow-body-style',
  ];

  if (issue.type === 'CODE_SMELL' &&
      (issue.severity === 'MINOR' || issue.severity === 'INFO') &&
      autoFixRules.some(r => ruleLower.includes(r))) {
    return 'AUTO_FIX';
  }

  return 'MANUAL_REVIEW';
}

/**
 * 主程式
 */
async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('    SonarCloud Issues Fetcher');
  console.log('    ISO 27001 A.12.6.1 技術弱點管理');
  console.log('═══════════════════════════════════════════════════');
  console.log(`專案: ${CONFIG.projectKey}`);
  console.log(`組織: ${CONFIG.organization}`);
  console.log('');

  if (!CONFIG.token) {
    console.error('❌ 錯誤: 未設定 SONAR_TOKEN 環境變數');
    console.error('   請在 GitHub Secrets 或本地環境設定 SONAR_TOKEN');
    process.exit(1);
  }

  // 確保輸出目錄存在
  if (!fs.existsSync(CONFIG.outputDir)) {
    fs.mkdirSync(CONFIG.outputDir, { recursive: true });
  }

  try {
    // 取得資料
    const [issues, hotspots, measures] = await Promise.all([
      fetchIssues(),
      fetchHotspots(),
      fetchMeasures(),
    ]);

    // 分類 Issues
    const categorized = categorizeIssues(issues);

    // 加入修復類型分類
    const enrichedIssues = issues.map(issue => ({
      ...issue,
      fixType: classifyFixType(issue),
    }));

    const enrichedHotspots = hotspots.map(hotspot => ({
      ...hotspot,
      fixType: 'SECURITY_REVIEW', // Hotspots 都需要人工審查
    }));

    // 統計
    const summary = {
      fetchedAt: new Date().toISOString(),
      projectKey: CONFIG.projectKey,
      organization: CONFIG.organization,
      measures,
      counts: {
        total: issues.length + hotspots.length,
        bugs: categorized.bugs.length,
        vulnerabilities: categorized.vulnerabilities.length,
        codeSmells: categorized.codeSmells.length,
        securityHotspots: hotspots.length,
      },
      fixTypeCounts: {
        autoFix: enrichedIssues.filter(i => i.fixType === 'AUTO_FIX').length,
        securityReview: enrichedIssues.filter(i => i.fixType === 'SECURITY_REVIEW').length + hotspots.length,
        manualReview: enrichedIssues.filter(i => i.fixType === 'MANUAL_REVIEW').length,
      },
      severityCounts: {
        blocker: issues.filter(i => i.severity === 'BLOCKER').length,
        critical: issues.filter(i => i.severity === 'CRITICAL').length,
        major: issues.filter(i => i.severity === 'MAJOR').length,
        minor: issues.filter(i => i.severity === 'MINOR').length,
        info: issues.filter(i => i.severity === 'INFO').length,
      },
    };

    // 完整報告
    const report = {
      summary,
      issues: {
        bugs: categorized.bugs,
        vulnerabilities: categorized.vulnerabilities,
        codeSmells: categorized.codeSmells,
      },
      hotspots: enrichedHotspots,
      allIssues: enrichedIssues,
    };

    // 寫入檔案
    const outputPath = path.join(CONFIG.outputDir, 'issues.json');
    fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));

    // 輸出摘要
    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('    執行摘要');
    console.log('═══════════════════════════════════════════════════');
    console.log(`📁 輸出檔案: ${outputPath}`);
    console.log('');
    console.log('📊 品質指標:');
    console.log(`   程式碼行數: ${measures.ncloc || 'N/A'}`);
    console.log(`   覆蓋率: ${measures.coverage || 'N/A'}%`);
    console.log(`   重複率: ${measures.duplicated_lines_density || 'N/A'}%`);
    console.log('');
    console.log('🐛 問題統計:');
    console.log(`   Bugs: ${summary.counts.bugs}`);
    console.log(`   Vulnerabilities: ${summary.counts.vulnerabilities}`);
    console.log(`   Code Smells: ${summary.counts.codeSmells}`);
    console.log(`   Security Hotspots: ${summary.counts.securityHotspots}`);
    console.log('');
    console.log('🔧 修復分類:');
    console.log(`   可自動修復: ${summary.fixTypeCounts.autoFix}`);
    console.log(`   需安全審查: ${summary.fixTypeCounts.securityReview}`);
    console.log(`   需人工審查: ${summary.fixTypeCounts.manualReview}`);
    console.log('');
    console.log('✅ 完成!');

    // 輸出 GitHub Actions 格式
    if (process.env.GITHUB_OUTPUT) {
      const outputLines = [
        `total_issues=${summary.counts.total}`,
        `bugs=${summary.counts.bugs}`,
        `vulnerabilities=${summary.counts.vulnerabilities}`,
        `code_smells=${summary.counts.codeSmells}`,
        `hotspots=${summary.counts.securityHotspots}`,
        `auto_fix_count=${summary.fixTypeCounts.autoFix}`,
      ];
      fs.appendFileSync(process.env.GITHUB_OUTPUT, outputLines.join('\n') + '\n');
    }

  } catch (error) {
    console.error('❌ 錯誤:', error.message);
    process.exit(1);
  }
}

main();
