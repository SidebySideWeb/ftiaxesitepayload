import type { Block } from 'payload'
import { validateMaxLength, validateUrl } from '../../../utils/blockValidation'

export const kallitechniaNewsList: Block = {
  slug: 'kallitechnia.newsList',
  labels: {
    singular: 'News List',
    plural: 'News Lists',
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
              name: 'itemsPerPage',
              type: 'number',
              defaultValue: 6,
              min: 1,
              max: 24,
              admin: {
                description: 'Number of posts to display per page (1-24)',
              },
            },
            {
              name: 'showExcerpt',
              type: 'checkbox',
              defaultValue: true,
              admin: {
                description: 'Show post excerpt in the list',
              },
            },
            {
              name: 'showImage',
              type: 'checkbox',
              defaultValue: true,
              admin: {
                description: 'Show featured image in the list',
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
          ],
        },
      ],
    },
  ],
}

