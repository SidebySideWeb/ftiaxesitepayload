/**
 * Block Normalization Tests
 */

import { describe, it, expect } from 'vitest'
import { normalizeBlock, normalizeBlocks } from '../blockNormalization'

describe('normalizeBlock', () => {
  it('normalizes hero block with defaults', () => {
    const block = {
      blockType: 'kallitechnia.hero',
    }

    const normalized = normalizeBlock(block)

    expect(normalized.blockType).toBe('kallitechnia.hero')
    expect(normalized.schemaVersion).toBe(1)
    expect(normalized.__deprecated).toBe(false)
    expect(normalized.title).toBe('')
    expect(normalized.subtitle).toBe('')
    expect(normalized.ctaLabel).toBe('')
    expect(normalized.ctaUrl).toBe('')
  })

  it('preserves existing values', () => {
    const block = {
      blockType: 'kallitechnia.hero',
      title: 'Test Title',
      schemaVersion: 1,
    }

    const normalized = normalizeBlock(block)

    expect(normalized.title).toBe('Test Title')
    expect(normalized.schemaVersion).toBe(1)
  })

  it('normalizes richText block with empty content', () => {
    const block = {
      blockType: 'kallitechnia.richText',
    }

    const normalized = normalizeBlock(block)

    expect(normalized.content).toBeDefined()
    expect(normalized.content.root).toBeDefined()
    expect(normalized.content.root.children).toEqual([])
  })

  it('normalizes imageGallery block with empty array', () => {
    const block = {
      blockType: 'kallitechnia.imageGallery',
    }

    const normalized = normalizeBlock(block)

    expect(Array.isArray(normalized.images)).toBe(true)
    expect(normalized.images).toEqual([])
  })

  it('throws error for invalid block', () => {
    expect(() => normalizeBlock(null as any)).toThrow()
    expect(() => normalizeBlock({} as any)).toThrow()
  })
})

describe('normalizeBlocks', () => {
  it('normalizes array of blocks', () => {
    const blocks = [
      { blockType: 'kallitechnia.hero' },
      { blockType: 'kallitechnia.richText' },
    ]

    const normalized = normalizeBlocks(blocks)

    expect(normalized.length).toBe(2)
    expect(normalized[0].blockType).toBe('kallitechnia.hero')
    expect(normalized[1].blockType).toBe('kallitechnia.richText')
  })

  it('handles null/undefined', () => {
    expect(normalizeBlocks(null)).toEqual([])
    expect(normalizeBlocks(undefined)).toEqual([])
  })

  it('filters out invalid blocks', () => {
    const blocks = [
      { blockType: 'kallitechnia.hero' },
      null,
      { blockType: 'kallitechnia.richText' },
      {},
    ]

    const normalized = normalizeBlocks(blocks)

    expect(normalized.length).toBe(2)
    expect(normalized[0].blockType).toBe('kallitechnia.hero')
    expect(normalized[1].blockType).toBe('kallitechnia.richText')
  })
})

