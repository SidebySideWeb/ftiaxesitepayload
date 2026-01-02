import type { Block } from 'payload'
import { validateMaxLength } from '../../../utils/blockValidation'

export const kallitechniaProgramDetail: Block = {
  slug: 'kallitechnia.programDetail',
  labels: {
    singular: 'Program Detail',
    plural: 'Program Details',
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Program Info',
          fields: [
            {
              name: 'title',
              type: 'text',
              defaultValue: '',
              validate: validateMaxLength(120, 'Title'),
              admin: {
                description: 'Program title (max 120 characters)',
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
                description: 'Program description using rich text editor',
              },
            },
            {
              name: 'imagePosition',
              type: 'select',
              defaultValue: 'left',
              dbName: 'imgPos',
              options: [
                {
                  label: 'Left',
                  value: 'left',
                },
                {
                  label: 'Right',
                  value: 'right',
                },
              ],
              admin: {
                description: 'Image position relative to content',
              },
            },
            {
              name: 'additionalInfo',
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
                description: 'Additional information using rich text editor',
              },
            },
          ],
        },
        {
          label: 'Media',
          fields: [
            {
              name: 'image',
              type: 'upload',
              relationTo: 'media',
              admin: {
                description: 'Program image. If not provided, section will render without image.',
              },
            },
          ],
        },
        {
          label: 'Schedule',
          fields: [
            {
              name: 'schedule',
              type: 'array',
              defaultValue: [],
              admin: {
                description: 'Program schedule. Section will render even if empty.',
              },
              fields: [
                {
                  name: 'day',
                  type: 'text',
                  defaultValue: '',
                  validate: validateMaxLength(50, 'Day'),
                  admin: {
                    description: 'Day of the week (max 50 characters)',
                  },
                },
                {
                  name: 'time',
                  type: 'text',
                  defaultValue: '',
                  validate: validateMaxLength(50, 'Time'),
                  admin: {
                    description: 'Time slot (max 50 characters)',
                  },
                },
                {
                  name: 'level',
                  type: 'text',
                  defaultValue: '',
                  validate: validateMaxLength(50, 'Level'),
                  admin: {
                    description: 'Level (e.g., Beginners, Advanced) (max 50 characters)',
                  },
                },
              ],
            },
          ],
        },
        {
          label: 'Coach',
          fields: [
            {
              name: 'coachName',
              type: 'text',
              defaultValue: '',
              validate: validateMaxLength(100, 'Coach Name'),
              admin: {
                description: 'Coach name (max 100 characters)',
              },
            },
            {
              name: 'coachPhoto',
              type: 'upload',
              relationTo: 'media',
              admin: {
                description: 'Coach photo. If not provided, section will render without photo.',
              },
            },
            {
              name: 'coachStudies',
              type: 'text',
              defaultValue: '',
              validate: validateMaxLength(200, 'Coach Studies'),
              admin: {
                description: 'Coach qualifications/studies (max 200 characters)',
              },
            },
            {
              name: 'coachBio',
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
                description: 'Coach biography using rich text editor',
              },
            },
          ],
        },
      ],
    },
  ],
}

