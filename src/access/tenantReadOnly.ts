import type { Access } from 'payload'
import { isAdmin } from './isAdmin'

/**
 * Access control for Tenants collection
 * - Super admins have full access
 * - Regular users can only read (no create/update/delete)
 */
export const tenantReadOnly: {
  read: Access
  create: Access
  update: Access
  delete: Access
} = {
  read: ({ req: { user } }) => {
    // Super admins see all tenants - MUST return true (not a query constraint)
    // This ensures collections are visible in admin UI
    if (isAdmin(user)) {
      return true
    }

    // Regular users see only their assigned tenant
    if (user?.tenant) {
      // Extract tenant ID (handles both string ID and object)
      const tenantId = typeof user.tenant === 'object' ? user.tenant.id : user.tenant
      return {
        id: {
          equals: tenantId,
        },
      }
    }

    // Public access: allow reading all tenants (needed for frontend)
    // Tenants are not sensitive data and need to be publicly readable
    return true
  },

  create: ({ req: { user } }) => {
    // Only super admins can create tenants
    return isAdmin(user)
  },

  update: ({ req: { user } }) => {
    // Only super admins can update tenants
    return isAdmin(user)
  },

  delete: ({ req: { user } }) => {
    // Only super admins can delete tenants
    return isAdmin(user)
  },
}

