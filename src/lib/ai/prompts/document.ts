/**
 * Document Analysis Prompts
 *
 * Specialized prompts for each document type.
 * All responses in structured JSON format.
 */

/**
 * Get the analysis prompt for a specific document type.
 */
export function getDocumentAnalysisPrompt(
  type: 'contract' | 'email' | 'meeting_notes' | 'quotation' | string
): string {
  const baseInstruction = `你是一個專業的文件分析助手。請分析以下文件內容，並以 JSON 格式回傳結果。

回傳格式必須嚴格遵循：
{
  "summary": "文件摘要（2-3 句話）",
  "entities": {
    "people": ["人名列表"],
    "companies": ["公司名列表"],
    "dates": ["日期列表"]
  },
  "sentiment": "positive" | "negative" | "neutral",
  "keyPoints": ["重點 1", "重點 2", ...],
  "actionItems": ["待辦事項 1", "待辦事項 2", ...],
  "confidence": 0.0-1.0
}

請使用繁體中文回應。只回傳 JSON，不要包含其他文字。`;

  const typeInstructions: Record<string, string> = {
    contract: `${baseInstruction}

## 合約分析重點
- 識別簽約雙方
- 提取合約期限和重要日期
- 列出主要義務和責任
- 標記潛在風險條款
- 提取金額和付款條件
- actionItems 應包含需要跟進的合約條款`,

    email: `${baseInstruction}

## Email 分析重點
- 識別寄件人和收件人的意圖
- 提取具體要求或問題
- 判斷緊急程度
- 列出需要回覆或跟進的事項
- actionItems 應包含需要回覆的內容`,

    meeting_notes: `${baseInstruction}

## 會議紀錄分析重點
- 提取出席人員
- 列出討論的關鍵議題
- 識別決議事項
- 提取行動項目和負責人
- 標記下次會議日期
- actionItems 應包含每個行動項目及其負責人`,

    quotation: `${baseInstruction}

## 報價單分析重點
- 識別報價方和客戶
- 提取項目明細和金額
- 標記總金額和幣別
- 提取報價有效期限
- 列出付款條件和交貨條件
- actionItems 應包含需要確認或回覆的事項`,
  };

  return typeInstructions[type] || typeInstructions.contract;
}
