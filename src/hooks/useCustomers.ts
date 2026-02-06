/**
 * Customer hooks - TanStack Query hooks for customer CRUD
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/api';

export interface Customer {
  readonly id: string;
  readonly name: string;
  readonly email: string | null;
  readonly phone: string | null;
  readonly company: string | null;
  readonly type: string;
  readonly status: string;
  readonly notes: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly organizationId: string;
  readonly createdById: string;
  readonly assignedToId: string | null;
}

interface CustomerListResponse {
  readonly success: boolean;
  readonly data: readonly Customer[];
  readonly pagination: {
    readonly page: number;
    readonly limit: number;
    readonly total: number;
    readonly totalPages: number;
  };
}

interface CustomerResponse {
  readonly success: boolean;
  readonly data: Customer;
}

interface CustomerParams {
  readonly page?: number;
  readonly limit?: number;
  readonly search?: string;
  readonly status?: string;
  readonly type?: string;
}

export function useCustomers(params: CustomerParams = {}) {
  const queryParams: Record<string, string> = {};
  if (params.page) queryParams.page = String(params.page);
  if (params.limit) queryParams.limit = String(params.limit);
  if (params.search) queryParams.search = params.search;
  if (params.status) queryParams.status = params.status;
  if (params.type) queryParams.type = params.type;

  return useQuery({
    queryKey: ['customers', params],
    queryFn: () => apiClient.get<CustomerListResponse>('/api/customers', queryParams),
  });
}

export function useCustomer(id: string) {
  return useQuery({
    queryKey: ['customers', id],
    queryFn: () => apiClient.get<CustomerResponse>(`/api/customers/${id}`),
    enabled: !!id,
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<Customer>) =>
      apiClient.post<CustomerResponse>('/api/customers', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Customer> & { readonly id: string }) =>
      apiClient.patch<CustomerResponse>(`/api/customers/${id}`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customers', variables.id] });
    },
  });
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiClient.delete<{ readonly success: boolean }>(`/api/customers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
}
