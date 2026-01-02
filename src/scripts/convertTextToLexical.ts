#!/usr/bin/env node
/**
 * Convert Text Strings to Lexical Format
 * 
 * Converts plain text strings stored in jsonb columns to Lexical editor format
 * This must be run AFTER the schema migration to jsonb
 * 
 * Usage:
 *   tsx src/scripts/convertTextToLexical.ts
 */

import { config as dotenvConfig } from 'dotenv'
import { existsSync } from 'node:fs'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'
import postgres from 'postgres'

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

/**
 * Convert a plain text string to Lexical format
 */
function textToLexical(text: string): any {
  if (!text || typeof text !== 'string') {
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

  // Split by newlines to create multiple paragraphs
  const paragraphs = text.split('\n').filter((p) => p.trim() !== '')

  if (paragraphs.length === 0) {
    // Empty text - return empty Lexical structure
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

  return {
    root: {
      children: paragraphs.map((paragraph) => ({
        children: [
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: paragraph.trim(),
            type: 'text',
            version: 1,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'paragraph',
        version: 1,
      })),
      direction: 'ltr',
      format: '',
      indent: 0,
      type: 'root',
      version: 1,
    },
  }
}

async function convertTextToLexical() {
  if (!process.env.DATABASE_URI) {
    console.error('❌ DATABASE_URI not found in environment variables')
    process.exit(1)
  }

  const sql = postgres(process.env.DATABASE_URI!, {
    ssl: {
      rejectUnauthorized: false,
    },
  })

  try {
    console.log('🔄 Converting text strings to Lexical format...\n')

    // List of tables and columns that need conversion
    const tablesToConvert = [
      // CTA blocks
      { table: 'homepages_blocks_kallitechnia_cta', column: 'description' },
      { table: 'pages_blocks_kallitechnia_cta', column: 'description' },
      { table: '_homepages_v_blocks_kallitechnia_cta', column: 'description' },
      { table: '_pages_v_blocks_kallitechnia_cta', column: 'description' },
      
      // Download button blocks
      { table: 'homepages_blocks_kallitechnia_downloadbutton', column: 'description' },
      { table: 'pages_blocks_kallitechnia_downloadbutton', column: 'description' },
      { table: '_homepages_v_blocks_kallitechnia_downloadbutton', column: 'description' },
      { table: '_pages_v_blocks_kallitechnia_downloadbutton', column: 'description' },
      
      // Form blocks
      { table: 'homepages_blocks_kallitechnia_form', column: 'description' },
      { table: 'pages_blocks_kallitechnia_form', column: 'description' },
      { table: '_homepages_v_blocks_kallitechnia_form', column: 'description' },
      { table: '_pages_v_blocks_kallitechnia_form', column: 'description' },
      
      // ImageText blocks
      { table: 'homepages_blocks_kallitechnia_imagetext', column: 'content' },
      { table: 'pages_blocks_kallitechnia_imagetext', column: 'content' },
      { table: '_homepages_v_blocks_kallitechnia_imagetext', column: 'content' },
      { table: '_pages_v_blocks_kallitechnia_imagetext', column: 'content' },
      
      // ProgramDetail blocks
      { table: 'homepages_blocks_kallitechnia_programdetail', columns: ['description', 'additional_info', 'coach_bio'] },
      { table: 'pages_blocks_kallitechnia_programdetail', columns: ['description', 'additional_info', 'coach_bio'] },
      { table: '_homepages_v_blocks_kallitechnia_programdetail', columns: ['description', 'additional_info', 'coach_bio'] },
      { table: '_pages_v_blocks_kallitechnia_programdetail', columns: ['description', 'additional_info', 'coach_bio'] },
      
      // ProgramsGrid blocks - description in nested array
      { table: 'homepages_blocks_kallitechnia_programsgrid_programs', column: 'description' },
      { table: 'pages_blocks_kallitechnia_programsgrid_programs', column: 'description' },
      { table: '_homepages_v_blocks_kallitechnia_programsgrid_programs', column: 'description' },
      { table: '_pages_v_blocks_kallitechnia_programsgrid_programs', column: 'description' },
      
      // Welcome blocks - paragraph in nested array
      { table: 'homepages_blocks_kallitechnia_welcome_paragraphs', column: 'paragraph' },
      { table: 'pages_blocks_kallitechnia_welcome_paragraphs', column: 'paragraph' },
      { table: '_homepages_v_blocks_kallitechnia_welcome_paragraphs', column: 'paragraph' },
      { table: '_pages_v_blocks_kallitechnia_welcome_paragraphs', column: 'paragraph' },
    ]

    let totalConverted = 0

    for (const item of tablesToConvert) {
      const table = item.table
      const columns = Array.isArray(item.columns) ? item.columns : [item.column]

      // Check if table exists
      const tableExists = await sql.unsafe(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = '${table}'
        )
      `)

      if (!tableExists[0].exists) {
        console.log(`   ⏭️  Table ${table} does not exist, skipping`)
        continue
      }

      for (const column of columns) {
        // Get all rows with non-null, non-object values (plain text strings)
        const rows = await sql.unsafe(`
          SELECT id, "${column}" as value
          FROM "${table}"
          WHERE "${column}" IS NOT NULL
          AND jsonb_typeof("${column}") = 'string'
        `)

        if (rows.length === 0) {
          console.log(`   ⏭️  No text strings found in ${table}.${column}`)
          continue
        }

        console.log(`   🔄 Converting ${rows.length} text strings in ${table}.${column}...`)

        for (const row of rows) {
          const textValue = row.value as string
          const lexicalValue = textToLexical(textValue)

          await sql.unsafe(`
            UPDATE "${table}"
            SET "${column}" = $1::jsonb
            WHERE id = $2
          `, [JSON.stringify(lexicalValue), row.id])

          totalConverted++
        }

        console.log(`   ✓ Converted ${rows.length} values in ${table}.${column}`)
      }
    }

    console.log(`\n✅ Conversion complete!`)
    console.log(`   Total values converted: ${totalConverted}`)
    console.log(`   You can now view/edit these fields in the Admin UI`)
  } catch (error: any) {
    console.error('❌ Conversion failed:', error.message)
    if (error.code === '42P01') {
      console.error('   Table does not exist - this is normal if no data has been created yet')
    }
    process.exit(1)
  } finally {
    await sql.end()
    process.exit(0)
  }
}

convertTextToLexical().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
