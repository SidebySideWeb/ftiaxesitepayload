import type { Access } from 'payload'
import { isAdmin } from './isAdmin'

/**
 * Access control for Forms collection
 * Forms use status: 'active'/'inactive' (not 'published'/'draft')
 * - Super admins see all forms
 * - Regular users see only their assigned tenant's forms
 * - Public users see only active forms
 */
export const formAccess: {
  read: Access
  create: Access
  update: Access
  delete: Access
} = {
  read: ({ req: { user } }): boolean | { tenant: { equals: string | number } } | { status: { equals: 'active' } } => {
    // Super admins see everything - MUST return true (not a query constraint)
    // This ensures collections are visible in admin UI
    if (isAdmin(user)) {
      return true
    }

    // Regular users see only their tenant's forms
    if (user?.tenant) {
      // Extract tenant ID (handles both string ID and object)
      const tenantId = typeof user.tenant === 'object' ? user.tenant.id : user.tenant
      return {
        tenant: {
          equals: tenantId,
        },
      }
    }

    // Public access: allow reading active forms only
    // Frontend needs to access active forms
    return {
      status: {
        equals: 'active' as const,
      },
    }
  },

  create: ({ req: { user }, data }) => {
    // Super admins can create for any tenant
    if (isAdmin(user)) {
      return true
    }

    // Regular users can only create forms for their own tenant
    if (user?.tenant) {
      const userTenantId = typeof user.tenant === 'object' ? user.tenant.id : user.tenant
      const dataTenantId = typeof data?.tenant === 'object' ? data.tenant.id : data?.tenant

      // Ensure the tenant field matches the user's tenant
      if (dataTenantId === userTenantId) {
        return true
      }
      return false
    }

    return false
  },

  update: ({ req: { user } }) => {
    // Super admins can update everything
    if (isAdmin(user)) {
      return true
    }

    // Regular users can only update their tenant's forms
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

    // Regular users can only delete their tenant's forms
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
