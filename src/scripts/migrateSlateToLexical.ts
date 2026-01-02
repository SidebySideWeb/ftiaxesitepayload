#!/usr/bin/env node
/**
 * Slate to Lexical Migration Script
 * 
 * Migrates all rich text fields from Slate format to Lexical format.
 * 
 * Usage:
 *   tsx src/scripts/migrateSlateToLexical.ts
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
 * Convert Slate format to Lexical format
 */
function slateToLexical(slateData: any): any {
  // If already Lexical format, return as-is
  if (slateData?.root?.type === 'root') {
    return slateData
  }

  // If empty or invalid, return empty Lexical document
  if (!slateData || !Array.isArray(slateData)) {
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

  // Convert Slate nodes to Lexical nodes
  const children: any[] = []

  for (const slateNode of slateData) {
    if (slateNode.type === 'paragraph') {
      const paragraph: any = {
        children: [],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'paragraph',
        version: 1,
      }

      // Convert text nodes
      if (slateNode.children && Array.isArray(slateNode.children)) {
        for (const child of slateNode.children) {
          if (child.text !== undefined) {
            const textNode: any = {
              detail: 0,
              format: 0,
              mode: 'normal',
              style: '',
              text: child.text || '',
              type: 'text',
              version: 1,
            }

            // Apply formatting
            if (child.bold) textNode.format |= 1 // BOLD
            if (child.italic) textNode.format |= 2 // ITALIC
            if (child.underline) textNode.format |= 4 // UNDERLINE
            if (child.strikethrough) textNode.format |= 8 // STRIKETHROUGH
            if (child.code) textNode.format |= 16 // CODE

            paragraph.children.push(textNode)
          }
        }
      }

      if (paragraph.children.length > 0) {
        children.push(paragraph)
      }
    } else if (slateNode.type === 'heading') {
      const heading: any = {
        children: [],
        direction: 'ltr',
        format: '',
        indent: 0,
        tag: `h${slateNode.level || 1}`,
        type: 'heading',
        version: 1,
      }

      if (slateNode.children && Array.isArray(slateNode.children)) {
        for (const child of slateNode.children) {
          if (child.text !== undefined) {
            const textNode: any = {
              detail: 0,
              format: 0,
              mode: 'normal',
              style: '',
              text: child.text || '',
              type: 'text',
              version: 1,
            }

            if (child.bold) textNode.format |= 1
            if (child.italic) textNode.format |= 2

            heading.children.push(textNode)
          }
        }
      }

      if (heading.children.length > 0) {
        children.push(heading)
      }
    }
  }

  return {
    root: {
      children,
      direction: 'ltr',
      format: '',
      indent: 0,
      type: 'root',
      version: 1,
    },
  }
}

/**
 * Check if data is in Slate format
 */
function isSlateFormat(data: any): boolean {
  if (!data || typeof data !== 'object') return false
  // Slate format is an array of nodes
  if (Array.isArray(data) && data.length > 0) {
    const firstNode = data[0]
    // Slate nodes have 'type' and 'children' properties
    return firstNode && typeof firstNode === 'object' && 'type' in firstNode
  }
  return false
}

/**
 * Recursively migrate rich text in blocks
 */
function migrateBlocks(blocks: any[]): { migrated: boolean; blocks: any[] } {
  let migrated = false
  const newBlocks = blocks.map((block) => {
    const newBlock = { ...block }

    // RichText field names that should be checked for Slate format
    const richTextFieldNames = ['description', 'content', 'paragraph', 'additionalInfo', 'coachBio']

    // Check all fields in the block
    for (const [key, value] of Object.entries(newBlock)) {
      if (richTextFieldNames.includes(key) && value) {
        // Check if it's Slate format and convert
        if (isSlateFormat(value)) {
          const lexicalContent = slateToLexical(value)
          if (JSON.stringify(lexicalContent) !== JSON.stringify(value)) {
            newBlock[key] = lexicalContent
            migrated = true
          }
        }
      } else if (key === 'paragraphs' && Array.isArray(value)) {
        // Handle welcome block paragraphs array
        const migratedParagraphs = value.map((item: any) => {
          if (typeof item === 'object' && item.paragraph) {
            if (isSlateFormat(item.paragraph)) {
              const lexicalContent = slateToLexical(item.paragraph)
              if (JSON.stringify(lexicalContent) !== JSON.stringify(item.paragraph)) {
                migrated = true
                return { ...item, paragraph: lexicalContent }
              }
            }
          }
          return item
        })
        if (migrated) {
          newBlock[key] = migratedParagraphs
        }
      } else if (Array.isArray(value)) {
        // Recursively check arrays (e.g., programs[], newsItems[])
        const migratedArray = value.map((item: any) => {
          if (typeof item === 'object' && item !== null) {
            const migratedItem = { ...item }
            let itemMigrated = false

            for (const [itemKey, itemValue] of Object.entries(migratedItem)) {
              if (richTextFieldNames.includes(itemKey) && itemValue) {
                if (isSlateFormat(itemValue)) {
                  const lexicalContent = slateToLexical(itemValue)
                  if (JSON.stringify(lexicalContent) !== JSON.stringify(itemValue)) {
                    migratedItem[itemKey] = lexicalContent
                    itemMigrated = true
                    migrated = true
                  }
                }
              }
            }

            return itemMigrated ? migratedItem : item
          }
          return item
        })
        if (migrated) {
          newBlock[key] = migratedArray
        }
      }
    }

    // Also handle richText block content
    if (block.blockType === 'kallitechnia.richText' && block.content) {
      if (isSlateFormat(block.content)) {
        const lexicalContent = slateToLexical(block.content)
        if (JSON.stringify(lexicalContent) !== JSON.stringify(block.content)) {
          newBlock.content = lexicalContent
          migrated = true
        }
      }
    }

    return newBlock
  })

  return { migrated, blocks: newBlocks }
}

async function migrateCollection(collection: string, payload: any) {
  console.log(`\n📦 Migrating ${collection}...`)

  let page = 1
  let totalMigrated = 0
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
      const { migrated, blocks } = migrateBlocks(sections)

      if (migrated) {
        try {
          await payload.update({
            collection,
            id: doc.id,
            data: {
              sections: blocks,
            },
            depth: 0,
          })
          totalMigrated++
          console.log(`  ✓ Migrated ${collection} document: ${doc.id}`)
        } catch (error) {
          console.error(`  ✗ Failed to migrate ${collection} document ${doc.id}:`, error)
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

  console.log(`  📊 ${collection}: ${totalMigrated} migrated, ${totalSkipped} skipped`)
  return { migrated: totalMigrated, skipped: totalSkipped }
}

async function migratePosts(payload: any) {
  console.log(`\n📦 Migrating Posts...`)

  let page = 1
  let totalMigrated = 0
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
      if (doc.content) {
        const lexicalContent = slateToLexical(doc.content)
        if (JSON.stringify(lexicalContent) !== JSON.stringify(doc.content)) {
          try {
            await payload.update({
              collection: 'posts',
              id: doc.id,
              data: {
                content: lexicalContent,
              },
              depth: 0,
            })
            totalMigrated++
            console.log(`  ✓ Migrated Post: ${doc.id}`)
          } catch (error) {
            console.error(`  ✗ Failed to migrate Post ${doc.id}:`, error)
          }
        } else {
          totalSkipped++
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

  console.log(`  📊 Posts: ${totalMigrated} migrated, ${totalSkipped} skipped`)
  return { migrated: totalMigrated, skipped: totalSkipped }
}

async function main() {
  console.log('🔄 Starting Slate to Lexical migration...\n')

  const payload = await getPayload({ config })

  try {
    // Migrate Pages
    const pagesResult = await migrateCollection('pages', payload)

    // Migrate Homepages
    const homepagesResult = await migrateCollection('homepages', payload)

    // Migrate Posts
    const postsResult = await migratePosts(payload)

    console.log('\n✅ Migration complete!')
    console.log(`   Pages: ${pagesResult.migrated} migrated, ${pagesResult.skipped} skipped`)
    console.log(`   Homepages: ${homepagesResult.migrated} migrated, ${homepagesResult.skipped} skipped`)
    console.log(`   Posts: ${postsResult.migrated} migrated, ${postsResult.skipped} skipped`)
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  } finally {
    process.exit(0)
  }
}

main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})

