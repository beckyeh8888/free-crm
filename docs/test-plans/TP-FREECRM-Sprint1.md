# Sprint 1 測試計畫

## 文件資訊
| 項目 | 內容 |
|------|------|
| 文件編號 | TP-FREECRM-Sprint1 |
| 版本 | v1.0 |
| 建立日期 | 2026-01-27 |
| Sprint | Sprint 1 |
| 測試期間 | 2026-01-20 ~ 2026-01-31 |
| 狀態 | 已完成 |

## 測試範圍

### 本 Sprint 功能範圍
| 功能 | User Story | 優先級 | 狀態 |
|------|-----------|--------|------|
| 用戶註冊 | US-001 | 高 | 已完成 |
| 用戶登入 | US-002 | 高 | 已完成 |
| 客戶管理 CRUD | US-003 | 高 | 已完成 |
| 聯絡人管理 CRUD | US-004 | 中 | 已完成 |
| 商機管理 CRUD | US-005 | 中 | 已完成 |
| 審計日誌 | US-006 | 高 | 已完成 |

### 測試類型
- [x] 單元測試 (Unit Tests)
- [x] 整合測試 (Integration Tests)
- [x] E2E 測試 (End-to-End Tests)
- [x] 無障礙測試 (Accessibility Tests)

## 測試案例清單

### 整合測試 - 認證 API

| ID | 測試項目 | 測試檔案 | 預期結果 | 實際結果 |
|----|---------|---------|---------|---------|
| IT-AUTH-001 | 有效資料註冊成功 | `tests/integration/api/auth/register.test.ts` | Pass | Pass |
| IT-AUTH-002 | 密碼正確 bcrypt 加密 | `tests/integration/api/auth/register.test.ts` | Pass | Pass |
| IT-AUTH-003 | 重複 email 回傳 409 | `tests/integration/api/auth/register.test.ts` | Pass | Pass |
| IT-AUTH-004 | 弱密碼驗證 | `tests/integration/api/auth/register.test.ts` | Pass | Pass |
| IT-AUTH-005 | 無效 email 格式驗證 | `tests/integration/api/auth/register.test.ts` | Pass | Pass |
| IT-AUTH-006 | 有效憑證登入成功 | `tests/integration/api/auth/login.test.ts` | Pass | Pass |
| IT-AUTH-007 | 錯誤密碼回傳錯誤 | `tests/integration/api/auth/login.test.ts` | Pass | Pass |

### 整合測試 - 客戶 API

| ID | 測試項目 | 測試檔案 | 預期結果 | 實際結果 |
|----|---------|---------|---------|---------|
| IT-CUST-001 | 未認證回傳 401 | `tests/integration/api/customers/customers-crud.test.ts` | Pass | Pass |
| IT-CUST-002 | 列出客戶（只回傳自己的） | `tests/integration/api/customers/customers-crud.test.ts` | Pass | Pass |
| IT-CUST-003 | 建立客戶成功 | `tests/integration/api/customers/customers-crud.test.ts` | Pass | Pass |
| IT-CUST-004 | 無效資料驗證 | `tests/integration/api/customers/customers-crud.test.ts` | Pass | Pass |
| IT-CUST-005 | 取得單一客戶詳情 | `tests/integration/api/customers/customers-crud.test.ts` | Pass | Pass |
| IT-CUST-006 | 更新客戶成功 | `tests/integration/api/customers/customers-crud.test.ts` | Pass | Pass |
| IT-CUST-007 | 刪除客戶成功 | `tests/integration/api/customers/customers-crud.test.ts` | Pass | Pass |
| IT-CUST-008 | 級聯刪除聯絡人和商機 | `tests/integration/api/customers/customers-crud.test.ts` | Pass | Pass |

### 整合測試 - 聯絡人 API

| ID | 測試項目 | 測試檔案 | 預期結果 | 實際結果 |
|----|---------|---------|---------|---------|
| IT-CONT-001 | 列出客戶聯絡人 | `tests/integration/api/contacts/contacts-crud.test.ts` | Pass | Pass |
| IT-CONT-002 | 建立聯絡人成功 | `tests/integration/api/contacts/contacts-crud.test.ts` | Pass | Pass |
| IT-CONT-003 | 設定主聯絡人 | `tests/integration/api/contacts/contacts-crud.test.ts` | Pass | Pass |
| IT-CONT-004 | 更新聯絡人 | `tests/integration/api/contacts/contacts-crud.test.ts` | Pass | Pass |
| IT-CONT-005 | 刪除聯絡人 | `tests/integration/api/contacts/contacts-crud.test.ts` | Pass | Pass |

### 整合測試 - 商機 API

| ID | 測試項目 | 測試檔案 | 預期結果 | 實際結果 |
|----|---------|---------|---------|---------|
| IT-DEAL-001 | 列出用戶商機 | `tests/integration/api/deals/deals-crud.test.ts` | Pass | Pass |
| IT-DEAL-002 | 建立商機成功 | `tests/integration/api/deals/deals-crud.test.ts` | Pass | Pass |
| IT-DEAL-003 | 取得商機詳情 | `tests/integration/api/deals/deals-crud.test.ts` | Pass | Pass |
| IT-DEAL-004 | 更新商機 | `tests/integration/api/deals/deals-crud.test.ts` | Pass | Pass |
| IT-DEAL-005 | 刪除商機 | `tests/integration/api/deals/deals-crud.test.ts` | Pass | Pass |
| IT-DEAL-006 | 按階段篩選 | `tests/integration/api/deals/deals-crud.test.ts` | Pass | Pass |

### 整合測試 - 資料庫

| ID | 測試項目 | 測試檔案 | 預期結果 | 實際結果 |
|----|---------|---------|---------|---------|
| IT-DB-001 | Customer 刪除級聯 Contacts | `tests/integration/db/cascade-delete.test.ts` | Pass | Pass |
| IT-DB-002 | Customer 刪除級聯 Deals | `tests/integration/db/cascade-delete.test.ts` | Pass | Pass |
| IT-DB-003 | User 刪除級聯 Customers | `tests/integration/db/cascade-delete.test.ts` | Pass | Pass |
| IT-DB-004 | Create 操作審計日誌 | `tests/integration/db/audit-log.test.ts` | Pass | Pass |
| IT-DB-005 | Update 操作審計日誌 | `tests/integration/db/audit-log.test.ts` | Pass | Pass |
| IT-DB-006 | Delete 操作審計日誌 | `tests/integration/db/audit-log.test.ts` | Pass | Pass |

### E2E 測試

| ID | 測試項目 | 測試檔案 | 預期結果 | 實際結果 |
|----|---------|---------|---------|---------|
| E2E-001 | 完整註冊到儀表板流程 | `tests/e2e/customer-journey.spec.ts` | Pass | 待 UI |
| E2E-002 | 建立第一個客戶 | `tests/e2e/customer-journey.spec.ts` | Pass | 待 UI |
| E2E-003 | 商機階段轉換 | `tests/e2e/deal-pipeline.spec.ts` | Pass | 待 UI |
| E2E-004 | 新增聯絡人 | `tests/e2e/contact-management.spec.ts` | Pass | 待 UI |

### 無障礙測試

| ID | 測試項目 | 測試檔案 | 預期結果 | 實際結果 |
|----|---------|---------|---------|---------|
| A11Y-001 | 表單標籤正確關聯 | `tests/accessibility/forms.test.tsx` | Pass | Pass |
| A11Y-002 | 錯誤訊息 aria-describedby | `tests/accessibility/forms.test.tsx` | Pass | Pass |
| A11Y-003 | 必填欄位 aria-required | `tests/accessibility/forms.test.tsx` | Pass | Pass |
| A11Y-004 | Skip link 存在 | `tests/accessibility/navigation.test.tsx` | Pass | Pass |
| A11Y-005 | 鍵盤導航支援 | `tests/accessibility/navigation.test.tsx` | Pass | Pass |
| A11Y-006 | ARIA landmarks 存在 | `tests/accessibility/navigation.test.tsx` | Pass | Pass |
| A11Y-007 | 標題階層正確 | `tests/accessibility/navigation.test.tsx` | Pass | Pass |

## 測試環境
| 項目 | 規格 |
|------|------|
| Node.js | v20.x |
| 測試框架 | Vitest 4.0.18 |
| E2E 框架 | Playwright 1.58.0 |
| 資料庫 | SQLite (test.db) |
| 瀏覽器 | Chromium, Firefox, WebKit |

## 測試資源

### 測試輔助工具
- `tests/helpers/test-db.ts` - 資料庫清理
- `tests/helpers/auth-helpers.ts` - 認證輔助
- `tests/helpers/request-helpers.ts` - 請求輔助

### 測試資料工廠
- `tests/factories/user.factory.ts`
- `tests/factories/customer.factory.ts`
- `tests/factories/contact.factory.ts`
- `tests/factories/deal.factory.ts`

## 風險與緩解措施
| 風險 | 緩解措施 | 狀態 |
|------|---------|------|
| SQLite 並行鎖定 | fileParallelism: false | 已解決 |
| 測試資料庫遷移 | prisma db push | 已解決 |
| E2E 測試待 UI | 先建立測試架構 | 進行中 |

## 驗收標準
- [x] 所有整合測試通過
- [x] 所有無障礙測試通過
- [ ] 程式碼覆蓋率 ≥ 80%（待執行）
- [x] 無 Critical/High 等級缺陷
- [x] 無障礙測試通過 WCAG 2.2 AAA 模式檢查

## 測試結果摘要

| 指標 | 數值 |
|------|------|
| 總測試數 | 146 |
| 通過數 | 146 |
| 失敗數 | 0 |
| 通過率 | 100% |

## 相關文件
- 測試執行紀錄: `docs/test-records/TR-FREECRM-20260127-001.md`
- 計畫檔案: `C:\Users\beck8\.claude\plans\tidy-singing-muffin.md`

## 稽核合規
此測試計畫符合：
- **ISO 27001 A.14.2.8** - 系統安全測試
- **ISO 29110 SI.5** - 軟體整合與測試
- **ISO 29110 PM.4** - 軟體配置管理
