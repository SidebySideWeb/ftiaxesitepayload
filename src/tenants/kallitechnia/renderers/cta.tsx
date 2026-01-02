'use client'

import { safeText, safeUrl } from '../../../rendering/sanitize'
import { AnimateIn } from '../../../components/AnimateIn'
import type { BlockRendererProps } from '../../../rendering/registry'

export function KallitechniaCta({ blockType, ...props }: BlockRendererProps) {
  const title = safeText(props.title)
  const description = safeText(props.description)
  const buttonLabel = safeText(props.buttonLabel)
  const buttonUrl = safeUrl(props.buttonUrl)
  const animate = props.animate || {}
  const shouldAnimate = animate.enabled !== false

  const hasContent = title || description || buttonLabel

  if (!hasContent) {
    return null
  }

  const cta = (
    <section
      style={{
        padding: '4rem 2rem',
        backgroundColor: '#f9fafb',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          maxWidth: '600px',
          margin: '0 auto',
        }}
      >
        {title && (
          <h2
            style={{
              fontSize: 'clamp(1.5rem, 3vw, 2.5rem)',
              fontWeight: 'bold',
              marginBottom: description ? '1rem' : '2rem',
            }}
          >
            {title}
          </h2>
        )}

        {description && (
          <p
            style={{
              fontSize: '1.125rem',
              color: '#666',
              marginBottom: buttonLabel ? '2rem' : 0,
              lineHeight: 1.6,
            }}
          >
            {description}
          </p>
        )}

        {buttonLabel && (
          buttonUrl ? (
            <a
              href={buttonUrl}
              style={{
                display: 'inline-block',
                padding: '1rem 2.5rem',
                backgroundColor: '#667eea',
                color: '#fff',
                textDecoration: 'none',
                borderRadius: '0.5rem',
                fontWeight: '600',
                fontSize: '1.125rem',
                transition: 'background-color 0.2s, transform 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#5568d3'
                e.currentTarget.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#667eea'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              {buttonLabel}
            </a>
          ) : (
            <button
              disabled
              style={{
                padding: '1rem 2.5rem',
                backgroundColor: '#d1d5db',
                color: '#6b7280',
                border: 'none',
                borderRadius: '0.5rem',
                fontWeight: '600',
                fontSize: '1.125rem',
                cursor: 'not-allowed',
              }}
            >
              {buttonLabel}
            </button>
          )
        )}
      </div>
    </section>
  )

  if (shouldAnimate) {
    return (
      <AnimateIn variant={animate.variant || 'fade'} delay={animate.delay || 0}>
        {cta}
      </AnimateIn>
    )
  }

  return cta
}

