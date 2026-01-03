/**
 * Block Hydration Utility
 * 
 * Recursively:
 * 1. Replaces image URLs in blocks with Media relationship IDs
 * 2. Converts text strings to Lexical format for richText fields
 * 3. Converts Slate format data to Lexical format
 * Generic implementation that works with any block structure.
 */

interface MediaMapping {
  [originalUrl: string]: number | string // Media ID
}

/**
 * Check if data is in Slate format
 */
function isSlateFormat(data: any): boolean {
  if (!data || typeof data !== 'object') return false
  // Slate format is an array of nodes
  if (Array.isArray(data) && data.length > 0) {
    const firstNode = data[0]
    // Slate nodes have 'type' and 'children' properties, but no 'root'
    return firstNode && typeof firstNode === 'object' && 'type' in firstNode && !('root' in firstNode)
  }
  return false
}

/**
 * Check if data is already in Lexical format
 */
function isLexicalFormat(data: any): boolean {
  return data && typeof data === 'object' && data.root && data.root.type === 'root'
}

/**
 * Convert Slate format to Lexical format
 */
function slateToLexical(slateData: any): any {
  // If already Lexical format, return as-is
  if (isLexicalFormat(slateData)) {
    return slateData
  }

  // If empty or invalid, return empty Lexical document with at least one paragraph
  if (!slateData || !Array.isArray(slateData)) {
    return createEmptyLexical()
  }

  // Convert Slate nodes to Lexical nodes
  const children: any[] = []

  for (const slateNode of slateData) {
    if (slateNode.type === 'paragraph') {
      const paragraph: any = {
        children: [],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'paragraph',
        version: 1,
      }

      // Convert text nodes
      if (slateNode.children && Array.isArray(slateNode.children)) {
        for (const child of slateNode.children) {
          if (child.text !== undefined) {
            const textNode: any = {
              detail: 0,
              format: 0,
              mode: 'normal',
              style: '',
              text: child.text || '',
              type: 'text',
              version: 1,
            }

            // Apply formatting
            if (child.bold) textNode.format |= 1 // BOLD
            if (child.italic) textNode.format |= 2 // ITALIC
            if (child.underline) textNode.format |= 4 // UNDERLINE
            if (child.strikethrough) textNode.format |= 8 // STRIKETHROUGH
            if (child.code) textNode.format |= 16 // CODE

            paragraph.children.push(textNode)
          }
        }
      }

      if (paragraph.children.length > 0) {
        children.push(paragraph)
      }
    } else if (slateNode.type === 'heading') {
      const heading: any = {
        children: [],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'heading',
        version: 1,
        tag: `h${slateNode.level || 1}`,
      }

      if (slateNode.children && Array.isArray(slateNode.children)) {
        for (const child of slateNode.children) {
          if (child.text !== undefined) {
            const textNode: any = {
              detail: 0,
              format: 0,
              mode: 'normal',
              style: '',
              text: child.text || '',
              type: 'text',
              version: 1,
            }

            if (child.bold) textNode.format |= 1
            if (child.italic) textNode.format |= 2

            heading.children.push(textNode)
          }
        }
      }

      if (heading.children.length > 0) {
        children.push(heading)
      }
    }
  }

  // Ensure at least one paragraph exists (Lexical requirement)
  if (children.length === 0) {
    children.push({
      children: [],
      direction: 'ltr',
      format: '',
      indent: 0,
      type: 'paragraph',
      version: 1,
    })
  }

  return {
    root: {
      children,
      direction: 'ltr',
      format: '',
      indent: 0,
      type: 'root',
      version: 1,
    },
  }
}

/**
 * Hydrate blocks by replacing image URLs with Media IDs and converting text to Lexical
 */
export function hydrateBlocks(blocks: any[], mediaMapping: MediaMapping): any[] {
  return blocks.map((block) => hydrateBlock(block, mediaMapping))
}

/**
 * Create an empty Lexical structure with at least one paragraph
 * Lexical requires at least one child node, so we always include an empty paragraph
 */
function createEmptyLexical(): any {
  return {
    root: {
      children: [
        {
          children: [],
          direction: 'ltr',
          format: '',
          indent: 0,
          type: 'paragraph',
          version: 1,
        },
      ],
      direction: 'ltr',
      format: '',
      indent: 0,
      type: 'root',
      version: 1,
    },
  }
}

/**
 * Convert a plain text string to Lexical format
 */
function textToLexical(text: string): any {
  if (!text || typeof text !== 'string' || text.trim() === '') {
    // Return empty Lexical structure with at least one paragraph
    return createEmptyLexical()
  }

  // Split by newlines to create multiple paragraphs
  const paragraphs = text.split('\n').filter((p) => p.trim() !== '')

  if (paragraphs.length === 0) {
    // Empty text - return empty Lexical structure with at least one paragraph
    return createEmptyLexical()
  }

  return {
    root: {
      children: paragraphs.map((paragraph) => ({
        children: [
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: paragraph.trim(),
            type: 'text',
            version: 1,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'paragraph',
        version: 1,
      })),
      direction: 'ltr',
      format: '',
      indent: 0,
      type: 'root',
      version: 1,
    },
  }
}

/**
 * Hydrate a single block recursively
 */
function hydrateBlock(block: any, mediaMapping: MediaMapping, isTopLevel: boolean = true): any {
  if (!block || typeof block !== 'object') {
    return block
  }

  // Create a copy to avoid mutating original
  const hydrated: any = { ...block }

  // Process all fields in the block
  for (const [key, value] of Object.entries(hydrated)) {
    if (isImageField(key, value)) {
      // Replace image URL with Media ID
      const mediaId = mediaMapping[value as string]
      if (mediaId) {
        hydrated[key] = mediaId
      } else {
        // URL not found in mapping - log warning but keep original
        console.warn(`  ⚠ Image URL not found in mapping: ${value}`)
      }
    } else if (isRichTextField(key, value, isTopLevel ? hydrated.blockType : undefined, !isTopLevel)) {
      // Check if it's Slate format and convert
      if (isSlateFormat(value)) {
        hydrated[key] = slateToLexical(value)
      } else if (typeof value === 'string' && value.trim() !== '') {
        // Convert text string to Lexical format
        hydrated[key] = textToLexical(value)
      } else if (isLexicalFormat(value)) {
        // Already in Lexical format, keep as-is
        hydrated[key] = value
      }
    } else if (Array.isArray(value)) {
      // Process arrays (e.g., images[], programs[], newsItems[])
      // Note: paragraphs is now a single richText field, handled by the block's beforeValidate hook
      if (key === 'paragraphs' && Array.isArray(value) && value.length > 0) {
        // If it's an array of strings, convert to single Lexical document with multiple paragraphs
        if (typeof value[0] === 'string') {
          const paragraphs = value.filter((p) => typeof p === 'string' && p.trim())
          if (paragraphs.length > 0) {
            hydrated[key] = {
              root: {
                children: paragraphs.map((text) => ({
                  children: [
                    {
                      detail: 0,
                      format: 0,
                      mode: 'normal',
                      style: '',
                      text: text.trim(),
                      type: 'text',
                      version: 1,
                    },
                  ],
                  direction: 'ltr',
                  format: '',
                  indent: 0,
                  type: 'paragraph',
                  version: 1,
                })),
                direction: 'ltr',
                format: '',
                indent: 0,
                type: 'root',
                version: 1,
              },
            }
          } else {
            hydrated[key] = createEmptyLexical()
          }
        } else {
          // Array of objects - let the block's hook handle it
          hydrated[key] = value
        }
      } else {
        hydrated[key] = value.map((item) => {
          if (typeof item === 'object' && item !== null) {
            // Nested items are not top-level blocks - pass isNested=true context
            return hydrateBlock(item, mediaMapping, false)
          }
          return item
        })
      }
    } else if (typeof value === 'object' && value !== null) {
      // Recursively process nested objects (not top-level blocks)
      hydrated[key] = hydrateBlock(value, mediaMapping, false)
    }
  }

  return hydrated
}

/**
 * Check if a field is a richText field that needs conversion
 */
function isRichTextField(key: string, value: any, blockType?: string, isNested: boolean = false): boolean {
  // RichText field names that should be converted from string to Lexical
  const richTextFieldNames = [
    'description',
    'paragraph', // For welcome block paragraphs array items
    'additionalInfo',
    'coachBio',
  ]

  // Blocks that have 'content' as richText (not textarea)
  const blocksWithRichTextContent = ['kallitechnia.richText', 'kallitechnia.imageText']

  // Check if key matches richText field pattern
  let isRichTextKey = richTextFieldNames.some((name) => {
    return key.toLowerCase() === name.toLowerCase() || key.toLowerCase().endsWith(name.toLowerCase())
  })

  // Special handling for 'content' field - only richText in specific blocks
  // IMPORTANT: Never convert 'content' in nested items (like contactInfo.items[].content)
  // because those are textarea fields, not richText
  if (key === 'content') {
    // Only convert if we're at top level AND the block type uses richText for content
    if (isNested) {
      // Never convert 'content' in nested items
      isRichTextKey = false
    } else {
      // Only convert if block type is known and uses richText
      isRichTextKey = blockType ? blocksWithRichTextContent.includes(blockType) : false
    }
  }

  // Value must be a string, array (Slate), or object (Lexical)
  if (!isRichTextKey) {
    return false
  }

  // If it's already Lexical format, don't convert
  if (isLexicalFormat(value)) {
    return false
  }

  // If it's Slate format, convert it
  if (isSlateFormat(value)) {
    return true
  }

  // If it's a string, convert it to Lexical
  if (typeof value === 'string' && value.trim() !== '') {
    return true
  }

  return false
}

/**
 * Check if a field is an image field that needs hydration
 */
function isImageField(key: string, value: any): boolean {
  // Common image field names
  const imageFieldNames = [
    'image',
    'backgroundImage',
    'logo',
    'icon',
    'thumbnail',
    'photo',
    'picture',
  ]

  // Check if key matches image field pattern
  const isImageKey = imageFieldNames.some((name) => {
    return key.toLowerCase() === name.toLowerCase() || key.toLowerCase().endsWith(name.toLowerCase())
  })

  // Value must be a string (URL)
  if (!isImageKey || typeof value !== 'string') {
    return false
  }

  // Must be a URL (http/https) or local path (/)
  return (
    value.startsWith('http://') ||
    value.startsWith('https://') ||
    value.startsWith('/')
  )
}

