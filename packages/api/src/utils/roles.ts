export type UserRoleLike = string | string[] | null | undefined;

export function normalizeRoles(role: UserRoleLike): string[] {
  let roles: string[] = [];

  if (Array.isArray(role)) {
    roles = role;
  } else if (role) {
    roles = [role];
  }

  return Array.from(
    new Set(roles.map((value) => value.trim()).filter((value) => value.length > 0)),
  );
}

export function serializeRoles(role: UserRoleLike): string {
  return normalizeRoles(role).sort().join(',');
}

export function hasRole(role: UserRoleLike, expectedRole: string): boolean {
  return normalizeRoles(role).includes(expectedRole);
}
