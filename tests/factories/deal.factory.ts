/**
 * Deal Test Data Factory
 */

import { prisma } from '@/lib/prisma';

export type DealStage =
  | 'lead'
  | 'qualified'
  | 'proposal'
  | 'negotiation'
  | 'closed_won'
  | 'closed_lost';

export interface DealFactoryData {
  customerId: string;
  title?: string;
  value?: number;
  currency?: string;
  stage?: DealStage;
  probability?: number;
  closeDate?: Date;
  notes?: string;
}

let dealCounter = 0;

/**
 * Build deal data without creating in database
 */
export function buildDeal(overrides: DealFactoryData) {
  dealCounter++;
  return {
    customerId: overrides.customerId,
    title: overrides.title ?? `Test Deal ${dealCounter}`,
    value: overrides.value ?? dealCounter * 10000,
    currency: overrides.currency ?? 'TWD',
    stage: overrides.stage ?? 'lead',
    probability: overrides.probability ?? 10,
    closeDate: overrides.closeDate,
    notes: overrides.notes,
  };
}

/**
 * Create deal in database
 */
export async function createDeal(overrides: DealFactoryData) {
  const data = buildDeal(overrides);

  return prisma.deal.create({
    data,
  });
}

/**
 * Create deals at various pipeline stages
 */
export async function createDealsAtAllStages(customerId: string) {
  const stages: DealStage[] = [
    'lead',
    'qualified',
    'proposal',
    'negotiation',
    'closed_won',
    'closed_lost',
  ];

  return Promise.all(
    stages.map((stage, i) =>
      createDeal({
        customerId,
        title: `Deal - ${stage}`,
        value: (i + 1) * 50000,
        stage,
        probability: stage === 'closed_won' ? 100 : stage === 'closed_lost' ? 0 : (i + 1) * 15,
      })
    )
  );
}

/**
 * Reset factory counter
 */
export function resetDealFactory() {
  dealCounter = 0;
}
