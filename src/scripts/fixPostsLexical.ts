#!/usr/bin/env node
/**
 * Fix Posts Empty Lexical Content
 * 
 * Fixes empty Lexical content in Posts collection
 * 
 * Usage:
 *   tsx src/scripts/fixPostsLexical.ts
 */

import { config as dotenvConfig } from 'dotenv'
import { existsSync } from 'node:fs'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'
// @ts-ignore - postgres is available via @payloadcms/db-postgres
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

async function fixPosts() {
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
    console.log('🔄 Fixing empty Lexical content in Posts...\n')

    // First, check what columns exist in the posts table
    const columns = await sql`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'posts'
      ORDER BY column_name
    `
    
    console.log('   📋 Posts table columns:')
    columns.forEach((col: any) => {
      console.log(`      - ${col.column_name} (${col.data_type})`)
    })

    // Find posts with empty content (children array is empty)
    const postsWithEmptyContent = await sql`
      SELECT id, content
      FROM ${sql('posts')}
      WHERE content IS NOT NULL
      AND jsonb_typeof(content) = 'object'
      AND content->'root'->'children' = '[]'::jsonb
    `

    if (postsWithEmptyContent.length === 0) {
      console.log('   ⏭️  No posts with empty Lexical content found')
    } else {
      console.log(`   🔄 Found ${postsWithEmptyContent.length} posts with empty content, fixing...`)

      const emptyLexical = createEmptyLexical()
      const emptyLexicalJson = JSON.stringify(emptyLexical)

      for (const post of postsWithEmptyContent) {
        await sql`
          UPDATE ${sql('posts')}
          SET content = ${emptyLexicalJson}::jsonb
          WHERE id = ${post.id}
        `
        console.log(`   ✓ Fixed post: ${post.id}`)
      }

      console.log(`\n   ✅ Fixed ${postsWithEmptyContent.length} posts`)
    }

    // Also check versioned posts (if table exists)
    try {
      const versionedPostsWithEmptyContent = await sql`
        SELECT id, content
        FROM ${sql('_posts_v')}
        WHERE content IS NOT NULL
        AND jsonb_typeof(content) = 'object'
        AND content->'root'->'children' = '[]'::jsonb
      `

      if (versionedPostsWithEmptyContent.length > 0) {
        console.log(`   🔄 Found ${versionedPostsWithEmptyContent.length} versioned posts with empty content, fixing...`)

        const emptyLexical = createEmptyLexical()
        const emptyLexicalJson = JSON.stringify(emptyLexical)

        for (const post of versionedPostsWithEmptyContent) {
          await sql`
            UPDATE ${sql('_posts_v')}
            SET content = ${emptyLexicalJson}::jsonb
            WHERE id = ${post.id}
          `
        }

        console.log(`   ✅ Fixed ${versionedPostsWithEmptyContent.length} versioned posts`)
      }
    } catch (error: any) {
      // Versioned table might not exist, that's okay
      console.log('   ⏭️  Versioned posts table not found or not accessible')
    }

    console.log('\n✅ Fix complete!')
  } catch (error: any) {
    console.error('❌ Failed to fix posts:', error.message)
    process.exit(1)
  } finally {
    await sql.end()
  }
}

fixPosts().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
