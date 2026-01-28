# SonarCloud 自動化腳本

此目錄包含 SonarCloud 程式碼品質自動化相關腳本。

## 腳本說明

### fetch-issues.js

從 SonarCloud API 取得程式碼品質問題。

**功能：**
- 取得 Bugs, Vulnerabilities, Code Smells
- 取得 Security Hotspots
- 取得品質指標 (覆蓋率、重複率、評級)
- 自動分類修復類型

**環境變數：**
```
SONAR_TOKEN=your_sonar_token
SONAR_PROJECT_KEY=free-crm
SONAR_ORGANIZATION=beckyeh8888
```

**執行：**
```bash
npm run sonar:fetch
```

### generate-fixes.js

分析問題並產生修復任務。

**功能：**
- 分類問題 (AUTO_FIX / SECURITY_REVIEW / MANUAL_REVIEW)
- 產生 Claude 修復指令
- 按檔案分組問題

**執行：**
```bash
npm run sonar:generate
```

### sync-to-notion.js

將分析報告同步到 Notion。

**功能：**
- 建立品質報告頁面
- 格式化問題清單
- 記錄品質指標

**環境變數：**
```
NOTION_API_KEY=your_notion_api_key
NOTION_PARENT_PAGE_ID=your_page_id
```

**執行：**
```bash
npm run sonar:sync
```

## 完整流程

```bash
# 執行完整流程
npm run sonar:all
```

## 輸出檔案

所有輸出檔案位於 `sonar-results/` 目錄（已加入 .gitignore）：

| 檔案 | 說明 |
|------|------|
| `issues.json` | 完整分析結果 |
| `auto-fix-tasks.json` | 可自動修復的任務 |
| `security-review.json` | 需安全審查的問題 |
| `manual-review.json` | 需人工審查的問題 |
| `fix-prompt.md` | Claude 修復指令 |

## ISO 27001 合規

此自動化流程符合以下 ISO 27001 條款：

- **A.12.6.1** - 技術弱點管理
- **A.12.4.1** - 事件日誌記錄
- **A.14.2.1** - 安全開發政策
- **A.14.2.5** - 安全系統工程原則
