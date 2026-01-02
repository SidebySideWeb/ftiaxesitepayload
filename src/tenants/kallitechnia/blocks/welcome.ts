import type { Block } from 'payload'
import { validateMaxLength } from '../../../utils/blockValidation'

export const kallitechniaWelcome: Block = {
  slug: 'kallitechnia.welcome',
  labels: {
    singular: 'Welcome Section',
    plural: 'Welcome Sections',
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
                description: 'Welcome section title (max 120 characters)',
              },
            },
            {
              name: 'paragraphs',
              type: 'array',
              defaultValue: [],
              admin: {
                description: 'Welcome paragraphs. Section will render even if empty.',
              },
              fields: [
                {
                  name: 'paragraph',
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
                    description: 'Paragraph content using rich text editor',
                  },
                },
              ],
              // Support both formats: array of strings (from sync pack) and array of objects
              hooks: {
                beforeValidate: [
                  ({ value }) => {
                    if (!value || !Array.isArray(value)) return value
                    // Convert array of strings to array of objects
                    return value.map((item) => {
                      if (typeof item === 'string') {
                        return { paragraph: item }
                      }
                      return item
                    })
                  },
                ],
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
                description: 'Welcome section image. If not provided, section will render without image.',
              },
            },
          ],
        },
      ],
    },
  ],
}

