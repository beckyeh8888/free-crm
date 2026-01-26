/**
 * Inngest API Route
 *
 * Handles Inngest webhook requests for background job processing.
 * In development, connect to Inngest Dev Server at http://localhost:8288
 */

import { serve } from 'inngest/next';
import { inngest } from '@/lib/inngest/client';
import { functions } from '@/lib/inngest/functions';

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions,
});
