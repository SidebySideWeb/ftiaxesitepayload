/**
 * Block Presets
 * 
 * Provides pre-filled block objects with safe defaults
 */

export interface BlockPreset {
  blockType: string
  [key: string]: any
}

/**
 * Creates a preset block object with all required fields and defaults
 */
export function createBlockPreset(blockType: string): BlockPreset {
  const presets: Record<string, BlockPreset> = {
    'kallitechnia.hero': {
      blockType: 'kallitechnia.hero',
      title: '',
      subtitle: '',
      backgroundImage: null,
      ctaLabel: '',
      ctaUrl: '',
      __deprecated: false,
      schemaVersion: 1,
    },
    'kallitechnia.richText': {
      blockType: 'kallitechnia.richText',
      content: {
        root: {
          children: [],
          direction: 'ltr',
          format: '',
          indent: 0,
          type: 'root',
          version: 1,
        },
      },
      __deprecated: false,
      schemaVersion: 1,
    },
    'kallitechnia.imageGallery': {
      blockType: 'kallitechnia.imageGallery',
      images: [],
      __deprecated: false,
      schemaVersion: 1,
    },
    'kallitechnia.cta': {
      blockType: 'kallitechnia.cta',
      title: '',
      description: '',
      buttonLabel: '',
      buttonUrl: '',
      __deprecated: false,
      schemaVersion: 1,
    },
  }

  return presets[blockType] || { blockType, __deprecated: false, schemaVersion: 1 }
}

/**
 * Gets all available block presets for a tenant
 */
export function getTenantBlockPresets(tenantCode: string): BlockPreset[] {
  const knownTypes = [
    'kallitechnia.hero',
    'kallitechnia.richText',
    'kallitechnia.imageGallery',
    'kallitechnia.cta',
  ]

  return knownTypes
    .filter((type) => type.startsWith(`${tenantCode}.`))
    .map((type) => createBlockPreset(type))
}

