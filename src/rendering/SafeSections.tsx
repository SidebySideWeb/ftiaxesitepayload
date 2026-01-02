/**
 * Safe Sections Renderer
 * 
 * Server component that safely renders CMS blocks with tenant isolation
 */

import { getRenderer, KNOWN_BLOCK_TYPES } from './registry'
import { UnknownSection } from './fallbacks'

interface SafeSectionsProps {
  sections: any[] | null | undefined
  tenantCode: string
  context?: {
    pageSlug?: string
    isHomepage?: boolean
  }
}

// Track logged warnings per request (dev only)
const loggedWarnings = new Set<string>()

function logWarningOnce(message: string, key: string) {
  if (process.env.NODE_ENV === 'development' && !loggedWarnings.has(key)) {
    console.warn(`[SafeSections] ${message}`)
    loggedWarnings.add(key)
  }
}

export default function SafeSections({
  sections,
  tenantCode,
  context,
}: SafeSectionsProps) {
  // Handle empty/null sections
  if (!sections || !Array.isArray(sections) || sections.length === 0) {
    return null
  }

  const renderedSections: React.ReactNode[] = []

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i]

    // Skip invalid sections
    if (!section || typeof section !== 'object') {
      logWarningOnce(
        `Skipping invalid section at index ${i}`,
        `invalid-section-${i}`,
      )
      continue
    }

    // Safely extract blockType
    const blockType = section.blockType || section.block_type || section.type

    if (!blockType || typeof blockType !== 'string') {
      logWarningOnce(
        `Skipping section at index ${i} - missing blockType`,
        `missing-blocktype-${i}`,
      )
      continue
    }

    // Check if block type is known
    if (!KNOWN_BLOCK_TYPES.has(blockType)) {
      logWarningOnce(
        `Unknown block type: ${blockType}`,
        `unknown-block-${blockType}`,
      )
      renderedSections.push(<UnknownSection key={`unknown-${i}`} blockType={blockType} />)
      continue
    }

    // Verify tenant prefix matches
    const expectedPrefix = `${tenantCode}.`
    if (!blockType.startsWith(expectedPrefix)) {
      logWarningOnce(
        `Block type "${blockType}" does not match tenant "${tenantCode}" - skipping`,
        `tenant-mismatch-${blockType}`,
      )
      continue
    }

    // Get renderer
    const Renderer = getRenderer(blockType)

    if (!Renderer) {
      logWarningOnce(
        `No renderer found for block type: ${blockType}`,
        `no-renderer-${blockType}`,
      )
      renderedSections.push(<UnknownSection key={`no-renderer-${i}`} blockType={blockType} />)
      continue
    }

    // Render with safe props
    try {
      renderedSections.push(
        <Renderer
          key={`section-${i}-${blockType}`}
          blockType={blockType}
          {...section}
          _context={context}
        />,
      )
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error(`[SafeSections] Error rendering ${blockType}:`, error)
      }
      // Continue rendering other sections
      continue
    }
  }

  if (renderedSections.length === 0) {
    return null
  }

  return <>{renderedSections}</>
}

