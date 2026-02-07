/**
 * Email Draft Prompts
 *
 * Generates contextual email drafts based on CRM data.
 * All responses in Traditional Chinese.
 */

interface EmailPromptParams {
  readonly purpose: 'follow_up' | 'outreach' | 'reply' | 'thank_you';
  readonly tone: 'formal' | 'friendly' | 'concise';
  readonly customerName: string;
  readonly companyName?: string;
  readonly dealInfo?: {
    readonly title: string;
    readonly stage: string;
    readonly value?: number;
    readonly currency?: string;
  };
  readonly additionalContext?: string;
}

const purposeLabels: Record<string, string> = {
  follow_up: '跟進客戶',
  outreach: '首次開發',
  reply: '回覆客戶',
  thank_you: '感謝信',
};

const toneInstructions: Record<string, string> = {
  formal: '使用正式、專業的語氣。使用敬語，結構完整。',
  friendly: '使用親切、溫暖的語氣。保持專業但不過於拘謹。',
  concise: '使用簡潔、直接的語氣。重點明確，不冗長。',
};

/**
 * Build the email draft generation prompt.
 */
export function getEmailDraftPrompt(params: EmailPromptParams): string {
  const { purpose, tone, customerName, companyName, dealInfo, additionalContext } = params;

  let context = `客戶名稱：${customerName}`;
  if (companyName) context += `\n公司：${companyName}`;
  if (dealInfo) {
    context += `\n商機：${dealInfo.title}（階段：${dealInfo.stage}`;
    if (dealInfo.value) context += `，金額：${dealInfo.currency || 'NT$'} ${dealInfo.value.toLocaleString()}`;
    context += '）';
  }
  if (additionalContext) context += `\n補充說明：${additionalContext}`;

  return `你是一位專業的業務人員，需要撰寫一封${purposeLabels[purpose]}的 Email。

## 語氣要求
${toneInstructions[tone]}

## 客戶資訊
${context}

## 回傳格式
請以 JSON 格式回傳，只回傳 JSON，不要包含其他文字：
{
  "subject": "Email 主旨",
  "body": "Email 正文（使用繁體中文，包含適當的稱呼和結尾）"
}

## 注意事項
- 使用繁體中文
- 內容需要自然、不像 AI 生成
- 包含具體的下一步行動建議
- 根據商機階段調整內容重點`;
}
