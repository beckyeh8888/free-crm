# Free CRM 專案計畫書 v2.0 — "Calm CRM"

## 文件資訊

| 項目 | 內容 |
|------|------|
| 文件編號 | DOC-PLN-2026-001-v2.0 |
| 版本 | v2.0 |
| 建立日期 | 2026-01-26 |
| 更新日期 | 2026-01-29 |
| 專案代號 | PRJ-2026-001 |
| 狀態 | 審核中 |

---

## 1. 專案概述

### 1.1 專案名稱

Free CRM — 智慧客戶關係管理系統（代號：Calm CRM）

### 1.2 專案背景

開發一套具備 AI 文件分析功能的 CRM 系統，協助小型團隊（1-10 人）有效管理 B2B 及 B2C 客戶關係。

### 1.3 專案願景

打造一個**與 Salesforce/HubSpot 完全不同**的 CRM：

- **深色優先** — 使用者每天操作 8 小時，深色主題減少視覺疲勞
- **鍵盤優先** — CMD+K 命令面板為主導航，滑鼠為輔
- **極簡資訊** — 每視圖 5-7 項，hover/點擊漸進揭露其餘
- **Pipeline 為主角** — Dashboard 不是統計圖表，是 Pipeline + 活動流

### 1.4 設計參考

| 參考 | 取什麼 |
|------|--------|
| **Linear** | 深色主題、鍵盤快捷鍵、極速互動、Kanban |
| **Apple iCloud** | 極簡留白、漸進揭露、大字排版 |

### 1.5 目標用戶

- 小型團隊（1-10 人）
- B2B 及 B2C 銷售團隊
- 需要 ISO 合規的企業

---

## 2. 適用標準

| 標準 | 說明 | 觸發條件 |
|------|------|----------|
| ISO 29110 | 小型組織軟體開發生命週期 | 預設適用 |
| ISO 27001 | 資訊安全管理系統 | 預設適用 |
| ISO 27701 | 隱私資訊管理 | 處理客戶個資 |
| ISO 42001 | AI 管理系統 | AI 文件分析功能 |
| WCAG 2.2 AAA | 無障礙標準 | 預設適用 |
| CWE Top 25 | 常見安全弱點 | 預設適用 |
| OWASP Top 10 | Web 應用安全風險 | 預設適用 |

---

## 3. 功能範圍（完整版）

### 3.1 功能模組總覽

| # | 模組 | 優先級 | 狀態 | 說明 |
|---|------|--------|------|------|
| 1 | 認證系統 | P0 | ✅ 完成 | 登入/註冊/2FA/RBAC |
| 2 | Dashboard | P0 | 🔄 重寫 | Pipeline Hero + 活動流 |
| 3 | 客戶管理 | P0 | 🔄 前端 | 列表 + Detail Panel + CRUD |
| 4 | 聯絡人管理 | P0 | 🔄 前端 | 嵌入客戶 Detail Panel |
| 5 | 商機管理 | P0 | 🔄 前端 | Kanban + List + CRUD |
| 6 | 文件管理 | P1 | 🔄 前端 | 上傳 + AI 分析 + 預覽 |
| 7 | Settings | P1 | ⏳ 待開發 | 組織設定 + 個人偏好 |
| 8 | Admin 管理 | P1 | ⏳ 待開發 | 用戶/角色/權限管理 |
| 9 | CMD+K 命令面板 | P1 | ⏳ 待開發 | 鍵盤優先導航 |
| 10 | 活動時間軸 | P2 | ⏳ 待開發 | 全域 + 客戶/商機級別 |
| 11 | 通知系統 | P2 | ⏳ 待開發 | 站內 + Email 通知 |
| 12 | 報表圖表 | P2 | ⏳ 待開發 | Pipeline 分析 + 營收預測 |
| 13 | 匯入匯出 | P2 | ⏳ 待開發 | CSV/Excel 匯入匯出 |
| 14 | 郵件整合 | P3 | ⏳ 待開發 | Email 追蹤 + 範本 |

### 3.2 模組詳細定義

#### M1: 認證系統（已完成）

- 帳號密碼登入/註冊
- NextAuth.js 整合
- 2FA (TOTP) + 備用碼
- 登入歷史記錄
- 帳號暫停/啟用
- RBAC 5 角色（Super Admin、Admin、Manager、Sales、Viewer）
- 細粒度權限（customers:read、deals:write 等）

#### M2: Dashboard

| 元素 | 桌面版 | 手機版 |
|------|--------|--------|
| 主數字 | Pipeline 總金額（Hero 大字） | 同左，縮寫（NT$2.3M） |
| Pipeline 分佈 | 4 個階段 chips + 金額 | 可滑動 chips |
| 活動流 | 最近 4 筆活動 + 時間軸點 | Today 活動列表 |
| 快速操作 | + New Deal / + Customer / View Pipeline | 底部 Tab + FAB |

#### M3: 客戶管理

| 功能 | 說明 |
|------|------|
| 列表檢視 | 極簡列表（名稱 + 金額 + 狀態色點），支援搜尋/篩選 |
| Detail Panel | 右側面板顯示完整資訊（桌面）/全螢幕推入（手機） |
| 客戶 CRUD | 新增/編輯/刪除/匯出 |
| 分類篩選 | All / B2B / B2C / Active / Inactive / Lead |
| 快速搜尋 | 名稱、公司、Email 即時搜尋 |
| 關聯檢視 | 在 Detail Panel 顯示聯絡人 + 商機 + 文件 |

#### M4: 聯絡人管理

| 功能 | 說明 |
|------|------|
| 嵌入顯示 | 在客戶 Detail Panel 內顯示 |
| 聯絡人 CRUD | 新增/編輯/刪除 |
| 主要聯絡人 | 標記 isPrimary |
| 聯絡資訊 | 姓名、Email、電話、職稱 |

#### M5: 商機管理

| 功能 | 桌面版 | 手機版 |
|------|--------|--------|
| Kanban 看板 | 4 欄拖拉（Lead → Qualified → Proposal → Negotiation） | Stage tabs + 列表 |
| List 檢視 | 資料表格（可切換） | 同 Kanban 手機版 |
| Deal Card | 名稱 + 金額 + 擁有者圓點 | 同左（更大觸控區） |
| 階段移動 | 拖拉 + 右鍵選單 | 左滑/長按選單 |
| 篩選 | 階段/金額/擁有者/日期 | 階段 tabs |
| 新增/編輯 | Modal / Inline | Bottom Sheet |

#### M6: 文件管理

| 功能 | 說明 |
|------|------|
| 文件上傳 | 拖拉上傳 / 點擊選擇 |
| 文件類型 | 合約、郵件、會議紀錄、報價單 |
| AI 分析 | 摘要、實體抽取、情緒分析、關鍵重點、行動項目 |
| 關聯客戶 | 將文件關聯到特定客戶 |
| 預覽 | 文件內容預覽 + AI 分析結果 |

#### M7: Settings 設定

| 功能 | 說明 |
|------|------|
| 組織設定 | 名稱、Logo、方案 |
| 個人偏好 | 語言、時區、通知偏好 |
| 安全設定 | 密碼變更、2FA 管理 |
| 登入歷史 | 查看登入裝置/IP |

#### M8: Admin 管理後台

| 功能 | 說明 |
|------|------|
| 用戶管理 | 列表、新增、暫停、重設密碼 |
| 角色管理 | 建立/編輯角色 + 分配權限 |
| 權限管理 | 細粒度權限配置 |
| 稽核日誌 | 查看/篩選/匯出操作記錄 |
| 組織成員 | 邀請/移除/變更角色 |

#### M9: CMD+K 命令面板

| 功能 | 說明 |
|------|------|
| 全域搜尋 | 搜尋客戶、商機、聯絡人、文件 |
| 快速操作 | + New Deal、+ Customer、Go to Settings |
| 鍵盤導航 | ↑↓ 選擇、Enter 執行、Esc 關閉 |
| 最近項目 | 顯示最近存取的項目 |
| 快捷鍵 | CMD+N 新增、CMD+/ 搜尋 |

#### M10: 活動時間軸

| 功能 | 說明 |
|------|------|
| 全域活動流 | Dashboard 顯示團隊所有活動 |
| 客戶活動流 | 客戶 Detail Panel 內的活動歷史 |
| 商機活動流 | 商機詳情的階段移動歷史 |
| 活動類型 | 建立、更新、階段移動、文件上傳、登入等 |
| 相對時間 | "2 hours ago"、"Yesterday" |

#### M11: 通知系統

| 功能 | 說明 |
|------|------|
| 站內通知 | Header bell icon + 通知面板 |
| 通知類型 | 商機階段變更、客戶指派、新文件、系統警告 |
| 已讀/未讀 | 標記已讀 + 全部已讀 |
| Email 通知 | 可設定哪些事件發送 Email |

#### M12: 報表圖表

| 功能 | 說明 |
|------|------|
| Pipeline 漏斗 | 各階段數量/金額視覺化 |
| 營收趨勢 | 月/季營收折線圖 |
| 成交率 | Won/Lost 比率 |
| 銷售預測 | 根據 probability × value 預測 |
| 業務績效 | 按 assignedTo 的業績排名 |
| 匯出 | PDF / CSV 匯出 |

#### M13: 匯入匯出

| 功能 | 說明 |
|------|------|
| CSV 匯入 | 客戶、聯絡人、商機批次匯入 |
| Excel 匯出 | 列表資料匯出為 .xlsx |
| 欄位對應 | 匯入時手動對應欄位 |
| 驗證報告 | 匯入前顯示驗證結果 |
| 歷史記錄 | 匯入/匯出記錄 |

#### M14: 郵件整合

| 功能 | 說明 |
|------|------|
| Email 追蹤 | 記錄寄出的郵件 |
| Email 範本 | 預設郵件範本 |
| 聯絡人 Email | 從聯絡人直接發送 |
| Email 歷史 | 客戶 Detail Panel 顯示往來郵件 |

---

## 4. 技術架構

### 4.1 技術棧

| 層級 | 技術 | 版本 |
|------|------|------|
| 框架 | Next.js (App Router) | 16.x |
| UI 框架 | React | 19.x |
| 語言 | TypeScript | 5.x |
| CSS | Tailwind CSS | 4.x |
| ORM | Prisma | 7.x |
| 資料庫 | SQLite (libSQL) | — |
| 認證 | NextAuth.js | 4.x |
| 狀態管理 | TanStack Query + React Context | 5.x |
| 輸入驗證 | Zod | 4.x |
| XSS 防護 | DOMPurify | 3.x |
| 限流 | @upstash/ratelimit | 2.x |
| 2FA | otpauth | 9.x |
| 背景任務 | Inngest | 3.x |
| 測試 | Vitest + Playwright + axe-core | — |
| 元件文件 | Storybook | 10.x |
| 程式碼品質 | SonarCloud | — |

### 4.2 系統架構

```
┌─────────────────────────────────────────────────────┐
│                    Client (Browser)                  │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │
│  │ React 19 SSR │  │ TanStack     │  │ React      │ │
│  │ Server Comp. │  │ Query        │  │ Context    │ │
│  │ (Initial)    │  │ (API State)  │  │ (UI State) │ │
│  └──────┬───────┘  └──────┬───────┘  └────────────┘ │
│         │                 │                          │
│  ┌──────┴─────────────────┴───────────────────────┐  │
│  │              Next.js 16 App Router             │  │
│  │  ┌─────────┐  ┌──────────┐  ┌──────────────┐  │  │
│  │  │ Pages   │  │ Layouts  │  │ Middleware   │  │  │
│  │  │ (RSC)   │  │          │  │ (Security)   │  │  │
│  │  └─────────┘  └──────────┘  └──────────────┘  │  │
│  └────────────────────┬───────────────────────────┘  │
└───────────────────────┼──────────────────────────────┘
                        │ API Routes
┌───────────────────────┼──────────────────────────────┐
│                  Server (Node.js)                     │
│  ┌────────────────────┴───────────────────────────┐  │
│  │              API Layer (Route Handlers)         │  │
│  │  ┌──────────┐  ┌──────────┐  ┌─────────────┐  │  │
│  │  │ Auth API │  │ CRUD API │  │ Admin API   │  │  │
│  │  │          │  │          │  │             │  │  │
│  │  └──────────┘  └──────────┘  └─────────────┘  │  │
│  └────────────────────┬───────────────────────────┘  │
│                       │                              │
│  ┌────────────────────┼───────────────────────────┐  │
│  │           Service Layer (lib/)                 │  │
│  │  ┌──────────┐  ┌──────────┐  ┌─────────────┐  │  │
│  │  │ RBAC     │  │ Validate │  │ Audit Log   │  │  │
│  │  │          │  │ (Zod)    │  │ (ISO 27001) │  │  │
│  │  └──────────┘  └──────────┘  └─────────────┘  │  │
│  └────────────────────┬───────────────────────────┘  │
│                       │                              │
│  ┌────────────────────┴───────────────────────────┐  │
│  │              Data Layer (Prisma)               │  │
│  │  ┌──────────────────────────────────────────┐  │  │
│  │  │  SQLite (libSQL) + Multi-tenant Scope    │  │  │
│  │  └──────────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  ┌────────────────────────────────────────────────┐  │
│  │         Background Jobs (Inngest)              │  │
│  │  ┌──────────────────────────────────────────┐  │  │
│  │  │  AI Document Analysis (Claude API)       │  │  │
│  │  │  Email Notifications                     │  │  │
│  │  │  Report Generation                       │  │  │
│  │  └──────────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
```

### 4.3 前端架構

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # 認證路由群組
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (dashboard)/              # 主應用路由群組（受保護）
│   │   ├── layout.tsx            # Dashboard Layout (Sidebar + Header)
│   │   ├── dashboard/page.tsx    # Dashboard 首頁
│   │   ├── customers/
│   │   │   └── page.tsx          # 客戶管理
│   │   ├── deals/
│   │   │   └── page.tsx          # 商機管理
│   │   ├── documents/
│   │   │   └── page.tsx          # 文件管理
│   │   ├── reports/
│   │   │   └── page.tsx          # 報表圖表
│   │   ├── settings/
│   │   │   ├── page.tsx          # 設定主頁
│   │   │   ├── profile/page.tsx  # 個人資料
│   │   │   └── security/page.tsx # 安全設定
│   │   └── admin/
│   │       ├── users/page.tsx    # 用戶管理
│   │       ├── roles/page.tsx    # 角色管理
│   │       └── audit/page.tsx    # 稽核日誌
│   ├── api/                      # API 路由（已完成）
│   └── layout.tsx                # Root Layout
│
├── components/
│   ├── ui/                       # 基礎 UI 元件
│   │   ├── Button/
│   │   ├── TextInput/
│   │   ├── Select/
│   │   ├── DataTable/
│   │   ├── Pagination/
│   │   ├── FilterBar/
│   │   ├── LoadingState/
│   │   ├── EmptyState/
│   │   ├── ErrorState/
│   │   ├── Modal/                # 新增
│   │   ├── Drawer/               # 新增（Detail Panel）
│   │   ├── Tabs/                 # 新增
│   │   ├── Badge/                # 新增（StatusDot）
│   │   ├── Avatar/               # 新增
│   │   ├── Toast/                # 新增
│   │   ├── DropdownMenu/         # 新增
│   │   ├── CommandPalette/       # 新增（CMD+K）
│   │   └── Chart/                # 新增（報表用）
│   │
│   ├── features/                 # 功能元件
│   │   ├── dashboard/
│   │   │   ├── PipelineHero.tsx
│   │   │   ├── StageChips.tsx
│   │   │   ├── ActivityFeed.tsx
│   │   │   └── QuickActions.tsx
│   │   ├── customers/
│   │   │   ├── CustomerList.tsx
│   │   │   ├── CustomerRow.tsx
│   │   │   ├── CustomerDetail.tsx
│   │   │   ├── CustomerForm.tsx
│   │   │   └── CustomerFilters.tsx
│   │   ├── contacts/
│   │   │   ├── ContactList.tsx
│   │   │   └── ContactForm.tsx
│   │   ├── deals/
│   │   │   ├── DealKanban.tsx
│   │   │   ├── DealColumn.tsx
│   │   │   ├── DealCard.tsx
│   │   │   ├── DealList.tsx
│   │   │   ├── DealForm.tsx
│   │   │   └── DealFilters.tsx
│   │   ├── documents/
│   │   │   ├── DocumentList.tsx
│   │   │   ├── DocumentUpload.tsx
│   │   │   ├── DocumentPreview.tsx
│   │   │   └── AIAnalysisPanel.tsx
│   │   ├── reports/
│   │   │   ├── PipelineFunnel.tsx
│   │   │   ├── RevenueTrend.tsx
│   │   │   ├── WinRateChart.tsx
│   │   │   └── SalesForecast.tsx
│   │   ├── admin/
│   │   │   ├── UserTable.tsx
│   │   │   ├── RoleEditor.tsx
│   │   │   └── AuditLogViewer.tsx
│   │   └── notifications/
│   │       ├── NotificationBell.tsx
│   │       └── NotificationPanel.tsx
│   │
│   ├── layout/                   # 佈局元件
│   │   ├── Sidebar/
│   │   ├── Header/
│   │   ├── DashboardLayout.tsx
│   │   └── MobileTabBar.tsx      # 新增
│   │
│   └── providers/
│       ├── SessionProvider.tsx
│       ├── QueryProvider.tsx      # 新增（TanStack Query）
│       └── ThemeProvider.tsx      # 新增
│
├── hooks/                        # 自訂 Hooks
│   ├── useCustomers.ts           # Customer CRUD hooks
│   ├── useDeals.ts               # Deal CRUD hooks
│   ├── useContacts.ts            # Contact CRUD hooks
│   ├── useDocuments.ts           # Document hooks
│   ├── useActivity.ts            # Activity feed hook
│   ├── useNotifications.ts       # Notification hook
│   ├── useCommandPalette.ts      # CMD+K hook
│   ├── useKeyboardShortcuts.ts   # 鍵盤快捷鍵
│   └── useMediaQuery.ts          # RWD breakpoint hook
│
├── lib/                          # 核心邏輯
│   ├── auth.ts                   # 已完成
│   ├── prisma.ts                 # 已完成
│   ├── rbac.ts                   # 已完成
│   ├── permissions.ts            # 已完成
│   ├── 2fa.ts                    # 已完成
│   ├── api-utils.ts              # 已完成
│   ├── validation.ts             # 已完成
│   ├── design-tokens.ts          # 已完成
│   ├── query-client.ts           # 新增（TanStack Query config）
│   └── inngest/                  # 已完成
│
├── services/                     # 業務邏輯服務
│   ├── customer.service.ts       # 客戶業務邏輯
│   ├── deal.service.ts           # 商機業務邏輯
│   ├── document.service.ts       # 文件業務邏輯
│   ├── notification.service.ts   # 通知邏輯
│   ├── report.service.ts         # 報表邏輯
│   └── import-export.service.ts  # 匯入匯出邏輯
│
└── types/                        # TypeScript 型別
    ├── next-auth.d.ts            # 已完成
    ├── customer.ts
    ├── deal.ts
    ├── contact.ts
    ├── document.ts
    ├── notification.ts
    └── report.ts
```

### 4.4 狀態管理架構

```
┌──────────────────────────────────────────────┐
│                 State Architecture           │
├──────────────────────────────────────────────┤
│                                              │
│  Server State (TanStack Query)               │
│  ├── useQuery('customers', ...)              │
│  ├── useQuery('deals', ...)                  │
│  ├── useQuery('contacts', ...)               │
│  ├── useQuery('documents', ...)              │
│  ├── useQuery('notifications', ...)          │
│  ├── useQuery('activity', ...)               │
│  ├── useMutation(createCustomer, ...)        │
│  ├── useMutation(updateDealStage, {          │
│  │     optimisticUpdate: true                │
│  │   })                                      │
│  └── useInfiniteQuery('activity', ...)       │
│                                              │
│  UI State (React Context)                    │
│  ├── SidebarContext (open/closed)            │
│  ├── CommandPaletteContext (open/closed)      │
│  ├── ThemeContext (dark/light)               │
│  └── SelectedCustomerContext (detail panel)   │
│                                              │
│  Server Components (RSC)                     │
│  ├── Dashboard page (initial data)           │
│  ├── Customer list (initial data)            │
│  └── Deal list (initial data)                │
│                                              │
└──────────────────────────────────────────────┘
```

### 4.5 資料庫架構（ER 圖）

```
Organization 1 ──── N OrganizationMember N ──── 1 User
     │                                            │
     │                                            ├── N LoginHistory
     │                                            ├── 1 TwoFactorAuth
     │                                            └── N AuditLog
     │
     ├──── N Role 1 ──── N RolePermission N ──── 1 Permission
     │
     ├──── N Customer
     │         ├── N Contact
     │         ├── N Deal
     │         └── N Document
     │
     ├──── N Document
     │         └── N DocumentAnalysis
     │
     └──── N SystemSetting
```

**需要新增的 Model（完整版）：**

| Model | 用途 | Sprint |
|-------|------|--------|
| Activity | 活動記錄（時間軸） | Sprint 3 |
| Notification | 通知（站內 + Email） | Sprint 4 |
| EmailTemplate | 郵件範本 | Sprint 5 |
| ImportJob | 匯入任務記錄 | Sprint 5 |

### 4.6 安全架構

| 層級 | 防護措施 | 實作方式 |
|------|----------|----------|
| 傳輸層 | HTTPS 強制 | HSTS Header |
| 應用層 | CSP + X-Frame + X-Content-Type | middleware.ts |
| 認證層 | JWT + Session + 2FA | NextAuth.js + otpauth |
| 授權層 | RBAC + 組織隔離 | lib/rbac.ts |
| 輸入層 | Schema 驗證 | Zod |
| 輸出層 | XSS 防護 | DOMPurify + React 自動轉義 |
| 資料層 | 參數化查詢 | Prisma |
| 限流層 | IP + User 限流 | @upstash/ratelimit |
| 稽核層 | 全操作記錄 | AuditLog model |

---

## 5. UI/UX 設計

### 5.1 設計方向

| 面向 | Salesforce/HubSpot | Calm CRM |
|------|-------------------|----------|
| 主題 | 亮色為主 | **深色為主** |
| 導航 | Sidebar + 下拉選單 | **CMD+K 為主**，Sidebar 為輔 |
| 資訊密度 | 每頁 40+ 欄位 | **每視圖 5-7 項** |
| 主畫面 | 統計圖表 | **Pipeline 為主角** |
| 狀態表示 | 彩色 Badge | **8px 色點** |
| 列表 | 密集資料表 | **極簡列表** + Detail Panel |
| 互動 | 滑鼠點擊 | **鍵盤優先** |

### 5.2 色彩系統（WCAG 2.2 AAA）

#### Dark Mode（預設）

| Token | 色碼 | 對比度 | 用途 |
|-------|------|--------|------|
| `--bg-page` | `#0d0d0d` | — | 頁面底色 |
| `--bg-card` | `#1a1a1a` | — | 卡片/面板 |
| `--bg-hover` | `#262626` | — | Hover/選中 |
| `--bg-surface` | `#111111` | — | 次要表面 |
| `--border` | `#2a2a2a` | — | 邊框 |
| `--border-subtle` | `#1f1f1f` | — | 極淡邊框 |
| `--text-primary` | `#fafafa` | 18.1:1 | 主文字 |
| `--text-secondary` | `#a0a0a0` | 6.7:1 | 次要文字 |
| `--text-muted` | `#666666` | — | 標註文字 |
| `--accent` | `#0070f0` | — | 強調/焦點 |
| `--success` | `#22c55e` | — | 成功/成交 |
| `--warning` | `#eab308` | — | 警告/風險 |
| `--error` | `#ef4444` | — | 錯誤/過期 |

#### Pipeline 階段色

| 階段 | 色碼 | 說明 |
|------|------|------|
| Lead | `#6366f1` | 紫色 |
| Qualified | `#8b5cf6` | 深紫 |
| Proposal | `#0070f0` | 藍色 |
| Negotiation | `#eab308` | 黃色 |
| Won | `#22c55e` | 綠色 |
| Lost | `#ef4444` | 紅色 |

### 5.3 字型

| 用途 | 字型 | 說明 |
|------|------|------|
| 主字型 | Inter | 系統級可讀性，免載入 |
| 等寬 | JetBrains Mono | 金額/數字 |

### 5.4 設計系統元件（15 個已設計）

| # | 元件 | 說明 |
|---|------|------|
| 1 | Button/Primary | accent 底，白字，min-h 44px |
| 2 | Button/Secondary | 透明底 + border |
| 3 | Button/Ghost | 無底無框 |
| 4 | StatusDot | 8x8 圓點 |
| 5 | StatHero | 大數字 32px + 小標籤 |
| 6 | Input/Dark | 深色搜尋框 |
| 7 | NavItem/Default | icon + label |
| 8 | NavItem/Active | accent bar + hover bg |
| 9 | Sidebar | Logo + Nav + User |
| 10 | MobileTabBar | 5 tab + 安全區 |
| 11 | Card | bg-card + border |
| 12 | ActivityItem | 時間軸圓點 + 描述 |
| 13 | CustomerRow | 頭像 + 名稱 + 金額 + 狀態點 |
| 14 | DealCard | 名稱 + 金額 + 擁有者 |
| 15 | CommandPalette | 搜尋 + 命令列表 |

### 5.5 頁面設計（6 頁已完成）

| # | 頁面 | 尺寸 | 設計檔 ID |
|---|------|------|-----------|
| 1 | Dashboard Desktop | 1440×900 | `325tP` |
| 2 | Dashboard Mobile | 375×812 | `FVLDw` |
| 3 | Customers Desktop | 1440×900 | `yvijg` |
| 4 | Customers Mobile | 375×812 | `j41rR` |
| 5 | Deals Desktop | 1440×900 | `Wn9mq` |
| 6 | Deals Mobile | 375×812 | `Ixz0w` |

**待設計頁面（完整版）：**

| # | 頁面 | 尺寸 |
|---|------|------|
| 7 | Documents Desktop | 1440×900 |
| 8 | Documents Mobile | 375×812 |
| 9 | Reports Desktop | 1440×900 |
| 10 | Reports Mobile | 375×812 |
| 11 | Settings Desktop | 1440×900 |
| 12 | Settings Mobile | 375×812 |
| 13 | Admin Desktop | 1440×900 |
| 14 | Admin Mobile | 375×812 |
| 15 | CMD+K Overlay | 1440×900 |
| 16 | Login / Register | 1440×900 + 375×812 |

### 5.6 桌面 vs 手機互動模式

| 面向 | 桌面版 | 手機版 |
|------|--------|--------|
| 導航首選 | CMD+K 命令面板 | 底部 Tab Bar |
| 導航次選 | 左側 Sidebar | 搜尋列 |
| 新增 | CMD+N / CMD+K | FAB + 按鈕 |
| 列表 → 詳情 | 右側 Detail Panel | 全螢幕推入 |
| 商機操作 | Kanban 拖拉 | Stage tabs + 滑動 |
| 編輯 | Modal / Inline 編輯 | Bottom Sheet |
| 多選 | Checkbox + 批量操作 | 長按多選 |
| Hover | 漸進揭露次要資訊 | 無 hover，展開顯示 |

---

## 6. Sprint 規劃

### Sprint 總覽

| Sprint | 主題 | 模組 |
|--------|------|------|
| Sprint 1 | 基礎建設 | ✅ 已完成（Auth + API + DB + UI 元件） |
| Sprint 2 | 安全 & RBAC | ✅ 已完成（2FA + RBAC + 多租戶 + 稽核） |
| Sprint 3 | 核心前端 | Dashboard + Customers + Deals 前端重寫 |
| Sprint 4 | 擴展功能 | Documents + CMD+K + Notifications + Activity |
| Sprint 5 | 管理 & 報表 | Settings + Admin + Reports |
| Sprint 6 | 進階功能 | Import/Export + Email + 效能優化 |
| Sprint 7 | 品質保證 | E2E 測試 + 無障礙 + 安全掃描 |
| Sprint 8 | 部署上線 | CI/CD + 部署 + 監控 |

### Sprint 3: 核心前端（重點）

| 項目 | 說明 |
|------|------|
| **目標** | 按 Calm CRM 設計實作 3 個核心頁面 |
| **交付物** | Dashboard / Customers / Deals 頁面（Desktop + Mobile） |

**任務清單：**

1. 安裝 TanStack Query + 設定 QueryProvider
2. 建立 Tailwind 深色主題 token（對應 Pencil 設計變數）
3. 重寫 DashboardLayout（深色 Sidebar + Header）
4. 新增 MobileTabBar 元件
5. 實作 CMD+K CommandPalette 骨架
6. 實作 Dashboard 頁面
   - PipelineHero（大數字 + 次標籤）
   - StageChips（Pipeline 階段分佈）
   - ActivityFeed（最近活動）
   - QuickActions（快速操作按鈕）
7. 實作 Customers 頁面
   - CustomerList + 搜尋/篩選
   - CustomerRow（極簡列表）
   - CustomerDetail（右側 Panel / 手機全螢幕）
   - CustomerForm（新增/編輯）
8. 實作 Deals 頁面
   - DealKanban + DealColumn + DealCard
   - Kanban 拖拉（optimistic update）
   - DealList（表格檢視切換）
   - DealForm（新增/編輯）
9. RWD 8 斷點測試
10. WCAG AAA 無障礙驗證

### Sprint 4: 擴展功能

**任務清單：**

1. Documents 文件管理頁面
   - 文件列表 + 上傳 + 預覽
   - AI 分析結果面板
2. CMD+K 命令面板完整實作
   - 全域搜尋（Customers + Deals + Contacts + Documents）
   - 快速操作（New Deal, New Customer, Go to...）
   - 最近項目
3. Activity 活動時間軸
   - 新增 Activity model + API
   - 全域活動流（Dashboard）
   - 客戶/商機級別活動
4. Notification 通知系統
   - 新增 Notification model + API
   - NotificationBell + NotificationPanel
   - Email 通知（Inngest 背景發送）

### Sprint 5: 管理 & 報表

**任務清單：**

1. Settings 設定頁面
   - 組織設定
   - 個人偏好
   - 安全設定（2FA 管理）
2. Admin 管理後台
   - 用戶管理表格
   - 角色/權限編輯器
   - 稽核日誌查看器
3. Reports 報表
   - Pipeline 漏斗圖
   - 營收趨勢圖
   - 成交率 / 銷售預測
   - 業務績效排名

### Sprint 6: 進階功能

**任務清單：**

1. Import/Export
   - CSV 匯入（客戶、商機）
   - Excel 匯出
   - 欄位對應 UI
   - 匯入驗證報告
2. Email 整合
   - Email 追蹤記錄
   - Email 範本管理
   - 聯絡人快速發送
3. 效能優化
   - React Server Components 優化
   - TanStack Query 快取策略
   - 圖片/資源 lazy loading
   - Bundle 分析 + code splitting

### Sprint 7: 品質保證

**任務清單：**

1. E2E 測試（Playwright）
   - 關鍵使用者流程 100% 覆蓋
   - 登入 → Dashboard → 客戶 → 商機完整流程
   - 跨瀏覽器測試
2. 無障礙測試
   - axe-core 自動化測試
   - 螢幕閱讀器手動測試
   - 鍵盤操作 100% 覆蓋
3. 安全掃描
   - SonarCloud 品質門檻通過
   - npm audit 零 Critical/High
   - OWASP ZAP 掃描
4. 效能基準
   - Lighthouse 90+ 全項
   - Core Web Vitals 通過

### Sprint 8: 部署上線

**任務清單：**

1. CI/CD Pipeline
   - GitHub Actions（build + test + lint + sonar）
   - 預覽環境（PR preview）
   - 生產部署流程
2. 部署環境
   - Vercel / Railway / 自架
   - SQLite → PostgreSQL 遷移（如需要）
   - 環境變數管理
3. 監控
   - Error tracking（Sentry）
   - 效能監控
   - Uptime 監控
4. 文件完善
   - API 文件最終版
   - 部署文件
   - 用戶手冊

---

## 7. 測試策略

### 7.1 測試分層

| 層級 | 工具 | 目標 | 覆蓋率 |
|------|------|------|--------|
| 單元測試 | Vitest | 函數、元件 | > 80% |
| 整合測試 | Vitest | API、資料庫 | > 70% |
| E2E 測試 | Playwright | 使用者流程 | 關鍵路徑 100% |
| 無障礙測試 | axe-core | WCAG 2.2 AAA | 100% 通過 |
| 安全測試 | SonarCloud + npm audit | 漏洞掃描 | 零 Critical |

### 7.2 測試命令

```bash
npm run test:unit         # 單元測試
npm run test:integration  # 整合測試
npm run test:e2e          # E2E 測試
npm run test:a11y         # 無障礙測試
npm run test:coverage     # 覆蓋率報告
npm run test:all          # 全部測試
```

### 7.3 品質門檻（Quality Gate）

| 指標 | 門檻 |
|------|------|
| 覆蓋率（新程式碼） | ≥ 80% |
| 重複程式碼 | ≤ 3% |
| 可維護性評級 | A |
| 可靠性評級 | A |
| 安全性評級 | A |

---

## 8. 部署計畫

### 8.1 環境規劃

| 環境 | 用途 | 部署方式 |
|------|------|----------|
| Local | 開發 | `npm run dev` |
| Preview | PR 預覽 | 自動部署 |
| Staging | 預發布 | 手動觸發 |
| Production | 正式環境 | Git tag 觸發 |

### 8.2 部署選項

| 選項 | 優點 | 適用 |
|------|------|------|
| Vercel | Next.js 原生、零配置 | 推薦首選 |
| Railway | 自訂性高、支援 SQLite | 備選 |
| Docker 自架 | 完全掌控 | 企業客戶 |

---

## 9. 風險評估

| # | 風險 | 影響 | 機率 | 緩解措施 |
|---|------|------|------|----------|
| R1 | SQLite 並發限制 | 中 | 低 | 預留 PostgreSQL 遷移路徑 |
| R2 | AI API 費用超支 | 中 | 中 | Rate limit + 預算告警 |
| R3 | 前端效能（大量數據） | 高 | 中 | 虛擬化列表 + 分頁 |
| R4 | 安全漏洞 | 高 | 低 | SonarCloud + npm audit + OWASP |
| R5 | 功能蔓延 | 中 | 高 | 嚴格按 Sprint 交付 |
| R6 | 第三方套件漏洞 | 中 | 中 | 每日 audit + 即時修補 |

---

## 10. 合規文件清單

| # | 文件 | ISO 對應 | 狀態 |
|---|------|----------|------|
| 1 | 專案計畫書 | ISO 29110 | ✅ 本文件 |
| 2 | 需求規格書 | ISO 29110 | 🔄 更新中 |
| 3 | 風險評估報告 | ISO 27001 | ✅ 已完成 |
| 4 | PIA 隱私影響評估 | ISO 27701 | ✅ 已完成 |
| 5 | AIIA AI 影響評估 | ISO 42001 | ✅ 已完成 |
| 6 | 測試計畫 | ISO 29110 | ⏳ Sprint 7 |
| 7 | 部署文件 | ISO 29110 | ⏳ Sprint 8 |
| 8 | 第三方元件清單 | ISO 27001 | ✅ 已完成 |
| 9 | 稽核紀錄 | ISO 27001 | ✅ 持續更新 |
| 10 | 程式碼品質報告 | ISO 27001 | ✅ SonarCloud |

---

## 11. 關鍵檔案索引

| 檔案 | 用途 |
|------|------|
| `prisma/schema.prisma` | 資料庫 Schema |
| `src/middleware.ts` | 安全中介層 |
| `src/lib/auth.ts` | 認證配置 |
| `src/lib/rbac.ts` | RBAC 邏輯 |
| `src/lib/validation.ts` | Zod Schema |
| `src/lib/api-utils.ts` | API 工具函數 |
| `src/lib/design-tokens.ts` | 設計系統 Token |
| `designs/pencil-new.pen` | UI 設計檔（Pencil） |
| `CLAUDE.md` | ISO 合規開發規則 |
| `docs/project-plan-v2.md` | 本文件 |

---

*此文件符合 ISO 29110 專案管理程序 (PM) 要求。*
*文件編號: DOC-PLN-2026-001-v2.0*
