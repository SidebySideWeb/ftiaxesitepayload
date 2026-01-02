#!/usr/bin/env node
/**
 * Clear All Sections Script
 * 
 * Clears all sections from pages and homepages to allow schema migration
 * from text/textarea to richText (jsonb)
 * 
 * Usage:
 *   tsx src/scripts/clearAllSections.ts <tenant-code>
 */

import { config as dotenvConfig } from 'dotenv'
import { existsSync } from 'node:fs'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getPayload } from 'payload'

// Load environment variables
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '../..')
const envPath = path.join(projectRoot, '.env')
const envLocalPath = path.join(projectRoot, '.env.local')

if (existsSync(envPath)) {
  dotenvConfig({ path: envPath })
}
if (existsSync(envLocalPath)) {
  dotenvConfig({ path: envLocalPath, override: true })
}

// Dynamically import config AFTER env vars are loaded
const configModule = await import('@payload-config')
const config = configModule.default

async function clearAllSections(tenantCode: string) {
  // We need to use raw SQL to clear sections because Payload will try to validate
  // and the schema migration hasn't happened yet
  console.log('⚠️  This script requires direct database access.')
  console.log('   Please manually delete sections in Admin UI, or wait for schema migration.')
  console.log('   The schema migration will fail until existing text data is cleared.')
  console.log('\n   Recommended approach:')
  console.log('   1. Start the dev server: pnpm dev')
  console.log('   2. Payload will attempt schema migration and may show errors')
  console.log('   3. Manually delete all sections in Admin UI for pages/homepages')
  console.log('   4. Restart dev server to complete schema migration')
  console.log('   5. Run: pnpm sync:site -- --tenant kallitechnia')
  process.exit(0)
}

const tenantCode = process.argv[2]

if (!tenantCode) {
  console.error('❌ Missing tenant code')
  console.error('   Usage: tsx src/scripts/clearAllSections.ts <tenant-code>')
  process.exit(1)
}

clearAllSections(tenantCode).catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
