/**
 * Validation Schema Unit Tests
 * Tests for Zod validation schemas
 */

// With globals: true in vitest.config.ts, describe/it/expect are global
import {
  emailSchema,
  passwordSchema,
  createCustomerSchema,
  createDealSchema,
  dealStageEnum,
} from '@/lib/validation';

describe('emailSchema', () => {
  it('should accept valid email', () => {
    const result = emailSchema.safeParse('test@example.com');
    expect(result.success).toBe(true);
  });

  it('should reject invalid email', () => {
    const result = emailSchema.safeParse('invalid-email');
    expect(result.success).toBe(false);
  });
});

describe('passwordSchema', () => {
  it('should accept strong password', () => {
    const result = passwordSchema.safeParse('Password1!');
    expect(result.success).toBe(true);
  });

  it('should reject password without uppercase', () => {
    const result = passwordSchema.safeParse('password1!');
    expect(result.success).toBe(false);
  });

  it('should reject password without number', () => {
    const result = passwordSchema.safeParse('Password!');
    expect(result.success).toBe(false);
  });

  it('should reject password without special character', () => {
    const result = passwordSchema.safeParse('Password1');
    expect(result.success).toBe(false);
  });

  it('should reject short password', () => {
    const result = passwordSchema.safeParse('Pass1!');
    expect(result.success).toBe(false);
  });
});

describe('createCustomerSchema', () => {
  it('should accept valid customer data', () => {
    const result = createCustomerSchema.safeParse({
      name: 'Test Customer',
      email: 'customer@example.com',
      type: 'B2B',
    });
    expect(result.success).toBe(true);
  });

  it('should reject empty name', () => {
    const result = createCustomerSchema.safeParse({
      name: '',
      type: 'B2B',
    });
    expect(result.success).toBe(false);
  });

  it('should use default values', () => {
    const result = createCustomerSchema.safeParse({
      name: 'Test',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.type).toBe('B2B');
      expect(result.data.status).toBe('active');
    }
  });
});

describe('createDealSchema', () => {
  it('should accept valid deal data', () => {
    const result = createDealSchema.safeParse({
      title: 'New Deal',
      customerId: 'clxxxxxxxxxxxxxxxxx',
      value: 10000,
      stage: 'lead',
    });
    expect(result.success).toBe(true);
  });

  it('should reject invalid customerId', () => {
    const result = createDealSchema.safeParse({
      title: 'New Deal',
      customerId: 'invalid-id',
    });
    expect(result.success).toBe(false);
  });

  it('should reject negative value', () => {
    const result = createDealSchema.safeParse({
      title: 'New Deal',
      customerId: 'clxxxxxxxxxxxxxxxxx',
      value: -100,
    });
    expect(result.success).toBe(false);
  });
});

describe('dealStageEnum', () => {
  it('should accept valid stages', () => {
    const stages = ['lead', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost'];
    stages.forEach((stage) => {
      const result = dealStageEnum.safeParse(stage);
      expect(result.success).toBe(true);
    });
  });

  it('should reject invalid stage', () => {
    const result = dealStageEnum.safeParse('invalid_stage');
    expect(result.success).toBe(false);
  });
});
