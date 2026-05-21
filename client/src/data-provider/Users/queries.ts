import { QueryObserverResult, useQuery, UseQueryOptions } from '@tanstack/react-query';
import t, { dataService, QueryKeys } from 'librechat-data-provider';
import { useRecoilValue } from 'recoil';
import store from '~/store';

export const useGetAllUsersQuery = (
  config?: UseQueryOptions<t.TUser[]>,
): QueryObserverResult<t.TUser[]> => {
  const queriesEnabled = useRecoilValue<boolean>(store.queriesEnabled);
  return useQuery<t.TUser[]>([QueryKeys.users], () => dataService.getAllUsers(), {
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: true,
    retry: false,
    ...config,
    enabled: (config?.enabled ?? true) && queriesEnabled,
  });
};
