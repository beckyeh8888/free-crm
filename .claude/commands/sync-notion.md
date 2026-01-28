# /sync-notion

**自動同步變更紀錄到 Notion**

此 skill 在以下情況下**必須執行**：
1. 每次 git commit 後
2. 每次測試執行後
3. 每次程式碼品質修復後
4. 對話結束前

## 使用方式

```
/sync-notion [類型]
```

## 類型參數

| 類型 | 說明 | Notion 頁面 |
|------|------|-------------|
| `dev` | 開發變更紀錄 | 開發紀錄 |
| `test` | 測試執行紀錄 | 測試紀錄 |
| `quality` | 程式碼品質報告 | 程式碼品質報告 |
| `meeting` | Claude 對話紀錄 | 會議紀錄 |
| `audit` | 元件審查紀錄 | 第三方元件清單 |
| `all` | 全部同步 | - |

## Notion 頁面 ID 對照表

| 文件類型 | Page ID | 說明 |
|----------|---------|------|
| 開發紀錄 | `2f4fc190-4a3f-8125-b675-da557a0dcd25` | CHG-* 變更紀錄 |
| 測試計畫 | `2f4fc190-4a3f-810d-a5bc-eb7a18f5f6b2` | TP-* 測試計畫 |
| 測試紀錄 | `2f4fc190-4a3f-81b5-bb9b-c175b69f309b` | TR-* 測試執行 |
| 會議紀錄 | `2f4fc190-4a3f-819a-b228-ded3a56389ee` | MTG-* 對話紀錄 |
| 程式碼品質報告 | `[待建立]` | CQ-* 品質報告 |
| 02-合規文件 | `2f4fc190-4a3f-81bd-8b2e-deb3fe9fd302` | 合規文件根目錄 |

## 強制執行規則

### Git Commit 後必須執行

```
git commit → /sync-notion dev
```

建立變更紀錄：
- 流水號：CHG-[類型]-[YYYYMMDD]-[NNN]
- 包含：commit hash、變更檔案、變更說明

### 測試執行後必須執行

```
npm run test:* → /sync-notion test
```

建立測試紀錄：
- 流水號：TR-[專案代號]-[YYYYMMDD]-[NNN]
- 包含：測試結果、覆蓋率、失敗分析

### 程式碼品質修復後必須執行

```
SonarCloud 修復 → /sync-notion quality
```

建立品質報告：
- 流水號：CQ-[YYYYMMDD]-[NNN]
- 包含：修復摘要、修復詳情、經驗教訓

### 對話結束前必須執行

```
對話即將結束 → /sync-notion meeting
```

建立對話紀錄：
- 流水號：MTG-[專案代號]-[YYYYMMDD]-[NNN]
- 包含：對話摘要、決議事項、程式碼變更

## 執行流程

### Step 1: 收集資訊

根據類型收集對應資訊：

| 類型 | 資訊來源 |
|------|----------|
| dev | `git log --oneline -10`、`git diff HEAD~1 --stat` |
| test | 測試輸出、覆蓋率報告 |
| quality | SonarCloud 分析結果、修復紀錄 |
| meeting | 對話歷史摘要 |
| audit | `npm audit`、`npm outdated` |

### Step 2: 產生流水號

1. 讀取 Notion 對應頁面
2. 查詢當日已有的流水號
3. 計算下一個序號
4. 格式：`[前綴]-[日期]-[序號]`

### Step 3: 格式化內容

產生 Markdown 格式的紀錄內容，包含：
- 文件資訊表格（編號、日期、執行者、狀態）
- 執行摘要
- 詳細內容
- 關聯資訊

### Step 4: 呼叫 Notion API

使用 curl 呼叫 Notion API 新增區塊：

```bash
curl -X PATCH "https://api.notion.com/v1/blocks/{page_id}/children" \
  -H "Authorization: Bearer $NOTION_API_KEY" \
  -H "Content-Type: application/json; charset=utf-8" \
  -H "Notion-Version: 2022-06-28" \
  -d @content.json
```

### Step 5: 確認並回報

- 確認 API 回應成功
- 回報建立的流水號
- 如失敗，記錄錯誤並重試

## 紀錄範本

### 開發變更紀錄 (CHG-*)

```markdown
### CHG-DEV-20260128-001
| 項目 | 內容 |
|------|------|
| 日期 | 2026-01-28 22:00 |
| 類型 | [修復] |
| commit | abc1234 |

**變更檔案：**
- `src/components/ui/Button.tsx` - 新增 readonly
- `src/app/api/customers/route.ts` - 移除類型斷言

**變更說明：**
修復 SonarCloud Code Smells，加強型別安全
```

### 測試執行紀錄 (TR-*)

```markdown
### TR-FREECRM-20260128-001
| 項目 | 內容 |
|------|------|
| 執行日期 | 2026-01-28 21:00 |
| 測試類型 | 整合測試 |
| 結果 | ✅ 通過 |

| 指標 | 數值 |
|------|------|
| 總測試數 | 114 |
| 通過數 | 114 |
| 覆蓋率 | 85% |
```

### 程式碼品質報告 (CQ-*)

```markdown
### CQ-20260128-001
| 項目 | 內容 |
|------|------|
| 修復日期 | 2026-01-28 |
| 初始問題 | 217 Code Smells |
| 已修復 | 217 |

**修復摘要：**
- S6759 React Props readonly (31)
- S4325 不必要類型斷言 (109)
- S1874 棄用 API (20)
```

### 對話紀錄 (MTG-*)

```markdown
### MTG-FREECRM-20260128-001
| 項目 | 內容 |
|------|------|
| 日期 | 2026-01-28 20:00 ~ 22:00 |
| 主題 | SonarCloud Code Smells 修復 |

**對話摘要：**
修復 217 個 SonarCloud Code Smells，更新 CLAUDE.md 編碼規範

**決議事項：**
- [x] 修復所有 Code Smells
- [x] 更新 CLAUDE.md 加入編碼規範
- [x] 同步到 Notion
```

## 本地備份

同步到 Notion 時，也會在本地 `docs/` 目錄建立備份：

| 類型 | 本地路徑 |
|------|----------|
| dev | `docs/records/dev/YYYY-MM-DD-*.md` |
| test | `docs/records/test/YYYY-MM-DD-*.md` |
| quality | `docs/compliance/code-quality/YYYY-MM-DD-*.md` |
| meeting | `docs/records/meeting/YYYY-MM-DD-*.md` |
| audit | `docs/compliance/audit-logs/YYYY-MM-DD-*.md` |

## 錯誤處理

| 錯誤 | 處理方式 |
|------|----------|
| Notion API 失敗 | 重試 3 次，間隔 5 秒 |
| 網路錯誤 | 本地備份 + 標記待同步 |
| 權限錯誤 | 檢查 NOTION_API_KEY |

## ISO 27001 合規

此 skill 符合以下 ISO 27001 條款：

| 條款 | 要求 | 對應功能 |
|------|------|----------|
| A.12.1.2 | 變更管理 | 開發變更紀錄 |
| A.12.4.1 | 事件日誌 | 所有紀錄類型 |
| A.14.2.1 | 安全開發政策 | 程式碼品質報告 |

## 注意事項

1. **必須執行**：此 skill 不是可選的，是強制要求
2. **即時同步**：每次變更後立即執行，不要累積
3. **UTF-8 編碼**：確保中文內容正確傳輸
4. **本地備份**：同步失敗時確保本地有備份

## 範例

```
# commit 後同步
git commit -m "feat: 新增客戶搜尋"
/sync-notion dev

# 測試後同步
npm run test:integration
/sync-notion test

# 品質修復後同步
# (完成 SonarCloud 修復)
/sync-notion quality

# 對話結束前
/sync-notion meeting
```
