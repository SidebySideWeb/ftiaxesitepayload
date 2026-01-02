import type { Block } from 'payload'
import { validateMaxLength } from '../../../utils/blockValidation'

export const kallitechniaSlogan: Block = {
  slug: 'kallitechnia.slogan',
  labels: {
    singular: 'Slogan',
    plural: 'Slogans',
  },
  fields: [
    {
      name: 'text',
      type: 'text',
      defaultValue: '',
      required: false,
      validate: validateMaxLength(200, 'Slogan Text'),
      admin: {
        description: 'Slogan text (max 200 characters). Block will render nothing if empty.',
      },
    },
  ],
}

