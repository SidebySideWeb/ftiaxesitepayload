#!/usr/bin/env node
/**
 * Validate and Fix Lexical Data Script
 * 
 * Validates all Lexical richText fields and fixes malformed structures
 * 
 * Usage:
 *   tsx src/scripts/validateAndFixLexical.ts
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

/**
 * Check if a Lexical structure is valid
 */
function isValidLexical(data: any): boolean {
  if (!data || typeof data !== 'object') return false
  if (!data.root || typeof data.root !== 'object') return false
  if (data.root.type !== 'root') return false
  if (!Array.isArray(data.root.children)) return false

  // Validate all children
  for (const child of data.root.children) {
    if (!child || typeof child !== 'object') return false
    if (!child.type) return false
    if (!Array.isArray(child.children)) return false

    // Validate text nodes
    for (const textChild of child.children) {
      if (!textChild || typeof textChild !== 'object') return false
      if (!textChild.type) return false
      if (textChild.type === 'text' && typeof textChild.text !== 'string') return false
    }
  }

  return true
}

/**
 * Create a valid empty Lexical structure
 */
function createEmptyLexical(): any {
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

/**
 * Recursively validate and fix Lexical data in blocks
 */
function validateBlock(block: any): { fixed: boolean; block: any } {
  let fixed = false
  const newBlock = { ...block }

  // RichText field names
  const richTextFieldNames = ['description', 'content', 'paragraph', 'additionalInfo', 'coachBio']

  // Check all fields in the block
  for (const [key, value] of Object.entries(newBlock)) {
    if (richTextFieldNames.includes(key) && value) {
      // Check if it's a Lexical object
      if (typeof value === 'object' && value.root) {
        if (!isValidLexical(value)) {
          console.log(`    Found invalid Lexical in ${newBlock.blockType || 'unknown'}.${key}, fixing`)
          newBlock[key] = createEmptyLexical()
          fixed = true
        }
      }
    } else if (key === 'paragraphs' && Array.isArray(value)) {
      // Handle welcome block paragraphs array
      const fixedParagraphs = value.map((item: any, index: number) => {
        if (typeof item === 'object' && item.paragraph) {
          if (typeof item.paragraph === 'object' && item.paragraph.root) {
            if (!isValidLexical(item.paragraph)) {
              console.log(`    Found invalid Lexical in ${newBlock.blockType || 'unknown'}.paragraphs[${index}].paragraph, fixing`)
              fixed = true
              return { ...item, paragraph: createEmptyLexical() }
            }
          }
        }
        return item
      })
      if (fixed) {
        newBlock[key] = fixedParagraphs
      }
    } else if (Array.isArray(value)) {
      // Recursively check arrays (e.g., programs[], newsItems[])
      const fixedArray = value.map((item: any, index: number) => {
        if (typeof item === 'object' && item !== null) {
          const { fixed: itemFixed, block: fixedItem } = validateBlock(item)
          if (itemFixed) {
            fixed = true
            return fixedItem
          }
        }
        return item
      })
      if (fixed) {
        newBlock[key] = fixedArray
      }
    } else if (typeof value === 'object' && value !== null) {
      // Recursively process nested objects
      const { fixed: nestedFixed, block: fixedNested } = validateBlock(value)
      if (nestedFixed) {
        fixed = true
        newBlock[key] = fixedNested
      }
    }
  }

  return { fixed, block: newBlock }
}

async function validateCollection(collection: string, payload: any) {
  console.log(`\n📦 Validating ${collection}...`)

  let page = 1
  let totalFixed = 0
  let totalSkipped = 0

  while (true) {
    const result = await payload.find({
      collection,
      limit: 100,
      page,
      depth: 0,
    })

    if (result.docs.length === 0) break

    for (const doc of result.docs) {
      const sections = doc.sections || []
      let anyFixed = false
      const validatedBlocks = sections.map((block: any) => {
        const { fixed, block: validatedBlock } = validateBlock(block)
        if (fixed) {
          anyFixed = true
        }
        return validatedBlock
      })

      if (anyFixed) {
        try {
          await payload.update({
            collection,
            id: doc.id,
            data: {
              sections: validatedBlocks,
            },
            depth: 0,
            overrideAccess: true,
          })
          totalFixed++
          console.log(`  ✓ Fixed ${collection} document: ${doc.id}`)
        } catch (error: any) {
          console.error(`  ✗ Failed to fix ${collection} document ${doc.id}:`, error.message)
        }
      } else {
        totalSkipped++
      }
    }

    if (result.hasNextPage) {
      page++
    } else {
      break
    }
  }

  console.log(`  📊 ${collection}: ${totalFixed} fixed, ${totalSkipped} skipped`)
  return { fixed: totalFixed, skipped: totalSkipped }
}

async function main() {
  console.log('🔄 Validating and fixing Lexical data...\n')

  const payload = await getPayload({ config })

  try {
    // Validate Pages
    const pagesResult = await validateCollection('pages', payload)

    // Validate Homepages
    const homepagesResult = await validateCollection('homepages', payload)

    console.log('\n✅ Validation complete!')
    console.log(`   Pages: ${pagesResult.fixed} fixed, ${pagesResult.skipped} skipped`)
    console.log(`   Homepages: ${homepagesResult.fixed} fixed, ${homepagesResult.skipped} skipped`)
  } catch (error: any) {
    console.error('❌ Validation failed:', error)
    process.exit(1)
  } finally {
    process.exit(0)
  }
}

main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
