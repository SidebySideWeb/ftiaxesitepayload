import type { Block } from 'payload'
import { validateMaxLength } from '../../../utils/blockValidation'

export const kallitechniaContactInfo: Block = {
  slug: 'kallitechnia.contactInfo',
  labels: {
    singular: 'Contact Info',
    plural: 'Contact Info Sections',
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Content',
          fields: [
            {
              name: 'title',
              type: 'text',
              defaultValue: '',
              validate: validateMaxLength(120, 'Title'),
              admin: {
                description: 'Section title (max 120 characters)',
              },
            },
            {
              name: 'items',
              type: 'array',
              defaultValue: [],
              admin: {
                description: 'Contact information items',
              },
              fields: [
                {
                  name: 'type',
                  type: 'select',
                  required: true,
                  options: [
                    { label: 'Address', value: 'address' },
                    { label: 'Phone', value: 'phone' },
                    { label: 'Email', value: 'email' },
                    { label: 'Hours', value: 'hours' },
                  ],
                  admin: {
                    description: 'Type of contact information',
                  },
                },
                {
                  name: 'label',
                  type: 'text',
                  defaultValue: '',
                  validate: validateMaxLength(100, 'Label'),
                  admin: {
                    description: 'Label for this contact item (e.g., "Διεύθυνση", "Τηλέφωνο")',
                  },
                },
                {
                  name: 'content',
                  type: 'textarea',
                  defaultValue: '',
                  validate: validateMaxLength(500, 'Content'),
                  admin: {
                    description: 'Contact information content. Use line breaks for multiple lines.',
                  },
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}
