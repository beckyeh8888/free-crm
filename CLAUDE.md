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
| 會議紀錄 | `01-專案管理/[專案名稱]/會議紀錄/` |
| 開發變更紀錄 | `01-專案管理/[專案名稱]/開發紀錄/` |
| 風險評估報告 | `02-合規文件/風險評估/[專案]-風險評估報告` |
| PIA 報告 | `02-合規文件/隱私影響評估/[專案]-PIA報告` |
| AIIA 報告 | `02-合規文件/AI影響評估/[專案]-AIIA報告` |
| 合規檢核報告 | `02-合規文件/稽核紀錄/[專案]-合規檢核報告` |
| API 文件 | `03-知識庫/API 文件/[專案名稱]/` |
| 前端元件文件 | `03-知識庫/前端文件/[專案名稱]/元件/` |
| 資料庫文件 | `03-知識庫/資料庫文件/[專案名稱]/` |
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

## SonarQube 程式碼品質規範

### ISO 27001 對應

| 條款 | 要求 | SonarQube 功能 |
|------|------|----------------|
| A.12.6.1 | 技術弱點管理 | Security Hotspots + Vulnerabilities |
| A.14.2.1 | 安全開發政策 | Quality Gate + Code Smells |
| A.14.2.5 | 安全系統工程原則 | 規則集 + 最佳實踐檢查 |

### 部署選項（免費）

| 選項 | 適用場景 | 設定方式 |
|------|----------|----------|
| SonarCloud | 公開專案 | GitHub 登入 → Import 專案 |
| SonarQube Community | 私有專案 | Docker 自架 |

### SonarQube Docker 快速啟動

```bash
# 啟動 SonarQube Community Edition
docker run -d --name sonarqube \
  -p 9000:9000 \
  -v sonarqube_data:/opt/sonarqube/data \
  -v sonarqube_logs:/opt/sonarqube/logs \
  sonarqube:community

# 預設帳號: admin / admin
# 登入後產生 Token 供 CI 使用
```

### 品質門檻 (Quality Gate)

| 指標 | 門檻 | 說明 |
|------|------|------|
| 覆蓋率 | ≥ 80% | 新程式碼測試覆蓋率 |
| 重複程式碼 | ≤ 3% | 重複區塊比例 |
| 可維護性評級 | A | Code Smells 密度 |
| 可靠性評級 | A | Bugs 密度 |
| 安全性評級 | A | Vulnerabilities 密度 |
| 安全熱點 | 已審查 | 無未審查的安全熱點 |

### GitHub Secrets 設定

| Secret | 說明 | 必要性 |
|--------|------|--------|
| `SONAR_TOKEN` | SonarQube/Cloud 存取 Token | 必要 |
| `SONAR_HOST_URL` | 自架 SonarQube URL | 僅自架需要 |

### GitHub Variables 設定

| Variable | 說明 | 預設值 |
|----------|------|--------|
| `USE_SELF_HOSTED_SONAR` | 使用自架 SonarQube | `false` |
| `SONAR_PROJECT_KEY` | 專案識別碼 | `free-crm` |
| `SONAR_ORGANIZATION` | SonarCloud 組織 | - |

### 相關檔案

| 檔案 | 用途 |
|------|------|
| `sonar-project.properties` | SonarQube 專案設定 |
| `.github/workflows/sonarqube.yml` | CI/CD 自動分析 |

### 常見問題修復

```typescript
// ❌ SonarQube: Cognitive Complexity 過高
function complexFunction() {
  if (a) {
    if (b) {
      if (c) { /* 巢狀過深 */ }
    }
  }
}

// ✅ 重構：提早返回、拆分函數
function improvedFunction() {
  if (!a) return;
  if (!b) return;
  if (!c) return;
  // 核心邏輯
}

// ❌ SonarQube: 不應忽略 Promise 返回值
async function fetchData() {
  fetch('/api/data'); // 未 await
}

// ✅ 正確處理 Promise
async function fetchData() {
  await fetch('/api/data');
}

// ❌ SonarQube: 硬編碼憑證
const password = "admin123";

// ✅ 使用環境變數
const password = process.env.ADMIN_PASSWORD;
```

### 執行本地分析

```bash
# 安裝 sonar-scanner
npm install -g sonarqube-scanner

# 執行測試產生覆蓋率報告
npm run test:coverage

# 執行 SonarQube 分析
sonar-scanner \
  -Dsonar.host.url=http://localhost:9000 \
  -Dsonar.token=YOUR_TOKEN
```

---

## TypeScript/React 編碼規範（SonarCloud Code Smells 預防）

> 此規範基於 2026-01-28 SonarCloud 掃描修復經驗，用於預防常見 Code Smells。

### S6759: React Props 必須標記 readonly

**所有 React Props interface 的屬性必須加上 `readonly` 修飾符。**

```typescript
// ❌ 錯誤：Props 未標記 readonly
interface ButtonProps {
  variant: 'primary' | 'secondary';
  size: 'sm' | 'md' | 'lg';
  onClick: () => void;
}

// ✅ 正確：所有屬性標記 readonly
interface ButtonProps {
  readonly variant: 'primary' | 'secondary';
  readonly size: 'sm' | 'md' | 'lg';
  readonly onClick: () => void;
}

// ✅ 陣列也要用 readonly
interface DataTableProps<T> {
  readonly columns: readonly Column<T>[];
  readonly data: readonly T[];
}
```

### S4325: 避免不必要的類型斷言

**TypeScript 已能推斷類型時，不要使用 `as` 斷言。**

```typescript
// ❌ 錯誤：不必要的類型斷言
const user = await prisma.user.findUnique({ where: { id } }) as User;
const items = [] as string[];

// ✅ 正確：讓 TypeScript 自動推斷
const user = await prisma.user.findUnique({ where: { id } });
const items: string[] = [];

// ✅ 必要時使用類型守衛
if (user && 'email' in user) {
  // TypeScript 知道 user 有 email 屬性
}
```

### S1874: 使用正確的 React 事件類型

**避免使用已棄用的事件類型。**

```typescript
// ❌ 錯誤：使用棄用的 FormEvent
import { FormEvent } from 'react';
const handleSubmit = (e: FormEvent) => { ... };

// ✅ 正確：使用完整的泛型類型
const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => { ... };

// ✅ 正確：其他常用事件類型
const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => { ... };
const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => { ... };
```

### S1128: 移除未使用的 Import

**所有 import 必須被使用，否則立即移除。**

```typescript
// ❌ 錯誤：有未使用的 import
import { useState, useEffect, useCallback } from 'react';  // useCallback 未使用

// ✅ 正確：只 import 使用到的
import { useState, useEffect } from 'react';
```

### S6582: 使用 Optional Chaining

**優先使用 `?.` 取代 `&&` 鏈式呼叫。**

```typescript
// ❌ 錯誤：使用 && 鏈式呼叫
const name = user && user.profile && user.profile.name;

// ✅ 正確：使用 optional chaining
const name = user?.profile?.name;

// ✅ 搭配 nullish coalescing 使用
const name = user?.profile?.name ?? 'Unknown';
```

### S3358: 避免巢狀三元運算子

**三元運算子不可巢狀，改用 if-else 或函數。**

```typescript
// ❌ 錯誤：巢狀三元運算子
const status = isActive ? 'active' : isPending ? 'pending' : 'inactive';

// ✅ 正確：使用函數或 if-else
function getStatus(isActive: boolean, isPending: boolean): string {
  if (isActive) return 'active';
  if (isPending) return 'pending';
  return 'inactive';
}

// ✅ 或使用物件映射
const statusMap = { active: 'active', pending: 'pending', default: 'inactive' };
```

### S3776: 控制認知複雜度

**函數認知複雜度不得超過 15。**

```typescript
// ❌ 錯誤：複雜度過高的函數
function processData(data: Data) {
  if (data.type === 'A') {
    if (data.status === 'active') {
      if (data.items.length > 0) {
        // 巢狀太深
      }
    }
  }
}

// ✅ 正確：提早返回 + 拆分函數
function processData(data: Data) {
  if (data.type !== 'A') return;
  if (data.status !== 'active') return;
  if (data.items.length === 0) return;

  processActiveItems(data.items);
}

function processActiveItems(items: Item[]) {
  // 獨立的處理邏輯
}
```

### S6479: 避免使用 Array Index 作為 React Key

**React key 必須使用唯一且穩定的識別符。**

```typescript
// ❌ 錯誤：使用 array index 作為 key
{items.map((item, index) => (
  <ListItem key={index} item={item} />
))}

// ✅ 正確：使用唯一 ID
{items.map((item) => (
  <ListItem key={item.id} item={item} />
))}

// ✅ 如果沒有 ID，產生穩定的 key
{items.map((item) => (
  <ListItem key={`${item.name}-${item.email}`} item={item} />
))}
```

### 編碼檢查清單

每次提交前，確認以下項目：

- [ ] 所有 React Props interface 的屬性都有 `readonly`
- [ ] 沒有不必要的 `as` 類型斷言
- [ ] 使用 `React.FormEvent<HTMLFormElement>` 等完整事件類型
- [ ] 沒有未使用的 import
- [ ] 使用 `?.` 取代 `&&` 鏈式呼叫
- [ ] 沒有巢狀三元運算子
- [ ] 函數認知複雜度 ≤ 15
- [ ] React key 使用唯一 ID，不使用 array index

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
    ├── 📁 會議紀錄/
    ├── 📁 開發紀錄/
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
├── RWD 規範
├── 📁 API 文件/
│   └── 📁 [專案名稱]/
├── 📁 前端文件/
│   └── 📁 [專案名稱]/元件/
└── 📁 資料庫文件/
    └── 📁 [專案名稱]/

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

## 開發文件規範

### 會議紀錄範本

每次討論或會議後，須建立會議紀錄：

```markdown
## 會議資訊
| 項目 | 內容 |
|------|------|
| 日期 | YYYY-MM-DD |
| 參與者 | @人員列表 |
| 主題 | [會議主題] |

## 討論摘要
- 重點 1
- 重點 2

## 決議事項
| 項目 | 負責人 | 期限 |
|------|--------|------|
| 決議 1 | @人員 | YYYY-MM-DD |

## 待辦追蹤
- [ ] 待辦 1
- [ ] 待辦 2
```

### 開發變更紀錄範本

每次開發變更須記錄，使用以下類型標籤：
- `[新增]` - 新功能、新元件、新 API
- `[修改]` - 功能調整、重構、樣式變更
- `[刪除]` - 移除功能、棄用 API
- `[修復]` - Bug 修復
- `[安全]` - 安全性修補

```markdown
### YYYY-MM-DD

#### [新增] 功能名稱
- **檔案**: `src/path/to/file.tsx`
- **說明**: 功能描述
- **影響範圍**: 相關模組
- **commit**: `abc1234`

#### [修改] 功能名稱
- **檔案**: `src/path/to/file.tsx`
- **變更內容**:
  - 原本：舊行為
  - 現在：新行為
- **原因**: 為什麼要改
- **commit**: `def5678`
```

### API 文件範本

每個 API 端點須有文件：

```markdown
### [HTTP Method] /api/path

#### 基本資訊
| 項目 | 內容 |
|------|------|
| 端點 | `/api/path` |
| 方法 | GET / POST / PUT / DELETE |
| 認證 | 需要 / 不需要 |
| 權限 | admin / user / public |

#### 請求參數

**Query Parameters:**
| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| page | number | 否 | 頁碼，預設 1 |

**Request Body:**
\`\`\`json
{
  "field": "type - 說明"
}
\`\`\`

#### 回應格式

**成功 (200):**
\`\`\`json
{
  "success": true,
  "data": { }
}
\`\`\`

**錯誤 (4xx/5xx):**
\`\`\`json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "錯誤訊息"
  }
}
\`\`\`
```

### 前端元件文件範本

每個元件須有文件（Storybook 為主要來源）：

```markdown
### ComponentName

#### 基本資訊
| 項目 | 內容 |
|------|------|
| 檔案位置 | `src/components/ui/ComponentName/` |
| Storybook | [連結] |
| 無障礙等級 | WCAG 2.2 AAA |

#### Props
| Prop | 類型 | 必填 | 預設值 | 說明 |
|------|------|------|--------|------|
| variant | 'primary' \| 'secondary' | 否 | 'primary' | 視覺變體 |
| size | 'sm' \| 'md' \| 'lg' | 否 | 'md' | 尺寸 |

#### 使用範例
\`\`\`tsx
import { ComponentName } from '@/components/ui';

<ComponentName variant="primary" size="md">
  內容
</ComponentName>
\`\`\`

#### 無障礙考量
- 鍵盤操作：支援 Tab、Enter、Escape
- ARIA 屬性：自動處理
- 焦點管理：...
```

### 資料庫文件範本

每個資料表須有文件：

```markdown
### Table: table_name

#### 基本資訊
| 項目 | 內容 |
|------|------|
| 用途 | 資料表用途說明 |
| 關聯 | 與哪些表有關聯 |

#### 欄位定義
| 欄位 | 類型 | 必填 | 說明 |
|------|------|------|------|
| id | String (CUID) | 是 | 主鍵 |
| name | String | 是 | 名稱 |
| email | String | 是 | 電子郵件 (unique) |
| created_at | DateTime | 是 | 建立時間 |

#### 索引
| 索引名稱 | 欄位 | 類型 |
|----------|------|------|
| idx_email | email | UNIQUE |
| idx_created | created_at | INDEX |

#### 關聯圖
\`\`\`
Customer 1 ──── N Contact
    │
    └──── N Deal
\`\`\`
```

---

## 文件更新規範（可稽核）

### 更新觸發時機

以下情況須執行 `/update-docs` 更新 Notion 文件：
- 每次 git commit 後
- 新增/修改/刪除 API 時
- 新增/修改/刪除 UI 元件時
- 資料庫 schema 變更時
- 安全性修補時

### 變更紀錄流水號規則

每筆變更紀錄必須有唯一流水號，格式如下：

```
CHG-[類型]-[日期]-[序號]
```

| 欄位 | 格式 | 說明 |
|------|------|------|
| CHG | 固定 | Change 變更紀錄前綴 |
| 類型 | 3字母 | DEV/API/UI/DB/SEC |
| 日期 | YYYYMMDD | 變更日期 |
| 序號 | 3位數 | 當日該類型的流水號 |

**類型代碼：**

| 代碼 | 說明 | 範例 |
|------|------|------|
| DEV | 一般開發變更 | `CHG-DEV-20260126-001` |
| API | API 端點變更 | `CHG-API-20260126-001` |
| UI | 前端元件變更 | `CHG-UI-20260126-001` |
| DB | 資料庫變更 | `CHG-DB-20260126-001` |
| SEC | 安全性修補 | `CHG-SEC-20260126-001` |

### 更新紀錄格式

每筆變更紀錄必須包含：

| 項目 | 說明 | 範例 |
|------|------|------|
| 流水號 | CHG-XXX-YYYYMMDD-NNN | `CHG-API-20260126-001` |
| 日期時間 | YYYY-MM-DD HH:mm | 2026-01-26 15:30 |
| 變更類型 | [新增/修改/刪除/修復/安全] | [新增] |
| 影響檔案 | 完整檔案路徑 | `src/app/api/customers/route.ts` |
| commit hash | Git commit 短 hash | `abc1234` |
| 變更說明 | 簡要描述變更內容 | 新增客戶 CRUD API |

### 使用方式

```bash
# 更新開發紀錄
/update-docs dev

# 更新 API 文件
/update-docs api

# 更新前端元件文件
/update-docs ui

# 更新資料庫文件
/update-docs db

# 全部更新
/update-docs all
```

### Notion 文件 ID 對照表

| 文件 | Page ID |
|------|---------|
| Free CRM 專案 | `2f4fc190-4a3f-8140-affc-d49f21807ce0` |
| 專案計畫書 | `2f4fc190-4a3f-81fc-a032-db82c3d30b5f` |
| 需求規格書 | `2f4fc190-4a3f-8139-a04c-cbbacd71da0b` |
| 開發紀錄 | `2f4fc190-4a3f-8125-b675-da557a0dcd25` |
| 測試計畫 | `2f4fc190-4a3f-810d-a5bc-eb7a18f5f6b2` |
| 測試紀錄 | `2f4fc190-4a3f-81b5-bb9b-c175b69f309b` |
| 會議紀錄 | `2f4fc190-4a3f-819a-b228-ded3a56389ee` |
| API 文件 | `2f4fc190-4a3f-812f-9ff2-e94af1ec2aff` |
| 前端元件文件 | `2f4fc190-4a3f-81a8-bdcf-e4df3eb70ead` |
| 資料庫文件 | `2f4fc190-4a3f-8109-a2c3-c18145a48aa4` |
| 風險評估報告 | `2f4fc190-4a3f-818d-a955-cd0af49d3743` |
| PIA 報告 | `2f4fc190-4a3f-8142-ac76-debfc29a3ab4` |
| AIIA 報告 | `2f4fc190-4a3f-81b5-8f39-d88acd5ae992` |
| 02-合規文件 | `2f4fc190-4a3f-81bd-8b2e-deb3fe9fd302` |
| 程式碼品質報告 | `2f6fc190-4a3f-8106-a2d3-cf01ee1b6d8c` |

### 稽核合規

此文件更新機制符合以下 ISO 標準：
- **ISO 27001 A.12.1.2** - 變更管理
- **ISO 27001 A.12.4.1** - 事件日誌記錄
- **ISO 29110 PM.4** - 軟體配置管理

---

## 測試規範（可稽核）

### 測試分層架構

| 層級 | 工具 | 目標 | 覆蓋率要求 |
|------|------|------|------------|
| 單元測試 | Vitest | 函數、元件 | > 80% |
| 整合測試 | Vitest | API、資料庫 | > 70% |
| E2E 測試 | Playwright | 使用者流程 | 關鍵路徑 100% |
| 無障礙測試 | axe-core | WCAG 2.2 AAA | 100% 通過 |

### 測試命令

```bash
# 單元測試
npm run test:unit

# 整合測試
npm run test:integration

# E2E 測試
npm run test:e2e

# E2E 測試（GUI 模式）
npm run test:e2e:ui

# 無障礙測試
npm run test:a11y

# 覆蓋率報告
npm run test:coverage

# 全部測試
npm run test:all
```

### 測試檔案命名規範

| 類型 | 位置 | 命名 |
|------|------|------|
| 單元測試 | `tests/unit/` | `*.test.ts` |
| 整合測試 | `tests/integration/` | `*.test.ts` |
| E2E 測試 | `tests/e2e/` | `*.spec.ts` |
| HTTP 測試 | `tests/http/` | `*.http` |

### 測試報告輸出

```
test-results/
├── coverage/           # 覆蓋率報告 (HTML)
├── playwright-report/  # E2E 報告 (HTML)
├── screenshots/        # 失敗截圖
└── junit.xml          # CI/CD 格式
```

### 測試紀錄格式（Notion）

每次測試執行須記錄：

```markdown
### TEST-YYYYMMDD-NNN
- **日期**: 2026-01-26 16:00
- **類型**: [單元/整合/E2E/無障礙]
- **結果**: ✅ 通過 / ❌ 失敗
- **覆蓋率**: 85%
- **失敗數**: 0
- **截圖**: [連結]
```

### API 測試工具

推薦使用 VS Code REST Client 擴展：

```bash
# 安裝擴展
code --install-extension humao.rest-client
```

測試檔案位於 `tests/http/*.http`

---

## 測試文件規範（ISO 27001 合規）

### 文件類型與頻率

| 文件類型 | 頻率 | Notion 位置 |
|----------|------|-------------|
| Sprint 測試計畫 | 每個 Sprint 一份 | `01-專案管理/[專案名稱]/測試計畫/` |
| 測試執行紀錄 | 每次測試即時建立 | `01-專案管理/[專案名稱]/測試紀錄/` |
| Claude 對話紀錄 | 每次對話即時建立 | `01-專案管理/[專案名稱]/會議紀錄/` |

### Sprint 測試計畫範本

**文件編號**: `TP-[專案代號]-Sprint[N]`
**Notion 位置**: `01-專案管理/[專案名稱]/測試計畫/Sprint-[N]-測試計畫`

```markdown
## 文件資訊
| 項目 | 內容 |
|------|------|
| 文件編號 | TP-[專案代號]-Sprint[N] |
| 版本 | v1.0 |
| 建立日期 | YYYY-MM-DD |
| Sprint | Sprint [N] |
| 測試期間 | YYYY-MM-DD ~ YYYY-MM-DD |
| 狀態 | 計畫中/執行中/已完成 |

## 測試範圍

### 本 Sprint 功能範圍
| 功能 | User Story | 優先級 |
|------|-----------|--------|
| [功能名稱] | US-001 | 高/中/低 |

### 測試類型
- [ ] 單元測試 (Unit Tests)
- [ ] 整合測試 (Integration Tests)
- [ ] E2E 測試 (End-to-End Tests)
- [ ] 無障礙測試 (Accessibility Tests)

## 測試案例清單

### 整合測試
| ID | 測試項目 | 測試檔案 | 預期結果 |
|----|---------|---------|---------|
| IT-001 | [測試描述] | `tests/integration/xxx.test.ts` | Pass |

### E2E 測試
| ID | 測試項目 | 測試檔案 | 預期結果 |
|----|---------|---------|---------|
| E2E-001 | [測試描述] | `tests/e2e/xxx.spec.ts` | Pass |

## 測試環境
| 項目 | 規格 |
|------|------|
| Node.js | v20.x |
| 測試框架 | Vitest 4.x / Playwright 1.x |
| 資料庫 | SQLite (test.db) |

## 驗收標準
- [ ] 所有測試通過
- [ ] 程式碼覆蓋率 ≥ 80%
- [ ] 無 Critical/High 等級缺陷
- [ ] 無障礙測試通過 WCAG 2.2 AAA
```

### 測試執行紀錄範本

**文件編號**: `TR-[專案代號]-[YYYYMMDD]-[序號]`
**Notion 位置**: `01-專案管理/[專案名稱]/測試紀錄/[日期]-測試執行紀錄`

```markdown
## 文件資訊
| 項目 | 內容 |
|------|------|
| 文件編號 | TR-[專案代號]-[YYYYMMDD]-[序號] |
| 執行日期 | YYYY-MM-DD HH:MM |
| 執行者 | Claude Code / [人員] |
| Sprint | Sprint [N] |
| 關聯測試計畫 | TP-[專案代號]-Sprint[N] |

## 執行摘要
| 項目 | 數值 |
|------|------|
| 總測試數 | [N] |
| 通過數 | [N] |
| 失敗數 | [N] |
| 通過率 | [N]% |
| 執行時間 | [N]s |

## 覆蓋率報告
| 指標 | 覆蓋率 | 目標 | 狀態 |
|------|-------|------|------|
| Lines | [N]% | 80% | ✓/✗ |
| Functions | [N]% | 80% | ✓/✗ |
| Branches | [N]% | 80% | ✓/✗ |
| Statements | [N]% | 80% | ✓/✗ |

## 測試結果詳情
[測試輸出摘要]

## 失敗測試分析
| 測試 | 錯誤訊息 | 根因分析 | 修復狀態 |
|------|---------|---------|---------|
| [測試名稱] | [錯誤] | [分析] | 待修復/已修復 |
```

### Claude 對話紀錄範本

**文件編號**: `MTG-[專案代號]-[YYYYMMDD]-[序號]`
**Notion 位置**: `01-專案管理/[專案名稱]/會議紀錄/[日期]-Claude-對話紀錄`

```markdown
## 對話資訊
| 項目 | 內容 |
|------|------|
| 文件編號 | MTG-[專案代號]-[YYYYMMDD]-[序號] |
| 日期時間 | YYYY-MM-DD HH:MM ~ HH:MM |
| 參與者 | @用戶, Claude Code |
| 主題標籤 | #開發 #測試 #架構 #除錯 |

## 對話摘要
[1-3 句話概述本次對話的主要內容和成果]

## 討論主題

### 主題 1: [主題名稱]
**用戶需求**: [用戶提出的需求或問題]
**Claude 回應**: [Claude 的分析和建議]
**決議**: [最終決定]

## 執行項目

### 程式碼變更
| 檔案 | 變更類型 | 說明 |
|------|---------|------|
| `src/path/file.ts` | 新增/修改/刪除 | [說明] |

### 測試執行
| 測試類型 | 結果 | 通過率 |
|---------|------|--------|
| 整合測試 | Pass/Fail | [N]% |

## 決議事項
| 項目 | 負責人 | 期限 | 狀態 |
|------|--------|------|------|
| [決議 1] | @用戶/@Claude | YYYY-MM-DD | 待辦/完成 |

## 待辦追蹤
- [ ] 待辦事項 1
- [ ] 待辦事項 2

## 相關連結
- 測試紀錄: [連結]
- Git Commit: [commit hash]
```

### 即時同步工作流程

**觸發時機與動作：**

| 觸發事件 | 動作 | Notion 目標 |
|----------|------|-------------|
| Sprint 開始 | 建立測試計畫 | `測試計畫/Sprint-N-測試計畫` |
| 執行測試後 | 建立測試紀錄 | `測試紀錄/[日期]-測試執行紀錄` |
| 對話結束前 | 建立對話紀錄 | `會議紀錄/[日期]-Claude-對話紀錄` |
| 發現缺陷時 | 更新缺陷追蹤 | 測試紀錄內的缺陷表 |

**同步規則：**
1. 測試完成後 → **立即**建立測試執行紀錄
2. 對話結束前 → **必須**建立對話紀錄
3. 每筆紀錄必須有唯一文件編號

### 稽核合規對照

此測試文件規範符合以下 ISO 標準：

| ISO 標準 | 條款 | 對應文件 |
|----------|------|----------|
| ISO 27001 | A.12.1.2 變更管理 | 測試執行紀錄 |
| ISO 27001 | A.12.4.1 事件日誌 | Claude 對話紀錄 |
| ISO 29110 | PM.4 軟體配置管理 | Sprint 測試計畫 |
| ISO 29110 | SI.5 軟體整合與測試 | 測試執行紀錄 |

---

## 第三方元件管理規範（ISO 27001 合規）

### ISO 27001 對應條款

| 條款 | 要求 | 對應功能 |
|------|------|----------|
| A.12.6.1 | 技術弱點管理 | 每日 `npm audit` 掃描 |
| A.15.1.1 | 供應商關係的資訊安全政策 | 元件清單與審核流程 |
| A.15.1.2 | 供應商協議中的安全處理 | 授權條款追蹤 |
| A.18.1.2 | 智慧財產權 | 套件授權合規檢查 |

### 元件審查命令

```bash
# 安全掃描
npm run audit:security

# 檢查過期套件
npm run audit:outdated

# 授權合規檢查
npm run audit:license

# 完整審查報告
npm run audit:full

# Markdown 格式報告
npm run audit:report

# 產生 SBOM (Software Bill of Materials)
npm run audit:sbom
```

### 允許的授權清單

| 授權 | 狀態 | 說明 |
|------|------|------|
| MIT | ✅ 允許 | 最寬鬆，無限制 |
| Apache-2.0 | ✅ 允許 | 需保留版權聲明 |
| ISC | ✅ 允許 | 類似 MIT |
| BSD-2-Clause | ✅ 允許 | 需保留版權聲明 |
| BSD-3-Clause | ✅ 允許 | 需保留版權聲明 |
| MPL-2.0 | ⚠️ 審核 | 修改檔案需開源 |
| GPL-3.0 | ❌ 禁止 | 需完整開源 |
| LGPL | ⚠️ 審核 | 動態連結可接受 |
| 未知/專有 | ❌ 禁止 | 需法務審核 |

### 元件變更紀錄規則

每次新增、刪除或升級套件時，必須：

1. **記錄變更編號**：`DEP-YYYYMMDD-NNN`
2. **Git commit 訊息格式**：
   ```
   deps([範圍]): [動作] [套件名稱]

   [詳細說明]

   變更編號: DEP-YYYYMMDD-NNN
   ```

3. **動作類型**：
   | 動作 | 說明 |
   |------|------|
   | `add` | 新增套件 |
   | `remove` | 移除套件 |
   | `upgrade` | 升級版本 |
   | `downgrade` | 降級版本 |

4. **範例**：
   ```
   deps(security): add @sentry/nextjs for error tracking

   - Added production dependency for error monitoring
   - License: MIT (compliant)
   - No known vulnerabilities

   變更編號: DEP-20260128-001
   ```

### 變更風險等級

| 變更類型 | 代碼 | 風險等級 | 需要審核 |
|----------|------|----------|----------|
| 新增套件 | ADD | 中-高 | 是 |
| 刪除套件 | DEL | 低 | 是 |
| 次版本升級 (patch) | UPG-P | 低 | 否 (自動) |
| 次版本升級 (minor) | UPG-M | 中 | 建議 |
| 主版本升級 (major) | UPG-J | 高 | 必須 |
| 版本降級 | DWN | 高 | 必須 |

### Notion 元件清單位置

| 文件 | Notion 位置 |
|------|-------------|
| 元件清單 | `02-合規文件/第三方元件清單/Free-CRM-元件清單` |
| 變更紀錄 | `02-合規文件/第三方元件清單/元件變更紀錄` |
| 審查紀錄 | `02-合規文件/第三方元件清單/每日審查紀錄` |

### CI/CD 自動審查

GitHub Actions workflow 會在以下情況自動執行：

1. **每日排程**：UTC 00:00 (台北 08:00)
2. **依賴變更時**：`package.json` 或 `package-lock.json` 變更
3. **手動觸發**：可選擇是否產生 SBOM

**檢查項目**：
- npm audit 安全掃描
- 授權合規檢查
- 過期套件報告
- SBOM 產生 (CycloneDX 格式)

### 新增套件審核流程

```
開發者需要新套件
      ↓
1. 確認是否有替代方案
2. 檢查套件授權是否合規
3. 檢查套件維護狀態
4. 執行 npm audit 確認無漏洞
      ↓
┌─────────────────────────────────────┐
│ 記錄到 Notion 元件變更紀錄           │
│ 包含：套件名稱、版本、授權、用途、位置 │
└─────────────────────────────────────┘
      ↓
npm install [套件]
      ↓
git commit -m "deps(xxx): add [套件名稱]"
      ↓
CI/CD 自動執行安全掃描
```

### 每日審查流程（Daily Audit）

**重要**：過期套件及漏洞必須每天審查，避免安全問題。

#### 審查紀錄存放位置

| 類型 | 位置 |
|------|------|
| 本地紀錄 | `docs/compliance/audit-logs/YYYY-MM-DD-audit.md` |
| Notion 紀錄 | `02-合規文件/第三方元件清單/每日審查紀錄` |

#### 每日檢查清單

```bash
# 1. 執行安全掃描
npm run audit:security

# 2. 檢查過期套件
npm run audit:outdated

# 3. 產生完整報告
npm run audit:full
```

#### 審查結果處理

| 結果 | 行動 | 時限 |
|------|------|------|
| Critical/High 漏洞 | **立即修復**或移除套件 | 24 小時內 |
| Moderate 漏洞 | 評估風險，規劃修復 | 7 天內 |
| Low 漏洞 | 追蹤觀察 | 下次 Sprint |
| 過期套件 (patch) | 自動更新 | 當日 |
| 過期套件 (minor) | 評估後更新 | 7 天內 |
| 過期套件 (major) | 規劃遷移 | 下次 Sprint |

#### 無法立即修復的漏洞處理

當漏洞存在於依賴鏈中（如 prisma → hono）且無法立即修復時：

1. **風險評估**：記錄漏洞影響範圍（生產/開發環境）
2. **緩解措施**：記錄可採取的臨時防護措施
3. **追蹤計畫**：設定追蹤頻率和預期修復時間
4. **文件化**：在審查紀錄中詳細說明

#### 審查紀錄範本

**文件編號**: `AUDIT-YYYYMMDD-NNN`

```markdown
# 第三方元件審查紀錄

## 文件資訊

| 項目 | 內容 |
|------|------|
| 文件編號 | AUDIT-YYYYMMDD-NNN |
| 審查日期 | YYYY-MM-DD |
| 審查人員 | [人員/Claude Code] |
| 審查類型 | 安全掃描 + 過期檢查 + 授權合規 |

## 執行摘要

| 項目 | 數值 | 狀態 |
|------|------|------|
| 整體狀態 | PASS/REVIEW/WARNING/CRITICAL | ✅/⚠️/🟠/🔴 |
| Critical 漏洞 | [N] | ✅/🔴 |
| High 漏洞 | [N] | ✅/🔴 |
| Moderate 漏洞 | [N] | ✅/⚠️ |
| 過期套件 | [N] | ✅/⚠️ |
| 授權合規 | [N]/[總數] | ✅/❌ |

## 本次更新套件

| 套件 | 舊版本 | 新版本 | 原因 |
|------|--------|--------|------|
| [套件名] | [舊] | [新] | [修復漏洞/Patch更新] |

## 未修復漏洞分析

### [漏洞等級]: [套件名稱]

| CVE/Advisory | 說明 | 影響範圍 |
|--------------|------|----------|
| [CVE編號] | [漏洞說明] | [生產/開發環境] |

**依賴鏈**: [root → dep1 → dep2 → 有漏洞的套件]
**風險評估**: [低/中/高]，[評估原因]
**修復方案**: [等待上游更新/替換套件/其他]

## 後續追蹤

- [ ] 追蹤 [套件] 更新以修復 [漏洞]
- [ ] 下次審查日期: YYYY-MM-DD

---
*此報告符合 ISO 27001 A.12.6.1 技術弱點管理要求*
```

#### 整體狀態判定

| 狀態 | 條件 |
|------|------|
| PASS | 無漏洞、授權合規、過期套件 ≤ 5 |
| REVIEW | Moderate 漏洞或需審核授權 |
| WARNING | 授權不合規或過期套件 > 10 |
| CRITICAL | 有 Critical 或 High 漏洞 |

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
