/**
 * API Client Unit Tests
 */

import { vi } from 'vitest';
import { apiClient, ApiError } from '@/services/api';

describe('API Client', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  function mockFetch(body: unknown, options: { readonly status?: number } = {}) {
    const { status = 200 } = options;
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
    ));
  }

  describe('ApiError', () => {
    it('has correct name, message, status, and code', () => {
      const error = new ApiError('Not found', 404, 'NOT_FOUND');

      expect(error.name).toBe('ApiError');
      expect(error.message).toBe('Not found');
      expect(error.status).toBe(404);
      expect(error.code).toBe('NOT_FOUND');
    });

    it('works without code', () => {
      const error = new ApiError('Server error', 500);

      expect(error.code).toBeUndefined();
    });
  });

  describe('GET', () => {
    it('calls fetch with correct URL', async () => {
      mockFetch({ success: true });

      await apiClient.get('/api/test');

      expect(fetch).toHaveBeenCalledWith('/api/test');
    });

    it('appends query params', async () => {
      mockFetch({ success: true });

      await apiClient.get('/api/test', { page: '1', limit: '10' });

      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/api/test?'));
      const calledUrl = vi.mocked(fetch).mock.calls[0][0] as string;
      expect(calledUrl).toContain('page=1');
      expect(calledUrl).toContain('limit=10');
    });

    it('returns parsed JSON', async () => {
      mockFetch({ success: true, data: { id: 1 } });

      const result = await apiClient.get<{ readonly success: boolean; readonly data: { readonly id: number } }>('/api/test');

      expect(result.success).toBe(true);
      expect(result.data.id).toBe(1);
    });
  });

  describe('POST', () => {
    it('calls fetch with POST method and body', async () => {
      mockFetch({ success: true });

      await apiClient.post('/api/test', { name: 'test' });

      expect(fetch).toHaveBeenCalledWith('/api/test', expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'test' }),
      }));
    });

    it('sends undefined body when no data', async () => {
      mockFetch({ success: true });

      await apiClient.post('/api/test');

      expect(fetch).toHaveBeenCalledWith('/api/test', expect.objectContaining({
        body: undefined,
      }));
    });
  });

  describe('PUT', () => {
    it('calls fetch with PUT method', async () => {
      mockFetch({ success: true });

      await apiClient.put('/api/test/1', { name: 'updated' });

      expect(fetch).toHaveBeenCalledWith('/api/test/1', expect.objectContaining({
        method: 'PUT',
      }));
    });
  });

  describe('PATCH', () => {
    it('calls fetch with PATCH method', async () => {
      mockFetch({ success: true });

      await apiClient.patch('/api/test/1', { name: 'patched' });

      expect(fetch).toHaveBeenCalledWith('/api/test/1', expect.objectContaining({
        method: 'PATCH',
      }));
    });
  });

  describe('DELETE', () => {
    it('calls fetch with DELETE method', async () => {
      mockFetch({ success: true });

      await apiClient.delete('/api/test/1');

      expect(fetch).toHaveBeenCalledWith('/api/test/1', expect.objectContaining({
        method: 'DELETE',
      }));
    });
  });

  describe('Error handling', () => {
    it('throws ApiError on non-ok response', async () => {
      mockFetch(
        { error: { message: 'Not found', code: 'NOT_FOUND' } },
        { status: 404 }
      );

      try {
        await apiClient.get('/api/test');
        expect.fail('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(ApiError);
        const apiErr = err as ApiError;
        expect(apiErr.status).toBe(404);
        expect(apiErr.message).toBe('Not found');
        expect(apiErr.code).toBe('NOT_FOUND');
      }
    });

    it('uses default message when body has no error message', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
        new Response('not json', { status: 500 })
      ));

      await expect(apiClient.get('/api/test')).rejects.toThrow('Request failed with status 500');
    });
  });
});
