import type { CollectionConfig } from 'payload'
import { tenantReadOnly } from '../access/tenantReadOnly'

export const Tenants: CollectionConfig = {
  slug: 'tenants',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'code', 'status', 'createdAt'],
  },
  access: tenantReadOnly,
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'code',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        description: 'Unique identifier for the tenant (e.g., kallitechnia, ftiaxesite)',
      },
    },
    {
      name: 'domains',
      type: 'array',
      fields: [
        {
          name: 'domain',
          type: 'text',
          required: true,
        },
        {
          name: 'status',
          type: 'select',
          options: [
            {
              label: 'Active',
              value: 'active',
            },
            {
              label: 'Disabled',
              value: 'disabled',
            },
          ],
          defaultValue: 'active',
          required: true,
        },
      ],
    },
  ],
  timestamps: true,
}

