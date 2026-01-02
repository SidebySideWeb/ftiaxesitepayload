#!/usr/bin/env node
/**
 * Check and Fix Slate Data Script
 * 
 * Checks all pages and homepages for Slate format data and converts to Lexical
 * 
 * Usage:
 *   tsx src/scripts/checkAndFixSlateData.ts
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
 * Check if data is in Slate format
 */
function isSlateFormat(data: any): boolean {
  if (!data || typeof data !== 'object') return false
  // Slate format is an array of nodes
  if (Array.isArray(data) && data.length > 0) {
    const firstNode = data[0]
    // Slate nodes have 'type' and 'children' properties
    return firstNode && typeof firstNode === 'object' && 'type' in firstNode && !('root' in firstNode)
  }
  return false
}

/**
 * Check if data is already in Lexical format
 */
function isLexicalFormat(data: any): boolean {
  return data && typeof data === 'object' && data.root && data.root.type === 'root'
}

/**
 * Convert Slate format to Lexical format
 */
function slateToLexical(slateData: any): any {
  // If already Lexical format, return as-is
  if (isLexicalFormat(slateData)) {
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
        type: 'heading',
        version: 1,
        tag: `h${slateNode.level || 1}`,
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
 * Recursively check and migrate rich text in blocks
 */
function migrateBlock(block: any): { migrated: boolean; block: any } {
  let migrated = false
  const newBlock = { ...block }

  // RichText field names that should be checked (only for blocks that actually use richText)
  // Note: 'content' in contactInfo is textarea, not richText, so we check blockType first
  const richTextFieldNames = ['description', 'paragraph', 'additionalInfo', 'coachBio']
  
  // Blocks that have 'content' as richText (not textarea)
  const blocksWithRichTextContent = ['kallitechnia.richText', 'kallitechnia.imageText']

  // Check all fields in the block
  for (const [key, value] of Object.entries(newBlock)) {
    // Check if this is a richText field
    const isRichTextField = richTextFieldNames.includes(key) || 
      (key === 'content' && blocksWithRichTextContent.includes(newBlock.blockType))
    
    if (isRichTextField && value) {
      // Check if it's Slate format and convert
      if (isSlateFormat(value)) {
        console.log(`    Found Slate data in ${newBlock.blockType || 'unknown'}.${key}`)
        const lexicalContent = slateToLexical(value)
        newBlock[key] = lexicalContent
        migrated = true
      } else if (typeof value === 'string' && value.trim() !== '') {
        // Convert plain text strings to Lexical (only for richText fields)
        console.log(`    Found text string in ${newBlock.blockType || 'unknown'}.${key}, converting to Lexical`)
        newBlock[key] = {
          root: {
            children: [
              {
                children: [
                  {
                    detail: 0,
                    format: 0,
                    mode: 'normal',
                    style: '',
                    text: value.trim(),
                    type: 'text',
                    version: 1,
                  },
                ],
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
        migrated = true
      }
    } else if (key === 'paragraphs' && Array.isArray(value)) {
      // Handle welcome block paragraphs array
      const migratedParagraphs = value.map((item: any, index: number) => {
        if (typeof item === 'object' && item.paragraph) {
          if (isSlateFormat(item.paragraph)) {
            console.log(`    Found Slate data in ${newBlock.blockType || 'unknown'}.paragraphs[${index}].paragraph`)
            const lexicalContent = slateToLexical(item.paragraph)
            migrated = true
            return { ...item, paragraph: lexicalContent }
          } else if (typeof item.paragraph === 'string' && item.paragraph.trim() !== '') {
            console.log(`    Found text string in ${newBlock.blockType || 'unknown'}.paragraphs[${index}].paragraph, converting to Lexical`)
            migrated = true
            return {
              ...item,
              paragraph: {
                root: {
                  children: [
                    {
                      children: [
                        {
                          detail: 0,
                          format: 0,
                          mode: 'normal',
                          style: '',
                          text: item.paragraph.trim(),
                          type: 'text',
                          version: 1,
                        },
                      ],
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
            }
          }
        } else if (typeof item === 'string' && item.trim() !== '') {
          // Handle array of strings (old format)
          console.log(`    Found text string in ${newBlock.blockType || 'unknown'}.paragraphs[${index}], converting to Lexical`)
          migrated = true
          return {
            paragraph: {
              root: {
                children: [
                  {
                    children: [
                      {
                        detail: 0,
                        format: 0,
                        mode: 'normal',
                        style: '',
                        text: item.trim(),
                        type: 'text',
                        version: 1,
                      },
                    ],
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
          }
        }
        return item
      })
      if (migrated) {
        newBlock[key] = migratedParagraphs
      }
    } else if (Array.isArray(value)) {
      // Recursively check arrays (e.g., programs[], newsItems[])
      const migratedArray = value.map((item: any, index: number) => {
        if (typeof item === 'object' && item !== null) {
          const migratedItem = { ...item }
          let itemMigrated = false

          for (const [itemKey, itemValue] of Object.entries(migratedItem)) {
            // Check if this is a richText field (description in programsGrid, etc.)
            const isRichTextField = richTextFieldNames.includes(itemKey)
            
            if (isRichTextField && itemValue) {
              if (isSlateFormat(itemValue)) {
                console.log(`    Found Slate data in ${newBlock.blockType || 'unknown'}[${index}].${itemKey}`)
                const lexicalContent = slateToLexical(itemValue)
                migratedItem[itemKey] = lexicalContent
                itemMigrated = true
                migrated = true
              } else if (typeof itemValue === 'string' && itemValue.trim() !== '') {
                console.log(`    Found text string in ${newBlock.blockType || 'unknown'}[${index}].${itemKey}, converting to Lexical`)
                migratedItem[itemKey] = {
                  root: {
                    children: [
                      {
                        children: [
                          {
                            detail: 0,
                            format: 0,
                            mode: 'normal',
                            style: '',
                            text: itemValue.trim(),
                            type: 'text',
                            version: 1,
                          },
                        ],
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
                itemMigrated = true
                migrated = true
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

  return { migrated, block: newBlock }
}

async function checkAndFixCollection(collection: string, payload: any) {
  console.log(`\n📦 Checking ${collection}...`)

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
      let anyMigrated = false
      const migratedBlocks = sections.map((block: any) => {
        const { migrated, block: newBlock } = migrateBlock(block)
        if (migrated) {
          anyMigrated = true
        }
        return newBlock
      })

      if (anyMigrated) {
        try {
          await payload.update({
            collection,
            id: doc.id,
            data: {
              sections: migratedBlocks,
            },
            depth: 0,
            overrideAccess: true,
          })
          totalMigrated++
          console.log(`  ✓ Migrated ${collection} document: ${doc.id}`)
        } catch (error: any) {
          console.error(`  ✗ Failed to migrate ${collection} document ${doc.id}:`, error.message)
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

async function main() {
  console.log('🔄 Checking and fixing Slate/Lexical data...\n')

  const payload = await getPayload({ config })

  try {
    // Migrate Pages
    const pagesResult = await checkAndFixCollection('pages', payload)

    // Migrate Homepages
    const homepagesResult = await checkAndFixCollection('homepages', payload)

    console.log('\n✅ Migration complete!')
    console.log(`   Pages: ${pagesResult.migrated} migrated, ${pagesResult.skipped} skipped`)
    console.log(`   Homepages: ${homepagesResult.migrated} migrated, ${homepagesResult.skipped} skipped`)
  } catch (error: any) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  } finally {
    if (payload && typeof payload.shutdown === 'function') {
      await payload.shutdown()
    }
    process.exit(0)
  }
}

main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
