/**
 * Safe Data Sanitization Utilities
 * 
 * Provides safe data extraction with fallbacks to prevent frontend crashes
 */

/**
 * Safely extract text value with fallback
 */
export function safeText(
  value: unknown,
  fallback: string = '',
): string {
  if (value === null || value === undefined) {
    return fallback
  }

  if (typeof value === 'string') {
    return value.trim()
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }

  return fallback
}

/**
 * Safely extract and validate URL
 * Rejects javascript:, data:, and other dangerous protocols
 */
export function safeUrl(
  value: unknown,
  fallback: string = '',
): string {
  const url = safeText(value, fallback)

  if (!url || url === fallback) {
    return fallback
  }

  // Reject dangerous protocols
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:']
  const lowerUrl = url.toLowerCase().trim()

  for (const protocol of dangerousProtocols) {
    if (lowerUrl.startsWith(protocol)) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`[SafeUrl] Rejected dangerous URL: ${url}`)
      }
      return fallback
    }
  }

  // If it doesn't start with http:// or https://, prepend https://
  if (!lowerUrl.startsWith('http://') && !lowerUrl.startsWith('https://')) {
    // Relative URLs are allowed
    if (lowerUrl.startsWith('/') || lowerUrl.startsWith('#')) {
      return url
    }
    // Otherwise, treat as external URL and prepend https://
    return `https://${url}`
  }

  return url
}

/**
 * Safely extract array value
 */
export function safeArray<T = unknown>(
  value: unknown,
  fallback: T[] = [],
): T[] {
  if (Array.isArray(value)) {
    return value
  }

  return fallback
}

/**
 * Safely normalize media field
 * Handles both ID strings and full media objects
 */
export interface SafeMedia {
  id: string
  url?: string
  alt?: string
  width?: number
  height?: number
}

export function safeMedia(
  value: unknown,
  fallback: SafeMedia | null = null,
): SafeMedia | null {
  if (!value) {
    return fallback
  }

  // If it's already a string ID
  if (typeof value === 'string') {
    return {
      id: value,
    }
  }

  // If it's an object
  if (typeof value === 'object' && value !== null) {
    const media = value as Record<string, unknown>

    // Handle Payload media object structure
    const id = safeText(media.id || media._id || media._ref, '')
    if (!id) {
      return fallback
    }

    return {
      id,
      url: safeText(media.url || media.filename, undefined),
      alt: safeText(media.alt, undefined),
      width: typeof media.width === 'number' ? media.width : undefined,
      height: typeof media.height === 'number' ? media.height : undefined,
    }
  }

  return fallback
}

/**
 * Safely extract rich text (Lexical) content
 * Returns empty lexical document structure if invalid
 */
export function safeRichText(
  value: unknown,
): any {
  // Empty Lexical document structure
  const emptyDoc = {
    root: {
      children: [],
      direction: 'ltr',
      format: '',
      indent: 0,
      type: 'root',
      version: 1,
    },
  }

  if (!value) {
    return emptyDoc
  }

  // If it's already a valid object with root property
  if (
    typeof value === 'object' &&
    value !== null &&
    'root' in value &&
    typeof (value as any).root === 'object'
  ) {
    return value
  }

  // If it's an array (legacy format), convert to Lexical format
  if (Array.isArray(value)) {
    return {
      root: {
        children: value,
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'root',
        version: 1,
      },
    }
  }

  return emptyDoc
}

