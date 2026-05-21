import { QueryObserverResult, useQuery, UseQueryOptions } from '@tanstack/react-query';
import { dataService, QueryKeys, Invitation } from 'librechat-data-provider';
import { useRecoilValue } from 'recoil';
import store from '~/store';

/**
 * Hook to fetch admin invitations
 */
export const useGetAdminInvitationsQuery = (
  config?: UseQueryOptions<Invitation[]>,
): QueryObserverResult<Invitation[]> => {
  const queriesEnabled = useRecoilValue<boolean>(store.queriesEnabled);
  return useQuery<Invitation[]>(
    [QueryKeys.adminInvitations],
    () => dataService.getAdminInvitations(),
    {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
      retry: false,
      ...config,
      enabled: (config?.enabled ?? true) === true && queriesEnabled,
    },
  );
};
