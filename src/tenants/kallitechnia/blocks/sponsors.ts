import type { Block } from 'payload'
import { validateMaxLength, validateUrl } from '../../../utils/blockValidation'

export const kallitechniaSponsors: Block = {
  slug: 'kallitechnia.sponsors',
  labels: {
    singular: 'Sponsors Section',
    plural: 'Sponsors Sections',
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
              name: 'subtitle',
              type: 'textarea',
              defaultValue: '',
              validate: validateMaxLength(240, 'Subtitle'),
              admin: {
                description: 'Section subtitle (max 240 characters)',
              },
            },
            {
              name: 'sponsors',
              type: 'array',
              defaultValue: [],
              admin: {
                description: 'Sponsor items. Section will render even if empty.',
              },
              fields: [
                {
                  name: 'logo',
                  type: 'upload',
                  relationTo: 'media',
                  admin: {
                    description: 'Sponsor logo. If not provided, only name will be displayed.',
                  },
                },
                {
                  name: 'name',
                  type: 'text',
                  defaultValue: '',
                  validate: validateMaxLength(100, 'Sponsor Name'),
                  admin: {
                    description: 'Sponsor name (max 100 characters)',
                  },
                },
                {
                  name: 'url',
                  type: 'text',
                  defaultValue: '',
                  validate: validateUrl,
                  admin: {
                    description: 'Sponsor website URL. Opens in new tab when clicked. Must start with / (internal), http://, or https://',
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

