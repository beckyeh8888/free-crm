# /update-docs

更新 Free CRM 專案的 Notion 文件。

## 使用方式

```
/update-docs [類型] [描述]
```

## 類型參數

| 類型 | 說明 | Notion 頁面 |
|------|------|-------------|
| `dev` | 新增開發變更紀錄 | 開發紀錄 (2f4fc190-4a3f-8125-b675-da557a0dcd25) |
| `api` | 更新 API 文件 | API 文件 (2f4fc190-4a3f-812f-9ff2-e94af1ec2aff) |
| `ui` | 更新前端元件文件 | 前端元件文件 (2f4fc190-4a3f-81a8-bdcf-e4df3eb70ead) |
| `db` | 更新資料庫文件 | 資料庫文件 (2f4fc190-4a3f-8109-a2c3-c18145a48aa4) |
| `all` | 全部更新 | 以上全部 |

## 變更類型標籤

每次更新必須使用以下標籤：
- `[新增]` - 新功能、新元件、新 API
- `[修改]` - 功能調整、重構、樣式變更
- `[刪除]` - 移除功能、棄用 API
- `[修復]` - Bug 修復
- `[安全]` - 安全性修補

## 流水號規則

### 格式

```
CHG-[類型]-[日期]-[序號]
```

| 欄位 | 格式 | 說明 |
|------|------|------|
| CHG | 固定 | Change 變更紀錄前綴 |
| 類型 | 3字母 | DEV/API/UI/DB/SEC |
| 日期 | YYYYMMDD | 變更日期 |
| 序號 | 3位數 | 當日該類型的流水號 |

### 類型代碼對照

| 類型參數 | 流水號代碼 | 說明 |
|----------|------------|------|
| `dev` | DEV | 一般開發變更 |
| `api` | API | API 端點變更 |
| `ui` | UI | 前端元件變更 |
| `db` | DB | 資料庫 Schema 變更 |
| - | SEC | 安全性修補（特殊） |

### 流水號產生邏輯

1. 讀取 Notion 開發紀錄頁面
2. 搜尋當日該類型已有的流水號
3. 計算下一個序號（+1）
4. 若當日無紀錄，從 001 開始

## 執行流程

1. 讀取 `git log --oneline -10` 取得最新變更
2. 分析變更的檔案類型（API、UI、DB、其他）
3. 讀取 Notion 開發紀錄，查詢當日已有的流水號
4. 產生新的流水號 `CHG-[類型]-[今日日期]-[下一序號]`
5. 使用 curl 呼叫 Notion API 新增變更紀錄
6. 確認寫入成功，回報流水號

## 紀錄格式

每筆變更紀錄必須包含：

| 欄位 | 格式 | 說明 |
|------|------|------|
| 流水號 | CHG-XXX-YYYYMMDD-NNN | 唯一識別碼 |
| 日期 | YYYY-MM-DD HH:mm | 變更時間 |
| 類型 | [新增/修改/刪除/修復/安全] | 變更類型標籤 |
| 檔案 | 完整路徑 | 影響的檔案 |
| commit | 短 hash | Git commit ID |
| 說明 | 文字 | 變更內容描述 |

### 範例

```markdown
### CHG-API-20260126-001
- **日期**: 2026-01-26 10:30
- **類型**: [新增]
- **檔案**: `src/app/api/customers/search/route.ts`
- **commit**: `abc1234`
- **說明**: 新增客戶搜尋 API，支援模糊查詢

### CHG-UI-20260126-001
- **日期**: 2026-01-26 14:15
- **類型**: [修改]
- **檔案**: `src/components/layout/Sidebar.tsx`
- **commit**: `def5678`
- **說明**: 調整收合狀態的過渡動畫

### CHG-SEC-20260126-001
- **日期**: 2026-01-26 16:00
- **類型**: [安全]
- **檔案**: `src/middleware.ts`
- **commit**: `ghi9012`
- **說明**: 修補 CSRF Token 驗證漏洞
```

## Notion API 資訊

使用 curl 直接呼叫 Notion API（因 MCP 有授權問題）：

```bash
# API Key 從環境變數取得
# 請在 .env.local 設定 NOTION_API_KEY

# 新增區塊到頁面
curl -X PATCH "https://api.notion.com/v1/blocks/{page_id}/children" \
  -H "Authorization: Bearer $NOTION_API_KEY" \
  -H "Content-Type: application/json; charset=utf-8" \
  -H "Notion-Version: 2022-06-28" \
  -d @update-content.json
```

## 專案頁面 ID 清單

| 文件 | Page ID |
|------|---------|
| Free CRM 專案 | `2f4fc190-4a3f-8140-affc-d49f21807ce0` |
| 專案計畫書 | `2f4fc190-4a3f-81fc-a032-db82c3d30b5f` |
| 需求規格書 | `2f4fc190-4a3f-8139-a04c-cbbacd71da0b` |
| 開發紀錄 | `2f4fc190-4a3f-8125-b675-da557a0dcd25` |
| API 文件 | `2f4fc190-4a3f-812f-9ff2-e94af1ec2aff` |
| 前端元件文件 | `2f4fc190-4a3f-81a8-bdcf-e4df3eb70ead` |
| 資料庫文件 | `2f4fc190-4a3f-8109-a2c3-c18145a48aa4` |
| 風險評估報告 | `2f4fc190-4a3f-818d-a955-cd0af49d3743` |
| PIA 報告 | `2f4fc190-4a3f-8142-ac76-debfc29a3ab4` |
| AIIA 報告 | `2f4fc190-4a3f-81b5-8f39-d88acd5ae992` |

## 注意事項

1. 每次程式碼變更後須執行此 skill 更新文件
2. 文件更新紀錄可供稽核使用（ISO 27001 合規）
3. 確保使用 UTF-8 編碼處理中文內容
4. 使用 JSON 檔案傳遞 API 請求體以避免編碼問題
