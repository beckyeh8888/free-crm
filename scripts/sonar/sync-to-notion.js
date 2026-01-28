#!/usr/bin/env node
/**
 * SonarCloud to Notion Sync
 * ISO 27001 A.12.4.1 事件日誌記錄
 *
 * 將 SonarCloud 分析結果同步到 Notion
 *
 * 使用方式:
 *   node scripts/sonar/sync-to-notion.js
 *
 * 環境變數:
 *   NOTION_API_KEY - Notion Integration Token
 *   NOTION_PARENT_PAGE_ID - 父頁面 ID (程式碼品質報告頁面)
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// 設定
const CONFIG = {
  notionApiVersion: '2022-06-28',
  apiKey: process.env.NOTION_API_KEY,
  parentPageId: process.env.NOTION_PARENT_PAGE_ID,
  issuesFile: path.join(__dirname, '../../sonar-results/issues.json'),
};

/**
 * 發送 API 請求到 Notion
 */
function notionRequest(endpoint, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.notion.com',
      path: `/v1/${endpoint}`,
      method,
      headers: {
        'Authorization': `Bearer ${CONFIG.apiKey}`,
        'Notion-Version': CONFIG.notionApiVersion,
        'Content-Type': 'application/json',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode >= 400) {
            reject(new Error(`Notion API Error ${res.statusCode}: ${parsed.message || data}`));
          } else {
            resolve(parsed);
          }
        } catch (e) {
          reject(new Error(`Parse Error: ${e.message}`));
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

/**
 * 評級轉換
 */
function ratingToEmoji(rating) {
  const ratings = {
    '1.0': '🅰️ A',
    '2.0': '🅱️ B',
    '3.0': '🇨 C',
    '4.0': '🇩 D',
    '5.0': '🇪 E',
  };
  return ratings[rating] || rating || 'N/A';
}

/**
 * 嚴重度轉換
 */
function severityToEmoji(severity) {
  const emojis = {
    BLOCKER: '🔴',
    CRITICAL: '🟠',
    MAJOR: '🟡',
    MINOR: '🔵',
    INFO: '⚪',
  };
  return emojis[severity] || '⚪';
}

/**
 * 建立報告標題
 */
function generateReportTitle() {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '');
  return `SonarCloud 品質報告 ${dateStr} ${timeStr.substring(0, 4)}`;
}

/**
 * 建立 Notion 頁面內容區塊
 */
function buildNotionBlocks(report) {
  const { summary, issues, hotspots } = report;
  const blocks = [];

  // 文件資訊表格
  blocks.push({
    object: 'block',
    type: 'heading_2',
    heading_2: {
      rich_text: [{ type: 'text', text: { content: '文件資訊' } }],
    },
  });

  blocks.push({
    object: 'block',
    type: 'table',
    table: {
      table_width: 2,
      has_column_header: false,
      has_row_header: true,
      children: [
        {
          type: 'table_row',
          table_row: {
            cells: [
              [{ type: 'text', text: { content: '報告編號' } }],
              [{ type: 'text', text: { content: `SQ-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-001` } }],
            ],
          },
        },
        {
          type: 'table_row',
          table_row: {
            cells: [
              [{ type: 'text', text: { content: '分析時間' } }],
              [{ type: 'text', text: { content: summary.fetchedAt } }],
            ],
          },
        },
        {
          type: 'table_row',
          table_row: {
            cells: [
              [{ type: 'text', text: { content: '專案' } }],
              [{ type: 'text', text: { content: summary.projectKey } }],
            ],
          },
        },
        {
          type: 'table_row',
          table_row: {
            cells: [
              [{ type: 'text', text: { content: '組織' } }],
              [{ type: 'text', text: { content: summary.organization } }],
            ],
          },
        },
      ],
    },
  });

  // 分隔線
  blocks.push({ object: 'block', type: 'divider', divider: {} });

  // 執行摘要
  blocks.push({
    object: 'block',
    type: 'heading_2',
    heading_2: {
      rich_text: [{ type: 'text', text: { content: '執行摘要' } }],
    },
  });

  // 問題統計表格
  blocks.push({
    object: 'block',
    type: 'table',
    table: {
      table_width: 3,
      has_column_header: true,
      has_row_header: false,
      children: [
        {
          type: 'table_row',
          table_row: {
            cells: [
              [{ type: 'text', text: { content: '類型' } }],
              [{ type: 'text', text: { content: '數量' } }],
              [{ type: 'text', text: { content: '狀態' } }],
            ],
          },
        },
        {
          type: 'table_row',
          table_row: {
            cells: [
              [{ type: 'text', text: { content: '🐛 Bugs' } }],
              [{ type: 'text', text: { content: String(summary.counts.bugs) } }],
              [{ type: 'text', text: { content: summary.counts.bugs === 0 ? '✅' : '⚠️' } }],
            ],
          },
        },
        {
          type: 'table_row',
          table_row: {
            cells: [
              [{ type: 'text', text: { content: '🔓 Vulnerabilities' } }],
              [{ type: 'text', text: { content: String(summary.counts.vulnerabilities) } }],
              [{ type: 'text', text: { content: summary.counts.vulnerabilities === 0 ? '✅' : '❌' } }],
            ],
          },
        },
        {
          type: 'table_row',
          table_row: {
            cells: [
              [{ type: 'text', text: { content: '🧹 Code Smells' } }],
              [{ type: 'text', text: { content: String(summary.counts.codeSmells) } }],
              [{ type: 'text', text: { content: summary.counts.codeSmells < 10 ? '✅' : '⚠️' } }],
            ],
          },
        },
        {
          type: 'table_row',
          table_row: {
            cells: [
              [{ type: 'text', text: { content: '🔥 Security Hotspots' } }],
              [{ type: 'text', text: { content: String(summary.counts.securityHotspots) } }],
              [{ type: 'text', text: { content: summary.counts.securityHotspots === 0 ? '✅' : '⚠️' } }],
            ],
          },
        },
      ],
    },
  });

  // 分隔線
  blocks.push({ object: 'block', type: 'divider', divider: {} });

  // 品質指標
  blocks.push({
    object: 'block',
    type: 'heading_2',
    heading_2: {
      rich_text: [{ type: 'text', text: { content: '品質指標' } }],
    },
  });

  const measures = summary.measures || {};
  blocks.push({
    object: 'block',
    type: 'table',
    table: {
      table_width: 3,
      has_column_header: true,
      has_row_header: false,
      children: [
        {
          type: 'table_row',
          table_row: {
            cells: [
              [{ type: 'text', text: { content: '指標' } }],
              [{ type: 'text', text: { content: '數值' } }],
              [{ type: 'text', text: { content: '目標' } }],
            ],
          },
        },
        {
          type: 'table_row',
          table_row: {
            cells: [
              [{ type: 'text', text: { content: '📊 覆蓋率' } }],
              [{ type: 'text', text: { content: `${measures.coverage || 'N/A'}%` } }],
              [{ type: 'text', text: { content: '≥ 80%' } }],
            ],
          },
        },
        {
          type: 'table_row',
          table_row: {
            cells: [
              [{ type: 'text', text: { content: '📋 重複率' } }],
              [{ type: 'text', text: { content: `${measures.duplicated_lines_density || 'N/A'}%` } }],
              [{ type: 'text', text: { content: '≤ 3%' } }],
            ],
          },
        },
        {
          type: 'table_row',
          table_row: {
            cells: [
              [{ type: 'text', text: { content: '🛡️ 可靠性' } }],
              [{ type: 'text', text: { content: ratingToEmoji(measures.reliability_rating) } }],
              [{ type: 'text', text: { content: 'A' } }],
            ],
          },
        },
        {
          type: 'table_row',
          table_row: {
            cells: [
              [{ type: 'text', text: { content: '🔒 安全性' } }],
              [{ type: 'text', text: { content: ratingToEmoji(measures.security_rating) } }],
              [{ type: 'text', text: { content: 'A' } }],
            ],
          },
        },
        {
          type: 'table_row',
          table_row: {
            cells: [
              [{ type: 'text', text: { content: '🔧 可維護性' } }],
              [{ type: 'text', text: { content: ratingToEmoji(measures.sqale_rating) } }],
              [{ type: 'text', text: { content: 'A' } }],
            ],
          },
        },
      ],
    },
  });

  // 分隔線
  blocks.push({ object: 'block', type: 'divider', divider: {} });

  // 修復分類
  blocks.push({
    object: 'block',
    type: 'heading_2',
    heading_2: {
      rich_text: [{ type: 'text', text: { content: '修復分類' } }],
    },
  });

  blocks.push({
    object: 'block',
    type: 'table',
    table: {
      table_width: 3,
      has_column_header: true,
      has_row_header: false,
      children: [
        {
          type: 'table_row',
          table_row: {
            cells: [
              [{ type: 'text', text: { content: '分類' } }],
              [{ type: 'text', text: { content: '數量' } }],
              [{ type: 'text', text: { content: '處理方式' } }],
            ],
          },
        },
        {
          type: 'table_row',
          table_row: {
            cells: [
              [{ type: 'text', text: { content: '🤖 AUTO_FIX' } }],
              [{ type: 'text', text: { content: String(summary.fixTypeCounts.autoFix) } }],
              [{ type: 'text', text: { content: 'AI 自動修復 → PR' } }],
            ],
          },
        },
        {
          type: 'table_row',
          table_row: {
            cells: [
              [{ type: 'text', text: { content: '🔐 SECURITY_REVIEW' } }],
              [{ type: 'text', text: { content: String(summary.fixTypeCounts.securityReview) } }],
              [{ type: 'text', text: { content: '需人工安全審查' } }],
            ],
          },
        },
        {
          type: 'table_row',
          table_row: {
            cells: [
              [{ type: 'text', text: { content: '👁️ MANUAL_REVIEW' } }],
              [{ type: 'text', text: { content: String(summary.fixTypeCounts.manualReview) } }],
              [{ type: 'text', text: { content: '需人工審查處理' } }],
            ],
          },
        },
      ],
    },
  });

  // 分隔線
  blocks.push({ object: 'block', type: 'divider', divider: {} });

  // Top 10 Bugs
  if (issues.bugs && issues.bugs.length > 0) {
    blocks.push({
      object: 'block',
      type: 'heading_2',
      heading_2: {
        rich_text: [{ type: 'text', text: { content: '🐛 Bugs (Top 10)' } }],
      },
    });

    const topBugs = issues.bugs.slice(0, 10);
    for (const bug of topBugs) {
      blocks.push({
        object: 'block',
        type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: [
            { type: 'text', text: { content: `${severityToEmoji(bug.severity)} ` } },
            { type: 'text', text: { content: bug.message, }, annotations: { bold: true } },
            { type: 'text', text: { content: `\n📁 ${bug.component}:${bug.line || '?'}` } },
          ],
        },
      });
    }
  }

  // Top 10 Code Smells
  if (issues.codeSmells && issues.codeSmells.length > 0) {
    blocks.push({
      object: 'block',
      type: 'heading_2',
      heading_2: {
        rich_text: [{ type: 'text', text: { content: '🧹 Code Smells (Top 10)' } }],
      },
    });

    const topSmells = issues.codeSmells.slice(0, 10);
    for (const smell of topSmells) {
      blocks.push({
        object: 'block',
        type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: [
            { type: 'text', text: { content: `${severityToEmoji(smell.severity)} ` } },
            { type: 'text', text: { content: smell.message, }, annotations: { bold: true } },
            { type: 'text', text: { content: `\n📁 ${smell.component}:${smell.line || '?'}` } },
          ],
        },
      });
    }
  }

  // Security Hotspots
  if (hotspots && hotspots.length > 0) {
    blocks.push({
      object: 'block',
      type: 'heading_2',
      heading_2: {
        rich_text: [{ type: 'text', text: { content: '🔥 Security Hotspots (需審查)' } }],
      },
    });

    for (const hotspot of hotspots.slice(0, 10)) {
      blocks.push({
        object: 'block',
        type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: [
            { type: 'text', text: { content: '⚠️ ' } },
            { type: 'text', text: { content: hotspot.message || hotspot.securityCategory, }, annotations: { bold: true } },
            { type: 'text', text: { content: `\n📁 ${hotspot.component}:${hotspot.line || '?'}` } },
          ],
        },
      });
    }
  }

  // 分隔線
  blocks.push({ object: 'block', type: 'divider', divider: {} });

  // 相關連結
  blocks.push({
    object: 'block',
    type: 'heading_2',
    heading_2: {
      rich_text: [{ type: 'text', text: { content: '相關連結' } }],
    },
  });

  blocks.push({
    object: 'block',
    type: 'bulleted_list_item',
    bulleted_list_item: {
      rich_text: [
        { type: 'text', text: { content: 'SonarCloud 報告: ' } },
        {
          type: 'text',
          text: {
            content: '查看完整報告',
            link: { url: `https://sonarcloud.io/project/overview?id=${summary.projectKey}` },
          },
        },
      ],
    },
  });

  // 合規說明
  blocks.push({ object: 'block', type: 'divider', divider: {} });
  blocks.push({
    object: 'block',
    type: 'callout',
    callout: {
      rich_text: [
        { type: 'text', text: { content: '此報告符合 ISO 27001 A.12.6.1 技術弱點管理要求' } },
      ],
      icon: { emoji: '📋' },
      color: 'blue_background',
    },
  });

  return blocks;
}

/**
 * 建立 Notion 頁面
 */
async function createNotionPage(report) {
  const title = generateReportTitle();
  const blocks = buildNotionBlocks(report);

  // Notion API 限制每次最多 100 個 blocks
  const chunkedBlocks = [];
  for (let i = 0; i < blocks.length; i += 100) {
    chunkedBlocks.push(blocks.slice(i, i + 100));
  }

  // 建立頁面（包含第一批 blocks）
  const pageData = {
    parent: { page_id: CONFIG.parentPageId },
    properties: {
      title: {
        title: [{ type: 'text', text: { content: title } }],
      },
    },
    children: chunkedBlocks[0] || [],
  };

  console.log('📄 正在建立 Notion 頁面...');
  const page = await notionRequest('pages', 'POST', pageData);

  // 如果有更多 blocks，追加到頁面
  for (let i = 1; i < chunkedBlocks.length; i++) {
    console.log(`   追加區塊 ${i + 1}/${chunkedBlocks.length}...`);
    await notionRequest(`blocks/${page.id}/children`, 'PATCH', {
      children: chunkedBlocks[i],
    });
  }

  return page;
}

/**
 * 主程式
 */
async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('    SonarCloud to Notion Sync');
  console.log('    ISO 27001 A.12.4.1 事件日誌記錄');
  console.log('═══════════════════════════════════════════════════');
  console.log('');

  // 檢查環境變數
  if (!CONFIG.apiKey) {
    console.error('❌ 錯誤: 未設定 NOTION_API_KEY 環境變數');
    process.exit(1);
  }

  if (!CONFIG.parentPageId) {
    console.error('❌ 錯誤: 未設定 NOTION_PARENT_PAGE_ID 環境變數');
    console.error('   請設定程式碼品質報告頁面的 ID');
    process.exit(1);
  }

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

    // 建立 Notion 頁面
    const page = await createNotionPage(report);

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('    同步完成');
    console.log('═══════════════════════════════════════════════════');
    console.log(`📄 頁面已建立: ${page.url}`);
    console.log('');
    console.log('✅ 完成!');

    // 輸出 GitHub Actions 格式
    if (process.env.GITHUB_OUTPUT) {
      fs.appendFileSync(process.env.GITHUB_OUTPUT, `notion_page_url=${page.url}\n`);
      fs.appendFileSync(process.env.GITHUB_OUTPUT, `notion_page_id=${page.id}\n`);
    }

  } catch (error) {
    console.error('❌ 錯誤:', error.message);
    process.exit(1);
  }
}

main();
