#!/usr/bin/env node
/**
 * Grant Admin Role Script
 * 
 * Grants superadmin role to a user by email
 * 
 * Usage:
 *   tsx src/scripts/grantAdmin.ts <email>
 * 
 * Example:
 *   tsx src/scripts/grantAdmin.ts user@example.com
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

async function grantAdmin(email: string) {
  const payload = await getPayload({ config })

  try {
    // Find user by email
    const result = await payload.find({
      collection: 'users',
      where: {
        email: {
          equals: email,
        },
      },
      limit: 1,
    })

    if (result.docs.length === 0) {
      console.error(`❌ User not found: ${email}`)
      process.exit(1)
    }

    const user = result.docs[0]

    // Check if already admin
    const currentRoles = Array.isArray(user.roles) ? user.roles : [user.roles].filter(Boolean)
    if (currentRoles.includes('admin')) {
      console.log(`✓ User ${email} already has admin role`)
      console.log(`  Current roles: ${currentRoles.join(', ')}`)
      return
    }

    // Add admin role
    const updatedRoles = [...new Set([...currentRoles, 'admin'])]

    await payload.update({
      collection: 'users',
      id: user.id,
      data: {
        roles: updatedRoles as ('user' | 'admin' | 'editor')[],
      },
    })

    console.log(`✅ Successfully granted admin role to ${email}`)
    console.log(`   Updated roles: ${updatedRoles.join(', ')}`)
  } catch (error) {
    console.error(`❌ Failed to grant admin role:`, error)
    process.exit(1)
  } finally {
    process.exit(0)
  }
}

// Get email from command line
const email = process.argv[2]

if (!email) {
  console.error('❌ Missing email argument')
  console.error('   Usage: tsx src/scripts/grantAdmin.ts <email>')
  console.error('   Example: tsx src/scripts/grantAdmin.ts user@example.com')
  process.exit(1)
}

grantAdmin(email).catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})

