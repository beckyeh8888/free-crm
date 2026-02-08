/**
 * Deal hooks - TanStack Query hooks for deal CRUD
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/api';

export interface Deal {
  readonly id: string;
  readonly title: string;
  readonly value: number | null;
  readonly currency: string;
  readonly stage: string;
  readonly probability: number;
  readonly closeDate: string | null;
  readonly closedAt: string | null;
  readonly notes: string | null;
  readonly lossReason: string | null;
  readonly lossNotes: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly customerId: string;
  readonly createdById: string | null;
  readonly assignedToId: string | null;
  readonly customer?: {
    readonly id: string;
    readonly name: string;
    readonly company: string | null;
  };
}

interface DealListResponse {
  readonly success: boolean;
  readonly data: readonly Deal[];
  readonly pagination: {
    readonly page: number;
    readonly limit: number;
    readonly total: number;
    readonly totalPages: number;
  };
}

interface DealResponse {
  readonly success: boolean;
  readonly data: Deal;
}

interface DealParams {
  readonly page?: number;
  readonly limit?: number;
  readonly stage?: string;
  readonly search?: string;
  readonly customerId?: string;
}

export function useDeals(params: DealParams = {}) {
  const queryParams: Record<string, string> = {};
  if (params.page) queryParams.page = String(params.page);
  if (params.limit) queryParams.limit = String(params.limit);
  if (params.stage) queryParams.stage = params.stage;
  if (params.search) queryParams.search = params.search;
  if (params.customerId) queryParams.customerId = params.customerId;

  return useQuery({
    queryKey: ['deals', params],
    queryFn: () => apiClient.get<DealListResponse>('/api/deals', queryParams),
  });
}

export function useDeal(id: string) {
  return useQuery({
    queryKey: ['deals', id],
    queryFn: () => apiClient.get<DealResponse>(`/api/deals/${id}`),
    enabled: !!id,
  });
}

export function useCreateDeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<Deal>) =>
      apiClient.post<DealResponse>('/api/deals', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
}

export function useUpdateDeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Deal> & { readonly id: string }) =>
      apiClient.patch<DealResponse>(`/api/deals/${id}`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['deals', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
}

export function useDeleteDeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiClient.delete<{ readonly success: boolean }>(`/api/deals/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
}
