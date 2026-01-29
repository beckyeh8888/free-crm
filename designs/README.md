# Free CRM 設計檔案

此資料夾存放 Pencil IDE 設計檔案 (`.pen`)，支援 Git 版本控制。

## 資料夾結構

```
designs/
├── pages/        # 頁面設計
├── components/   # 元件設計
└── README.md
```

## 命名規範

| 類型 | 命名格式 | 範例 |
|------|----------|------|
| 頁面 | `[功能名稱].pen` | `dashboard.pen`, `customers.pen` |
| 元件 | `[元件名稱].pen` | `button.pen`, `data-table.pen` |

## 設計規範

### 色彩對比度 (WCAG 2.2 AAA)

| 項目 | 要求 |
|------|------|
| 一般文字 | 對比度 >= 7:1 |
| 大文字 (18px+) | 對比度 >= 4.5:1 |

### 觸控目標

| 裝置 | 最小尺寸 |
|------|----------|
| 桌面 | 44 x 44 px |
| 手機 | 48 x 48 px |

### RWD 斷點

| 斷點 | 寬度 |
|------|------|
| xs | 0-479px |
| sm | 480-767px |
| md | 768-1023px |
| lg | 1024-1439px |
| xl | 1440-1919px |
| 2xl | 1920-2559px |
| 3xl | 2560-3839px |
| 4k | 3840px+ |

## 使用方式

1. 開啟 Pencil IDE
2. 選擇此專案資料夾
3. 在 `pages/` 或 `components/` 建立 `.pen` 檔案
4. 按 `Ctrl + K` 使用 AI 輔助設計

## Git 提交規範

```bash
git add designs/*.pen
git commit -m "design([範圍]): [描述]"
```

範例：
- `design(pages): 新增客戶管理頁面設計`
- `design(components): 新增資料表格元件設計`
