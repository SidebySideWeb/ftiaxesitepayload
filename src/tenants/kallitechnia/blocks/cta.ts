import type { Block } from 'payload'
import { validateUrl, validateMaxLength } from '../../../utils/blockValidation'

export const kallitechniaCta: Block = {
  slug: 'kallitechnia.cta',
  labels: {
    singular: 'Call to Action',
    plural: 'Call to Actions',
  },
  fields: [
    {
      name: '__deprecated',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        hidden: true,
      },
    },
    {
      name: 'schemaVersion',
      type: 'number',
      defaultValue: 1,
      admin: {
        hidden: true,
      },
    },
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
              validate: validateMaxLength(100, 'Title'),
              admin: {
                description: 'CTA section title (max 100 characters)',
              },
            },
            {
              name: 'description',
              type: 'richText',
              defaultValue: {
                root: {
                  children: [],
                  direction: 'ltr',
                  format: '',
                  indent: 0,
                  type: 'root',
                  version: 1,
                },
              },
              admin: {
                description: 'CTA section description using rich text editor',
              },
            },
          ],
        },
        {
          label: 'Button',
          fields: [
            {
              name: 'buttonLabel',
              type: 'text',
              defaultValue: '',
              validate: validateMaxLength(50, 'Button Label'),
              admin: {
                description: 'Button text (max 50 characters)',
              },
            },
            {
              name: 'buttonUrl',
              type: 'text',
              defaultValue: '',
              validate: validateUrl,
              admin: {
                description: 'Button destination URL. Must start with / (internal), http://, or https://',
              },
            },
          ],
        },
      ],
    },
  ],
}

