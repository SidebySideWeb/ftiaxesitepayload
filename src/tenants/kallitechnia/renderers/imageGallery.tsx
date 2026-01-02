'use client'

import { safeArray, safeMedia } from '../../../rendering/sanitize'
import { MissingImage } from '../../../rendering/fallbacks'
import { useBreakpoint } from '../../../hooks/useBreakpoint'
import { AnimateIn } from '../../../components/AnimateIn'
import type { BlockRendererProps } from '../../../rendering/registry'

export function KallitechniaImageGallery({ blockType, ...props }: BlockRendererProps) {
  const images = safeArray(props.images, [])
  const animate = props.animate || {}
  const shouldAnimate = animate.enabled !== false
  const { isMobile, isTablet, isDesktop } = useBreakpoint()

  if (!images || images.length === 0) {
    return null
  }

  // Filter out invalid images
  const validImages = images
    .map((item: any) => {
      const image = safeMedia(item?.image || item)
      const caption = item?.caption || ''
      return image ? { image, caption } : null
    })
    .filter(Boolean)

  if (validImages.length === 0) {
    return null
  }

  // Determine columns based on breakpoint
  const columns = isMobile ? 1 : isTablet ? 2 : 3

  const gallery = (
    <section
      style={{
        padding: '2rem 1rem',
        maxWidth: '1200px',
        margin: '0 auto',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gap: '1rem',
        }}
      >
        {validImages.map((item: any, index: number) => {
          const { image, caption } = item

          const imageElement = image?.url ? (
            <img
              src={image.url}
              alt={caption || image.alt || 'Gallery image'}
              style={{
                width: '100%',
                height: 'auto',
                display: 'block',
                borderRadius: '0.5rem',
              }}
              loading="lazy"
            />
          ) : (
            <MissingImage alt={caption || 'Gallery image'} />
          )

          return (
            <div
              key={image?.id || index}
              style={{
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {imageElement}
              {caption && (
                <p
                  style={{
                    marginTop: '0.5rem',
                    fontSize: '0.875rem',
                    color: '#666',
                    textAlign: 'center',
                  }}
                >
                  {caption}
                </p>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )

  if (shouldAnimate) {
    return (
      <AnimateIn variant={animate.variant || 'fade'} delay={animate.delay || 0}>
        {gallery}
      </AnimateIn>
    )
  }

  return gallery
}

