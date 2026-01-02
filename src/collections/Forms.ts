import type { CollectionConfig } from 'payload'
import { tenantAccess } from '../access/tenantAccess'
import { validateUrl } from '../utils/blockValidation'

export const Forms: CollectionConfig = {
  slug: 'forms',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'tenant', 'createdAt'],
  },
  access: tenantAccess,
  fields: [
    {
      name: 'tenant',
      type: 'relationship',
      relationTo: 'tenants',
      required: true,
      index: true,
      admin: {
        description: 'The tenant this form belongs to',
      },
    },
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: {
        description: 'Internal name for this form',
      },
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        description: 'URL-friendly identifier for this form',
      },
    },
    {
      name: 'fields',
      type: 'array',
      required: true,
      minRows: 1,
      admin: {
        description: 'Form fields configuration',
      },
      fields: [
        {
          name: 'type',
          type: 'select',
          required: true,
          options: [
            { label: 'Text', value: 'text' },
            { label: 'Email', value: 'email' },
            { label: 'Tel (Phone)', value: 'tel' },
            { label: 'Textarea', value: 'textarea' },
            { label: 'Number', value: 'number' },
            { label: 'Select', value: 'select' },
            { label: 'Checkbox', value: 'checkbox' },
          ],
          admin: {
            description: 'Field type',
          },
        },
        {
          name: 'label',
          type: 'text',
          required: true,
          admin: {
            description: 'Field label shown to users',
          },
        },
        {
          name: 'name',
          type: 'text',
          required: true,
          admin: {
            description: 'Field name (used in form submission)',
          },
        },
        {
          name: 'required',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            description: 'Is this field required?',
          },
        },
        {
          name: 'placeholder',
          type: 'text',
          admin: {
            description: 'Placeholder text',
          },
        },
        {
          name: 'options',
          type: 'array',
          admin: {
            condition: (data) => data.type === 'select',
            description: 'Options for select field',
          },
          fields: [
            {
              name: 'label',
              type: 'text',
              required: true,
            },
            {
              name: 'value',
              type: 'text',
              required: true,
            },
          ],
        },
      ],
    },
    {
      name: 'successMessage',
      type: 'text',
      defaultValue: 'Thank you! Your submission has been received.',
      admin: {
        description: 'Message shown after successful submission',
      },
    },
    {
      name: 'redirectUrl',
      type: 'text',
      validate: (value: string | string[] | null | undefined) => {
        if (!value || typeof value !== 'string') return true // Optional
        return validateUrl(value)
      },
      admin: {
        description: 'Optional URL to redirect after submission (must be http/https or internal /)',
      },
    },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Inactive', value: 'inactive' },
      ],
      defaultValue: 'active',
      required: true,
      admin: {
        description: 'Form status',
      },
    },
  ],
  timestamps: true,
}

