#!/usr/bin/env node

/**
 * Notion 自動同步腳本
 *
 * 用法: node scripts/sync-to-notion.js [類型] [內容檔案路徑]
 *
 * 類型:
 *   - dev: 開發變更紀錄
 *   - test: 測試執行紀錄
 *   - quality: 程式碼品質報告
 *   - meeting: 對話紀錄
 *   - audit: 元件審查紀錄
 *
 * ISO 27001 合規: A.12.1.2, A.12.4.1
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Notion Page IDs
const NOTION_PAGES = {
  dev: '2f4fc190-4a3f-8125-b675-da557a0dcd25',      // 開發紀錄
  test: '2f4fc190-4a3f-81b5-bb9b-c175b69f309b',     // 測試紀錄
  meeting: '2f4fc190-4a3f-819a-b228-ded3a56389ee',  // 會議紀錄
  compliance: '2f4fc190-4a3f-81bd-8b2e-deb3fe9fd302', // 02-合規文件
};

// 流水號前綴
const PREFIXES = {
  dev: 'CHG-DEV',
  test: 'TR-FREECRM',
  quality: 'CQ',
  meeting: 'MTG-FREECRM',
  audit: 'AUDIT',
};

// 取得今日日期字串
function getDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

// 取得格式化日期時間
function getFormattedDateTime() {
  const now = new Date();
  return now.toISOString().replace('T', ' ').slice(0, 16);
}

// 產生流水號
function generateSerialNumber(type, existingNumbers = []) {
  const prefix = PREFIXES[type] || 'REC';
  const dateStr = getDateString();

  // 找出當日該類型的最大序號
  const todayNumbers = existingNumbers.filter(n =>
    n.startsWith(`${prefix}-${dateStr}`)
  );

  let nextSeq = 1;
  if (todayNumbers.length > 0) {
    const seqs = todayNumbers.map(n => {
      const parts = n.split('-');
      return parseInt(parts[parts.length - 1], 10);
    });
    nextSeq = Math.max(...seqs) + 1;
  }

  return `${prefix}-${dateStr}-${String(nextSeq).padStart(3, '0')}`;
}

// 將 Markdown 轉換為 Notion 區塊格式
function markdownToNotionBlocks(markdown) {
  const lines = markdown.split('\n');
  const blocks = [];

  for (const line of lines) {
    if (!line.trim()) continue;

    // Heading 3 (###)
    if (line.startsWith('### ')) {
      blocks.push({
        type: 'heading_3',
        heading_3: {
          rich_text: [{ type: 'text', text: { content: line.slice(4) } }]
        }
      });
    }
    // Heading 2 (##)
    else if (line.startsWith('## ')) {
      blocks.push({
        type: 'heading_2',
        heading_2: {
          rich_text: [{ type: 'text', text: { content: line.slice(3) } }]
        }
      });
    }
    // Bullet list (-)
    else if (line.startsWith('- ')) {
      blocks.push({
        type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: [{ type: 'text', text: { content: line.slice(2) } }]
        }
      });
    }
    // Table row (|)
    else if (line.startsWith('|') && !line.includes('---')) {
      // 簡化處理：轉為普通文字
      blocks.push({
        type: 'paragraph',
        paragraph: {
          rich_text: [{ type: 'text', text: { content: line } }]
        }
      });
    }
    // Code block (```)
    else if (line.startsWith('```')) {
      // Skip code fence markers
      continue;
    }
    // Regular paragraph
    else {
      blocks.push({
        type: 'paragraph',
        paragraph: {
          rich_text: [{ type: 'text', text: { content: line } }]
        }
      });
    }
  }

  return blocks;
}

// 將區塊分成多批（Notion API 限制每次 100 個區塊）
function chunkBlocks(blocks, chunkSize = 100) {
  const chunks = [];
  for (let i = 0; i < blocks.length; i += chunkSize) {
    chunks.push(blocks.slice(i, i + chunkSize));
  }
  return chunks;
}

// 呼叫 Notion API（單次請求）
async function appendBlocksToPage(pageId, blocks, token) {
  const data = JSON.stringify({ children: blocks });

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.notion.com',
      port: 443,
      path: `/v1/blocks/${pageId}/children`,
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json; charset=utf-8',
        'Notion-Version': '2022-06-28',
        'Content-Length': Buffer.byteLength(data),
      },
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(body));
        } else {
          reject(new Error(`Notion API 錯誤 ${res.statusCode}: ${body}`));
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// 呼叫 Notion API（支援分批上傳）
async function appendToNotionPage(pageId, blocks) {
  const token = process.env.NOTION_API_KEY || process.env.NOTION_TOKEN;

  if (!token) {
    throw new Error('NOTION_API_KEY 或 NOTION_TOKEN 環境變數未設定');
  }

  // 分批處理（每批最多 100 個區塊）
  const chunks = chunkBlocks(blocks, 100);
  console.log(`總共 ${blocks.length} 個區塊，分 ${chunks.length} 批上傳`);

  for (let i = 0; i < chunks.length; i++) {
    console.log(`上傳第 ${i + 1}/${chunks.length} 批...`);
    await appendBlocksToPage(pageId, chunks[i], token);

    // 避免 rate limit，每批之間稍微延遲
    if (i < chunks.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
}

// 建立本地備份
function createLocalBackup(type, serialNumber, content) {
  const dateStr = getDateString();
  const dateDash = `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;

  const backupDirs = {
    dev: 'docs/records/dev',
    test: 'docs/records/test',
    quality: 'docs/compliance/code-quality',
    meeting: 'docs/records/meeting',
    audit: 'docs/compliance/audit-logs',
  };

  const dir = backupDirs[type] || 'docs/records/other';
  const fullDir = path.join(process.cwd(), dir);

  // 確保目錄存在
  fs.mkdirSync(fullDir, { recursive: true });

  const filename = `${dateDash}-${serialNumber}.md`;
  const filepath = path.join(fullDir, filename);

  fs.writeFileSync(filepath, content, 'utf8');
  console.log(`本地備份: ${filepath}`);

  return filepath;
}

// 主函數
async function main() {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.log('用法: node sync-to-notion.js [類型] [內容檔案路徑]');
    console.log('類型: dev, test, quality, meeting, audit');
    process.exit(1);
  }

  const type = args[0];
  const contentFile = args[1];

  // 驗證類型
  if (!PREFIXES[type]) {
    console.error(`錯誤: 未知的類型 "${type}"`);
    console.log('可用類型: dev, test, quality, meeting, audit');
    process.exit(1);
  }

  // 讀取內容
  let content;
  if (contentFile && fs.existsSync(contentFile)) {
    content = fs.readFileSync(contentFile, 'utf8');
  } else if (contentFile) {
    // 內容直接作為參數傳入
    content = args.slice(1).join(' ');
  } else {
    // 從 stdin 讀取
    content = fs.readFileSync(0, 'utf8');
  }

  // 產生流水號
  const serialNumber = generateSerialNumber(type);
  console.log(`流水號: ${serialNumber}`);

  // 加上標題
  const fullContent = `### ${serialNumber}\n\n${content}`;

  // 建立本地備份
  const backupPath = createLocalBackup(type, serialNumber, fullContent);

  // 轉換為 Notion 區塊
  const blocks = markdownToNotionBlocks(fullContent);

  // 取得目標頁面 ID
  let pageId = NOTION_PAGES[type];
  if (!pageId) {
    // quality 和 audit 使用 compliance 頁面
    pageId = NOTION_PAGES.compliance;
  }

  // 同步到 Notion
  try {
    await appendToNotionPage(pageId, blocks);
    console.log(`✅ 已同步到 Notion (${type})`);
  } catch (error) {
    console.error(`❌ Notion 同步失敗: ${error.message}`);
    console.log(`📁 本地備份已建立: ${backupPath}`);
    process.exit(1);
  }

  console.log('---');
  console.log(`流水號: ${serialNumber}`);
  console.log(`本地備份: ${backupPath}`);
}

// 執行
main().catch(error => {
  console.error('錯誤:', error.message);
  process.exit(1);
});
