/**
 * Block Validation Utilities
 * 
 * Provides validation functions for block fields
 */

/**
 * Validates URL - must be http/https or internal (starts with /)
 * Rejects javascript:, data:, and other dangerous protocols
 */
export function validateUrl(value: string | null | undefined): true | string {
  if (!value || value.trim() === '') {
    return true // Empty is allowed (optional field)
  }

  const url = value.trim().toLowerCase()

  // Reject dangerous protocols
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:']
  for (const protocol of dangerousProtocols) {
    if (url.startsWith(protocol)) {
      return `Invalid URL: ${protocol} protocol is not allowed for security reasons`
    }
  }

  // Allow internal URLs (starting with /)
  if (url.startsWith('/')) {
    return true
  }

  // Allow http/https URLs
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return true
  }

  // If it doesn't start with / or http(s)://, suggest adding https://
  return 'URL must start with / (internal), http://, or https://'
}

/**
 * Validates text length with helpful error message
 */
export function validateMaxLength(
  maxLength: number,
  fieldName: string = 'Field',
): (value: string | null | undefined) => true | string {
  return (value: string | null | undefined) => {
    if (!value) {
      return true // Empty is allowed
    }

    if (value.length > maxLength) {
      return `${fieldName} must be ${maxLength} characters or less (currently ${value.length})`
    }

    return true
  }
}

/**
 * Validates that at least one item exists in array
 */
export function validateMinItems(
  minItems: number,
  fieldName: string = 'Field',
): (value: any[] | null | undefined) => true | string {
  return (value: any[] | null | undefined) => {
    if (!value || !Array.isArray(value)) {
      return `${fieldName} must have at least ${minItems} item(s)`
    }

    if (value.length < minItems) {
      return `${fieldName} must have at least ${minItems} item(s) (currently ${value.length})`
    }

    return true
  }
}

