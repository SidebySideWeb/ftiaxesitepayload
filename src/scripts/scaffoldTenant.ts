#!/usr/bin/env node
/**
 * Tenant Scaffold Script
 * 
 * Creates the folder structure for a new tenant's blocks
 * 
 * Usage:
 *   tsx src/scripts/scaffoldTenant.ts <tenantCode>
 * 
 * Example:
 *   tsx src/scripts/scaffoldTenant.ts mynewtenant
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const projectRoot = path.resolve(dirname, '../..')

function scaffoldTenant(tenantCode: string) {
  // Validate tenant code (alphanumeric, lowercase, no spaces)
  if (!/^[a-z0-9]+$/.test(tenantCode)) {
    console.error(
      `❌ Invalid tenant code: "${tenantCode}". Must be lowercase alphanumeric only.`,
    )
    process.exit(1)
  }

  const tenantDir = path.join(projectRoot, 'src', 'tenants', tenantCode)
  const blocksDir = path.join(tenantDir, 'blocks')
  const indexFile = path.join(tenantDir, 'index.ts')

  // Check if tenant already exists
  if (fs.existsSync(tenantDir)) {
    console.error(`❌ Tenant "${tenantCode}" already exists at ${tenantDir}`)
    process.exit(1)
  }

  // Create directory structure
  console.log(`📁 Creating directory structure for tenant: ${tenantCode}`)
  fs.mkdirSync(blocksDir, { recursive: true })

  // Create index.ts
  const indexContent = `// Placeholder for ${tenantCode} tenant
// Blocks will be added here as needed

export const tenantCode = '${tenantCode}'

export const ${tenantCode}Blocks: any[] = []
`

  // Create schema.ts
  const schemaFile = path.join(tenantDir, 'schema.ts')
  const schemaContent = `/**
 * ${tenantCode} Tenant Schema
 * 
 * Defines allowed blocks for this tenant
 */

export const tenantCode = '${tenantCode}'

export const allowedBlocks = [] as const

export type ${tenantCode.charAt(0).toUpperCase() + tenantCode.slice(1)}BlockType = (typeof allowedBlocks)[number]
`

  fs.writeFileSync(schemaFile, schemaContent)
  console.log(`✅ Created ${schemaFile}`)

  fs.writeFileSync(indexFile, indexContent)
  console.log(`✅ Created ${indexFile}`)

  // Create renderers directory and index
  const renderersDir = path.join(tenantDir, 'renderers')
  const renderersIndexFile = path.join(renderersDir, 'index.ts')
  fs.mkdirSync(renderersDir, { recursive: true })

  const renderersIndexContent = `/**
 * ${tenantCode} Tenant Renderers
 * 
 * Exports all renderer components for ${tenantCode} blocks
 */

export const ${tenantCode}Renderers = {}
`

  fs.writeFileSync(renderersIndexFile, renderersIndexContent)
  console.log(`✅ Created ${renderersIndexFile}`)

  // Update tenantRegistry.ts
  const registryFile = path.join(projectRoot, 'src', 'tenantRegistry.ts')
  let registryContent = fs.readFileSync(registryFile, 'utf-8')

  // Add import
  const importLine = `import { ${tenantCode}Blocks } from './tenants/${tenantCode}'`
  const lastImportIndex = registryContent.lastIndexOf("import {")
  const lastImportEnd = registryContent.indexOf('\n', lastImportIndex)
  registryContent =
    registryContent.slice(0, lastImportEnd + 1) +
    importLine +
    '\n' +
    registryContent.slice(lastImportEnd + 1)

  // Add to TENANTS array
  const tenantsArrayMatch = registryContent.match(/export const TENANTS = \[(.*?)\] as const/)
  if (tenantsArrayMatch) {
    const currentTenants = tenantsArrayMatch[1]
    const newTenants = currentTenants
      ? `${currentTenants}, '${tenantCode}'`
      : `'${tenantCode}'`
    registryContent = registryContent.replace(
      /export const TENANTS = \[.*?\] as const/,
      `export const TENANTS = [${newTenants}] as const`,
    )
  }

  // Add to tenantBlocks array
  const blocksArrayMatch = registryContent.match(/export const tenantBlocks = \[(.*?)\]/s)
  if (blocksArrayMatch) {
    const currentBlocks = blocksArrayMatch[1].trim()
    const newBlocks = currentBlocks
      ? `${currentBlocks}\n  ...${tenantCode}Blocks,`
      : `...${tenantCode}Blocks`
    registryContent = registryContent.replace(
      /export const tenantBlocks = \[.*?\]/s,
      `export const tenantBlocks = [${newBlocks}\n]`,
    )
  }

  fs.writeFileSync(registryFile, registryContent)
  console.log(`✅ Updated ${registryFile}`)

  console.log(`\n✅ Tenant "${tenantCode}" scaffolded successfully!`)
  console.log(`\nNext steps:`)
  console.log(`  1. Create block files in: ${blocksDir}`)
  console.log(`  2. Export blocks from: ${indexFile}`)
  console.log(`  3. Run: npm run generate:types`)
}

// Get tenant code from command line
const tenantCode = process.argv[2]

if (!tenantCode) {
  console.error('❌ Usage: tsx src/scripts/scaffoldTenant.ts <tenantCode>')
  console.error('   Example: tsx src/scripts/scaffoldTenant.ts mynewtenant')
  process.exit(1)
}

scaffoldTenant(tenantCode)

