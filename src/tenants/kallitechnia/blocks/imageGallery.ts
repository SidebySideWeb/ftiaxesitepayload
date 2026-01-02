import type { Block } from 'payload'
import { validateMinItems } from '../../../utils/blockValidation'

export const kallitechniaImageGallery: Block = {
  slug: 'kallitechnia.imageGallery',
  labels: {
    singular: 'Image Gallery',
    plural: 'Image Galleries',
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
      name: 'enableCaptions',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Show captions below images',
      },
    },
    {
      name: 'images',
      type: 'array',
      defaultValue: [],
      admin: {
        description: 'Add images to the gallery. Gallery will be hidden if empty.',
      },
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          admin: {
            description: 'Gallery image. If not provided, this item will be skipped.',
          },
        },
        {
          name: 'caption',
          type: 'text',
          defaultValue: '',
          validate: (value, { data }) => {
            // Only validate if captions are enabled
            if (data?.enableCaptions && value && value.length > 200) {
              return 'Caption must be 200 characters or less'
            }
            return true
          },
          admin: {
            condition: (data, siblingData, { data: rootData }) => {
              return rootData?.enableCaptions === true
            },
            description: 'Optional caption for the image (max 200 characters)',
          },
        },
      ],
    },
  ],
}

