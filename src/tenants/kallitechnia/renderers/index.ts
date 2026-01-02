/**
 * Kallitechnia Tenant Renderers
 * 
 * Exports all renderer components for kallitechnia blocks
 */

import { KallitechniaHero } from './hero'
import { KallitechniaRichText } from './richText'
import { KallitechniaImageGallery } from './imageGallery'
import { KallitechniaCta } from './cta'

export const kallitechniaRenderers = {
  'kallitechnia.hero': KallitechniaHero,
  'kallitechnia.richText': KallitechniaRichText,
  'kallitechnia.imageGallery': KallitechniaImageGallery,
  'kallitechnia.cta': KallitechniaCta,
}

