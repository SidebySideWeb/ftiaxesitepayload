import type { CollectionConfig } from 'payload'
import { tenantAccess } from '../access/tenantAccess'
import { tenantBlocks } from '../tenantRegistry'
import { pageBlockGuardrails, normalizeBlocksHook } from '../hooks/blockGuardrails'

export const Pages: CollectionConfig = {
  slug: 'pages',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'tenant', 'status', 'createdAt'],
  },
  access: tenantAccess,
  versions: {
    drafts: true,
    maxPerDoc: 15,
  },
  hooks: {
    beforeValidate: [pageBlockGuardrails],
    beforeChange: [normalizeBlocksHook],
  },
  fields: [
    {
      name: 'tenant',
      type: 'relationship',
      relationTo: 'tenants',
      required: true,
      index: true,
      admin: {
        description: 'The tenant this page belongs to. This cannot be changed after creation.',
        readOnly: true,
        position: 'sidebar',
      },
    },
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      admin: {
        description: 'URL-friendly identifier for this page',
      },
    },
    {
      name: 'sections',
      type: 'blocks',
      blocks: tenantBlocks,
      defaultValue: [],
      admin: {
        description: 'Flexible sections for the page. Page will render even if empty, but will show no content.',
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
          validate: (value) => {
            if (value && value.length > 60) {
              return 'SEO title should be 60 characters or less for best results'
            }
            return true
          },
          admin: {
            description: 'SEO title (overrides page title if set). Recommended: 50-60 characters.',
          },
        },
        {
          name: 'description',
          type: 'textarea',
          defaultValue: '',
          validate: (value) => {
            if (value && value.length > 160) {
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

