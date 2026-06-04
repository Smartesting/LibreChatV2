import { useMemo, useState, useCallback } from 'react';
import { SystemRoles, roleDefaults, isSystemRoleName } from 'librechat-data-provider';
import type { PermissionTypes, TRole } from 'librechat-data-provider';
import { useGetRole, useListRoles } from '~/data-provider';
import { hasRole } from '~/utils/roles';
import { useAuthContext } from './AuthContext';

export function useRoleSelector(permissionType: PermissionTypes) {
  const { user, roles } = useAuthContext();
  const [selectedRole, setSelectedRole] = useState<string>(SystemRoles.USER);
  const selectedRoleData = roles?.[selectedRole] ?? null;

  const { data: roleList } = useListRoles({
    enabled: hasRole(user?.role, SystemRoles.ADMIN),
  });

  const shouldFetchSelectedRole = selectedRoleData == null;
  const isSelectedCustomRole = !isSystemRoleName(selectedRole);

  const {
    data: fetchedRoleData = null,
    isLoading: isSelectedRoleLoading,
    isError: isSelectedRoleError,
  } = useGetRole(selectedRole, { enabled: shouldFetchSelectedRole });

  const resolvePermissions = useCallback(
    (role: string, roleData: TRole | null) => {
      if (roleData?.permissions?.[permissionType]) {
        return roleData.permissions[permissionType];
      }
      const contextPermissions = roles?.[role]?.permissions?.[permissionType];
      if (contextPermissions) {
        return contextPermissions;
      }
      const isCustom = !isSystemRoleName(role);
      const defaults = !isCustom
        ? roleDefaults[role as SystemRoles]
        : roleDefaults[SystemRoles.USER];
      return defaults.permissions[permissionType];
    },
    [roles, permissionType],
  );

  const defaultValues = useMemo(
    () => resolvePermissions(selectedRole, fetchedRoleData ?? selectedRoleData),
    [resolvePermissions, selectedRole, fetchedRoleData, selectedRoleData],
  );

  const availableRoleNames = useMemo(() => {
    const names = roleList?.roles?.map((r) => r.name);
    return names?.length ? names : [SystemRoles.USER, SystemRoles.ADMIN];
  }, [roleList]);

  const roleDropdownItems = useMemo(
    () => availableRoleNames.map((role) => ({ label: role, onClick: () => setSelectedRole(role) })),
    [availableRoleNames],
  );

  return {
    selectedRole,
    setSelectedRole,
    isSelectedCustomRole,
    isCustomRoleLoading: shouldFetchSelectedRole ? isSelectedRoleLoading : false,
    isCustomRoleError: shouldFetchSelectedRole ? isSelectedRoleError : false,
    defaultValues,
    roleDropdownItems,
  };
}
