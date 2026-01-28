#!/usr/bin/env node
/**
 * SonarCloud Fix Generator
 * ISO 27001 A.14.2.1 安全開發政策
 *
 * 分析 SonarCloud 問題，產生適合 AI 修復的格式
 *
 * 使用方式:
 *   node scripts/sonar/generate-fixes.js
 *
 * 輸出:
 *   sonar-results/auto-fix-tasks.json - AI 可自動修復的任務
 *   sonar-results/security-review.json - 需安全審查的問題
 *   sonar-results/manual-review.json - 需人工審查的問題
 */

const fs = require('fs');
const path = require('path');

// 設定
const CONFIG = {
  issuesFile: path.join(__dirname, '../../sonar-results/issues.json'),
  outputDir: path.join(__dirname, '../../sonar-results'),
};

/**
 * 安全規則 - 禁止自動修復的規則模式
 */
const SECURITY_RULES = [
  // SQL Injection
  'sql-injection', 'sqli', 'parameterized',
  // XSS
  'xss', 'cross-site-scripting', 'sanitize', 'escape',
  // Path Traversal
  'path-traversal', 'directory-traversal', 'path-injection',
  // Command Injection
  'command-injection', 'os-command', 'exec', 'spawn',
  // Authentication
  'auth', 'authentication', 'password', 'credential', 'session',
  // Cryptography
  'crypto', 'encryption', 'decrypt', 'hash', 'random',
  // Secrets
  'secret', 'hardcoded', 'api-key', 'token', 'private-key',
  // SSRF
  'ssrf', 'server-side-request',
  // Deserialization
  'deserialization', 'deserialize', 'pickle',
  // CSRF
  'csrf', 'cross-site-request',
];

/**
 * 可自動修復的規則 (低風險 Code Smells)
 */
const AUTO_FIX_RULES = [
  // Code Style
  'prefer-const', 'no-var', 'const-vs-let',
  'no-unused-vars', 'unused-import', 'unused-variable',
  'no-duplicate-imports', 'duplicate-import',
  'no-extra-semicolons', 'extra-semicolon',
  'prefer-template', 'template-literal',
  'object-shorthand', 'shorthand-property',
  'arrow-body-style', 'implicit-return',
  'no-empty', 'empty-block',
  // TypeScript specific
  'no-inferrable-types', 'inferrable-type',
  'explicit-function-return-type', 'return-type',
  'prefer-optional-chain', 'optional-chaining',
  'prefer-nullish-coalescing', 'nullish-coalescing',
  // Formatting
  'indent', 'indentation',
  'quotes', 'quote-style',
  'comma-dangle', 'trailing-comma',
  'eol-last', 'newline-at-end',
  'max-len', 'line-length',
];

/**
 * 判斷規則是否匹配關鍵字清單
 */
function matchesRule(rule, keywords) {
  const ruleLower = (rule || '').toLowerCase();
  return keywords.some(keyword => ruleLower.includes(keyword));
}

/**
 * 按檔案分組問題
 */
function groupByFile(issues) {
  const grouped = {};

  for (const issue of issues) {
    const file = issue.component || 'unknown';
    if (!grouped[file]) {
      grouped[file] = [];
    }
    grouped[file].push(issue);
  }

  return grouped;
}

/**
 * 產生修復提示
 */
function generateFixPrompt(issue) {
  const severityHint = {
    BLOCKER: '這是阻斷性問題，必須立即修復',
    CRITICAL: '這是嚴重問題，優先修復',
    MAJOR: '這是主要問題，應該修復',
    MINOR: '這是次要問題，建議修復',
    INFO: '這是提示性問題，可選擇修復',
  };

  const typeHint = {
    BUG: '這是一個 Bug，可能導致程式錯誤或非預期行為',
    VULNERABILITY: '這是安全漏洞，需要安全專家審查',
    CODE_SMELL: '這是程式碼異味，影響可維護性和可讀性',
  };

  return {
    key: issue.key,
    type: issue.type,
    severity: issue.severity,
    rule: issue.rule,
    message: issue.message,
    component: issue.component,
    line: issue.line,
    textRange: issue.textRange,
    fixType: issue.fixType,
    hints: {
      severity: severityHint[issue.severity] || '',
      type: typeHint[issue.type] || '',
    },
    suggestedApproach: getSuggestedApproach(issue),
  };
}

/**
 * 取得建議修復方法
 */
function getSuggestedApproach(issue) {
  const rule = (issue.rule || '').toLowerCase();

  // 常見問題的修復建議
  const approaches = {
    'prefer-const': '將 let 改為 const（變數沒有重新賦值）',
    'no-unused-vars': '移除未使用的變數，或加入 _ 前綴表示有意忽略',
    'no-duplicate-imports': '合併來自同一模組的 import 語句',
    'cognitive-complexity': '重構函數，抽取子函數以降低認知複雜度',
    'no-empty': '移除空的程式碼區塊，或加入註解說明為何為空',
    'prefer-template': '使用樣板字串 (``) 代替字串串接 (+)',
    'object-shorthand': '使用物件屬性簡寫語法',
    'arrow-body-style': '使用箭頭函數的隱式返回',
    'no-console': '移除 console 語句，或使用適當的 logger',
    'eqeqeq': '使用嚴格相等 (===) 代替鬆散相等 (==)',
    'no-magic-numbers': '將魔術數字抽取為命名常數',
  };

  for (const [pattern, approach] of Object.entries(approaches)) {
    if (rule.includes(pattern)) {
      return approach;
    }
  }

  return '分析程式碼上下文，根據規則描述進行修復';
}

/**
 * 分類並準備修復任務
 */
function categorizeAndPrepare(report) {
  const autoFix = [];
  const securityReview = [];
  const manualReview = [];

  const allIssues = report.allIssues || [];
  const hotspots = report.hotspots || [];

  // 分類 Issues
  for (const issue of allIssues) {
    const rule = issue.rule || '';

    // 檢查是否為安全相關
    if (issue.type === 'VULNERABILITY' || matchesRule(rule, SECURITY_RULES)) {
      securityReview.push(generateFixPrompt({
        ...issue,
        fixType: 'SECURITY_REVIEW',
      }));
      continue;
    }

    // 檢查是否可自動修復
    if (
      issue.type === 'CODE_SMELL' &&
      (issue.severity === 'MINOR' || issue.severity === 'INFO') &&
      matchesRule(rule, AUTO_FIX_RULES)
    ) {
      autoFix.push(generateFixPrompt({
        ...issue,
        fixType: 'AUTO_FIX',
      }));
      continue;
    }

    // 其他需要人工審查
    manualReview.push(generateFixPrompt({
      ...issue,
      fixType: 'MANUAL_REVIEW',
    }));
  }

  // Security Hotspots 都需要安全審查
  for (const hotspot of hotspots) {
    securityReview.push({
      key: hotspot.key,
      type: 'SECURITY_HOTSPOT',
      severity: hotspot.vulnerabilityProbability || 'MEDIUM',
      rule: hotspot.securityCategory,
      message: hotspot.message,
      component: hotspot.component,
      line: hotspot.line,
      fixType: 'SECURITY_REVIEW',
      hints: {
        severity: '這是安全熱點，需要人工審查是否為真正的安全問題',
        type: '安全熱點需要驗證是否存在實際的安全風險',
      },
      suggestedApproach: '檢查程式碼上下文，判斷是否存在安全風險，如有則修復',
    });
  }

  return { autoFix, securityReview, manualReview };
}

/**
 * 產生 Claude Code 修復指令
 */
function generateClaudePrompt(tasks) {
  if (tasks.length === 0) {
    return null;
  }

  const fileGroups = groupByFile(tasks);
  const files = Object.keys(fileGroups);

  let prompt = `# SonarCloud 問題自動修復

以下是需要修復的程式碼品質問題，請逐一修復：

## 待修復檔案 (${files.length} 個)

`;

  for (const [file, issues] of Object.entries(fileGroups)) {
    prompt += `### ${file}\n\n`;

    for (const issue of issues) {
      prompt += `**[${issue.severity}] ${issue.message}**\n`;
      prompt += `- 行號: ${issue.line || 'N/A'}\n`;
      prompt += `- 規則: ${issue.rule}\n`;
      prompt += `- 建議: ${issue.suggestedApproach}\n\n`;
    }
  }

  prompt += `
## 修復原則

1. 只修復上述列出的問題，不要進行其他重構
2. 保持程式碼風格一致
3. 確保修復不會破壞現有功能
4. 如果不確定如何修復，跳過該問題

## 修復完成後

1. 執行 \`npm run lint\` 確認無錯誤
2. 執行 \`npm run test\` 確認測試通過
`;

  return prompt;
}

/**
 * 主程式
 */
async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('    SonarCloud Fix Generator');
  console.log('    ISO 27001 A.14.2.1 安全開發政策');
  console.log('═══════════════════════════════════════════════════');
  console.log('');

  // 檢查 issues.json 是否存在
  if (!fs.existsSync(CONFIG.issuesFile)) {
    console.error('❌ 錯誤: 找不到 sonar-results/issues.json');
    console.error('   請先執行 fetch-issues.js');
    process.exit(1);
  }

  try {
    // 讀取分析結果
    console.log('📥 讀取 SonarCloud 分析結果...');
    const report = JSON.parse(fs.readFileSync(CONFIG.issuesFile, 'utf8'));

    // 分類並準備修復任務
    console.log('🔧 分類修復任務...');
    const { autoFix, securityReview, manualReview } = categorizeAndPrepare(report);

    // 產生 Claude 修復指令
    const claudePrompt = generateClaudePrompt(autoFix);

    // 寫入檔案
    const outputFiles = {
      'auto-fix-tasks.json': {
        count: autoFix.length,
        tasks: autoFix,
        groupedByFile: groupByFile(autoFix),
        claudePrompt,
      },
      'security-review.json': {
        count: securityReview.length,
        tasks: securityReview,
        groupedByFile: groupByFile(securityReview),
      },
      'manual-review.json': {
        count: manualReview.length,
        tasks: manualReview,
        groupedByFile: groupByFile(manualReview),
      },
    };

    for (const [filename, data] of Object.entries(outputFiles)) {
      const outputPath = path.join(CONFIG.outputDir, filename);
      fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
      console.log(`   📁 ${filename}: ${data.count} 筆`);
    }

    // 如果有 Claude prompt，也輸出為 markdown
    if (claudePrompt) {
      const promptPath = path.join(CONFIG.outputDir, 'fix-prompt.md');
      fs.writeFileSync(promptPath, claudePrompt);
      console.log(`   📝 fix-prompt.md: Claude 修復指令`);
    }

    // 輸出摘要
    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('    分類摘要');
    console.log('═══════════════════════════════════════════════════');
    console.log(`🤖 可自動修復 (AUTO_FIX): ${autoFix.length} 筆`);
    console.log(`🔐 需安全審查 (SECURITY_REVIEW): ${securityReview.length} 筆`);
    console.log(`👁️ 需人工審查 (MANUAL_REVIEW): ${manualReview.length} 筆`);
    console.log('');

    if (autoFix.length > 0) {
      console.log('📋 可自動修復的問題按檔案分組:');
      const fileGroups = groupByFile(autoFix);
      for (const [file, issues] of Object.entries(fileGroups)) {
        console.log(`   ${file}: ${issues.length} 筆`);
      }
    }

    console.log('');
    console.log('✅ 完成!');

    // 輸出 GitHub Actions 格式
    if (process.env.GITHUB_OUTPUT) {
      fs.appendFileSync(process.env.GITHUB_OUTPUT, `auto_fix_count=${autoFix.length}\n`);
      fs.appendFileSync(process.env.GITHUB_OUTPUT, `security_review_count=${securityReview.length}\n`);
      fs.appendFileSync(process.env.GITHUB_OUTPUT, `manual_review_count=${manualReview.length}\n`);
      fs.appendFileSync(process.env.GITHUB_OUTPUT, `has_auto_fix_tasks=${autoFix.length > 0}\n`);
    }

  } catch (error) {
    console.error('❌ 錯誤:', error.message);
    process.exit(1);
  }
}

main();
