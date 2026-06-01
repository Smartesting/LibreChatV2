import { z } from 'zod';
import {
  agentPermissionsSchema,
  bookmarkPermissionsSchema,
  fileCitationsPermissionsSchema,
  fileSearchPermissionsSchema,
  mcpServersPermissionsSchema,
  memoryPermissionsSchema,
  multiConvoPermissionsSchema,
  peoplePickerPermissionsSchema,
  Permissions,
  permissionsSchema,
  PermissionTypes,
  promptPermissionsSchema,
  remoteAgentsPermissionsSchema,
  runCodePermissionsSchema,
  skillPermissionsSchema,
  temporaryChatPermissionsSchema,
  webSearchPermissionsSchema,
} from './permissions';

/**
 * Enum for System Defined Roles
 */
export enum SystemRoles {
  /**
   * The Admin role
   */
  ADMIN = 'ADMIN',
  /**
   * The default user role
   */
  USER = 'USER',
  /**
   * The organization admin role
   */
  ORGADMIN = 'ORGADMIN',
  /**
   * The trainer role
   */
  TRAINER = 'TRAINER',
  /**
   * The trainee role
   */
  TRAINEE = 'TRAINEE',
}

export const roleSchema = z.object({
  name: z.string(),
  permissions: permissionsSchema,
});

export type TRole = z.infer<typeof roleSchema>;

const defaultRolesSchema = z.object({
  [SystemRoles.ADMIN]: roleSchema.extend({
    name: z.literal(SystemRoles.ADMIN),
    permissions: permissionsSchema.extend({
      [PermissionTypes.PROMPTS]: promptPermissionsSchema.extend({
        [Permissions.USE]: z.boolean().default(true),
        [Permissions.CREATE]: z.boolean().default(true),
        [Permissions.SHARE]: z.boolean().default(true),
        [Permissions.SHARE_PUBLIC]: z.boolean().default(true),
      }),
      [PermissionTypes.BOOKMARKS]: bookmarkPermissionsSchema.extend({
        [Permissions.USE]: z.boolean().default(true),
      }),
      [PermissionTypes.MEMORIES]: memoryPermissionsSchema.extend({
        [Permissions.USE]: z.boolean().default(true),
        [Permissions.CREATE]: z.boolean().default(true),
        [Permissions.UPDATE]: z.boolean().default(true),
        [Permissions.READ]: z.boolean().default(true),
        [Permissions.OPT_OUT]: z.boolean().default(true),
      }),
      [PermissionTypes.AGENTS]: agentPermissionsSchema.extend({
        [Permissions.USE]: z.boolean().default(true),
        [Permissions.CREATE]: z.boolean().default(true),
        [Permissions.SHARE]: z.boolean().default(true),
        [Permissions.SHARE_PUBLIC]: z.boolean().default(true),
      }),
      [PermissionTypes.MULTI_CONVO]: multiConvoPermissionsSchema.extend({
        [Permissions.USE]: z.boolean().default(true),
      }),
      [PermissionTypes.TEMPORARY_CHAT]: temporaryChatPermissionsSchema.extend({
        [Permissions.USE]: z.boolean().default(true),
      }),
      [PermissionTypes.RUN_CODE]: runCodePermissionsSchema.extend({
        [Permissions.USE]: z.boolean().default(true),
      }),
      [PermissionTypes.WEB_SEARCH]: webSearchPermissionsSchema.extend({
        [Permissions.USE]: z.boolean().default(true),
      }),
      [PermissionTypes.PEOPLE_PICKER]: peoplePickerPermissionsSchema.extend({
        [Permissions.VIEW_USERS]: z.boolean().default(true),
        [Permissions.VIEW_GROUPS]: z.boolean().default(true),
        [Permissions.VIEW_ROLES]: z.boolean().default(true),
      }),
      [PermissionTypes.MARKETPLACE]: z.object({
        [Permissions.USE]: z.boolean().default(false),
      }),
      [PermissionTypes.FILE_SEARCH]: fileSearchPermissionsSchema.extend({
        [Permissions.USE]: z.boolean().default(true),
      }),
      [PermissionTypes.FILE_CITATIONS]: fileCitationsPermissionsSchema.extend({
        [Permissions.USE]: z.boolean().default(true),
      }),
      [PermissionTypes.MCP_SERVERS]: mcpServersPermissionsSchema.extend({
        [Permissions.USE]: z.boolean().default(true),
        [Permissions.CREATE]: z.boolean().default(true),
        [Permissions.SHARE]: z.boolean().default(true),
        [Permissions.SHARE_PUBLIC]: z.boolean().default(true),
      }),
      [PermissionTypes.REMOTE_AGENTS]: remoteAgentsPermissionsSchema.extend({
        [Permissions.USE]: z.boolean().default(true),
        [Permissions.CREATE]: z.boolean().default(true),
        [Permissions.SHARE]: z.boolean().default(true),
        [Permissions.SHARE_PUBLIC]: z.boolean().default(true),
      }),
      [PermissionTypes.SKILLS]: skillPermissionsSchema.extend({
        [Permissions.USE]: z.boolean().default(true),
        [Permissions.CREATE]: z.boolean().default(true),
        [Permissions.SHARE]: z.boolean().default(true),
        [Permissions.SHARE_PUBLIC]: z.boolean().default(true),
      }),
    }),
  }),
  [SystemRoles.ORGADMIN]: roleSchema.extend({
    name: z.literal(SystemRoles.ORGADMIN),
    permissions: permissionsSchema,
  }),
  [SystemRoles.TRAINER]: roleSchema.extend({
    name: z.literal(SystemRoles.TRAINER),
    permissions: permissionsSchema,
  }),
  [SystemRoles.TRAINEE]: roleSchema.extend({
    name: z.literal(SystemRoles.TRAINEE),
    permissions: permissionsSchema,
  }),
  [SystemRoles.USER]: roleSchema.extend({
    name: z.literal(SystemRoles.USER),
    permissions: permissionsSchema,
  }),
});

const systemRoleSet = new Set(Object.values(SystemRoles).map((r) => r.toUpperCase()));

/** Case-insensitive check for reserved system role names. */
export function isSystemRoleName(name: string | string[] | undefined | null): boolean {
  if (!name) {
    return false;
  }
  if (Array.isArray(name)) {
    return name.some((n) => systemRoleSet.has(n.toUpperCase()));
  }
  return systemRoleSet.has(name.toUpperCase());
}

export const roleDefaults = defaultRolesSchema.parse({
  [SystemRoles.ADMIN]: {
    name: SystemRoles.ADMIN,
    permissions: {
      [PermissionTypes.PROMPTS]: {
        [Permissions.USE]: true,
        [Permissions.CREATE]: true,
        [Permissions.SHARE]: true,
        [Permissions.SHARE_PUBLIC]: true,
      },
      [PermissionTypes.BOOKMARKS]: {
        [Permissions.USE]: true,
      },
      [PermissionTypes.MEMORIES]: {
        [Permissions.USE]: true,
        [Permissions.CREATE]: true,
        [Permissions.UPDATE]: true,
        [Permissions.READ]: true,
        [Permissions.OPT_OUT]: true,
      },
      [PermissionTypes.AGENTS]: {
        [Permissions.USE]: true,
        [Permissions.CREATE]: true,
        [Permissions.SHARE]: true,
        [Permissions.SHARE_PUBLIC]: true,
      },
      [PermissionTypes.MULTI_CONVO]: {
        [Permissions.USE]: true,
      },
      [PermissionTypes.TEMPORARY_CHAT]: {
        [Permissions.USE]: true,
      },
      [PermissionTypes.RUN_CODE]: {
        [Permissions.USE]: true,
      },
      [PermissionTypes.WEB_SEARCH]: {
        [Permissions.USE]: true,
      },
      [PermissionTypes.PEOPLE_PICKER]: {
        [Permissions.VIEW_USERS]: true,
        [Permissions.VIEW_GROUPS]: true,
        [Permissions.VIEW_ROLES]: true,
      },
      [PermissionTypes.MARKETPLACE]: {
        [Permissions.USE]: true,
      },
      [PermissionTypes.FILE_SEARCH]: {
        [Permissions.USE]: true,
      },
      [PermissionTypes.FILE_CITATIONS]: {
        [Permissions.USE]: true,
      },
      [PermissionTypes.MCP_SERVERS]: {
        [Permissions.USE]: true,
        [Permissions.CREATE]: true,
        [Permissions.SHARE]: true,
        [Permissions.SHARE_PUBLIC]: true,
      },
      [PermissionTypes.REMOTE_AGENTS]: {
        [Permissions.USE]: true,
        [Permissions.CREATE]: true,
        [Permissions.SHARE]: true,
        [Permissions.SHARE_PUBLIC]: true,
      },
      [PermissionTypes.SKILLS]: {
        [Permissions.USE]: true,
        [Permissions.CREATE]: true,
        [Permissions.SHARE]: true,
        [Permissions.SHARE_PUBLIC]: true,
      },
    },
  },
  [SystemRoles.ORGADMIN]: {
    name: SystemRoles.ORGADMIN,
    permissions: {
      [PermissionTypes.PROMPTS]: {
        [Permissions.SHARE]: false,
        [Permissions.SHARE_PUBLIC]: false,
        [Permissions.USE]: false,
        [Permissions.CREATE]: false,
      },
      [PermissionTypes.BOOKMARKS]: {
        [Permissions.USE]: false,
      },
      [PermissionTypes.AGENTS]: {
        [Permissions.SHARE]: false,
        [Permissions.SHARE_PUBLIC]: false,
        [Permissions.USE]: false,
        [Permissions.CREATE]: false,
      },
      [PermissionTypes.MULTI_CONVO]: {
        [Permissions.USE]: false,
      },
      [PermissionTypes.TEMPORARY_CHAT]: {
        [Permissions.USE]: false,
      },
      [PermissionTypes.RUN_CODE]: {
        [Permissions.USE]: false,
      },
      [PermissionTypes.MEMORIES]: {},
      [PermissionTypes.WEB_SEARCH]: {},
      [PermissionTypes.PEOPLE_PICKER]: {},
      [PermissionTypes.MARKETPLACE]: {},
      [PermissionTypes.FILE_SEARCH]: {},
      [PermissionTypes.FILE_CITATIONS]: {},
      [PermissionTypes.MCP_SERVERS]: {},
      [PermissionTypes.REMOTE_AGENTS]: {},
      [PermissionTypes.SKILLS]: {},
    },
  },
  [SystemRoles.TRAINER]: {
    name: SystemRoles.TRAINER,
    permissions: {
      [PermissionTypes.PROMPTS]: {},
      [PermissionTypes.BOOKMARKS]: {},
      [PermissionTypes.AGENTS]: {},
      [PermissionTypes.MULTI_CONVO]: {},
      [PermissionTypes.TEMPORARY_CHAT]: {},
      [PermissionTypes.RUN_CODE]: {},
      [PermissionTypes.MEMORIES]: {},
      [PermissionTypes.WEB_SEARCH]: {},
      [PermissionTypes.PEOPLE_PICKER]: {},
      [PermissionTypes.MARKETPLACE]: {},
      [PermissionTypes.FILE_SEARCH]: {},
      [PermissionTypes.FILE_CITATIONS]: {},
      [PermissionTypes.MCP_SERVERS]: {},
      [PermissionTypes.REMOTE_AGENTS]: {},
      [PermissionTypes.SKILLS]: {},
    },
  },
  [SystemRoles.TRAINEE]: {
    name: SystemRoles.TRAINEE,
    permissions: {
      [PermissionTypes.PROMPTS]: {},
      [PermissionTypes.BOOKMARKS]: {},
      [PermissionTypes.AGENTS]: {},
      [PermissionTypes.MULTI_CONVO]: {},
      [PermissionTypes.TEMPORARY_CHAT]: {},
      [PermissionTypes.RUN_CODE]: {},
      [PermissionTypes.MEMORIES]: {},
      [PermissionTypes.WEB_SEARCH]: {},
      [PermissionTypes.PEOPLE_PICKER]: {},
      [PermissionTypes.MARKETPLACE]: {},
      [PermissionTypes.FILE_SEARCH]: {},
      [PermissionTypes.FILE_CITATIONS]: {},
      [PermissionTypes.MCP_SERVERS]: {},
      [PermissionTypes.REMOTE_AGENTS]: {},
      [PermissionTypes.SKILLS]: {},
    },
  },
  [SystemRoles.USER]: {
    name: SystemRoles.USER,
    permissions: {
      [PermissionTypes.PROMPTS]: {},
      [PermissionTypes.BOOKMARKS]: {},
      [PermissionTypes.AGENTS]: {},
      [PermissionTypes.MULTI_CONVO]: {},
      [PermissionTypes.TEMPORARY_CHAT]: {},
      [PermissionTypes.RUN_CODE]: {},
      [PermissionTypes.MEMORIES]: {},
      [PermissionTypes.WEB_SEARCH]: {},
      [PermissionTypes.PEOPLE_PICKER]: {},
      [PermissionTypes.MARKETPLACE]: {},
      [PermissionTypes.FILE_SEARCH]: {},
      [PermissionTypes.FILE_CITATIONS]: {},
      [PermissionTypes.MCP_SERVERS]: {},
      [PermissionTypes.REMOTE_AGENTS]: {},
      [PermissionTypes.SKILLS]: {},
    },
  },
});
