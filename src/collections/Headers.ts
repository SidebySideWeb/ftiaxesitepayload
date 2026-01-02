import type { CollectionConfig } from 'payload'
import { tenantAccess } from '../access/tenantAccess'

export const Headers: CollectionConfig = {
  slug: 'headers',
  admin: {
    useAsTitle: 'tenant',
    defaultColumns: ['tenant', 'createdAt', 'updatedAt'],
  },
  access: tenantAccess,
  fields: [
    {
      name: 'tenant',
      type: 'relationship',
      relationTo: 'tenants',
      required: true,
      unique: true,
      index: true,
      admin: {
        description: 'Each tenant can have exactly one header. This cannot be changed after creation.',
        readOnly: true,
        position: 'sidebar',
      },
    },
    {
      name: 'logo',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Logo image for the header',
      },
    },
    {
      name: 'navigationMenu',
      type: 'relationship',
      relationTo: 'navigation-menus',
      admin: {
        description: 'Navigation menu to display in the header',
      },
    },
    {
      name: 'enableTopBar',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Show a top bar above the main header',
      },
    },
    {
      name: 'topBarText',
      type: 'text',
      defaultValue: '',
      validate: (value: string | string[] | null | undefined, { data }: { data?: { enableTopBar?: boolean } }) => {
        if (data?.enableTopBar && typeof value === 'string' && value.length > 100) {
          return 'Top bar text must be 100 characters or less'
        }
        return true
      },
      admin: {
        condition: (data) => data.enableTopBar === true,
        description: 'Text to display in the top bar (max 100 characters)',
      },
    },
  ],
  timestamps: true,
}

