import type { Block } from 'payload'
import { validateMaxLength, validateUrl } from '../../../utils/blockValidation'

export const kallitechniaProgramsGrid: Block = {
  slug: 'kallitechnia.programsGrid',
  labels: {
    singular: 'Programs Grid',
    plural: 'Programs Grids',
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
              name: 'programs',
              type: 'array',
              defaultValue: [],
              admin: {
                description: 'Program items. Grid will be hidden if empty.',
              },
              fields: [
                {
                  name: 'image',
                  type: 'upload',
                  relationTo: 'media',
                  admin: {
                    description: 'Program image. If not provided, item will render without image.',
                  },
                },
                {
                  name: 'title',
                  type: 'text',
                  defaultValue: '',
                  validate: validateMaxLength(100, 'Program Title'),
                  admin: {
                    description: 'Program title (max 100 characters)',
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
                    description: 'Program description using rich text editor',
                  },
                },
                {
                  name: 'buttonLabel',
                  type: 'text',
                  defaultValue: '',
                  validate: validateMaxLength(50, 'Button Label'),
                  admin: {
                    description: 'Button label (max 50 characters)',
                  },
                },
                {
                  name: 'buttonUrl',
                  type: 'text',
                  defaultValue: '',
                  validate: validateUrl,
                  admin: {
                    description: 'Button URL. Must start with / (internal), http://, or https://',
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

