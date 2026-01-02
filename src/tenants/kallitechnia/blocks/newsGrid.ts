import type { Block } from 'payload'
import { validateMaxLength, validateUrl } from '../../../utils/blockValidation'

/**
 * News Grid Block (Legacy)
 * 
 * Displays a grid of manually entered news items.
 * For new implementations, use newsList block which pulls from Posts collection.
 */
export const kallitechniaNewsGrid: Block = {
  slug: 'kallitechnia.newsGrid',
  labels: {
    singular: 'News Grid (Legacy)',
    plural: 'News Grids (Legacy)',
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
              name: 'buttonLabel',
              type: 'text',
              defaultValue: '',
              validate: validateMaxLength(50, 'Button Label'),
              admin: {
                description: 'Optional "View All" button label (max 50 characters)',
              },
            },
            {
              name: 'buttonUrl',
              type: 'text',
              defaultValue: '',
              validate: validateUrl,
              admin: {
                description: 'Optional "View All" button URL. Must start with / (internal), http://, or https://',
              },
            },
            {
              name: 'newsItems',
              type: 'array',
              defaultValue: [],
              admin: {
                description: 'News items. Grid will be hidden if empty. For new implementations, use newsList block instead.',
              },
              fields: [
                {
                  name: 'image',
                  type: 'upload',
                  relationTo: 'media',
                  admin: {
                    description: 'News item image. If not provided, item will render without image.',
                  },
                },
                {
                  name: 'date',
                  type: 'text',
                  defaultValue: '',
                  validate: validateMaxLength(50, 'Date'),
                  admin: {
                    description: 'News item date (formatted as text, max 50 characters)',
                  },
                },
                {
                  name: 'title',
                  type: 'text',
                  defaultValue: '',
                  validate: validateMaxLength(200, 'News Title'),
                  admin: {
                    description: 'News item title (max 200 characters)',
                  },
                },
                {
                  name: 'excerpt',
                  type: 'textarea',
                  defaultValue: '',
                  validate: validateMaxLength(300, 'Excerpt'),
                  admin: {
                    description: 'News item excerpt (max 300 characters)',
                  },
                },
                {
                  name: 'readMoreLabel',
                  type: 'text',
                  defaultValue: '',
                  validate: validateMaxLength(50, 'Read More Label'),
                  admin: {
                    description: 'Read more button label (max 50 characters)',
                  },
                },
                {
                  name: 'readMoreUrl',
                  type: 'text',
                  defaultValue: '',
                  validate: validateUrl,
                  admin: {
                    description: 'Read more button URL. Must start with / (internal), http://, or https://',
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

