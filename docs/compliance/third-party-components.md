# Free-CRM 第三方元件清單

## 文件資訊

| 項目 | 內容 |
|------|------|
| 文件編號 | SBOM-FREECRM-20260128 |
| 版本 | v1.0 |
| 建立日期 | 2026-01-28 |
| 專案代號 | PRJ-2025-001 |
| 狀態 | 已核准 |

## ISO 27001 合規對照

| 條款 | 要求 | 對應功能 |
|------|------|----------|
| A.12.6.1 | 技術弱點管理 | 每日 npm audit 掃描 |
| A.15.1.1 | 供應商關係的資訊安全政策 | 元件清單與審核流程 |
| A.15.1.2 | 供應商協議中的安全處理 | 授權條款追蹤 |
| A.18.1.2 | 智慧財產權 | 套件授權合規檢查 |

---

## 元件統計

| 類別 | 數量 |
|------|------|
| 生產依賴 (dependencies) | 15 |
| 開發依賴 (devDependencies) | 40 |
| **總計** | **55** |

---

## 生產依賴清單 (15 個)

### 框架類 (Framework)

| 套件 | 版本 | 授權 | 使用原因 | 使用位置 | 狀態 |
|------|------|------|----------|----------|------|
| next | 16.1.4 | MIT | Next.js 全端框架，提供 App Router、API Routes、SSR | `src/app/**/*`, `next.config.ts`, `src/middleware.ts` (27 個 API 路由) | ✅ 活躍 |
| react | 19.2.3 | MIT | React 核心庫，UI 元件開發 | `src/components/**/*.tsx` (18+ 個元件)、所有頁面 | ✅ 活躍 |
| react-dom | 19.2.3 | MIT | React DOM 渲染，瀏覽器端渲染支援 | 與 React 配合使用，所有頁面渲染 | ✅ 活躍 |

### 資料庫類 (Database)

| 套件 | 版本 | 授權 | 使用原因 | 使用位置 | 狀態 |
|------|------|------|----------|----------|------|
| @prisma/client | ^7.3.0 | Apache-2.0 | Prisma ORM 用戶端，型別安全的資料庫操作 | `src/lib/prisma.ts`、23 個 API 路由、13 個測試檔案 | ✅ 活躍 |
| prisma | ^7.3.0 | Apache-2.0 | Prisma CLI，資料庫遷移和 Schema 管理 | `prisma/schema.prisma`、`prisma/migrations/` | ✅ 活躍 |
| @prisma/adapter-libsql | ^7.3.0 | Apache-2.0 | LibSQL 資料庫適配器，支援 SQLite/Turso | `src/lib/prisma.ts` | ✅ 活躍 |
| @libsql/client | ^0.17.0 | MIT | LibSQL 驅動程式，開發環境輕量資料庫 | `src/lib/prisma.ts` | ✅ 活躍 |

### 認證安全類 (Security & Auth)

| 套件 | 版本 | 授權 | 使用原因 | 使用位置 | 狀態 |
|------|------|------|----------|----------|------|
| next-auth | ^4.24.13 | ISC | 身份驗證框架，JWT Session 管理 | `src/lib/auth.ts`、`src/app/api/auth/[...nextauth]/route.ts`、`src/middleware.ts`、`src/components/providers/SessionProvider.tsx`、登入/註冊頁面 | ✅ 活躍 |
| @auth/prisma-adapter | ^2.11.1 | ISC | NextAuth Prisma 適配器，用戶資料存儲 | `src/lib/auth.ts` (第 10 行) | ✅ 活躍 |
| bcryptjs | ^3.0.3 | MIT | 密碼加密雜湊，ISO 27001 A.9.4.3 合規 | `src/lib/auth.ts`、`src/app/api/auth/register/route.ts`、`src/app/api/account/password/route.ts`、`src/app/api/admin/users/**` | ✅ 活躍 |
| otpauth | ^9.4.1 | MIT | TOTP 2FA 認證，RFC 6238 合規 | `src/lib/2fa.ts`、`src/app/api/account/2fa/**` (4 個端點) | ✅ 活躍 |
| @upstash/ratelimit | ^2.0.8 | MIT | API 速率限制，防止暴力攻擊 | **尚未實作** (已安裝準備使用) | ⚠️ 未使用 |
| dompurify | ^3.3.1 | Apache-2.0 | HTML 淨化，XSS 防護 (CWE-79) | **尚未實作** (已安裝準備使用) | ⚠️ 未使用 |

### 工具類 (Tools & Utilities)

| 套件 | 版本 | 授權 | 使用原因 | 使用位置 | 狀態 |
|------|------|------|----------|----------|------|
| zod | ^4.3.6 | MIT | Schema 驗證，防止 SQL 注入/XSS | `src/lib/validation.ts`、15 個 API 路由 | ✅ 活躍 |
| qrcode | ^1.5.4 | MIT | QR Code 生成，2FA 設定用 | `src/lib/2fa.ts` (`generateQRCodeDataUrl()`) | ✅ 活躍 |
| dotenv | ^17.2.3 | BSD-2 | 環境變數載入 | Next.js 自動載入 `.env` 檔案 | ✅ 被動 |
| inngest | ^3.49.3 | Apache-2.0 | 背景工作隊列，非同步任務處理 | `src/lib/inngest/client.ts`、`src/lib/inngest/functions.ts`、`src/app/api/inngest/route.ts` | ✅ 活躍 |

---

## 開發依賴清單 (40 個)

### 測試框架

| 套件 | 版本 | 授權 | 使用原因 | 使用位置 |
|------|------|------|----------|----------|
| vitest | ^4.0.18 | MIT | 單元/整合測試框架 | `tests/**/*.test.ts` (20+ 測試檔案) |
| playwright | ^1.58.0 | Apache-2.0 | E2E 測試框架 | `tests/e2e/*.spec.ts` |
| @vitest/browser-playwright | ^4.0.18 | MIT | Vitest Playwright 整合 | `vitest.config.ts` |
| @vitest/coverage-v8 | ^4.0.18 | MIT | 測試覆蓋率報告 | `npm run test:coverage` |
| jsdom | ^27.4.0 | MIT | DOM 模擬環境 | 測試環境設定 |

### 測試工具庫

| 套件 | 版本 | 授權 | 使用原因 | 使用位置 |
|------|------|------|----------|----------|
| @testing-library/react | ^16.3.2 | MIT | React 元件測試 | 元件單元測試 |
| @testing-library/dom | ^10.4.1 | MIT | DOM 測試工具 | 測試輔助 |
| @testing-library/jest-dom | ^6.9.1 | MIT | Jest DOM 匹配器 | 測試斷言 |
| @testing-library/user-event | ^14.6.1 | MIT | 使用者互動模擬 | E2E 測試 |

### 無障礙測試

| 套件 | 版本 | 授權 | 使用原因 | 使用位置 |
|------|------|------|----------|----------|
| @axe-core/react | ^4.11.0 | MPL-2.0 | axe 無障礙檢查 (WCAG 2.2) | `tests/accessibility/**` |
| @storybook/addon-a11y | ^10.2.0 | MIT | Storybook 無障礙檢查 | Storybook 插件 |

### Storybook & 文件

| 套件 | 版本 | 授權 | 使用原因 | 使用位置 |
|------|------|------|----------|----------|
| storybook | ^10.2.0 | MIT | UI 元件文件化 | `.storybook/` |
| @storybook/nextjs-vite | ^10.2.0 | MIT | Storybook Next.js + Vite | Storybook 設定 |
| @storybook/addon-docs | ^10.2.0 | MIT | Storybook 文件 | 元件文件 |
| @storybook/addon-vitest | ^10.2.0 | MIT | Storybook Vitest 整合 | 測試整合 |
| @storybook/addon-onboarding | ^10.2.0 | MIT | Storybook 上手指南 | 開發指南 |
| @storybook/test | ^8.6.15 | MIT | Storybook 測試 | 視覺測試 |
| @chromatic-com/storybook | ^5.0.0 | MIT | Chromatic CI/CD 整合 | 視覺回歸測試 |
| eslint-plugin-storybook | ^10.2.0 | MIT | Storybook ESLint 規則 | 程式碼檢查 |

### 樣式 & CSS

| 套件 | 版本 | 授權 | 使用原因 | 使用位置 |
|------|------|------|----------|----------|
| tailwindcss | ^4 | MIT | Utility-first CSS 框架 | `src/**/*.tsx` 所有元件 |
| @tailwindcss/postcss | ^4 | MIT | Tailwind PostCSS 插件 | `postcss.config.js` |

### 程式碼品質

| 套件 | 版本 | 授權 | 使用原因 | 使用位置 |
|------|------|------|----------|----------|
| eslint | ^9 | MIT | 程式碼檢查器 | `eslint.config.mjs` |
| eslint-config-next | 16.1.4 | MIT | Next.js ESLint 配置 | ESLint 設定 |
| eslint-plugin-jsx-a11y | ^6.10.2 | MIT | 無障礙 JSX 檢查 (WCAG) | ESLint 插件 |
| eslint-plugin-security | ^3.0.1 | Apache-2.0 | 安全編碼檢查 (CWE/OWASP) | ESLint 插件 |

### 類型定義

| 套件 | 版本 | 授權 | 使用原因 | 使用位置 |
|------|------|------|----------|----------|
| typescript | ^5 | Apache-2.0 | TypeScript 編譯器 | 全專案 |
| @types/node | ^20 | MIT | Node.js 型別定義 | 伺服器端程式碼 |
| @types/react | ^19 | MIT | React 型別定義 | React 元件 |
| @types/react-dom | ^19 | MIT | React DOM 型別定義 | DOM 操作 |
| @types/bcryptjs | ^2.4.6 | MIT | bcryptjs 型別定義 | 密碼加密 |
| @types/dompurify | ^3.0.5 | MIT | DOMPurify 型別定義 | XSS 防護 |
| @types/qrcode | ^1.5.6 | MIT | QRCode 型別定義 | 2FA |

### 建構工具

| 套件 | 版本 | 授權 | 使用原因 | 使用位置 |
|------|------|------|----------|----------|
| vite | ^7.3.1 | MIT | 前端建構工具 | Storybook 建構 |
| babel-plugin-react-compiler | 1.0.0 | MIT | React 編譯器外掛 | 效能最佳化 |

### Mock & 審查工具

| 套件 | 版本 | 授權 | 使用原因 | 使用位置 |
|------|------|------|----------|----------|
| msw | ^2.12.7 | MIT | Mock Service Worker (API Mock) | 測試 API mock |
| license-checker | ^25.0.1 | BSD-3 | 授權合規檢查 | `npm run audit:license` |

---

## 未使用但已安裝的套件

| 套件 | 分類 | 狀態 | 建議處理 |
|------|------|------|----------|
| dompurify | security | ⚠️ 未使用 | 應在顯示用戶內容時實作 XSS 防護 |
| @upstash/ratelimit | security | ⚠️ 未使用 | 應儘快實作 API 速率限制 |

---

## 審查命令

```bash
# 執行安全掃描
npm run audit:security

# 檢查過期套件
npm run audit:outdated

# 授權合規檢查
npm run audit:license

# 完整審查報告
npm run audit:full

# Markdown 格式報告
npm run audit:report

# 產生 SBOM
npm run audit:sbom
```

---

## 變更歷史

| 日期 | 變更編號 | 類型 | 說明 |
|------|----------|------|------|
| 2026-01-28 | DEP-20260128-001 | 新增 | license-checker 授權檢查工具 |
| 2026-01-28 | SBOM-FREECRM-20260128 | 初始 | 建立元件清單文件 |

---

*此文件由 audit-dependencies.js 自動產生並手動驗證*
*符合 ISO 27001 A.12.6.1 技術弱點管理要求*
