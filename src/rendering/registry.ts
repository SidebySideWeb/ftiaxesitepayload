/**
 * Block Renderer Registry
 * 
 * Maps blockType strings to React components
 * Supports tenant-scoped block names (e.g., kallitechnia.hero)
 */

import type { ComponentType } from 'react'
import { kallitechniaRenderers } from '../tenants/kallitechnia/renderers'

export type BlockRendererProps = {
  blockType: string
  [key: string]: any
}

export type BlockRenderer = ComponentType<BlockRendererProps>

// Registry map: blockType -> Component
const registry = new Map<string, BlockRenderer>()

// Track known block types for validation
export const KNOWN_BLOCK_TYPES = new Set<string>()

// Register all tenant renderers on module load
registerTenantRenderers('kallitechnia', kallitechniaRenderers)

/**
 * Register a block renderer
 */
export function registerBlock(
  blockType: string,
  component: BlockRenderer,
): void {
  registry.set(blockType, component)
  KNOWN_BLOCK_TYPES.add(blockType)
}

/**
 * Get renderer for a block type
 */
export function getRenderer(blockType: string): BlockRenderer | undefined {
  return registry.get(blockType)
}

/**
 * Check if block type is registered
 */
export function hasRenderer(blockType: string): boolean {
  return registry.has(blockType)
}

/**
 * Get all registered block types
 */
export function getRegisteredBlockTypes(): string[] {
  return Array.from(registry.keys())
}

/**
 * Register all renderers for a tenant
 * This is a convenience function - actual registration happens via imports
 */
export function registerTenantRenderers(
  tenantCode: string,
  renderers: Record<string, BlockRenderer>,
): void {
  for (const [blockType, component] of Object.entries(renderers)) {
    // Ensure block type matches tenant prefix
    if (blockType.startsWith(`${tenantCode}.`)) {
      registerBlock(blockType, component)
    } else if (process.env.NODE_ENV === 'development') {
      console.warn(
        `[Registry] Block type "${blockType}" does not match tenant prefix "${tenantCode}."`,
      )
    }
  }
}

