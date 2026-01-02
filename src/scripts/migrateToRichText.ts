#!/usr/bin/env node
/**
 * Migrate Text to RichText Script
 * 
 * Clears text/textarea description fields to allow schema migration to richText (jsonb)
 * This must be run BEFORE Payload tries to migrate the schema
 * 
 * Usage:
 *   tsx src/scripts/migrateToRichText.ts
 */

import { config as dotenvConfig } from 'dotenv'
import { existsSync } from 'node:fs'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'
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

// Use postgres package (from @payloadcms/db-postgres)
// @ts-ignore - postgres is available via @payloadcms/db-postgres
import postgres from 'postgres'

async function migrateToRichText() {
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
    console.log('🔄 Clearing text/textarea description fields to allow schema migration...\n')

    // List of tables and columns that need to be cleared
    // Include both regular tables and versioned tables (with _pages_v_ and _homepages_v_ prefixes)
    const tablesToClear = [
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
      
      // ProgramDetail blocks (PostgreSQL uses snake_case for column names)
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

    for (const item of tablesToClear) {
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
        // Check if column exists and is text/varchar (not already jsonb)
        const columnInfo = await sql.unsafe(`
          SELECT data_type 
          FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = '${table}'
          AND column_name = '${column}'
        `)

        if (columnInfo.length === 0) {
          console.log(`   ⏭️  Column ${table}.${column} does not exist, skipping`)
          continue
        }

        const dataType = columnInfo[0].data_type
        if (dataType === 'jsonb') {
          console.log(`   ⏭️  Column ${table}.${column} is already jsonb, skipping`)
          continue
        }

        // Drop and recreate column as jsonb - this is the only way PostgreSQL allows the conversion
        await sql.unsafe(`
          ALTER TABLE "${table}" 
          DROP COLUMN "${column}",
          ADD COLUMN "${column}" jsonb
        `)

        console.log(`   ✓ Migrated ${table}.${column} to jsonb`)
      }
    }

    console.log('\n✅ All description/text fields cleared!')
    console.log('   You can now start the dev server or run sync:site')
    console.log('   The schema migration should now succeed.')
  } catch (error: any) {
    console.error('❌ Migration failed:', error.message)
    if (error.code === '42P01') {
      console.error('   Table does not exist - this is normal if no data has been created yet')
    }
    process.exit(1)
  } finally {
    await sql.end()
    process.exit(0)
  }
}

migrateToRichText().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
