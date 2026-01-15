import type { CollectionConfig, CollectionBeforeChangeHook } from 'payload'
import { tenantAccess } from '../access/tenantAccess'
import { tenantBlocks } from '../tenantRegistry'
import {
  homepageBlockGuardrails,
  normalizeBlocksHook,
} from '../hooks/blockGuardrails'

const assignTenantHook: CollectionBeforeChangeHook = async ({ data, req, operation }) => {
  if (operation === 'create' && req.user?.tenant && !data.tenant) {
    // Assign tenant from logged-in user
    const tenantId = typeof req.user.tenant === 'object' ? req.user.tenant.id : req.user.tenant
    data.tenant = tenantId
  }
  return data
}

export const Homepages: CollectionConfig = {
  slug: 'homepages',
  admin: {
    useAsTitle: 'tenant',
    defaultColumns: ['tenant', 'status', 'schemaVersion', 'createdAt'],
  },
  access: tenantAccess,
  versions: {
    drafts: true,
    maxPerDoc: 15,
  },
  hooks: {
    beforeValidate: [homepageBlockGuardrails],
    beforeChange: [normalizeBlocksHook, assignTenantHook],
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
        description: 'Each tenant can have exactly one homepage. This cannot be changed after creation.',
        readOnly: true,
        position: 'sidebar',
      },
    },
    {
      name: 'sections',
      type: 'blocks',
      blocks: tenantBlocks,
      defaultValue: [],
      admin: {
        description: 'Flexible sections for the homepage. Consider starting with a hero block for best UX.',
      },
    },
    {
      name: 'schemaVersion',
      type: 'number',
      defaultValue: 1,
      admin: {
        description: 'Schema version for migration tracking',
        readOnly: true,
      },
    },
    {
      name: 'status',
      type: 'select',
      options: [
        {
          label: 'Draft',
          value: 'draft',
        },
        {
          label: 'Published',
          value: 'published',
        },
      ],
      defaultValue: 'published',
      required: true,
      admin: {
        description: 'Publication status',
      },
    },
    {
      name: 'seo',
      type: 'group',
      admin: {
        description: 'SEO settings. All fields are optional.',
      },
      fields: [
        {
          name: 'title',
          type: 'text',
          defaultValue: '',
          validate: (value: string | string[] | null | undefined) => {
            if (typeof value === 'string' && value.length > 60) {
              return 'SEO title should be 60 characters or less for best results'
            }
            return true
          },
          admin: {
            description: 'SEO title for the homepage. Recommended: 50-60 characters.',
          },
        },
        {
          name: 'description',
          type: 'textarea',
          defaultValue: '',
          validate: (value: string | string[] | null | undefined) => {
            if (typeof value === 'string' && value.length > 160) {
              return 'Meta description should be 160 characters or less for best results'
            }
            return true
          },
          admin: {
            description: 'Meta description for search engines. Recommended: 150-160 characters.',
          },
        },
      ],
    },
  ],
  timestamps: true,
}

