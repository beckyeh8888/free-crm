# SonarCloud 自動化修復系統設定指南

## 概述

此系統整合 SonarCloud 程式碼品質分析、Notion 報告同步與 AI 自動修復功能，符合 ISO 27001 A.12.6.1 技術弱點管理要求。

## 系統架構

```
┌─────────────────────────────────────────────────────────────────┐
│                   SonarCloud 自動化修復流程                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Push to       SonarCloud      Fetch API      Notion Sync       │
│  GitHub    →   Analysis    →   (Issues)   →   (Report)         │
│                                    ↓                             │
│                              AI Auto-Fix                         │
│                                    ↓                             │
│                              Create PR                           │
│                              (Human Review)                      │
└─────────────────────────────────────────────────────────────────┘
```

## 必要設定

### 1. GitHub Secrets

在 GitHub Repository → Settings → Secrets and variables → Actions 新增以下 Secrets：

| Secret 名稱 | 說明 | 取得方式 |
|------------|------|----------|
| `SONAR_TOKEN` | SonarCloud API Token | SonarCloud → My Account → Security → Generate Token |
| `NOTION_API_KEY` | Notion Integration Token | Notion → Settings → Integrations → Create new integration |
| `NOTION_QUALITY_REPORT_PAGE_ID` | 程式碼品質報告頁面 ID | 從 Notion 頁面 URL 取得 |
| `ANTHROPIC_API_KEY` | Claude API Key (用於 AI 修復) | Anthropic Console → API Keys |

### 2. SonarCloud 設定

1. 前往 https://sonarcloud.io/ 並使用 GitHub 登入
2. 點擊 "+" → "Analyze new project" → 選擇 `free-crm` repository
3. 確認 Organization Key 為 `beckyeh8888`
4. 在 Security 頁面產生 Token 並加入 GitHub Secrets

### 3. Notion 設定

1. 前往 https://www.notion.so/my-integrations
2. 建立新的 Integration：
   - Name: `SonarCloud Reports`
   - Capabilities: Read content, Insert content, Update content
3. 複製 Integration Token 並加入 GitHub Secrets
4. 在 Notion 工作區：
   - 開啟 `02-合規文件` 頁面
   - 建立 `程式碼品質報告` 子頁面
   - 點擊右上角 ⋯ → Connections → 加入 Integration
   - 複製頁面 ID (URL 中 `notion.so/` 後的部分，去除 `-` 符號)

### 4. 頁面 ID 取得方式

從 Notion 頁面 URL：
```
https://www.notion.so/程式碼品質報告-abc123def456...
                                    ^^^^^^^^^^^^^^^^
                                    這部分就是 Page ID
```

## 本地執行

### 環境變數設定

建立 `.env.local` 檔案（已在 .gitignore 中）：

```bash
# SonarCloud
SONAR_TOKEN=your_sonar_token_here
SONAR_PROJECT_KEY=free-crm
SONAR_ORGANIZATION=beckyeh8888

# Notion
NOTION_API_KEY=your_notion_api_key_here
NOTION_PARENT_PAGE_ID=your_page_id_here
```

### 執行腳本

```bash
# 取得 SonarCloud 分析結果
npm run sonar:fetch

# 分類修復任務
npm run sonar:generate

# 同步到 Notion
npm run sonar:sync

# 執行完整流程
npm run sonar:all
```

## 輸出檔案

執行後會在 `sonar-results/` 目錄產生以下檔案：

| 檔案 | 說明 |
|------|------|
| `issues.json` | SonarCloud 完整分析結果 |
| `auto-fix-tasks.json` | 可自動修復的任務 |
| `security-review.json` | 需安全審查的問題 |
| `manual-review.json` | 需人工審查的問題 |
| `fix-prompt.md` | Claude 修復指令 |

## 修復分類規則

### AUTO_FIX (可自動修復)

低風險的 Code Smells，包括：
- `prefer-const` - 將 let 改為 const
- `no-unused-vars` - 移除未使用的變數
- `no-duplicate-imports` - 合併重複的 import
- 其他程式碼風格問題

### SECURITY_REVIEW (需安全審查)

涉及安全的問題，禁止自動修復：
- SQL Injection
- XSS
- Path Traversal
- Command Injection
- Authentication/Authorization
- Cryptography
- Secrets/Credentials

### MANUAL_REVIEW (需人工審查)

其他複雜問題，需要人工判斷：
- Bugs
- 高複雜度 Code Smells
- 非標準模式的問題

## GitHub Actions Workflow

### 觸發條件

1. **自動觸發**：當 `SonarCloud Analysis` workflow 完成後
2. **手動觸發**：workflow_dispatch

### 工作流程

1. `fetch-sonar-results` - 取得 SonarCloud 分析結果
2. `sync-to-notion` - 同步報告到 Notion
3. `ai-fix-generation` - AI 自動修復（如有可修復的問題）
4. `notify` - 產生執行摘要

### 手動觸發選項

- `skip_ai_fix`: 跳過 AI 自動修復
- `force_notion_sync`: 強制同步到 Notion（即使沒有問題）

## ISO 27001 合規對照

| 條款 | 要求 | 對應功能 |
|------|------|----------|
| A.12.6.1 | 技術弱點管理 | SonarCloud 自動掃描 |
| A.12.4.1 | 事件日誌記錄 | Notion 品質報告 |
| A.14.2.1 | 安全開發政策 | AI 修復 + 人工審核 |
| A.14.2.5 | 安全系統工程原則 | Quality Gate 品質門檻 |

## 故障排除

### SonarCloud API 錯誤

1. 確認 `SONAR_TOKEN` 正確且未過期
2. 確認專案已在 SonarCloud 中分析過
3. 確認 Organization Key 正確

### Notion 同步失敗

1. 確認 Integration 已加入目標頁面
2. 確認 Page ID 格式正確（無 `-` 符號）
3. 確認 API Key 有正確的權限

### AI 修復未執行

1. 確認有可自動修復的問題 (`auto_fix_count > 0`)
2. 確認 `ANTHROPIC_API_KEY` 已設定
3. 檢查 workflow 日誌中的錯誤訊息

## 聯絡資訊

如有問題，請聯繫專案負責人或在 GitHub Issues 回報。
