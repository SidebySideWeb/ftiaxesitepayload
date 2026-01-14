/**
 * Al-Anastasiou Tenant Schema
 * 
 * Defines allowed blocks for this tenant
 */

export const tenantCode = 'al-anastasiou'

export const allowedBlocks = [
  'al-anastasiou.hero',
  'al-anastasiou.richText',
  'al-anastasiou.imageGallery',
  'al-anastasiou.cta',
  'al-anastasiou.genericSection',
] as const

export type AlAnastasiouBlockType = (typeof allowedBlocks)[number]
