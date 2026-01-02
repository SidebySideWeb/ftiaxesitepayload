#!/usr/bin/env node
/**
 * Fix Empty Lexical Data Script
 * 
 * Fixes Lexical structures that have empty children arrays
 * Lexical requires at least one paragraph child
 * 
 * Usage:
 *   tsx src/scripts/fixEmptyLexical.ts
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
 * Create a valid empty Lexical structure with at least one paragraph
 */
function createEmptyLexical(): any {
  return {
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
  }
}

/**
 * Check if a Lexical structure has empty children
 */
function hasEmptyChildren(data: any): boolean {
  if (!data || typeof data !== 'object') return false
  if (!data.root || typeof data.root !== 'object') return false
  if (data.root.type !== 'root') return false
  if (!Array.isArray(data.root.children)) return false
  
  // Check if children array is empty
  return data.root.children.length === 0
}

/**
 * Recursively find and fix empty Lexical structures in blocks
 */
function fixBlock(block: any): { fixed: boolean; block: any } {
  let fixed = false
  const newBlock = { ...block }

  // RichText field names
  const richTextFieldNames = ['description', 'content', 'paragraph', 'additionalInfo', 'coachBio']

  // Check all fields in the block
  for (const [key, value] of Object.entries(newBlock)) {
    if (richTextFieldNames.includes(key) && value) {
      // Check if it's a Lexical object with empty children
      if (typeof value === 'object' && value.root) {
        if (hasEmptyChildren(value)) {
          console.log(`    Found empty Lexical in ${newBlock.blockType || 'unknown'}.${key}, fixing`)
          newBlock[key] = createEmptyLexical()
          fixed = true
        }
      }
    } else if (key === 'paragraphs' && Array.isArray(value)) {
      // Handle welcome block paragraphs array
      const fixedParagraphs = value.map((item: any, index: number) => {
        if (typeof item === 'object' && item.paragraph) {
          if (typeof item.paragraph === 'object' && item.paragraph.root) {
            if (hasEmptyChildren(item.paragraph)) {
              console.log(`    Found empty Lexical in ${newBlock.blockType || 'unknown'}.paragraphs[${index}].paragraph, fixing`)
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
          const { fixed: itemFixed, block: fixedItem } = fixBlock(item)
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
      const { fixed: nestedFixed, block: fixedNested } = fixBlock(value)
      if (nestedFixed) {
        fixed = true
        newBlock[key] = fixedNested
      }
    }
  }

  return { fixed, block: newBlock }
}

async function fixCollection(collection: string, payload: any) {
  console.log(`\n📦 Fixing ${collection}...`)

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
      const fixedBlocks = sections.map((block: any) => {
        const { fixed, block: fixedBlock } = fixBlock(block)
        if (fixed) {
          anyFixed = true
        }
        return fixedBlock
      })

      if (anyFixed) {
        try {
          await payload.update({
            collection,
            id: doc.id,
            data: {
              sections: fixedBlocks,
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

async function fixPosts(payload: any) {
  console.log(`\n📦 Fixing Posts...`)

  let page = 1
  let totalFixed = 0
  let totalSkipped = 0

  while (true) {
    const result = await payload.find({
      collection: 'posts',
      limit: 100,
      page,
      depth: 0,
    })

    if (result.docs.length === 0) break

    for (const doc of result.docs) {
      let fixed = false
      const updateData: any = {}

      // Check content field (richText)
      if (doc.content) {
        if (typeof doc.content === 'object' && doc.content.root) {
          if (hasEmptyChildren(doc.content)) {
            console.log(`    Found empty Lexical in posts[${doc.id}].content, fixing`)
            updateData.content = createEmptyLexical()
            fixed = true
          }
        }
      }

      // Check excerpt field (if it's richText - but it's textarea, so skip)

      if (fixed) {
        try {
          await payload.update({
            collection: 'posts',
            id: doc.id,
            data: updateData,
            depth: 0,
            overrideAccess: true,
          })
          totalFixed++
          console.log(`  ✓ Fixed posts document: ${doc.id}`)
        } catch (error: any) {
          console.error(`  ✗ Failed to fix posts document ${doc.id}:`, error.message)
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

  console.log(`  📊 Posts: ${totalFixed} fixed, ${totalSkipped} skipped`)
  return { fixed: totalFixed, skipped: totalSkipped }
}

async function main() {
  console.log('🔄 Fixing empty Lexical structures...\n')

  const payload = await getPayload({ config })

  try {
    // Fix Pages
    const pagesResult = await fixCollection('pages', payload)

    // Fix Homepages
    const homepagesResult = await fixCollection('homepages', payload)

    // Fix Posts
    const postsResult = await fixPosts(payload)

    console.log('\n✅ Fix complete!')
    console.log(`   Pages: ${pagesResult.fixed} fixed, ${pagesResult.skipped} skipped`)
    console.log(`   Homepages: ${homepagesResult.fixed} fixed, ${homepagesResult.skipped} skipped`)
    console.log(`   Posts: ${postsResult.fixed} fixed, ${postsResult.skipped} skipped`)
  } catch (error: any) {
    console.error('❌ Fix failed:', error)
    process.exit(1)
  } finally {
    process.exit(0)
  }
}

main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
