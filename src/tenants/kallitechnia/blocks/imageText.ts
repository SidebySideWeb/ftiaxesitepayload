import type { Block } from 'payload'
import { validateMaxLength } from '../../../utils/blockValidation'

export const kallitechniaImageText: Block = {
  slug: 'kallitechnia.imageText',
  labels: {
    singular: 'Image & Text',
    plural: 'Image & Text Sections',
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
              name: 'content',
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
                description: 'Text content using rich text editor',
              },
            },
            {
              name: 'imagePosition',
              type: 'select',
              defaultValue: 'left',
              dbName: 'imgPos',
              options: [
                {
                  label: 'Left',
                  value: 'left',
                },
                {
                  label: 'Right',
                  value: 'right',
                },
              ],
              admin: {
                description: 'Image position relative to text',
              },
            },
          ],
        },
        {
          label: 'Media',
          fields: [
            {
              name: 'image',
              type: 'upload',
              relationTo: 'media',
              admin: {
                description: 'Section image. If not provided, section will render without image.',
              },
            },
          ],
        },
      ],
    },
  ],
}

