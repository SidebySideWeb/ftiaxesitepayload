import type { CollectionConfig, CollectionBeforeChangeHook } from 'payload'
import { tenantAccess } from '../access/tenantAccess'
import { validateUrl } from '../utils/blockValidation'

const assignTenantHook: CollectionBeforeChangeHook = async ({ data, req, operation }) => {
  if (operation === 'create' && req.user?.tenant && !data.tenant) {
    // Assign tenant from logged-in user
    const tenantId = typeof req.user.tenant === 'object' ? req.user.tenant.id : req.user.tenant
    data.tenant = tenantId
  }
  return data
}

export const Footers: CollectionConfig = {
  slug: 'footers',
  admin: {
    useAsTitle: 'tenant',
    defaultColumns: ['tenant', 'createdAt', 'updatedAt'],
  },
  access: tenantAccess,
  hooks: {
    beforeChange: [assignTenantHook],
  },
  fields: [
    {
      name: 'tenant',
      type: 'relationship',
      relationTo: 'tenants',
      required: true,
      unique: true,
      index: true,
      admin: {
        description: 'Each tenant can have exactly one footer. This cannot be changed after creation.',
        readOnly: true,
        position: 'sidebar',
      },
    },
    {
      name: 'copyrightText',
      type: 'text',
      defaultValue: '',
      validate: (value: string | string[] | null | undefined) => {
        if (typeof value === 'string' && value.length > 200) {
          return 'Copyright text must be 200 characters or less'
        }
        return true
      },
      admin: {
        description: 'Copyright text to display in the footer (max 200 characters)',
      },
    },
    {
      name: 'socialLinks',
      type: 'array',
      defaultValue: [],
      admin: {
        description: 'Social media links. Footer will render even if empty.',
      },
      fields: [
        {
          name: 'platform',
          type: 'text',
          required: true,
          validate: (value: string | string[] | null | undefined) => {
            if (typeof value !== 'string' || !value.trim()) {
              return 'Platform name is required'
            }
            if (value.length > 50) {
              return 'Platform name must be 50 characters or less'
            }
            return true
          },
          admin: {
            description: 'Social media platform (e.g., Facebook, Twitter, Instagram)',
          },
        },
        {
          name: 'url',
          type: 'text',
          required: true,
          validate: validateUrl,
          admin: {
            description: 'URL to the social media profile. Must start with http:// or https://',
          },
        },
      ],
    },
  ],
  timestamps: true,
}

