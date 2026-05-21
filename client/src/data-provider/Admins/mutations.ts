import { useMutation, UseMutationResult, useQueryClient } from '@tanstack/react-query';
import { dataService, QueryKeys } from 'librechat-data-provider';

/**
 * Grant admin access
 */
export const useGrantAdminAccessMutation = (options?: {
  onMutate?: (variables: { email: string }) => void;
  onError?: (error: Error, variables: { email: string }, context: unknown) => void;
  onSuccess?: (data: { message: string }, variables: { email: string }, context: unknown) => void;
}): UseMutationResult<{ message: string }, Error, { email: string }> => {
  const queryClient = useQueryClient();

  return useMutation(
    (data: { email: string }) => {
      return dataService.grantAdminAccess(data);
    },
    {
      onMutate: (variables) => options?.onMutate?.(variables),
      onError: (error, variables, context) => options?.onError?.(error, variables, context),
      onSuccess: (data, variables, context) => {
        // Invalidate the adminInvitations query to refresh the list
        queryClient.invalidateQueries([QueryKeys.adminInvitations]);
        // Invalidate the adminUsers query to refresh the list
        queryClient.invalidateQueries([QueryKeys.adminUsers]);
        options?.onSuccess?.(data, variables, context);
      },
    },
  );
};

/**
 * Revoke admin access
 */
export const useRevokeAdminAccessMutation = (options?: {
  onMutate?: (variables: { email: string }) => void;
  onError?: (error: Error, variables: { email: string }, context: unknown) => void;
  onSuccess?: (data: { message: string }, variables: { email: string }, context: unknown) => void;
}): UseMutationResult<{ message: string }, Error, { email: string }> => {
  const queryClient = useQueryClient();

  return useMutation(
    (data: { email: string }) => {
      return dataService.revokeAdminAccess(data);
    },
    {
      onMutate: (variables) => options?.onMutate?.(variables),
      onError: (error, variables, context) => options?.onError?.(error, variables, context),
      onSuccess: (data, variables, context) => {
        // Invalidate the adminInvitations query to refresh the list
        queryClient.invalidateQueries([QueryKeys.adminInvitations]);
        // Invalidate the adminUsers query to refresh the list
        queryClient.invalidateQueries([QueryKeys.adminUsers]);
        options?.onSuccess?.(data, variables, context);
      },
    },
  );
};
