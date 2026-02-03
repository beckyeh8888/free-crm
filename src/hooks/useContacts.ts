/**
 * Contact hooks - TanStack Query hooks for contact CRUD
 *
 * Provides hooks for managing customer contacts:
 * - useContacts(customerId) - List contacts for a customer
 * - useContact(customerId, contactId) - Get single contact
 * - useCreateContact(customerId) - Create new contact
 * - useUpdateContact(customerId) - Update existing contact
 * - useDeleteContact(customerId) - Delete a contact
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/api';

// ============================================
// Types
// ============================================

export interface Contact {
  readonly id: string;
  readonly name: string;
  readonly email: string | null;
  readonly phone: string | null;
  readonly title: string | null;
  readonly isPrimary: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

interface ContactListResponse {
  readonly success: boolean;
  readonly data: readonly Contact[];
  readonly pagination: {
    readonly page: number;
    readonly limit: number;
    readonly total: number;
    readonly totalPages: number;
  };
}

interface ContactResponse {
  readonly success: boolean;
  readonly data: Contact;
}

interface ContactParams {
  readonly page?: number;
  readonly limit?: number;
}

export interface CreateContactData {
  readonly name: string;
  readonly email?: string;
  readonly phone?: string;
  readonly title?: string;
  readonly isPrimary?: boolean;
}

export interface UpdateContactData {
  readonly name?: string;
  readonly email?: string;
  readonly phone?: string;
  readonly title?: string;
  readonly isPrimary?: boolean;
}

// ============================================
// Hooks
// ============================================

/**
 * Fetch contacts for a customer
 */
export function useContacts(customerId: string, params: ContactParams = {}) {
  const queryParams: Record<string, string> = {};
  if (params.page) queryParams.page = String(params.page);
  if (params.limit) queryParams.limit = String(params.limit);

  return useQuery({
    queryKey: ['contacts', customerId, params],
    queryFn: () =>
      apiClient.get<ContactListResponse>(
        `/api/customers/${customerId}/contacts`,
        queryParams
      ),
    enabled: !!customerId,
  });
}

/**
 * Fetch a single contact
 */
export function useContact(customerId: string, contactId: string) {
  return useQuery({
    queryKey: ['contacts', customerId, contactId],
    queryFn: () =>
      apiClient.get<ContactResponse>(
        `/api/customers/${customerId}/contacts/${contactId}`
      ),
    enabled: !!customerId && !!contactId,
  });
}

/**
 * Create a new contact for a customer
 */
export function useCreateContact(customerId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateContactData) =>
      apiClient.post<ContactResponse>(
        `/api/customers/${customerId}/contacts`,
        data
      ),
    onSuccess: () => {
      // Invalidate contacts list for this customer
      queryClient.invalidateQueries({ queryKey: ['contacts', customerId] });
      // Invalidate activities (audit log will have new entry)
      queryClient.invalidateQueries({ queryKey: ['activities'] });
    },
  });
}

/**
 * Update an existing contact
 */
export function useUpdateContact(customerId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      contactId,
      ...data
    }: UpdateContactData & { readonly contactId: string }) =>
      apiClient.patch<ContactResponse>(
        `/api/customers/${customerId}/contacts/${contactId}`,
        data
      ),
    onSuccess: (_, variables) => {
      // Invalidate contacts list and single contact
      queryClient.invalidateQueries({ queryKey: ['contacts', customerId] });
      queryClient.invalidateQueries({
        queryKey: ['contacts', customerId, variables.contactId],
      });
      // Invalidate activities
      queryClient.invalidateQueries({ queryKey: ['activities'] });
    },
  });
}

/**
 * Delete a contact
 */
export function useDeleteContact(customerId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (contactId: string) =>
      apiClient.delete<{ readonly success: boolean }>(
        `/api/customers/${customerId}/contacts/${contactId}`
      ),
    onSuccess: () => {
      // Invalidate contacts list for this customer
      queryClient.invalidateQueries({ queryKey: ['contacts', customerId] });
      // Invalidate activities
      queryClient.invalidateQueries({ queryKey: ['activities'] });
    },
  });
}
