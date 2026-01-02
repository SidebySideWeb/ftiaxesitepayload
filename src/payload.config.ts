import 'dotenv/config'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Tenants } from './collections/Tenants'
import { Pages } from './collections/Pages'
import { Homepages } from './collections/Homepages'
import { NavigationMenus } from './collections/NavigationMenus'
import { Headers } from './collections/Headers'
import { Footers } from './collections/Footers'
import { Forms } from './collections/Forms'
import { FormSubmissions } from './collections/FormSubmissions'
import { Posts } from './collections/Posts'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// Verify config is loading
console.log('[Payload Config] Loading configuration...')
console.log('[Payload Config] Collections:', [
  'Users',
  'Tenants',
  'Pages',
  'Homepages',
  'NavigationMenus',
  'Headers',
  'Footers',
  'Media',
  'Forms',
  'FormSubmissions',
  'Posts',
].join(', '))

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [
    Users,
    Tenants,
    Pages,
    Homepages,
    NavigationMenus,
    Headers,
    Footers,
    Media,
    Forms,
    FormSubmissions,
    Posts,
  ],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',

  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },

  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI,
      ssl: {
        rejectUnauthorized: false,
      },
    },
  }),
  sharp,
  plugins: [],
})
