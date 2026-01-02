#!/usr/bin/env node
/**
 * Change Password Script
 * 
 * Changes password for a user by email
 * 
 * Usage:
 *   tsx src/scripts/changePassword.ts <email> <newPassword>
 * 
 * Example:
 *   tsx src/scripts/changePassword.ts user@example.com "NewPassword123!"
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

async function changePassword(email: string, newPassword: string) {
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

    // Update password using Payload's update method
    // Payload will automatically hash the password
    await payload.update({
      collection: 'users',
      id: user.id,
      data: {
        password: newPassword,
      },
    })

    console.log(`✅ Successfully changed password for ${email}`)
  } catch (error) {
    console.error(`❌ Failed to change password:`, error)
    process.exit(1)
  } finally {
    process.exit(0)
  }
}

// Get email and password from command line
const email = process.argv[2]
const newPassword = process.argv[3]

if (!email || !newPassword) {
  console.error('❌ Missing arguments')
  console.error('   Usage: tsx src/scripts/changePassword.ts <email> <newPassword>')
  console.error('   Example: tsx src/scripts/changePassword.ts user@example.com "NewPassword123!"')
  process.exit(1)
}

changePassword(email, newPassword).catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
