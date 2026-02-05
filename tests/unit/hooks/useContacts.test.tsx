/**
 * useContacts Hook Tests
 * Unit tests for contact CRUD hooks
 *
 * @vitest-environment jsdom
 */

import '@testing-library/jest-dom/vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import {
  useContacts,
  useContact,
  useCreateContact,
  useUpdateContact,
  useDeleteContact,
} from '@/hooks/useContacts';
import { apiClient } from '@/services/api';

// Mock api client
vi.mock('@/services/api', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockContacts = [
  {
    id: 'contact-1',
    name: '張三',
    email: 'zhang@example.com',
    phone: '0912345678',
    title: '總經理',
    isPrimary: true,
    createdAt: '2026-01-15T00:00:00Z',
    updatedAt: '2026-01-15T00:00:00Z',
  },
  {
    id: 'contact-2',
    name: '李四',
    email: 'li@example.com',
    phone: '0923456789',
    title: '業務經理',
    isPrimary: false,
    createdAt: '2026-01-20T00:00:00Z',
    updatedAt: '2026-01-20T00:00:00Z',
  },
  {
    id: 'contact-3',
    name: '王五',
    email: null,
    phone: '0934567890',
    title: null,
    isPrimary: false,
    createdAt: '2026-01-25T00:00:00Z',
    updatedAt: '2026-01-25T00:00:00Z',
  },
];

const mockCustomerId = 'cust-123';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return function Wrapper({ children }: { readonly children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };
}

describe('useContacts Hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useContacts', () => {
    it('fetches contacts list for a customer', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        success: true,
        data: mockContacts,
        pagination: { page: 1, limit: 10, total: 3, totalPages: 1 },
      });

      const { result } = renderHook(
        () => useContacts(mockCustomerId),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiClient.get).toHaveBeenCalledWith(
        `/api/customers/${mockCustomerId}/contacts`,
        {}
      );
      expect(result.current.data?.data).toHaveLength(3);
    });

    it('fetches contacts with pagination', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        success: true,
        data: [mockContacts[0]],
        pagination: { page: 2, limit: 1, total: 3, totalPages: 3 },
      });

      const { result } = renderHook(
        () => useContacts(mockCustomerId, { page: 2, limit: 1 }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiClient.get).toHaveBeenCalledWith(
        `/api/customers/${mockCustomerId}/contacts`,
        { page: '2', limit: '1' }
      );
    });

    it('does not fetch when customerId is empty', async () => {
      const { result } = renderHook(
        () => useContacts(''),
        { wrapper: createWrapper() }
      );

      expect(result.current.fetchStatus).toBe('idle');
      expect(apiClient.get).not.toHaveBeenCalled();
    });

    it('handles empty contacts list', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        success: true,
        data: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
      });

      const { result } = renderHook(
        () => useContacts(mockCustomerId),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.data).toHaveLength(0);
    });

    it('handles API error', async () => {
      vi.mocked(apiClient.get).mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(
        () => useContacts(mockCustomerId),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toBeInstanceOf(Error);
    });
  });

  describe('useContact', () => {
    it('fetches single contact by id', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        success: true,
        data: mockContacts[0],
      });

      const { result } = renderHook(
        () => useContact(mockCustomerId, 'contact-1'),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiClient.get).toHaveBeenCalledWith(
        `/api/customers/${mockCustomerId}/contacts/contact-1`
      );
      expect(result.current.data?.data.name).toBe('張三');
    });

    it('does not fetch when customerId is empty', async () => {
      const { result } = renderHook(
        () => useContact('', 'contact-1'),
        { wrapper: createWrapper() }
      );

      expect(result.current.fetchStatus).toBe('idle');
      expect(apiClient.get).not.toHaveBeenCalled();
    });

    it('does not fetch when contactId is empty', async () => {
      const { result } = renderHook(
        () => useContact(mockCustomerId, ''),
        { wrapper: createWrapper() }
      );

      expect(result.current.fetchStatus).toBe('idle');
      expect(apiClient.get).not.toHaveBeenCalled();
    });

    it('returns contact with null fields', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        success: true,
        data: mockContacts[2], // 王五 has null email and title
      });

      const { result } = renderHook(
        () => useContact(mockCustomerId, 'contact-3'),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.data.email).toBeNull();
      expect(result.current.data?.data.title).toBeNull();
    });
  });

  describe('useCreateContact', () => {
    it('creates a new contact', async () => {
      const newContact = {
        name: '新聯絡人',
        email: 'new@example.com',
        phone: '0911111111',
        title: '專員',
        isPrimary: false,
      };

      vi.mocked(apiClient.post).mockResolvedValue({
        success: true,
        data: { id: 'contact-new', ...newContact },
      });

      const { result } = renderHook(
        () => useCreateContact(mockCustomerId),
        { wrapper: createWrapper() }
      );

      result.current.mutate(newContact);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiClient.post).toHaveBeenCalledWith(
        `/api/customers/${mockCustomerId}/contacts`,
        newContact
      );
    });

    it('creates contact with minimal data', async () => {
      const newContact = {
        name: '只有名字',
      };

      vi.mocked(apiClient.post).mockResolvedValue({
        success: true,
        data: { id: 'contact-minimal', ...newContact },
      });

      const { result } = renderHook(
        () => useCreateContact(mockCustomerId),
        { wrapper: createWrapper() }
      );

      result.current.mutate(newContact);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiClient.post).toHaveBeenCalledWith(
        `/api/customers/${mockCustomerId}/contacts`,
        newContact
      );
    });

    it('creates primary contact', async () => {
      const newContact = {
        name: '主要聯絡人',
        email: 'primary@example.com',
        isPrimary: true,
      };

      vi.mocked(apiClient.post).mockResolvedValue({
        success: true,
        data: { id: 'contact-primary', ...newContact },
      });

      const { result } = renderHook(
        () => useCreateContact(mockCustomerId),
        { wrapper: createWrapper() }
      );

      result.current.mutate(newContact);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiClient.post).toHaveBeenCalledWith(
        `/api/customers/${mockCustomerId}/contacts`,
        newContact
      );
    });

    it('handles create error', async () => {
      vi.mocked(apiClient.post).mockRejectedValue(new Error('Validation failed'));

      const { result } = renderHook(
        () => useCreateContact(mockCustomerId),
        { wrapper: createWrapper() }
      );

      result.current.mutate({ name: '' });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toBeInstanceOf(Error);
    });
  });

  describe('useUpdateContact', () => {
    it('updates an existing contact', async () => {
      const updateData = {
        contactId: 'contact-1',
        name: '張三（更新）',
        email: 'zhang.updated@example.com',
      };

      vi.mocked(apiClient.patch).mockResolvedValue({
        success: true,
        data: { ...mockContacts[0], ...updateData },
      });

      const { result } = renderHook(
        () => useUpdateContact(mockCustomerId),
        { wrapper: createWrapper() }
      );

      result.current.mutate(updateData);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiClient.patch).toHaveBeenCalledWith(
        `/api/customers/${mockCustomerId}/contacts/contact-1`,
        { name: '張三（更新）', email: 'zhang.updated@example.com' }
      );
    });

    it('updates contact title', async () => {
      const updateData = {
        contactId: 'contact-2',
        title: '資深業務經理',
      };

      vi.mocked(apiClient.patch).mockResolvedValue({
        success: true,
        data: { ...mockContacts[1], title: '資深業務經理' },
      });

      const { result } = renderHook(
        () => useUpdateContact(mockCustomerId),
        { wrapper: createWrapper() }
      );

      result.current.mutate(updateData);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiClient.patch).toHaveBeenCalledWith(
        `/api/customers/${mockCustomerId}/contacts/contact-2`,
        { title: '資深業務經理' }
      );
    });

    it('updates contact to primary', async () => {
      const updateData = {
        contactId: 'contact-2',
        isPrimary: true,
      };

      vi.mocked(apiClient.patch).mockResolvedValue({
        success: true,
        data: { ...mockContacts[1], isPrimary: true },
      });

      const { result } = renderHook(
        () => useUpdateContact(mockCustomerId),
        { wrapper: createWrapper() }
      );

      result.current.mutate(updateData);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiClient.patch).toHaveBeenCalledWith(
        `/api/customers/${mockCustomerId}/contacts/contact-2`,
        { isPrimary: true }
      );
    });

    it('handles update error', async () => {
      vi.mocked(apiClient.patch).mockRejectedValue(new Error('Not found'));

      const { result } = renderHook(
        () => useUpdateContact(mockCustomerId),
        { wrapper: createWrapper() }
      );

      result.current.mutate({ contactId: 'invalid-id', name: 'Test' });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toBeInstanceOf(Error);
    });
  });

  describe('useDeleteContact', () => {
    it('deletes a contact', async () => {
      vi.mocked(apiClient.delete).mockResolvedValue({
        success: true,
      });

      const { result } = renderHook(
        () => useDeleteContact(mockCustomerId),
        { wrapper: createWrapper() }
      );

      result.current.mutate('contact-2');

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiClient.delete).toHaveBeenCalledWith(
        `/api/customers/${mockCustomerId}/contacts/contact-2`
      );
    });

    it('handles delete error', async () => {
      vi.mocked(apiClient.delete).mockRejectedValue(new Error('Cannot delete primary contact'));

      const { result } = renderHook(
        () => useDeleteContact(mockCustomerId),
        { wrapper: createWrapper() }
      );

      result.current.mutate('contact-1');

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toBeInstanceOf(Error);
    });

    it('calls API with correct endpoint', async () => {
      vi.mocked(apiClient.delete).mockResolvedValue({
        success: true,
      });

      const { result } = renderHook(
        () => useDeleteContact('different-customer'),
        { wrapper: createWrapper() }
      );

      result.current.mutate('some-contact');

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiClient.delete).toHaveBeenCalledWith(
        '/api/customers/different-customer/contacts/some-contact'
      );
    });
  });
});
