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

export const NavigationMenus: CollectionConfig = {
  slug: 'navigation-menus',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'tenant', 'createdAt'],
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
      index: true,
      admin: {
        description: 'The tenant this navigation menu belongs to. This cannot be changed after creation.',
        readOnly: true,
        position: 'sidebar',
      },
    },
    {
      name: 'title',
      type: 'text',
      required: true,
      admin: {
        description: 'Internal name for this navigation menu',
      },
    },
    {
      name: 'items',
      type: 'array',
      defaultValue: [],
      admin: {
        description: 'Navigation menu items. Menu will be empty if no items are added.',
      },
      fields: [
        {
          name: 'label',
          type: 'text',
          required: true,
          validate: (value: string | string[] | null | undefined) => {
            if (typeof value !== 'string' || !value.trim()) {
              return 'Label is required'
            }
            if (value.length > 50) {
              return 'Label must be 50 characters or less'
            }
            return true
          },
          admin: {
            description: 'Menu item label (max 50 characters)',
          },
        },
        {
          name: 'type',
          type: 'select',
          options: [
            {
              label: 'Internal',
              value: 'internal',
            },
            {
              label: 'External',
              value: 'external',
            },
          ],
          required: true,
          defaultValue: 'internal',
          admin: {
            description: 'Link type: Internal links to a page, External links to a URL',
          },
        },
        {
          name: 'page',
          type: 'relationship',
          relationTo: 'pages',
          admin: {
            condition: (data) => data.type === 'internal',
            description: 'Select a page for internal links',
          },
        },
        {
          name: 'url',
          type: 'text',
          defaultValue: '',
          validate: (value: string | string[] | null | undefined, { data }: { data?: { type?: string } }) => {
            if (data?.type === 'external') {
              if (typeof value !== 'string' || !value.trim()) {
                return 'URL is required for external links'
              }
              return validateUrl(value)
            }
            return true
          },
          admin: {
            condition: (data) => data.type === 'external',
            description: 'External URL. Must start with / (internal), http://, or https://',
          },
        },
        {
          name: 'openInNewTab',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            description: 'Open link in a new tab',
          },
        },
      ],
    },
  ],
  timestamps: true,
}

