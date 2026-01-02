import type { Block } from 'payload'

export const kallitechniaRichText: Block = {
  slug: 'kallitechnia.richText',
  labels: {
    singular: 'Rich Text',
    plural: 'Rich Text Blocks',
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
      type: 'tabs',
      tabs: [
        {
          label: 'Content',
          fields: [
            {
              name: 'title',
              type: 'text',
              defaultValue: '',
              admin: {
                description: 'Optional section title',
              },
            },
            {
              name: 'subtitle',
              type: 'textarea',
              defaultValue: '',
              admin: {
                description: 'Optional section subtitle',
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
                description: 'Rich text content using Lexical editor. Start typing to add content.',
              },
            },
          ],
        },
      ],
    },
  ],
}

