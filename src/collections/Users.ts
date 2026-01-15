import type { CollectionConfig, Access } from 'payload'
import { isAdmin } from '../access/isAdmin'

/**
 * Access control for Users collection
 * - Admins see all users
 * - Editors see only users from their tenant
 * - Users can see only themselves
 */
const usersAccess: {
  read: Access
  create: Access
  update: Access
  delete: Access
} = {
  read: ({ req: { user } }) => {
    // Admins see all users
    if (isAdmin(user)) {
      return true
    }

    // Editors see only users from their tenant
    if (user?.roles?.includes('editor') && user?.tenant) {
      const tenantId = typeof user.tenant === 'object' ? user.tenant.id : user.tenant
      return {
        tenant: {
          equals: tenantId,
        },
      }
    }

    // Regular users can only see themselves
    if (user?.id) {
      return {
        id: {
          equals: user.id,
        },
      }
    }

    return false
  },

  create: ({ req: { user } }) => {
    // Only admins can create users
    return isAdmin(user) ?? false
  },

  update: ({ req: { user }, id }) => {
    // Admins can update anyone
    if (isAdmin(user)) {
      return true
    }

    // Editors can update users from their tenant
    if (user?.roles?.includes('editor') && user?.tenant) {
      const tenantId = typeof user.tenant === 'object' ? user.tenant.id : user.tenant
      // We need to check if the user being updated belongs to the same tenant
      // This requires a query constraint
      return {
        tenant: {
          equals: tenantId,
        },
      }
    }

    // Users can only update themselves
    if (user?.id && id === user.id) {
      return true
    }

    return false
  },

  delete: ({ req: { user } }) => {
    // Only admins can delete users
    return isAdmin(user) ?? false
  },
}

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'tenant', 'roles', 'createdAt'],
  },
  auth: true,
  access: usersAccess,
  fields: [
    {
      name: 'tenant',
      type: 'relationship',
      relationTo: 'tenants',
      saveToJWT: true,
      admin: {
        description: 'The tenant this user belongs to. Leave empty for super admins.',
      },
    },
    {
      name: 'roles',
      type: 'select',
      hasMany: true,
      options: [
        {
          label: 'Admin',
          value: 'admin',
        },
        {
          label: 'Editor',
          value: 'editor',
        },
        {
          label: 'User',
          value: 'user',
        },
      ],
      defaultValue: ['user'],
      required: true,
      saveToJWT: true,
      access: {
        update: ({ req: { user } }) => {
          // Only admins can update roles
          return user?.roles?.includes('admin') ?? false
        },
      },
    },
  ],
}
