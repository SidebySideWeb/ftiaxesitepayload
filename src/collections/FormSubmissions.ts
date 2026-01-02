import type { CollectionConfig } from 'payload'
import { tenantAccess } from '../access/tenantAccess'

export const FormSubmissions: CollectionConfig = {
  slug: 'form-submissions',
  admin: {
    useAsTitle: 'form',
    defaultColumns: ['form', 'createdAt'],
  },
  access: {
    ...tenantAccess,
    create: () => true, // Allow public submissions via API
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

