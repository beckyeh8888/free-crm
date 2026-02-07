/**
 * Sales Insights Prompts
 *
 * Generates AI-powered sales analysis and recommendations.
 */

interface InsightsData {
  readonly dealsByStage: Record<string, number>;
  readonly totalDealValue: number;
  readonly atRiskDeals: readonly {
    readonly id: string;
    readonly title: string;
    readonly customerName: string;
    readonly daysSinceUpdate: number;
    readonly daysOverdue: number;
    readonly value: number;
    readonly stage: string;
  }[];
  readonly recentlyClosedWon: number;
  readonly recentlyClosedLost: number;
  readonly activeTasks: number;
  readonly overdueTasks: number;
}

/**
 * Build the sales insights prompt with CRM data context.
 */
export function getSalesInsightsPrompt(data: InsightsData): string {
  const stageLabels: Record<string, string> = {
    lead: '線索', qualification: '評估', proposal: '提案',
    negotiation: '議價', closed_won: '成交', closed_lost: '失敗',
  };

  const pipelineSummary = Object.entries(data.dealsByStage)
    .map(([stage, count]) => `- ${stageLabels[stage] ?? stage}：${count} 筆`)
    .join('\n');

  const riskDetails = data.atRiskDeals.length > 0
    ? data.atRiskDeals.map((d) => {
        const reasons: string[] = [];
        if (d.daysOverdue > 0) reasons.push(`逾期 ${d.daysOverdue} 天`);
        if (d.daysSinceUpdate > 14) reasons.push(`${d.daysSinceUpdate} 天未更新`);
        return `- ${d.title}（${d.customerName}）: ${stageLabels[d.stage] ?? d.stage}，金額 ${d.value.toLocaleString()}，風險：${reasons.join('、')}`;
      }).join('\n')
    : '目前沒有高風險商機';

  return `你是一位資深的銷售顧問，請根據以下 CRM 數據提供銷售洞察分析。

## 商機管道概覽
${pipelineSummary}
總商機價值：${data.totalDealValue.toLocaleString()}

## 近期成交狀況
- 成交：${data.recentlyClosedWon} 筆
- 失敗：${data.recentlyClosedLost} 筆

## 高風險商機
${riskDetails}

## 任務狀況
- 進行中任務：${data.activeTasks}
- 逾期任務：${data.overdueTasks}

## 回傳格式
請以 JSON 格式回傳，只回傳 JSON：
{
  "summary": "整體銷售狀況摘要（2-3 句話）",
  "atRiskDeals": [
    {
      "dealId": "商機 ID",
      "title": "商機名稱",
      "reason": "風險原因",
      "suggestedAction": "建議行動"
    }
  ],
  "keyInsights": [
    "洞察 1",
    "洞察 2",
    "洞察 3"
  ]
}

## 分析要求
- 使用繁體中文
- 提供具體、可行動的建議
- 識別最緊急需要關注的商機
- 基於數據給出客觀分析`;
}
