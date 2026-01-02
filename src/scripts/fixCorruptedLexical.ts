#!/usr/bin/env node
/**
 * Fix Corrupted Lexical Data Script
 * 
 * Finds and fixes textarea fields that contain stringified Lexical objects
 * 
 * Usage:
 *   tsx src/scripts/fixCorruptedLexical.ts
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
 * Check if a value is a stringified Lexical object
 */
function isStringifiedLexical(value: any): boolean {
  if (typeof value !== 'string') return false
  try {
    const parsed = JSON.parse(value)
    return parsed && typeof parsed === 'object' && parsed.root && parsed.root.type === 'root'
  } catch {
    return false
  }
}

/**
 * Extract text from a Lexical object (if stringified)
 * Handles double-encoded cases where a Lexical object is stringified inside another Lexical object
 */
function extractTextFromLexical(lexicalData: any, depth: number = 0): string {
  // Prevent infinite recursion
  if (depth > 5) {
    return ''
  }

  if (typeof lexicalData === 'string') {
    try {
      lexicalData = JSON.parse(lexicalData)
    } catch {
      // If it's not valid JSON, return as-is (it's plain text)
      return lexicalData
    }
  }

  if (!lexicalData || typeof lexicalData !== 'object') {
    return ''
  }

  // Check if this is a Lexical object
  if (lexicalData.root && lexicalData.root.children) {
    const extractText = (node: any): string => {
      if (node.type === 'text' && node.text) {
        // Check if the text itself is a stringified Lexical object
        if (typeof node.text === 'string' && node.text.trim().startsWith('{') && node.text.includes('"root"')) {
          try {
            const innerLexical = JSON.parse(node.text)
            // Recursively extract text from the inner Lexical object
            return extractTextFromLexical(innerLexical, depth + 1)
          } catch {
            // If parsing fails, return the text as-is
            return node.text
          }
        }
        return node.text
      }
      if (node.children && Array.isArray(node.children)) {
        return node.children.map(extractText).join('')
      }
      return ''
    }

    const extracted = lexicalData.root.children.map(extractText).join('\n').trim()
    return extracted
  }

  return ''
}

/**
 * Recursively find and fix corrupted Lexical data in blocks
 */
function fixBlock(block: any): { fixed: boolean; block: any } {
  let fixed = false
  const newBlock = { ...block }

  // Check if this is a contactInfo block with items
  if (block.blockType === 'kallitechnia.contactInfo' && Array.isArray(block.items)) {
    newBlock.items = block.items.map((item: any) => {
      const newItem = { ...item }
      
      // Check if content field contains stringified Lexical or Lexical object
      if (item.content) {
        if (isStringifiedLexical(item.content)) {
          console.log(`    Found stringified Lexical in contactInfo.items[].content, extracting text`)
          const extractedText = extractTextFromLexical(item.content)
          // Ensure it's a plain string and truncate if too long (textarea max is 500)
          newItem.content = typeof extractedText === 'string' ? extractedText.substring(0, 500) : ''
          fixed = true
        } else if (typeof item.content === 'object' && item.content.root) {
          // It's a Lexical object (not stringified) - extract text
          console.log(`    Found Lexical object in contactInfo.items[].content, extracting text`)
          const extractedText = extractTextFromLexical(item.content)
          // Ensure it's a plain string and truncate if too long (textarea max is 500)
          newItem.content = typeof extractedText === 'string' ? extractedText.substring(0, 500) : ''
          fixed = true
        } else if (typeof item.content !== 'string') {
          // If it's not a string, convert to empty string
          console.log(`    Found non-string content in contactInfo.items[].content, clearing`)
          newItem.content = ''
          fixed = true
        }
      }
      
      return newItem
    })
  }

  // Recursively check nested arrays
  for (const [key, value] of Object.entries(newBlock)) {
    if (Array.isArray(value) && key !== 'items') {
      newBlock[key] = value.map((item: any) => {
        if (typeof item === 'object' && item !== null) {
          const { fixed: itemFixed, block: fixedItem } = fixBlock(item)
          if (itemFixed) {
            fixed = true
            return fixedItem
          }
        }
        return item
      })
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

async function main() {
  console.log('🔄 Fixing corrupted Lexical data...\n')

  const payload = await getPayload({ config })

  try {
    // Fix Pages
    const pagesResult = await fixCollection('pages', payload)

    // Fix Homepages
    const homepagesResult = await fixCollection('homepages', payload)

    console.log('\n✅ Fix complete!')
    console.log(`   Pages: ${pagesResult.fixed} fixed, ${pagesResult.skipped} skipped`)
    console.log(`   Homepages: ${homepagesResult.fixed} fixed, ${homepagesResult.skipped} skipped`)
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
