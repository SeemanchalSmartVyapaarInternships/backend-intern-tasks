/**
 * Centralized role and permission definitions.
 * Keeping these in one place avoids "magic string" role checks
 * scattered across the codebase and makes RBAC easy to audit/extend.
 */

const ROLES = Object.freeze({
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  EMPLOYEE: 'EMPLOYEE',
});

const ROLE_HIERARCHY = Object.freeze({
  [ROLES.SUPER_ADMIN]: 4,
  [ROLES.ADMIN]: 3,
  [ROLES.MANAGER]: 2,
  [ROLES.EMPLOYEE]: 1,
});

/**
 * Permission catalogue. Each permission maps to the list of roles
 * that are allowed to perform that action.
 */
const PERMISSIONS = Object.freeze({
  MANAGE_USERS: [ROLES.SUPER_ADMIN, ROLES.ADMIN],
  MANAGE_EMPLOYEES: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER],
  VIEW_REPORTS: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER],
  VIEW_OWN_PROFILE: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER, ROLES.EMPLOYEE],
  FULL_ACCESS: [ROLES.SUPER_ADMIN],
});

const ALL_ROLES = Object.values(ROLES);

module.exports = {
  ROLES,
  ROLE_HIERARCHY,
  PERMISSIONS,
  ALL_ROLES,
};
