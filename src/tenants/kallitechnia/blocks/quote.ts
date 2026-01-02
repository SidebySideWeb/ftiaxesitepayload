import type { Block } from 'payload'
import { validateMaxLength } from '../../../utils/blockValidation'

export const kallitechniaQuote: Block = {
  slug: 'kallitechnia.quote',
  labels: {
    singular: 'Quote',
    plural: 'Quotes',
  },
  fields: [
    {
      name: 'text',
      type: 'textarea',
      defaultValue: '',
      required: false,
      validate: validateMaxLength(500, 'Quote Text'),
      admin: {
        description: 'Quote text (max 500 characters). Block will render nothing if empty.',
      },
    },
  ],
}

