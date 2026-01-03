import type { Access } from 'payload'
import { isAdmin } from './isAdmin'

/**
 * Access control for tenant-scoped collections
 * - Super admins see all tenants and content
 * - Regular users see only their assigned tenant's content
 */
export const tenantAccess: {
  read: Access
  create: Access
  update: Access
  delete: Access
} = {
  read: ({ req: { user } }) => {
    // Super admins see everything - MUST return true (not a query constraint)
    // This ensures collections are visible in admin UI
    if (isAdmin(user)) {
      return true
    }

    // Regular users see only their tenant's content
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
        equals: 'published',
      },
    }
  },

  create: ({ req: { user }, data }) => {
    // Super admins can create for any tenant
    if (isAdmin(user)) {
      return true
    }

    // Regular users can only create content for their own tenant
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

    // Regular users can only update their tenant's content
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

    // Regular users can only delete their tenant's content
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

