# Storybook 元件庫指南

> Free CRM UI 元件庫使用說明

---

## 快速開始

### 啟動 Storybook

```bash
npm run storybook
```

訪問 http://localhost:6006 瀏覽元件庫。

### 建置靜態版本

```bash
npm run build-storybook
```

輸出至 `storybook-static/` 目錄。

---

## 元件總覽

### 基礎元件 (Basic)

| 元件 | 說明 | Stories |
|------|------|---------|
| Button | 按鈕 | Default, Variants, Sizes, Loading, Disabled |
| TextInput | 文字輸入框 | Default, With Label, Error, Disabled |
| Select | 下拉選單 | Default, With Options, Disabled |

### CRM 元件 (CRM)

| 元件 | 說明 | Stories |
|------|------|---------|
| DataTable | 資料表格 | Default, Empty, ManyRows, LongText, Loading, Error |
| Pagination | 分頁 | Default, FirstPage, LastPage, ManyPages |
| FilterBar | 篩選列 | Default, WithValues, Loading, Vertical |

### 狀態元件 (State)

| 元件 | 說明 | Stories |
|------|------|---------|
| EmptyState | 空狀態 | Default, WithAction, CustomIcon |
| LoadingState | 載入中 | Spinner, Skeleton, Dots, FullPage |
| ErrorState | 錯誤狀態 | Default, Network, NotFound, WithRetry |

---

## 使用方式

### 匯入元件

```tsx
// 單一匯入
import { Button } from '@/components/ui/Button';
import { DataTable } from '@/components/ui/DataTable';

// 批量匯入
import { Button, TextInput, Select, DataTable } from '@/components/ui';
```

### 基本範例

#### Button

```tsx
<Button variant="primary" size="md" onClick={handleClick}>
  送出
</Button>

<Button variant="danger" loading={isSubmitting}>
  刪除
</Button>
```

#### TextInput

```tsx
<TextInput
  label="電子郵件"
  type="email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  error={errors.email}
  hint="請輸入有效的電子郵件地址"
/>
```

#### Select

```tsx
<Select
  label="客戶類型"
  options={[
    { value: 'B2B', label: 'B2B 企業客戶' },
    { value: 'B2C', label: 'B2C 個人客戶' },
  ]}
  value={type}
  onChange={(e) => setType(e.target.value)}
/>
```

#### DataTable

```tsx
const columns = [
  { key: 'name', header: '客戶名稱' },
  { key: 'email', header: '電子郵件' },
  {
    key: 'status',
    header: '狀態',
    render: (value) => (
      <span className={`badge-${value}`}>{value}</span>
    ),
  },
];

<DataTable
  columns={columns}
  data={customers}
  keyExtractor={(row) => row.id}
  loading={isLoading}
  error={error}
  emptyTitle="尚無客戶"
  onRowClick={(row) => router.push(`/customers/${row.id}`)}
/>
```

#### FilterBar

```tsx
const fields = [
  { key: 'search', label: '搜尋', type: 'search', placeholder: '輸入關鍵字' },
  {
    key: 'status',
    label: '狀態',
    type: 'select',
    options: [
      { value: 'active', label: '活躍' },
      { value: 'inactive', label: '停用' },
    ],
  },
];

<FilterBar
  fields={fields}
  values={filters}
  onChange={setFilters}
  onSubmit={handleSearch}
/>
```

---

## 無障礙 (Accessibility)

所有元件遵循 **WCAG 2.2 AAA** 標準：

### 色彩對比

- 一般文字: ≥ 7:1
- 大文字: ≥ 4.5:1

### 觸控目標

- 最小尺寸: 44×44px

### 鍵盤操作

- 100% 功能可用鍵盤操作
- 焦點指示清晰可見 (3px outline)
- 支援 Tab 導航

### ARIA 屬性

```tsx
// 表單元件
<input aria-describedby="hint-id" aria-invalid={hasError} />

// 狀態元件
<div role="status" aria-live="polite" aria-busy={isLoading} />

// 錯誤元件
<div role="alert" aria-live="assertive" />
```

### 動畫偏好

元件尊重 `prefers-reduced-motion` 設定。

---

## 主題支援

### 深色模式

所有元件支援深色模式，透過 Tailwind CSS `dark:` 前綴：

```tsx
// 自動切換
<div className="bg-white dark:bg-gray-900">
  <Button>在深色模式下也清晰可見</Button>
</div>
```

### 自訂樣式

使用 `className` prop 擴展樣式：

```tsx
<Button className="w-full md:w-auto">
  自訂寬度
</Button>
```

---

## 互動測試

使用 `@storybook/test` 進行 play function 測試：

```tsx
export const ClickTest: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button');
    await userEvent.click(button);
    await expect(button).toHaveFocus();
  },
};
```

執行測試：

```bash
npm run test-storybook
```

---

## 檔案結構

```
src/components/ui/
├── Button/
│   ├── Button.tsx          # 元件實作
│   ├── Button.stories.tsx  # Storybook stories
│   └── index.ts            # 匯出
├── TextInput/
├── Select/
├── DataTable/
├── Pagination/
├── FilterBar/
├── EmptyState/
├── LoadingState/
├── ErrorState/
└── index.ts                # 統一匯出
```

---

## 新增元件指南

### 1. 建立目錄結構

```bash
mkdir -p src/components/ui/NewComponent
```

### 2. 建立元件檔案

**NewComponent.tsx**
```tsx
/**
 * NewComponent - WCAG 2.2 AAA Compliant
 */

export interface NewComponentProps {
  // props
}

export function NewComponent({ ...props }: NewComponentProps) {
  return (
    <div role="..." aria-label="...">
      {/* 實作 */}
    </div>
  );
}
```

### 3. 建立 Stories

**NewComponent.stories.tsx**
```tsx
import type { Meta, StoryObj } from '@storybook/react';
import { NewComponent } from './NewComponent';

const meta: Meta<typeof NewComponent> = {
  title: 'UI/NewComponent',
  component: NewComponent,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof NewComponent>;

export const Default: Story = {
  args: {},
};
```

### 4. 建立 index.ts

```tsx
export { NewComponent, type NewComponentProps } from './NewComponent';
```

### 5. 更新主 index.ts

```tsx
export { NewComponent, type NewComponentProps } from './NewComponent';
```

---

## 常見問題

### Q: 如何在 Next.js 頁面中使用元件？

```tsx
'use client';

import { Button, DataTable } from '@/components/ui';

export default function CustomersPage() {
  return (
    <div>
      <Button>新增客戶</Button>
      <DataTable columns={columns} data={data} keyExtractor={(r) => r.id} />
    </div>
  );
}
```

### Q: 元件沒有顯示在 Storybook？

確認：
1. 檔案位於 `src/components/` 目錄下
2. 檔名符合 `*.stories.tsx` 格式
3. 已正確匯出 `meta` 和 stories

### Q: 無障礙檢查失敗？

1. 開啟 Storybook 的 A11y 面板
2. 檢查錯誤訊息
3. 確認 ARIA 屬性正確
4. 確認色彩對比度足夠

---

## 相關資源

- [Storybook 官方文件](https://storybook.js.org/docs)
- [WCAG 2.2 指南](https://www.w3.org/TR/WCAG22/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [React Aria](https://react-spectrum.adobe.com/react-aria/)
