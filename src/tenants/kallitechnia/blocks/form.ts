import type { Block } from 'payload'
import { validateMaxLength } from '../../../utils/blockValidation'

export const kallitechniaForm: Block = {
  slug: 'kallitechnia.form',
  labels: {
    singular: 'Form',
    plural: 'Forms',
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Form',
          fields: [
            {
              name: 'form',
              type: 'relationship',
              relationTo: 'forms',
              required: false,
              admin: {
                description: 'Select a form from the Forms collection. If not selected, form will not be displayed.',
              },
            },
            {
              name: 'title',
              type: 'text',
              defaultValue: '',
              validate: validateMaxLength(120, 'Title'),
              admin: {
                description: 'Optional form title (max 120 characters). Overrides form name if set.',
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
                description: 'Optional form description using rich text editor',
              },
            },
          ],
        },
      ],
    },
  ],
}
