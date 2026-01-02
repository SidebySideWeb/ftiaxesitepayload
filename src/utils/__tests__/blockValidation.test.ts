/**
 * Block Validation Tests
 */

import { describe, it, expect } from 'vitest'
import { validateUrl, validateMaxLength, validateMinItems } from '../blockValidation'

describe('validateUrl', () => {
  it('allows empty values', () => {
    expect(validateUrl('')).toBe(true)
    expect(validateUrl(null)).toBe(true)
    expect(validateUrl(undefined)).toBe(true)
  })

  it('allows internal URLs', () => {
    expect(validateUrl('/about')).toBe(true)
    expect(validateUrl('/contact')).toBe(true)
  })

  it('allows http URLs', () => {
    expect(validateUrl('http://example.com')).toBe(true)
  })

  it('allows https URLs', () => {
    expect(validateUrl('https://example.com')).toBe(true)
  })

  it('rejects javascript: protocol', () => {
    const result = validateUrl('javascript:alert(1)')
    expect(result).not.toBe(true)
    expect(typeof result).toBe('string')
  })

  it('rejects data: protocol', () => {
    const result = validateUrl('data:text/html,<script>alert(1)</script>')
    expect(result).not.toBe(true)
    expect(typeof result).toBe('string')
  })

  it('rejects vbscript: protocol', () => {
    const result = validateUrl('vbscript:msgbox(1)')
    expect(result).not.toBe(true)
  })
})

describe('validateMaxLength', () => {
  it('allows empty values', () => {
    const validator = validateMaxLength(10, 'Field')
    expect(validator('')).toBe(true)
    expect(validator(null)).toBe(true)
    expect(validator(undefined)).toBe(true)
  })

  it('allows values within limit', () => {
    const validator = validateMaxLength(10, 'Field')
    expect(validator('hello')).toBe(true)
    expect(validator('1234567890')).toBe(true)
  })

  it('rejects values exceeding limit', () => {
    const validator = validateMaxLength(10, 'Field')
    const result = validator('12345678901')
    expect(result).not.toBe(true)
    expect(typeof result).toBe('string')
    expect(result).toContain('10')
  })
})

describe('validateMinItems', () => {
  it('rejects empty arrays', () => {
    const validator = validateMinItems(1, 'Field')
    expect(validator([])).not.toBe(true)
    expect(validator(null)).not.toBe(true)
    expect(validator(undefined)).not.toBe(true)
  })

  it('allows arrays with enough items', () => {
    const validator = validateMinItems(2, 'Field')
    expect(validator([1, 2])).toBe(true)
    expect(validator([1, 2, 3])).toBe(true)
  })

  it('rejects arrays with too few items', () => {
    const validator = validateMinItems(2, 'Field')
    const result = validator([1])
    expect(result).not.toBe(true)
    expect(typeof result).toBe('string')
    expect(result).toContain('2')
  })
})

