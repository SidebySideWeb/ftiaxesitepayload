'use client'

import React from 'react'
import { safeRichText, safeText } from '../../../rendering/sanitize'
import { EmptyRichText } from '../../../rendering/fallbacks'
import { AnimateIn } from '../../../components/AnimateIn'
import type { BlockRendererProps } from '../../../rendering/registry'

/**
 * Simple Lexical Rich Text Renderer
 * 
 * Note: For production, you may want to use @payloadcms/richtext-lexical's renderer
 * This is a basic implementation that handles common cases safely
 */
function renderLexicalNode(node: any): React.ReactNode {
  if (!node || typeof node !== 'object') {
    return null
  }

  const { type, children, text, format, ...rest } = node

  // Text node
  if (type === 'text' || text !== undefined) {
    const textContent = safeText(text || node.text || '')
    if (!textContent) {
      return null
    }

    let element: React.ReactNode = textContent

    // Apply formatting
    if (format) {
      if (format & 1) {
        // Bold
        element = <strong>{element}</strong>
      }
      if (format & 2) {
        // Italic
        element = <em>{element}</em>
      }
      if (format & 4) {
        // Strikethrough
        element = <del>{element}</del>
      }
      if (format & 8) {
        // Underline
        element = <u>{element}</u>
      }
      if (format & 16) {
        // Code
        element = <code>{element}</code>
      }
    }

    return element
  }

  // Element nodes
  if (children && Array.isArray(children)) {
    const childElements = children
      .map((child, index) => (
        <React.Fragment key={index}>{renderLexicalNode(child)}</React.Fragment>
      ))
      .filter(Boolean)

    if (childElements.length === 0) {
      return null
    }

    switch (type) {
      case 'paragraph':
        return <p style={{ marginBottom: '1rem' }}>{childElements}</p>
      case 'heading':
        const level = rest.tag || rest.level || 1
        const HeadingTag = `h${Math.min(Math.max(level, 1), 6)}` as keyof React.JSX.IntrinsicElements
        return (
          <HeadingTag style={{ marginBottom: '0.5rem', marginTop: '1.5rem' }}>
            {childElements}
          </HeadingTag>
        )
      case 'list':
        const ListTag = rest.listType === 'number' ? 'ol' : 'ul'
        return (
          <ListTag style={{ marginBottom: '1rem', paddingLeft: '1.5rem' }}>
            {childElements}
          </ListTag>
        )
      case 'listitem':
        return <li>{childElements}</li>
      case 'link':
        const url = safeText(rest.url || rest.href)
        if (url) {
          return <a href={url}>{childElements}</a>
        }
        return <>{childElements}</>
      default:
        return <div>{childElements}</div>
    }
  }

  return null
}

export function KallitechniaRichText({ blockType, ...props }: BlockRendererProps) {
  const content = safeRichText(props.content)
  const animate = props.animate || {}
  const shouldAnimate = animate.enabled !== false

  // Check if content is empty
  if (
    !content ||
    !content.root ||
    !content.root.children ||
    content.root.children.length === 0
  ) {
    return <EmptyRichText />
  }

  const renderedContent = content.root.children
    .map((node: any, index: number) => (
      <React.Fragment key={index}>{renderLexicalNode(node)}</React.Fragment>
    ))
    .filter(Boolean)

  if (renderedContent.length === 0) {
    return <EmptyRichText />
  }

  const contentElement = (
    <div
      style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: '2rem 1rem',
        lineHeight: 1.7,
      }}
    >
      {renderedContent}
    </div>
  )

  if (shouldAnimate) {
    return (
      <AnimateIn variant={animate.variant || 'fade'} delay={animate.delay || 0}>
        {contentElement}
      </AnimateIn>
    )
  }

  return contentElement
}

