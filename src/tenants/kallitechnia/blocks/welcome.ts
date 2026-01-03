import type { Block } from 'payload'
import { validateMaxLength } from '../../../utils/blockValidation'

export const kallitechniaWelcome: Block = {
  slug: 'kallitechnia.welcome',
  labels: {
    singular: 'Welcome Section',
    plural: 'Welcome Sections',
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
                description: 'Welcome section title (max 120 characters)',
              },
            },
            {
              name: 'paragraphs',
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
                description: 'Welcome paragraphs content using rich text editor. You can add multiple paragraphs in the editor.',
              },
              // Support both formats: array of strings (from sync pack) and single richText
              hooks: {
                beforeValidate: [
                  ({ value }) => {
                    // If it's an array of strings (from sync pack), convert to Lexical
                    if (Array.isArray(value) && value.length > 0) {
                      if (typeof value[0] === 'string') {
                        // Convert array of strings to single Lexical document with multiple paragraphs
                        const paragraphs = value.filter((p) => typeof p === 'string' && p.trim())
                        if (paragraphs.length === 0) {
                          return {
                            root: {
                              children: [],
                              direction: 'ltr',
                              format: '',
                              indent: 0,
                              type: 'root',
                              version: 1,
                            },
                          }
                        }
                        return {
                          root: {
                            children: paragraphs.map((text) => ({
                              children: [
                                {
                                  detail: 0,
                                  format: 0,
                                  mode: 'normal',
                                  style: '',
                                  text: text.trim(),
                                  type: 'text',
                                  version: 1,
                                },
                              ],
                              direction: 'ltr',
                              format: '',
                              indent: 0,
                              type: 'paragraph',
                              version: 1,
                            })),
                            direction: 'ltr',
                            format: '',
                            indent: 0,
                            type: 'root',
                            version: 1,
                          },
                        }
                      }
                      // If it's an array of objects with paragraph property, extract paragraphs
                      if (value[0] && typeof value[0] === 'object' && value[0].paragraph) {
                        const paragraphs = value
                          .map((item) => item.paragraph)
                          .filter((p) => p && (typeof p === 'string' || (typeof p === 'object' && p.root)))
                        if (paragraphs.length === 0) {
                          return {
                            root: {
                              children: [],
                              direction: 'ltr',
                              format: '',
                              indent: 0,
                              type: 'root',
                              version: 1,
                            },
                          }
                        }
                        // If paragraphs are already Lexical, merge them
                        if (paragraphs[0] && typeof paragraphs[0] === 'object' && paragraphs[0].root) {
                          return {
                            root: {
                              children: paragraphs.flatMap((p) => (p.root?.children || [])),
                              direction: 'ltr',
                              format: '',
                              indent: 0,
                              type: 'root',
                              version: 1,
                            },
                          }
                        }
                        // If paragraphs are strings, convert to Lexical
                        return {
                          root: {
                            children: paragraphs
                              .filter((p) => typeof p === 'string' && p.trim())
                              .map((text) => ({
                                children: [
                                  {
                                    detail: 0,
                                    format: 0,
                                    mode: 'normal',
                                    style: '',
                                    text: text.trim(),
                                    type: 'text',
                                    version: 1,
                                  },
                                ],
                                direction: 'ltr',
                                format: '',
                                indent: 0,
                                type: 'paragraph',
                                version: 1,
                              })),
                            direction: 'ltr',
                            format: '',
                            indent: 0,
                            type: 'root',
                            version: 1,
                          },
                        }
                      }
                    }
                    // Already in correct format (Lexical), return as-is
                    return value
                  },
                ],
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
                description: 'Welcome section image. If not provided, section will render without image.',
              },
            },
          ],
        },
      ],
    },
  ],
}

