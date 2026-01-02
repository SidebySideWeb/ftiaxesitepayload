/**
 * Tenant Blocks Loader
 * 
 * Dynamically loads blocks for a specific tenant
 */

import type { Block } from 'payload'
import { kallitechniaBlocks } from '../tenants/kallitechnia'

/**
 * Gets blocks for a specific tenant
 */
export function getTenantBlocks(tenantCode: string): Block[] {
  switch (tenantCode) {
    case 'kallitechnia':
      return kallitechniaBlocks
    case 'ftiaxesite':
      // Return empty array for now - will be populated when ftiaxesite blocks are created
      return []
    default:
      console.warn(`[TenantBlocksLoader] Unknown tenant code: ${tenantCode}`)
      return []
  }
}

/**
 * Gets all tenant codes that have blocks defined
 */
export function getTenantCodesWithBlocks(): string[] {
  return ['kallitechnia', 'ftiaxesite']
}

/**
 * Checks if a block type belongs to a tenant
 */
export function isBlockTypeForTenant(blockType: string, tenantCode: string): boolean {
  return blockType.startsWith(`${tenantCode}.`)
}

