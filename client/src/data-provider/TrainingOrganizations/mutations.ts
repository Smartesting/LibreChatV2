import { QueryClient, useMutation, UseMutationResult, useQueryClient } from '@tanstack/react-query';
import type * as t from 'librechat-data-provider';
import { dataService, QueryKeys } from 'librechat-data-provider';

/**
 * TRAINING ORGANIZATIONS
 */

/**
 * Create a new training organization
 */
export const useCreateTrainingOrganizationMutation = (
  options?: t.CreateTrainingOrganizationMutationOptions,
): UseMutationResult<t.TrainingOrganization, Error, t.TrainingOrganizationCreateParams> => {
  const queryClient = useQueryClient();
  return useMutation(
    (newOrgData: t.TrainingOrganizationCreateParams) =>
      dataService.createTrainingOrganization(newOrgData),
    {
      onMutate: (variables) => options?.onMutate?.(variables),
      onError: (error, variables, context) => options?.onError?.(error, variables, context),
      onSuccess: (newTrainingOrg, variables, context) => {
        const listRes = queryClient.getQueryData<t.TrainingOrganization[]>([
          QueryKeys.trainingOrganizations,
        ]);

        if (!listRes) {
          return options?.onSuccess?.(newTrainingOrg, variables, context);
        }

        const currentTrainingOrgs = [...listRes, newTrainingOrg];

        queryClient.setQueryData<t.TrainingOrganization[]>(
          [QueryKeys.trainingOrganizations],
          currentTrainingOrgs,
        );
        return options?.onSuccess?.(newTrainingOrg, variables, context);
      },
    },
  );
};

/**
 * Delete a training organization
 */
export const useDeleteTrainingOrganizationMutation = (
  options?: t.DeleteTrainingOrganizationMutationOptions,
): UseMutationResult<void, Error, t.TrainingOrganization['_id']> => {
  const queryClient = useQueryClient();
  return useMutation((id: string) => dataService.deleteTrainingOrganization(id), {
    onMutate: (orgId) => options?.onMutate?.(orgId),
    onError: (error, orgId, context) => options?.onError?.(error, orgId, context),
    onSuccess: (data, orgId, context) => {
      const listRes = queryClient.getQueryData<t.TrainingOrganization[]>([
        QueryKeys.trainingOrganizations,
      ]);
      if (!listRes) {
        return options?.onSuccess?.(data, orgId, context);
      }
      const updatedTrainingOrgs = listRes.filter((org) => org._id !== orgId);
      queryClient.setQueryData<t.TrainingOrganization[]>(
        [QueryKeys.trainingOrganizations],
        updatedTrainingOrgs,
      );
      return options?.onSuccess?.(data, orgId, context);
    },
  });
};

function getOrgMutationOptions(
  queryClient: QueryClient,
  options?: t.MutationOptions<
    t.TrainingOrganization,
    {
      id: string;
      email: string;
    }
  >,
  invalidateQueries?: Partial<{
    adminInvitations: boolean;
    trainerInvitations: boolean;
  }>,
) {
  return {
    onMutate: (variables: { id: string; email: string }) => options?.onMutate?.(variables),
    onError: (
      error: Error,
      variables: {
        id: string;
        email: string;
      },
    ) => options?.onError?.(error, variables),
    onSuccess: (
      updatedOrg: t.TrainingOrganization,
      variables: {
        id: string;
        email: string;
      },
    ) => {
      // Update the organization in the cache
      queryClient.setQueryData<t.TrainingOrganization>(
        [QueryKeys.trainingOrganizations, variables.id],
        updatedOrg,
      );

      // Update the organization in the main list cache
      const listRes = queryClient.getQueryData<t.TrainingOrganization[]>([
        QueryKeys.trainingOrganizations,
      ]);

      if (listRes) {
        const updatedList = listRes.map((org) =>
          org._id === variables.id ? updatedOrg : org
        );

        queryClient.setQueryData<t.TrainingOrganization[]>(
          [QueryKeys.trainingOrganizations],
          updatedList
        );
      }

      if (invalidateQueries?.adminInvitations) {
        // Invalidate the admin invitations query to refresh the list of administrators
        queryClient.invalidateQueries([
          QueryKeys.trainingOrganizations,
          variables.id,
          'adminInvitations',
        ]);
      }

      if (invalidateQueries?.trainerInvitations) {
        // Invalidate the trainer invitations query to refresh the list of trainers
        queryClient.invalidateQueries([
          QueryKeys.trainingOrganizations,
          variables.id,
          'trainerInvitations',
        ]);
      }

      return options?.onSuccess?.(updatedOrg, variables);
    },
  };
}

/**
 * Add an administrator to a training organization
 */
export const useAddAdministratorMutation = (
  options?: t.MutationOptions<t.TrainingOrganization, { id: string; email: string }>,
): UseMutationResult<t.TrainingOrganization, Error, { id: string; email: string }> => {
  const queryClient = useQueryClient();
  return useMutation(
    ({ id, email }: { id: string; email: string }) =>
      dataService.addAdministratorToOrganization(id, email),
    getOrgMutationOptions(queryClient, options, { adminInvitations: true }),
  );
};

/**
 * Remove an administrator from a training organization
 */
export const useRemoveAdministratorMutation = (
  options?: t.MutationOptions<t.TrainingOrganization, { id: string; email: string }>,
): UseMutationResult<t.TrainingOrganization, Error, { id: string; email: string }> => {
  const queryClient = useQueryClient();
  return useMutation(
    ({ id, email }: { id: string; email: string }) =>
      dataService.removeAdministratorFromOrganization(id, email),
    getOrgMutationOptions(queryClient, options, { adminInvitations: true }),
  );
};

/**
 * Add a trainer to a training organization
 */
export const useAddTrainerMutation = (
  options?: t.MutationOptions<t.TrainingOrganization, { id: string; email: string }>,
): UseMutationResult<t.TrainingOrganization, Error, { id: string; email: string }> => {
  const queryClient = useQueryClient();
  return useMutation(
    ({ id, email }: { id: string; email: string }) =>
      dataService.addTrainerToOrganization(id, email),
    getOrgMutationOptions(queryClient, options, { trainerInvitations: true }),
  );
};

/**
 * Remove a trainer from a training organization
 */
export const useRemoveTrainerMutation = (
  options?: t.MutationOptions<t.TrainingOrganization, { id: string; email: string }>,
): UseMutationResult<t.TrainingOrganization, Error, { id: string; email: string }> => {
  const queryClient = useQueryClient();
  return useMutation(
    ({ id, email }: { id: string; email: string }) =>
      dataService.removeTrainerFromOrganization(id, email),
    getOrgMutationOptions(queryClient, options, { trainerInvitations: true }),
  );
};

/**
 * TRAININGS
 */

/**
 * Create a new training
 */
export const useCreateTrainingMutation = (
  options?: t.CreateTrainingMutationOptions,
): UseMutationResult<t.Training, Error, t.TrainingCreateParams> => {
  const queryClient = useQueryClient();
  return useMutation(
    (newTrainingData: t.TrainingCreateParams) =>
      dataService.createTraining(newTrainingData.trainingOrganizationId, newTrainingData),
    {
      onMutate: (variables) => options?.onMutate?.(variables),
      onError: (error, variables, context) => options?.onError?.(error, variables, context),
      onSuccess: (newTraining, variables, context) => {
        queryClient.invalidateQueries([
          QueryKeys.trainingOrganizations,
          variables.trainingOrganizationId,
          'trainings',
        ]);
        return options?.onSuccess?.(newTraining, variables, context);
      },
    },
  );
};

/**
 * Delete a training
 */
export const useDeleteTrainingMutation = (
  options?: t.DeleteTrainingMutationOptions,
): UseMutationResult<void, Error, { organizationId: string; trainingId: string }> => {
  const queryClient = useQueryClient();
  return useMutation(
    ({ organizationId, trainingId }: { organizationId: string; trainingId: string }) =>
      dataService.deleteTraining(organizationId, trainingId),
    {
      onMutate: (variables) => options?.onMutate?.(variables),
      onError: (error, variables, context) => options?.onError?.(error, variables, context),
      onSuccess: (data, variables, context) => {
        queryClient.invalidateQueries([QueryKeys.trainingOrganizations]);
        return options?.onSuccess?.(data, variables, context);
      },
    },
  );
};

/**
 * Update a training
 */
export const useUpdateTrainingMutation = (
  options?: t.UpdateTrainingMutationOptions,
): UseMutationResult<
  t.Training,
  Error,
  { organizationId: string; id: string; data: Partial<t.Training> }
> => {
  const queryClient = useQueryClient();
  return useMutation(
    ({
      organizationId,
      id,
      data,
    }: {
      organizationId: string;
      id: string;
      data: Partial<t.Training>;
    }) => dataService.updateTraining(organizationId, id, data),
    {
      onMutate: (variables) => options?.onMutate?.(variables),
      onError: (error, variables, context) => options?.onError?.(error, variables, context),
      onSuccess: (updatedTraining, variables, context) => {
        if (updatedTraining.trainingOrganizationId) {
          queryClient.invalidateQueries([
            QueryKeys.trainingOrganizations,
            updatedTraining.trainingOrganizationId,
            'trainings',
          ]);
        } else {
          queryClient.invalidateQueries([QueryKeys.trainingOrganizations]);
        }
        return options?.onSuccess?.(updatedTraining, variables, context);
      },
    },
  );
};
