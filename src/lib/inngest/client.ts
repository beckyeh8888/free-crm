/**
 * Inngest Client Configuration
 *
 * Event-driven background job processing for:
 * - AI document analysis
 * - Email notifications
 * - Audit log processing
 */

import { Inngest } from 'inngest';

// Create the Inngest client
export const inngest = new Inngest({
  id: 'free-crm',
  // In development, Inngest Dev Server runs at http://localhost:8288
  // In production, configure INNGEST_EVENT_KEY and INNGEST_SIGNING_KEY
});

// ============================================
// Event Types
// ============================================

export interface DocumentAnalyzeEvent {
  name: 'document/analyze.requested';
  data: {
    documentId: string;
    userId: string;
    analysisType: 'contract' | 'email' | 'meeting_notes' | 'quotation';
    options?: {
      extractEntities?: boolean;
      summarize?: boolean;
      extractDates?: boolean;
    };
  };
}

export interface DocumentAnalysisCompleteEvent {
  name: 'document/analyze.completed';
  data: {
    documentId: string;
    analysisId: string;
    userId: string;
  };
}

export interface DocumentAnalysisFailedEvent {
  name: 'document/analyze.failed';
  data: {
    documentId: string;
    userId: string;
    error: string;
  };
}

// Union type for all events
export type FreeCRMEvents =
  | DocumentAnalyzeEvent
  | DocumentAnalysisCompleteEvent
  | DocumentAnalysisFailedEvent;
