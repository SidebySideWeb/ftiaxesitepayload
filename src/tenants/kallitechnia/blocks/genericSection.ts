import type { Block } from 'payload'

/**
 * Generic Section Block
 * 
 * Fallback block for unknown component types.
 * Stores raw component data as JSON to prevent data loss.
 * Frontend renderer will handle this gracefully.
 */
export const kallitechniaGenericSection: Block = {
  slug: 'kallitechnia.genericSection',
  labels: {
    singular: 'Generic Section',
    plural: 'Generic Sections',
  },
  fields: [
    {
      name: 'rawData',
      type: 'json',
      defaultValue: {},
      admin: {
        description: 'Raw component data. This is a fallback block for unknown component types.',
        readOnly: true,
      },
    },
  ],
}

