import type { CollectionConfig } from 'payload'
import { tenantAccess } from '../access/tenantAccess'
import { lexicalEditor } from '@payloadcms/richtext-lexical'

export const Posts: CollectionConfig = {
  slug: 'posts',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'tenant', 'status', 'publishedAt', 'createdAt'],
  },
  access: tenantAccess,
  versions: {
    drafts: true,
    maxPerDoc: 15,
  },
  fields: [
    {
      name: 'tenant',
      type: 'relationship',
      relationTo: 'tenants',
      required: true,
      index: true,
      admin: {
        description: 'The tenant this post belongs to. This cannot be changed after creation.',
        readOnly: true,
        position: 'sidebar',
      },
    },
    {
      name: 'title',
      type: 'text',
      required: true,
      validate: (value: string | string[] | null | undefined) => {
        if (typeof value !== 'string' || !value.trim()) {
          return 'Title is required'
        }
        if (value.length > 200) {
          return 'Title must be 200 characters or less'
        }
        return true
      },
      admin: {
        description: 'Post title (required, max 200 characters)',
      },
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        description: 'URL-friendly identifier for this post. Must be unique.',
      },
    },
    {
      name: 'excerpt',
      type: 'textarea',
      defaultValue: '',
      validate: (value: string | string[] | null | undefined) => {
        if (value && value.length > 300) {
          return 'Excerpt must be 300 characters or less'
        }
        return true
      },
      admin: {
        description: 'Short excerpt for previews (max 300 characters)',
      },
    },
    {
      name: 'content',
      type: 'richText',
      editor: lexicalEditor(),
      defaultValue: {
        root: {
          children: [
            {
              children: [],
              direction: 'ltr',
              format: '',
              indent: 0,
              type: 'paragraph',
              version: 1,
            },
          ],
          direction: 'ltr',
          format: '',
          indent: 0,
          type: 'root',
          version: 1,
        },
      },
      admin: {
        description: 'Post content using Lexical editor',
      },
    },
    {
      name: 'featuredImage',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Featured image for the post. Used in listings and previews.',
      },
    },
    {
      name: 'publishedAt',
      type: 'date',
      admin: {
        description: 'Publication date. Used for sorting and display.',
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    {
      name: 'status',
      type: 'select',
      options: [
        {
          label: 'Draft',
          value: 'draft',
        },
        {
          label: 'Published',
          value: 'published',
        },
      ],
      defaultValue: 'draft',
      required: true,
      admin: {
        description: 'Publication status. Drafts are hidden from frontend.',
      },
    },
    {
      name: 'seo',
      type: 'group',
      admin: {
        description: 'SEO settings. All fields are optional.',
      },
      fields: [
        {
          name: 'title',
          type: 'text',
          defaultValue: '',
          validate: (value: string | string[] | null | undefined) => {
            if (value && value.length > 60) {
              return 'SEO title should be 60 characters or less for best results'
            }
            return true
          },
          admin: {
            description: 'SEO title (overrides post title if set). Recommended: 50-60 characters.',
          },
        },
        {
          name: 'description',
          type: 'textarea',
          defaultValue: '',
          validate: (value: string | string[] | null | undefined) => {
            if (value && value.length > 160) {
              return 'Meta description should be 160 characters or less for best results'
            }
            return true
          },
          admin: {
            description: 'Meta description for search engines. Recommended: 150-160 characters.',
          },
        },
      ],
    },
  ],
  timestamps: true,
}

