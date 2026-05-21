import type t from 'librechat-data-provider';
import { dataService, QueryKeys } from 'librechat-data-provider';
import type { QueryObserverResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';

/**
 * Hook for listing all training organizations
 */
export const useListTrainingOrganizationsQuery = <
  TData = t.TrainingOrganization[],
>(): QueryObserverResult<TData> => {
  return useQuery<t.TrainingOrganization[], unknown, TData>(
    [QueryKeys.trainingOrganizations],
    () => dataService.listTrainingOrganizations(),
    {
      staleTime: 1000 * 5,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
      retry: false,
    },
  );
};

/**
 * Hook for fetching a single training organization by ID
 */
export const useTrainingOrganizationByIdQuery = <
  TData = t.TrainingOrganization,
>(id: t.TrainingOrganization['_id']): QueryObserverResult<TData> => {
  return useQuery<t.TrainingOrganization, unknown, TData>(
    [QueryKeys.trainingOrganizations, id],
    () => dataService.getTrainingOrganizationById(id),
    {
      staleTime: 1000 * 5,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
      retry: false,
      enabled: !!id,
    },
  );
};

/**
 * Hook for fetching trainings by organization ID
 */
export const useTrainingsByOrganizationQuery = <
  TData = t.TrainingWithStatus[],
>(organizationId: string): QueryObserverResult<TData> => {
  return useQuery<t.TrainingWithStatus[], unknown, TData>(
    [QueryKeys.trainingOrganizations, organizationId, 'trainings'],
    () => dataService.getTrainingsByOrganization(organizationId),
    {
      staleTime: 1000 * 5,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
      retry: false,
      enabled: !!organizationId,
    },
  );
};

/**
 * Hook for fetching organization admin invitations by organization ID
 */
export const useOrgAdminInvitationsQuery = <
  TData = t.Invitation[],
>(orgId: string): QueryObserverResult<TData> => {
  return useQuery<t.Invitation[], unknown, TData>(
    [QueryKeys.trainingOrganizations, orgId, 'adminInvitations'],
    () => dataService.getOrgAdminInvitations(orgId),
    {
      staleTime: 1000 * 5,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
      retry: false,
      enabled: !!orgId,
    },
  );
};

/**
 * Hook for fetching organization trainer invitations by organization ID
 */
export const useOrgTrainerInvitationsQuery = <
  TData = t.Invitation[],
>(orgId: string): QueryObserverResult<TData> => {
  return useQuery<t.Invitation[], unknown, TData>(
    [QueryKeys.trainingOrganizations, orgId, 'trainerInvitations'],
    () => dataService.getOrgTrainerInvitations(orgId),
    {
      staleTime: 1000 * 5,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
      retry: false,
      enabled: !!orgId,
    },
  );
};

/**
 * Hook for checking if the current user is an active trainer in any ongoing training
 */
export const useIsActiveTrainerQuery = <
  TData = { isActiveTrainer: boolean },
>(): QueryObserverResult<TData> => {
  return useQuery<{ isActiveTrainer: boolean }, unknown, TData>(
    [QueryKeys.trainingOrganizations, 'isActiveTrainer'],
    () => dataService.isActiveTrainer(),
    {
      staleTime: 1000 * 60, // 1 minute
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
      retry: false,
    },
  );
};
