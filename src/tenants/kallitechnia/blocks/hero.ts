import type { Block } from 'payload'
import { validateUrl, validateMaxLength } from '../../../utils/blockValidation'

export const kallitechniaHero: Block = {
  slug: 'kallitechnia.hero',
  labels: {
    singular: 'Hero',
    plural: 'Heroes',
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
              validate: validateMaxLength(120, 'Title'),
              admin: {
                description: 'Main headline for the hero section (max 120 characters)',
              },
            },
            {
              name: 'subtitle',
              type: 'textarea',
              defaultValue: '',
              validate: validateMaxLength(240, 'Subtitle'),
              admin: {
                description: 'Supporting text below the title (max 240 characters)',
              },
            },
          ],
        },
        {
          label: 'Media',
          fields: [
            {
              name: 'backgroundImage',
              type: 'upload',
              relationTo: 'media',
              admin: {
                description: 'Background image for the hero section. If not provided, a gradient will be used.',
              },
            },
          ],
        },
        {
          label: 'Actions',
          fields: [
            {
              name: 'hasCTA',
              type: 'checkbox',
              defaultValue: false,
              admin: {
                description: 'Enable call-to-action button',
              },
            },
            {
              name: 'ctaLabel',
              type: 'text',
              defaultValue: '',
              validate: validateMaxLength(50, 'CTA Label'),
              admin: {
                condition: (data) => data.hasCTA === true,
                description: 'Call-to-action button text (max 50 characters)',
              },
            },
            {
              name: 'ctaUrl',
              type: 'text',
              defaultValue: '',
              validate: validateUrl,
              admin: {
                condition: (data) => data.hasCTA === true,
                description: 'Call-to-action button URL. Must start with / (internal), http://, or https://',
              },
            },
          ],
        },
      ],
    },
  ],
}

