# CLAUDE.md - ISO 合規開發規則

> 此檔案定義專案開發規則，Claude Code 會自動讀取並套用。

---

## ⚡ 文件產出規則（重要）

### 所有文件必須寫入 Notion

產出以下類型文件時，**必須使用 Notion MCP 寫入對應位置**：

| 文件類型 | Notion 位置 |
|----------|-------------|
| 專案計畫書 | `01-專案管理/[專案名稱]/專案計畫書` |
| 需求規格書 | `01-專案管理/[專案名稱]/需求規格書` |
| 會議紀錄 | `01-專案管理/[專案名稱]/會議紀錄` |
| 風險評估報告 | `02-合規文件/風險評估/[專案]-風險評估報告` |
| PIA 報告 | `02-合規文件/隱私影響評估/[專案]-PIA報告` |
| AIIA 報告 | `02-合規文件/AI影響評估/[專案]-AIIA報告` |
| 合規檢核報告 | `02-合規文件/稽核紀錄/[專案]-合規檢核報告` |
| 技術文件 | `03-知識庫/` 或 GitHub `docs/` |
| 範本 | `04-範本庫/` |

### 寫入流程

```
1. 產出 Markdown 內容
2. 使用 Notion MCP 建立/更新頁面
3. 確認寫入成功
4. 回報頁面連結
```

### 文件 metadata

每份文件開頭必須包含：

```markdown
## 文件資訊
| 項目 | 內容 |
|------|------|
| 文件編號 | [自動產生] |
| 版本 | v1.0 |
| 建立日期 | [當天日期] |
| 專案代號 | [PRJ-YYYY-NNN] |
| 狀態 | 草稿/審核中/已核准 |
```

### 本地備份

除了 Notion，重要文件也要：
1. 存一份到專案 `docs/` 目錄（Git 追蹤）
2. 提醒用戶備份到外接硬碟

---

## 專案基本規範

### 適用 ISO 標準

所有專案預設遵循：
- **ISO 29110** - 小型組織軟體開發生命週期
- **ISO 27001** - 資訊安全管理系統
- **ISO 27701** - 隱私資訊管理（處理個資時）
- **ISO 42001** - AI 管理系統（涉及 AI 時）

### AI 專案判定觸發詞

遇到以下關鍵字時，自動加入 ISO 42001 要求：
- 機器學習、深度學習、LLM、大型語言模型
- AI、人工智慧、模型訓練、推論、微調
- RAG、向量資料庫、Embedding、AI Agent

---

## 技術棧（固定）

```
前端框架：React 18+
全端框架：Next.js 14+ (App Router)
後端環境：Node.js 20 LTS+
UI 標準：WCAG 2.2 Level AAA
RWD 支援：手機 → 4K (8 斷點)
安全標準：CWE Top 25 + OWASP Top 10
```

### 專案結構

```
project-root/
├── src/
│   ├── app/                    # Next.js App Router
│   ├── components/
│   │   ├── ui/                # 基礎 UI 元件
│   │   └── features/          # 功能元件
│   ├── hooks/
│   ├── lib/
│   ├── services/
│   └── types/
├── docs/                       # 技術文件
├── tests/
│   ├── unit/
│   ├── integration/
│   ├── e2e/
│   └── accessibility/
└── compliance/                 # 合規文件
```

---

## WCAG 2.2 AAA 無障礙要求

### 必須遵守

| 項目 | 要求 |
|------|------|
| 文字對比度 | ≥ 7:1（一般文字）、≥ 4.5:1（大文字） |
| 觸控目標 | ≥ 44×44px |
| 鍵盤操作 | 100% 功能可用鍵盤操作 |
| 焦點指示 | 明顯可見（3px outline） |
| 閃爍內容 | 完全禁止 |
| 動畫 | 尊重 `prefers-reduced-motion` |

### 必要實作

```tsx
// 1. 語意化 HTML
<header role="banner">
  <nav role="navigation" aria-label="主選單">
</header>
<main role="main">
<footer role="contentinfo">

// 2. 圖片替代文字
<Image src="..." alt="描述性文字" />
<Image src="decoration.svg" alt="" role="presentation" />

// 3. 表單標籤
<label htmlFor="email">電子郵件</label>
<input id="email" aria-describedby="email-hint" aria-invalid={hasError} />

// 4. 跳至主內容
<a href="#main-content" className="skip-link">跳至主要內容</a>

// 5. 焦點樣式
*:focus-visible {
  outline: 3px solid #0055cc;
  outline-offset: 2px;
}

// 6. 動畫偏好
@media (prefers-reduced-motion: reduce) {
  * { animation-duration: 0.01ms !important; }
}
```

---

## RWD 響應式斷點

### 8 斷點定義

| 斷點 | 範圍 | 裝置 |
|------|------|------|
| `xs` | 0-479px | 小型手機 |
| `sm` | 480-767px | 大型手機 |
| `md` | 768-1023px | 平板直向 |
| `lg` | 1024-1439px | 平板橫向/小筆電 |
| `xl` | 1440-1919px | 桌機 |
| `2xl` | 1920-2559px | Full HD |
| `3xl` | 2560-3839px | 2K/QHD |
| `4k` | 3840px+ | 4K UHD |

### Tailwind 設定

```javascript
// tailwind.config.js
screens: {
  'xs': '480px',
  'sm': '640px',
  'md': '768px',
  'lg': '1024px',
  'xl': '1440px',
  '2xl': '1920px',
  '3xl': '2560px',
  '4k': '3840px',
}
```

### 必須遵守

- 無水平捲軸（320px 起）
- 支援 200% 文字放大
- 觸控目標手機上 ≥ 48×48px

---

## 安全編碼規範

### 🔴 高風險（必須補強）

| CWE | 弱點 | 防護措施 |
|-----|------|----------|
| CWE-79 | XSS | DOMPurify + CSP Header |
| CWE-89 | SQL 注入 | Prisma 參數化 + Zod 驗證 |
| CWE-352 | CSRF | CSRF Token + SameSite Cookie |
| CWE-22 | 路徑遍歷 | path.resolve + 前綴檢查 |
| CWE-78 | 命令注入 | execFile + 白名單 |
| CWE-287 | 身份驗證缺陷 | NextAuth + bcrypt + MFA |

### 🟠 中風險（須補強）

| CWE | 弱點 | 防護措施 |
|-----|------|----------|
| CWE-798 | 硬編碼憑證 | 環境變數 + Secret Manager |
| CWE-918 | SSRF | URL 白名單 + 禁止內部 IP |
| CWE-863 | 不當授權 | RBAC 角色權限 |
| CWE-502 | 不安全反序列化 | Zod Schema 驗證 |
| CWE-400 | 資源消耗 | Rate Limiting |

### 必要實作

```typescript
// 1. 輸入驗證 (Zod)
import { z } from 'zod';
const schema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
});

// 2. XSS 防護
import DOMPurify from 'dompurify';
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }} />

// 3. CSRF Token
response.headers.set('X-CSRF-Token', token);

// 4. Rate Limiting
import { Ratelimit } from '@upstash/ratelimit';
const { success } = await ratelimit.limit(ip);

// 5. 安全 Headers (middleware.ts)
response.headers.set('X-Frame-Options', 'DENY');
response.headers.set('X-Content-Type-Options', 'nosniff');
response.headers.set('Strict-Transport-Security', 'max-age=31536000');
```

### 禁止事項

```typescript
// ❌ 禁止
eval(userInput);
exec(`command ${userInput}`);
dangerouslySetInnerHTML={{ __html: userInput }}
const query = `SELECT * FROM users WHERE id = '${userId}'`;
const API_KEY = 'sk-1234567890';

// ✅ 正確
const result = schema.safeParse(userInput);
execFile('command', [sanitizedArg]);
DOMPurify.sanitize(userInput);
prisma.user.findUnique({ where: { id: userId } });
const API_KEY = process.env.API_KEY;
```

---

## 文件管理

### 三層架構

| 平台 | 用途 | 寫入方式 |
|------|------|----------|
| Notion | 專案管理、合規文件、知識庫 | **MCP 自動寫入** |
| GitHub | 原始碼、技術文件、CI/CD | Git commit |
| 外接硬碟 | 完整備份、加密交付、離線存取 | 手動備份 |

### Notion MCP 使用

產出文件時，使用 Notion MCP 工具：

```
1. notion_search - 搜尋現有頁面
2. notion_create_page - 建立新頁面
3. notion_update_page - 更新頁面內容
4. notion_get_page - 讀取頁面
```

**建立頁面範例：**
- 先用 `notion_search` 找到父頁面
- 用 `notion_create_page` 在該位置建立子頁面
- 寫入 Markdown 內容

### Notion 工作區結構

```
📁 00-公司治理
├── 資訊安全政策 (ISO 27001)
├── 隱私保護政策 (ISO 27701)
├── AI 管理政策 (ISO 42001)
└── 軟體開發程序 (ISO 29110)

📁 01-專案管理
├── 📊 專案總覽 (Database)
└── 📁 [專案名稱]/
    ├── 專案計畫書
    ├── 需求規格書
    ├── 會議紀錄
    └── 變更申請單

📁 02-合規文件
├── 📁 風險評估/
├── 📁 隱私影響評估 (PIA)/
├── 📁 AI 影響評估 (AIIA)/
└── 📁 稽核紀錄/

📁 03-知識庫
├── 技術棧規範
├── 安全編碼指南
├── WCAG 檢核清單
└── RWD 規範

📁 04-範本庫
├── 專案計畫書範本
├── 風險評估報告範本
├── 合規檢核報告範本
└── 客戶交付清單範本
```

### 文件編號規則

```
[類別]-[年度]-[流水號]-[版本]

DOC-POL-2025-001-v1.0  # 政策
DOC-PRC-2025-001-v1.0  # 程序
DOC-RPT-2025-001-v1.0  # 報告
PRJ-2025-001            # 專案代號
```

### Git Commit 規範

```
[類型]([範圍]): [簡述]

類型：feat|fix|docs|security|a11y|refactor|test|chore

範例：
security(auth): 修復 JWT 過期驗證漏洞
a11y(form): 新增表單錯誤提示的 ARIA 標籤
feat(user): 實作使用者註冊功能
```

### Git 推送規則（重要）

**每次 commit 後必須立即推送到 GitHub：**

```bash
# 標準流程
git add [files]
git commit -m "[類型]([範圍]): [簡述]"
git push origin main
```

**規則：**
1. 每次 commit 後**必須**執行 `git push`
2. 不允許累積多個 commit 才推送
3. 推送前確保通過 ESLint 檢查
4. 推送失敗時立即處理衝突

### 加密交付

客戶交付原始碼須：
1. 7-Zip 壓縮 + AES-256 加密
2. GPG 對稱加密（雙重保護）
3. SHA256 校驗碼
4. 密碼分離傳遞（電話/簡訊）

---

## PDCA 開發流程

### Plan 階段

- [ ] 專案範圍定義
- [ ] Notion 建立專案頁面
- [ ] GitHub 建立 Repo
- [ ] 風險評估（ISO 27001）
- [ ] PIA 隱私影響評估（如處理個資）
- [ ] AIIA AI 影響評估（如涉及 AI）

### Do 階段

- [ ] 遵循技術棧規範
- [ ] 實作 WCAG 2.2 AAA 無障礙
- [ ] 實作 RWD 8 斷點
- [ ] 安全編碼（CWE/OWASP）
- [ ] 程式碼審查

### Check 階段

- [ ] ESLint security plugin 掃描
- [ ] npm audit 弱點掃描
- [ ] axe-core 無障礙測試
- [ ] 各斷點 RWD 測試
- [ ] 單元測試 > 80%
- [ ] E2E 測試關鍵路徑

### Act 階段

- [ ] 弱點修補
- [ ] 矯正措施
- [ ] 備份至外接硬碟
- [ ] 更新 Notion 狀態

---

## 必要套件

```json
{
  "dependencies": {
    "next": "^14.x",
    "react": "^18.x",
    "next-auth": "^4.x",
    "zod": "^3.x",
    "@upstash/ratelimit": "^1.x",
    "dompurify": "^3.x"
  },
  "devDependencies": {
    "eslint-plugin-jsx-a11y": "^6.x",
    "eslint-plugin-security": "^2.x",
    "@axe-core/react": "^4.x",
    "playwright": "^1.x"
  }
}
```

---

## 快速參考

| 需求 | 做法 |
|------|------|
| 新專案 | 建立 Notion 頁面 + GitHub Repo + 風險評估 |
| AI 專案 | 加入 ISO 42001 + AIIA |
| 處理個資 | 加入 ISO 27701 + PIA |
| 客戶交付 | 7-Zip + GPG 加密 |
| 備份 | 週備份至外接硬碟 |
