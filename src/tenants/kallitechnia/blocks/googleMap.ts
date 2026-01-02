import type { Block } from 'payload'
import { validateMaxLength } from '../../../utils/blockValidation'

export const kallitechniaGoogleMap: Block = {
  slug: 'kallitechnia.googleMap',
  labels: {
    singular: 'Google Map',
    plural: 'Google Maps',
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Map',
          fields: [
            {
              name: 'title',
              type: 'text',
              defaultValue: '',
              validate: validateMaxLength(120, 'Title'),
              admin: {
                description: 'Optional section title (max 120 characters)',
              },
            },
            {
              name: 'embedCode',
              type: 'textarea',
              required: true,
              admin: {
                description: 'Google Maps embed code (iframe src URL or full iframe HTML). Paste the embed URL from Google Maps.',
              },
            },
            {
              name: 'height',
              type: 'number',
              defaultValue: 450,
              min: 200,
              max: 800,
              admin: {
                description: 'Map height in pixels (default: 450, min: 200, max: 800)',
              },
            },
          ],
        },
      ],
    },
  ],
}
