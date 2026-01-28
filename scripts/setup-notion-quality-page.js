#!/usr/bin/env node
/**
 * 建立 Notion 程式碼品質報告頁面
 *
 * 使用方式：
 *   設定環境變數 NOTION_API_KEY 後執行
 *   node scripts/setup-notion-quality-page.js
 */

const https = require('https');

const CONFIG = {
  apiKey: process.env.NOTION_API_KEY,
  parentPageId: '2f4fc190-4a3f-81bd-8b2e-deb3fe9fd302', // 02-合規文件
};

function notionRequest(endpoint, method, body) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.notion.com',
      path: `/v1/${endpoint}`,
      method,
      headers: {
        'Authorization': `Bearer ${CONFIG.apiKey}`,
        'Notion-Version': '2022-06-28',
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
            reject(new Error(`Notion API Error: ${parsed.message}`));
          } else {
            resolve(parsed);
          }
        } catch (e) {
          reject(new Error(`Parse Error: ${e.message}`));
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('    建立 Notion 程式碼品質報告頁面');
  console.log('═══════════════════════════════════════════════════');
  console.log('');

  if (!CONFIG.apiKey) {
    console.error('❌ 錯誤: 未設定 NOTION_API_KEY 環境變數');
    console.error('');
    console.error('請執行:');
    console.error('  $env:NOTION_API_KEY="your_api_key_here"  # PowerShell');
    console.error('  set NOTION_API_KEY=your_api_key_here     # CMD');
    process.exit(1);
  }

  try {
    console.log('📄 正在建立頁面...');

    const page = await notionRequest('pages', 'POST', {
      parent: { page_id: CONFIG.parentPageId },
      icon: { emoji: '📊' },
      properties: {
        title: {
          title: [{ text: { content: '程式碼品質報告' } }],
        },
      },
      children: [
        {
          object: 'block',
          type: 'heading_2',
          heading_2: {
            rich_text: [{ type: 'text', text: { content: '簡介' } }],
          },
        },
        {
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [{
              type: 'text',
              text: { content: '此頁面為 SonarCloud 程式碼品質分析報告的存放位置。每次執行 SonarCloud 分析後，系統會自動在此建立子頁面。' },
            }],
          },
        },
        {
          object: 'block',
          type: 'divider',
          divider: {},
        },
        {
          object: 'block',
          type: 'heading_2',
          heading_2: {
            rich_text: [{ type: 'text', text: { content: 'ISO 27001 合規對照' } }],
          },
        },
        {
          object: 'block',
          type: 'bulleted_list_item',
          bulleted_list_item: {
            rich_text: [{ type: 'text', text: { content: 'A.12.6.1 技術弱點管理 - SonarCloud 自動掃描' } }],
          },
        },
        {
          object: 'block',
          type: 'bulleted_list_item',
          bulleted_list_item: {
            rich_text: [{ type: 'text', text: { content: 'A.12.4.1 事件日誌記錄 - 品質報告記錄' } }],
          },
        },
        {
          object: 'block',
          type: 'bulleted_list_item',
          bulleted_list_item: {
            rich_text: [{ type: 'text', text: { content: 'A.14.2.1 安全開發政策 - AI 修復 + 人工審核' } }],
          },
        },
        {
          object: 'block',
          type: 'bulleted_list_item',
          bulleted_list_item: {
            rich_text: [{ type: 'text', text: { content: 'A.14.2.5 安全系統工程原則 - Quality Gate 品質門檻' } }],
          },
        },
        {
          object: 'block',
          type: 'divider',
          divider: {},
        },
        {
          object: 'block',
          type: 'heading_2',
          heading_2: {
            rich_text: [{ type: 'text', text: { content: '自動化流程' } }],
          },
        },
        {
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [{ type: 'text', text: { content: '當 SonarCloud 分析完成後，GitHub Actions 會自動：' } }],
          },
        },
        {
          object: 'block',
          type: 'numbered_list_item',
          numbered_list_item: {
            rich_text: [{ type: 'text', text: { content: '從 SonarCloud API 取得分析結果' } }],
          },
        },
        {
          object: 'block',
          type: 'numbered_list_item',
          numbered_list_item: {
            rich_text: [{ type: 'text', text: { content: '在此頁面下建立品質報告' } }],
          },
        },
        {
          object: 'block',
          type: 'numbered_list_item',
          numbered_list_item: {
            rich_text: [{ type: 'text', text: { content: 'AI 自動修復低風險問題' } }],
          },
        },
        {
          object: 'block',
          type: 'numbered_list_item',
          numbered_list_item: {
            rich_text: [{ type: 'text', text: { content: '建立 PR 等待人工審核' } }],
          },
        },
        {
          object: 'block',
          type: 'divider',
          divider: {},
        },
        {
          object: 'block',
          type: 'heading_2',
          heading_2: {
            rich_text: [{ type: 'text', text: { content: '品質報告清單' } }],
          },
        },
        {
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [{ type: 'text', text: { content: '以下為自動產生的品質報告（按時間排序）：' } }],
          },
        },
      ],
    });

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('    ✅ 頁面建立成功！');
    console.log('═══════════════════════════════════════════════════');
    console.log('');
    console.log(`📄 頁面 URL: ${page.url}`);
    console.log(`🔑 頁面 ID: ${page.id}`);
    console.log('');
    console.log('請將以下 ID 加入 GitHub Secrets:');
    console.log(`   NOTION_QUALITY_REPORT_PAGE_ID = ${page.id}`);
    console.log('');
    console.log('並更新 CLAUDE.md 中的 Page ID 對照表');

  } catch (error) {
    console.error('❌ 錯誤:', error.message);
    process.exit(1);
  }
}

main();
