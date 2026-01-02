#!/usr/bin/env node
/**
 * Clear Homepage Sections Script
 * 
 * Clears all sections from the homepage to fix duplicates
 * 
 * Usage:
 *   tsx src/scripts/clearHomepage.ts <tenant-code>
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

async function clearHomepage(tenantCode: string) {
  const payload = await getPayload({ config })

  try {
    // Find tenant
    const tenantResult = await payload.find({
      collection: 'tenants',
      where: {
        code: {
          equals: tenantCode,
        },
      },
      limit: 1,
    })

    if (tenantResult.docs.length === 0) {
      console.error(`❌ Tenant "${tenantCode}" not found.`)
      process.exit(1)
    }

    const tenant = tenantResult.docs[0]

    // Find homepage
    const homepageResult = await payload.find({
      collection: 'homepages',
      where: {
        tenant: {
          equals: tenant.id,
        },
      },
      limit: 1,
    })

    if (homepageResult.docs.length === 0) {
      console.log(`ℹ No homepage found for tenant "${tenantCode}"`)
      process.exit(0)
    }

    const homepage = homepageResult.docs[0]

    // Clear sections
    console.log(`🗑️  Clearing sections from homepage: ${homepage.id}`)
    await payload.update({
      collection: 'homepages',
      id: homepage.id,
      data: {},
      unset: ['sections'],
      overrideAccess: true,
    })

    console.log(`✅ Homepage sections cleared successfully!`)
    console.log(`   You can now run: pnpm sync:site -- --tenant ${tenantCode}`)
  } catch (error: any) {
    console.error(`❌ Failed to clear homepage:`, error.message)
    process.exit(1)
  } finally {
    process.exit(0)
  }
}

const tenantCode = process.argv[2]

if (!tenantCode) {
  console.error('❌ Missing tenant code')
  console.error('   Usage: tsx src/scripts/clearHomepage.ts <tenant-code>')
  console.error('   Example: tsx src/scripts/clearHomepage.ts kallitechnia')
  process.exit(1)
}

clearHomepage(tenantCode).catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
