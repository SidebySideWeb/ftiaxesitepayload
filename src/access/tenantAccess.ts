import type { Access } from 'payload'
import { isAdmin } from './isAdmin'

/**
 * Helper to check if user is admin or editor
 */
function isAdminOrEditor(user?: { roles?: string | string[] } | null): boolean {
  if (!user?.roles) return false
  
  const roles = Array.isArray(user.roles) ? user.roles : [user.roles]
  return roles.includes('admin') || roles.includes('editor')
}

/**
 * Access control for tenant-scoped collections
 * - Super admins see all tenants and content
 * - Editors see only their assigned tenant's content
 * - Regular users see only their assigned tenant's content
 */
export const tenantAccess: {
  read: Access
  create: Access
  update: Access
  delete: Access
} = {
  read: ({ req: { user } }): boolean | { tenant: { equals: string | number } } | { status: { equals: 'published' } } => {
    // Super admins see everything - MUST return true (not a query constraint)
    // This ensures collections are visible in admin UI
    if (isAdmin(user)) {
      return true
    }

    // Editors and regular users see only their tenant's content
    if (user?.tenant) {
      // Extract tenant ID (handles both string ID and object)
      const tenantId = typeof user.tenant === 'object' ? user.tenant.id : user.tenant
      return {
        tenant: {
          equals: tenantId,
        },
      }
    }

    // Public access: allow reading published content only
    // Frontend needs to access published pages/homepages/posts
    return {
      status: {
        equals: 'published' as const,
      },
    }
  },

  create: ({ req: { user }, data }) => {
    // Super admins can create for any tenant
    if (isAdmin(user)) {
      return true
    }

    // Editors and regular users can create content
    // The tenant will be auto-assigned by hooks, so we allow creation
    // The hook will ensure the tenant matches the user's tenant
    if (isAdminOrEditor(user) && user?.tenant) {
      // Allow creation - hook will assign tenant automatically
      return true
    }

    // If user has tenant but is not editor/admin, still allow (for backward compatibility)
    if (user?.tenant) {
      return true
    }

    return false
  },

  update: ({ req: { user } }) => {
    // Super admins can update everything
    if (isAdmin(user)) {
      return true
    }

    // Editors and regular users can only update their tenant's content
    if (user?.tenant) {
      // Extract tenant ID (handles both string ID and object)
      const tenantId = typeof user.tenant === 'object' ? user.tenant.id : user.tenant
      return {
        tenant: {
          equals: tenantId,
        },
      }
    }

    return false
  },

  delete: ({ req: { user } }) => {
    // Super admins can delete everything
    if (isAdmin(user)) {
      return true
    }

    // Editors and regular users can only delete their tenant's content
    if (user?.tenant) {
      // Extract tenant ID (handles both string ID and object)
      const tenantId = typeof user.tenant === 'object' ? user.tenant.id : user.tenant
      return {
        tenant: {
          equals: tenantId,
        },
      }
    }

    return false
  },
}

