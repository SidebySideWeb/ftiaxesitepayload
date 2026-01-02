/**
 * Kallitechnia Tenant Schema
 * 
 * Defines allowed blocks for this tenant
 */

export const tenantCode = 'kallitechnia'

export const allowedBlocks = [
  'kallitechnia.hero',
  'kallitechnia.richText',
  'kallitechnia.imageGallery',
  'kallitechnia.cta',
] as const

export type KallitechniaBlockType = (typeof allowedBlocks)[number]

