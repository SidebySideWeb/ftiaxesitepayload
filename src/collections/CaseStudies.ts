import type { CollectionConfig, CollectionBeforeChangeHook } from 'payload'
import { tenantAccess } from '../access/tenantAccess'

const assignTenantHook: CollectionBeforeChangeHook = async ({ data, req, operation }) => {
  if (operation === 'create' && req.user?.tenant && !data.tenant) {
    // Assign tenant from logged-in user
    const tenantId = typeof req.user.tenant === 'object' ? req.user.tenant.id : req.user.tenant
    data.tenant = tenantId
  }
  return data
}

export const CaseStudies: CollectionConfig = {
  slug: 'case-studies',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'tenant', 'status', 'createdAt'],
  },
  access: tenantAccess,
  versions: {
    drafts: true,
    maxPerDoc: 15,
  },
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
        description: 'The tenant this case study belongs to. This cannot be changed after creation.',
        readOnly: true,
        position: 'sidebar',
      },
    },
    {
      name: 'title',
      type: 'text',
      required: true,
      validate: (value: string | string[] | null | undefined) => {
        if (typeof value !== 'string' || !value.trim()) {
          return 'Title is required'
        }
        if (value.length > 200) {
          return 'Title must be 200 characters or less'
        }
        return true
      },
      admin: {
        description: 'Case study title (required, max 200 characters)',
      },
    },
    {
      name: 'goal',
      type: 'textarea',
      required: true,
      admin: {
        description: 'The goal or objective of this project',
      },
    },
    {
      name: 'what',
      type: 'textarea',
      required: true,
      admin: {
        description: 'What was done in this project',
      },
    },
    {
      name: 'result',
      type: 'textarea',
      required: true,
      admin: {
        description: 'The result or outcome of this project',
      },
    },
    {
      name: 'images',
      type: 'array',
      minRows: 1,
      maxRows: 6,
      admin: {
        description: 'Project images (1-6 images)',
      },
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          required: true,
        },
      ],
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
      defaultValue: 'draft',
      required: true,
      admin: {
        description: 'Publication status. Drafts are hidden from frontend.',
      },
    },
  ],
  timestamps: true,
}
