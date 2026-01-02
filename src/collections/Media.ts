import type { CollectionConfig, Access } from 'payload'
import { tenantAccess } from '../access/tenantAccess'
import { isAdmin } from '../access/isAdmin'

/**
 * Media access control
 * - Public read access for media files (needed for frontend display)
 * - Tenant-scoped access for admin operations (create, update, delete)
 * - Admin users see all media in admin UI
 */
const mediaAccess: {
  read: Access
  create: Access
  update: Access
  delete: Access
} = {
  // Public read access - media files need to be accessible for frontend rendering
  // For admin UI, admins should see all media
  read: ({ req: { user } }) => {
    // Admins see all media in admin UI
    if (isAdmin(user)) {
      return true
    }
    // Public read access for frontend
    return true
  },
  // Tenant-scoped for admin operations
  create: tenantAccess.create,
  update: tenantAccess.update,
  delete: tenantAccess.delete,
}

export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    defaultColumns: ['alt', 'tenant', 'createdAt'],
  },
  access: mediaAccess,
  fields: [
    {
      name: 'tenant',
      type: 'relationship',
      relationTo: 'tenants',
      required: true,
      index: true,
      admin: {
        description: 'The tenant this media belongs to. This cannot be changed after creation.',
        readOnly: true,
        position: 'sidebar',
      },
    },
    {
      name: 'alt',
      type: 'text',
      required: true,
      validate: (value) => {
        if (!value || value.trim() === '') {
          return 'Alt text is required for accessibility'
        }
        if (value.length > 200) {
          return 'Alt text must be 200 characters or less'
        }
        return true
      },
      admin: {
        description:
          'Alternative text for the image (required for accessibility, max 200 characters)',
      },
    },
  ],
  upload: true,
}
