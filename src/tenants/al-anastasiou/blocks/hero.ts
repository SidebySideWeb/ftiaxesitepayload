import type { Block } from 'payload'
import { validateUrl, validateMaxLength } from '../../../utils/blockValidation'

export const alAnastasiouHero: Block = {
  slug: 'al-anastasiou.hero',
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
            {
              name: 'description',
              type: 'textarea',
              defaultValue: '',
              admin: {
                description: 'Additional description text (optional)',
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
              name: 'hasPrimaryCTA',
              type: 'checkbox',
              defaultValue: false,
              admin: {
                description: 'Enable primary call-to-action button',
              },
            },
            {
              name: 'primaryCTALabel',
              type: 'text',
              defaultValue: '',
              validate: validateMaxLength(50, 'Primary CTA Label'),
              admin: {
                condition: (data) => data.hasPrimaryCTA === true,
                description: 'Primary call-to-action button text (max 50 characters)',
              },
            },
            {
              name: 'primaryCTAUrl',
              type: 'text',
              defaultValue: '',
              validate: validateUrl,
              admin: {
                condition: (data) => data.hasPrimaryCTA === true,
                description: 'Primary call-to-action button URL. Must start with / (internal), http://, or https://',
              },
            },
            {
              name: 'hasSecondaryCTA',
              type: 'checkbox',
              defaultValue: false,
              admin: {
                description: 'Enable secondary call-to-action button',
              },
            },
            {
              name: 'secondaryCTALabel',
              type: 'text',
              defaultValue: '',
              validate: validateMaxLength(50, 'Secondary CTA Label'),
              admin: {
                condition: (data) => data.hasSecondaryCTA === true,
                description: 'Secondary call-to-action button text (max 50 characters)',
              },
            },
            {
              name: 'secondaryCTAUrl',
              type: 'text',
              defaultValue: '',
              validate: validateUrl,
              admin: {
                condition: (data) => data.hasSecondaryCTA === true,
                description: 'Secondary call-to-action button URL. Must start with / (internal), http://, or https://',
              },
            },
          ],
        },
      ],
    },
  ],
}
