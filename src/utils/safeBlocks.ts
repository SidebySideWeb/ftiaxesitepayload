/**
 * Safe Block Filtering Utilities
 * 
 * Provides utilities to safely filter and validate blocks
 * to prevent frontend crashes from unknown or malformed block data.
 */

export interface BlockSection {
  blockType: string
  [key: string]: any
}

/**
 * Filters out unknown block types from sections array
 * 
 * @param sections - Array of block sections from Payload
 * @param allowedBlockTypes - Array of allowed block type slugs (e.g., ['kallitechnia.hero', 'kallitechnia.richText'])
 * @returns Filtered array containing only known block types
 */
export function filterUnknownBlocks(
  sections: BlockSection[] | null | undefined,
  allowedBlockTypes: string[],
): BlockSection[] {
  if (!sections || !Array.isArray(sections)) {
    return []
  }

  return sections.filter((section) => {
    if (!section || typeof section !== 'object' || !section.blockType) {
      return false
    }

    return allowedBlockTypes.includes(section.blockType)
  })
}

/**
 * Gets a safe value from a block field with optional default
 * 
 * @param block - Block section object
 * @param fieldName - Name of the field to retrieve
 * @param defaultValue - Default value if field is missing or invalid
 * @returns Field value or default
 */
export function getSafeBlockField<T>(
  block: BlockSection | null | undefined,
  fieldName: string,
  defaultValue: T,
): T {
  if (!block || typeof block !== 'object') {
    return defaultValue
  }

  const value = block[fieldName]

  // Handle undefined/null
  if (value === undefined || value === null) {
    return defaultValue
  }

  return value as T
}

/**
 * Validates that a block has the expected structure
 * 
 * @param block - Block section to validate
 * @param expectedBlockType - Expected block type slug
 * @returns True if block is valid, false otherwise
 */
export function isValidBlock(
  block: BlockSection | null | undefined,
  expectedBlockType?: string,
): boolean {
  if (!block || typeof block !== 'object') {
    return false
  }

  if (!block.blockType || typeof block.blockType !== 'string') {
    return false
  }

  if (expectedBlockType && block.blockType !== expectedBlockType) {
    return false
  }

  return true
}

