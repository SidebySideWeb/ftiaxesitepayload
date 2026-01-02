'use client'

import { safeText, safeUrl, safeMedia } from '../../../rendering/sanitize'
import { MissingImage } from '../../../rendering/fallbacks'
import { AnimateIn } from '../../../components/AnimateIn'
import type { BlockRendererProps } from '../../../rendering/registry'

export function KallitechniaHero({ blockType, ...props }: BlockRendererProps) {
  const title = safeText(props.title)
  const subtitle = safeText(props.subtitle)
  const ctaLabel = safeText(props.ctaLabel)
  const ctaUrl = safeUrl(props.ctaUrl)
  const backgroundImage = safeMedia(props.backgroundImage)
  const animate = props.animate || {}
  const shouldAnimate = animate.enabled !== false // Default to true if not specified

  const hasContent = title || subtitle || (ctaLabel && ctaUrl)

  if (!hasContent) {
    return null
  }

  const content = (
    <section
      style={{
        position: 'relative',
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        padding: '4rem 2rem',
        color: '#fff',
      }}
    >
      {/* Background Image or Gradient Fallback */}
      {backgroundImage?.url ? (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `url(${backgroundImage.url})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            zIndex: 0,
          }}
        />
      ) : (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background:
              'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            zIndex: 0,
          }}
        />
      )}

      {/* Overlay for text readability */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          zIndex: 1,
        }}
      />

      {/* Content */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          maxWidth: '800px',
          width: '100%',
        }}
      >
        {title && (
          <h1
            style={{
              fontSize: 'clamp(2rem, 5vw, 4rem)',
              fontWeight: 'bold',
              marginBottom: subtitle ? '1rem' : '2rem',
              lineHeight: 1.2,
            }}
          >
            {title}
          </h1>
        )}

        {subtitle && (
          <p
            style={{
              fontSize: 'clamp(1rem, 2vw, 1.25rem)',
              marginBottom: ctaLabel && ctaUrl ? '2rem' : 0,
              lineHeight: 1.6,
            }}
          >
            {subtitle}
          </p>
        )}

        {ctaLabel && ctaUrl && (
          <a
            href={ctaUrl}
            style={{
              display: 'inline-block',
              padding: '1rem 2rem',
              backgroundColor: '#fff',
              color: '#333',
              textDecoration: 'none',
              borderRadius: '0.5rem',
              fontWeight: '600',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            {ctaLabel}
          </a>
        )}
      </div>
    </section>
  )

  if (shouldAnimate) {
    return (
      <AnimateIn variant={animate.variant || 'fade'} delay={animate.delay || 0}>
        {content}
      </AnimateIn>
    )
  }

  return content
}

