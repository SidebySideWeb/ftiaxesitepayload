import { kallitechniaBlocks } from './tenants/kallitechnia'
import { ftiaxesiteBlocks } from './tenants/ftiaxesite'
import { getTenantBlocks } from './utils/tenantBlocksLoader'

/**
 * Tenant Block Registry
 * 
 * This file aggregates all tenant-specific blocks.
 * Each tenant has its own namespace (e.g., kallitechnia.hero, ftiaxesite.landingHero)
 * 
 * To add a new tenant:
 * 1. Create src/tenants/<tenantCode>/blocks/*.ts files
 * 2. Create src/tenants/<tenantCode>/index.ts that exports blocks array
 * 3. Create src/tenants/<tenantCode>/schema.ts with allowedBlocks
 * 4. Update getTenantBlocks() in src/utils/tenantBlocksLoader.ts
 * 5. Import and add to tenantBlocks array below
 * 6. Add tenant code to TENANTS array
 */

export const TENANTS = ['kallitechnia', 'ftiaxesite'] as const

// Aggregate all tenant blocks (for Payload config)
export const tenantBlocks = [...kallitechniaBlocks, ...ftiaxesiteBlocks]

/**
 * Gets blocks for a specific tenant
 * Use this when you need tenant-specific blocks (e.g., in hooks)
 */
export { getTenantBlocks }

