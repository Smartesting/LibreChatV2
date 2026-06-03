import { useRecoilValue } from 'recoil';
import type t from 'librechat-data-provider';
import { dataService, QueryKeys } from 'librechat-data-provider';
import type { QueryObserverResult, UseQueryOptions } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';
import store from '~/store';

export const useGetUserQuery = (
  config?: UseQueryOptions<t.TUser>,
): QueryObserverResult<t.TUser> => {
  const queriesEnabled = useRecoilValue<boolean>(store.queriesEnabled);
  return useQuery<t.TUser>([QueryKeys.user], () => dataService.getUser(), {
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    retry: false,
    ...config,
    enabled: (config?.enabled ?? true) === true && queriesEnabled,
  });
};

export const useUserSession = (config?: UseQueryOptions<any>): QueryObserverResult<any> => {
  const queriesEnabled = useRecoilValue<boolean>(store.queriesEnabled);
  return useQuery<any>([QueryKeys.user, 'session'], () => dataService.getUserSession(), {
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    retry: false,
    staleTime: 60 * 1000,
    ...config,
    enabled: (config?.enabled ?? true) === true && queriesEnabled,
  });
};

export interface UseGraphTokenQueryOptions {
  scopes?: string;
  enabled?: boolean;
}

export const useGraphTokenQuery = (
  options: UseGraphTokenQueryOptions = {},
  config?: UseQueryOptions<any>,
): QueryObserverResult<any> => {
  const { scopes, enabled = false } = options;

  return useQuery({
    queryKey: [QueryKeys.graphToken, scopes],
    queryFn: () => dataService.getGraphApiToken({ scopes }),
    enabled,
    staleTime: 50 * 60 * 1000, // 50 minutes (tokens expire in 60 minutes)
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    ...config,
  });
};
