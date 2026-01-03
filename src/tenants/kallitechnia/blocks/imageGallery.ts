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
      name: 'title',
      type: 'text',
      defaultValue: '',
      admin: {
        description: 'Gallery section title',
      },
    },
    {
      name: 'subtitle',
      type: 'text',
      defaultValue: '',
      admin: {
        description: 'Gallery section subtitle',
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
          name: 'title',
          type: 'text',
          defaultValue: '',
          admin: {
            description: 'Image title (shown on hover)',
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
            description: 'Image description (shown on hover, supports rich text)',
          },
        },
        {
          name: 'imageAlt',
          type: 'text',
          defaultValue: '',
          admin: {
            description: 'Alternative text for accessibility (falls back to title if not provided)',
          },
        },
        {
          name: 'caption',
          type: 'text',
          defaultValue: '',
          validate: (value: string | string[] | null | undefined, { data }: { data?: { enableCaptions?: boolean } }) => {
            // Only validate if captions are enabled
            if (data?.enableCaptions && typeof value === 'string' && value.length > 200) {
              return 'Caption must be 200 characters or less'
            }
            return true
          },
          admin: {
            condition: (data: any, siblingData: any, { data: rootData }: any) => {
              return rootData?.enableCaptions === true
            },
            description: 'Optional caption for the image (max 200 characters)',
          },
        },
      ],
    },
  ],
}

