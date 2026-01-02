/**
 * Block Normalization
 * 
 * Ensures blocks have required fields based on schemaVersion
 * Upgrades older versions in-memory (non-destructive)
 */

export interface NormalizedBlock {
  blockType: string
  schemaVersion: number
  __deprecated?: boolean
  [key: string]: any
}

/**
 * Normalizes a block to ensure it has all required fields
 * Upgrades older schema versions
 */
export function normalizeBlock(block: any): NormalizedBlock {
  if (!block || typeof block !== 'object') {
    throw new Error('Block must be an object')
  }

  const blockType = block.blockType || block.block_type || block.type
  if (!blockType || typeof blockType !== 'string') {
    throw new Error('Block must have a blockType')
  }

  const schemaVersion = block.schemaVersion || block.schema_version || 1
  const normalized: NormalizedBlock = {
    ...block,
    blockType,
    schemaVersion: typeof schemaVersion === 'number' ? schemaVersion : 1,
    __deprecated: block.__deprecated || false,
  }

  // Version-specific upgrades
  if (schemaVersion < 2) {
    // Future: add migration logic here when schemaVersion 2 is introduced
    // For now, just ensure schemaVersion is set
    normalized.schemaVersion = 1
  }

  // Ensure tenant-scoped blockType format
  if (!blockType.includes('.')) {
    // If blockType doesn't have tenant prefix, we can't normalize it
    // This should not happen in production, but handle gracefully
    console.warn(`[normalizeBlock] Block type "${blockType}" missing tenant prefix`)
  }

  // Add defaults based on block type
  switch (blockType) {
    case 'kallitechnia.hero':
      normalized.title = normalized.title || ''
      normalized.subtitle = normalized.subtitle || ''
      normalized.ctaLabel = normalized.ctaLabel || ''
      normalized.ctaUrl = normalized.ctaUrl || ''
      break

    case 'kallitechnia.richText':
      if (!normalized.content) {
        normalized.content = {
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
      break

    case 'kallitechnia.imageGallery':
      normalized.images = Array.isArray(normalized.images) ? normalized.images : []
      break

    case 'kallitechnia.cta':
      normalized.title = normalized.title || ''
      normalized.description = normalized.description || ''
      normalized.buttonLabel = normalized.buttonLabel || ''
      normalized.buttonUrl = normalized.buttonUrl || ''
      break
  }

  return normalized
}

/**
 * Normalizes an array of blocks
 */
export function normalizeBlocks(blocks: any[] | null | undefined): NormalizedBlock[] {
  if (!blocks || !Array.isArray(blocks)) {
    return []
  }

  return blocks
    .map((block) => {
      try {
        return normalizeBlock(block)
      } catch (error) {
        console.error('[normalizeBlocks] Error normalizing block:', error)
        return null
      }
    })
    .filter((block): block is NormalizedBlock => block !== null)
}

