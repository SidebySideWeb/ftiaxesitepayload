import type { Block } from 'payload'
import { validateMaxLength, validateUrl } from '../../../utils/blockValidation'

export const kallitechniaDownloadButton: Block = {
  slug: 'kallitechnia.downloadButton',
  labels: {
    singular: 'Download Button',
    plural: 'Download Buttons',
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
                description: 'Description text above the button using rich text editor',
              },
            },
            {
              name: 'buttonLabel',
              type: 'text',
              defaultValue: 'Download',
              validate: validateMaxLength(100, 'Button Label'),
              admin: {
                description: 'Button label text (max 100 characters)',
              },
            },
            {
              name: 'fileUrl',
              type: 'text',
              defaultValue: '',
              validate: validateUrl,
              required: true,
              admin: {
                description: 'URL to the file to download. Must start with / (internal), http://, or https://',
              },
            },
            {
              name: 'fileName',
              type: 'text',
              defaultValue: '',
              validate: validateMaxLength(200, 'File Name'),
              admin: {
                description: 'Optional file name for download (max 200 characters). If not provided, filename from URL will be used.',
              },
            },
          ],
        },
      ],
    },
  ],
}
