/**
 * Block Guardrails Hooks
 * 
 * Provides validation hooks for structural guardrails
 */

import type { CollectionBeforeValidateHook, CollectionBeforeChangeHook } from 'payload'

/**
 * Validates that homepage has at least one hero block
 * Shows warning but doesn't hard fail
 */
export const homepageBlockGuardrails: CollectionBeforeValidateHook = async ({
  data,
  operation,
  req,
}) => {
  if (operation === 'create' || operation === 'update') {
    const sections = data?.sections

    if (!sections || !Array.isArray(sections) || sections.length === 0) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(
          '[Homepage Guardrails] Homepage has no sections. Consider adding at least one hero block.',
        )
      }
      // Don't fail, just warn
      return data
    }

    // Check if there's at least one hero block
    const hasHero = sections.some(
      (section: any) =>
        section?.blockType?.includes('.hero') || section?.blockType === 'hero',
    )

    if (!hasHero) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(
          '[Homepage Guardrails] Homepage has no hero block. Consider adding one for better UX.',
        )
      }
    }
  }

  return data
}

/**
 * Validates that pages have at least some content
 * Warns if sections are empty
 */
export const pageBlockGuardrails: CollectionBeforeValidateHook = async ({
  data,
  operation,
  req,
}) => {
  if (operation === 'create' || operation === 'update') {
    const sections = data?.sections

    if (!sections || !Array.isArray(sections) || sections.length === 0) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(
          '[Page Guardrails] Page has no sections. The page will be empty.',
        )
      }
    }
  }

  return data
}

/**
 * Normalizes blocks before save
 */
export const normalizeBlocksHook: CollectionBeforeChangeHook = async ({
  data,
  operation,
  req,
}) => {
  if (data?.sections && Array.isArray(data.sections)) {
    const { normalizeBlocks } = await import('../utils/blockNormalization')
    data.sections = normalizeBlocks(data.sections)
  }

  return data
}

