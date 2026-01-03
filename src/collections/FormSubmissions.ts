import type { CollectionConfig, CollectionBeforeChangeHook } from 'payload'
import { tenantAccess } from '../access/tenantAccess'

const assignTenantHook: CollectionBeforeChangeHook = async ({ data, req, operation }) => {
  if (operation === 'create' && data.form) {
    // Get the form to extract its tenant
    const payload = req.payload
    const form = await payload.findByID({
      collection: 'forms',
      id: typeof data.form === 'object' ? data.form.id : data.form,
      depth: 0,
    })
    
    if (form?.tenant) {
      const tenantId = typeof form.tenant === 'object' ? form.tenant.id : form.tenant
      data.tenant = tenantId
    }
  }
  return data
}

export const FormSubmissions: CollectionConfig = {
  slug: 'form-submissions',
  admin: {
    useAsTitle: 'form',
    defaultColumns: ['form', 'tenant', 'createdAt'],
  },
  access: {
    ...tenantAccess,
    create: () => true, // Allow public submissions via API
  },
  hooks: {
    beforeChange: [assignTenantHook],
  },
  fields: [
    {
      name: 'form',
      type: 'relationship',
      relationTo: 'forms',
      required: true,
      index: true,
      admin: {
        description: 'The form this submission belongs to',
      },
    },
    {
      name: 'tenant',
      type: 'relationship',
      relationTo: 'tenants',
      required: true,
      index: true,
      admin: {
        description: 'The tenant this submission belongs to (auto-set from form)',
        readOnly: true,
        position: 'sidebar',
      },
    },
    {
      name: 'payload',
      type: 'json',
      required: true,
      admin: {
        description: 'Form submission data',
      },
    },
    {
      name: 'metadata',
      type: 'group',
      fields: [
        {
          name: 'ip',
          type: 'text',
          admin: {
            description: 'IP address of submitter',
          },
        },
        {
          name: 'userAgent',
          type: 'text',
          admin: {
            description: 'User agent string',
          },
        },
      ],
    },
  ],
  timestamps: true,
}

