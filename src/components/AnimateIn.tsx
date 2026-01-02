'use client'

import { useEffect, useRef, useState } from 'react'

export type AnimationVariant =
  | 'fade'
  | 'slideUp'
  | 'slideLeft'
  | 'slideRight'
  | 'scale'

interface AnimateInProps {
  children: React.ReactNode
  variant?: AnimationVariant
  delay?: number
  once?: boolean
  threshold?: number
  className?: string
}

const animationStyles: Record<AnimationVariant, { initial: string; animate: string }> = {
  fade: {
    initial: 'opacity-0',
    animate: 'opacity-100 transition-opacity duration-700 ease-out',
  },
  slideUp: {
    initial: 'opacity-0 translate-y-8',
    animate: 'opacity-100 translate-y-0 transition-all duration-700 ease-out',
  },
  slideLeft: {
    initial: 'opacity-0 translate-x-8',
    animate: 'opacity-100 translate-x-0 transition-all duration-700 ease-out',
  },
  slideRight: {
    initial: 'opacity-0 -translate-x-8',
    animate: 'opacity-100 translate-x-0 transition-all duration-700 ease-out',
  },
  scale: {
    initial: 'opacity-0 scale-95',
    animate: 'opacity-100 scale-100 transition-all duration-700 ease-out',
  },
}

export function AnimateIn({
  children,
  variant = 'fade',
  delay = 0,
  once = true,
  threshold = 0.15,
  className = '',
}: AnimateInProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [shouldAnimate, setShouldAnimate] = useState(true)
  const elementRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (prefersReducedMotion) {
      setShouldAnimate(false)
      setIsVisible(true)
      return
    }

    if (!elementRef.current) {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setTimeout(() => {
              setIsVisible(true)
            }, delay)

            if (once) {
              observer.disconnect()
            }
          } else if (!once) {
            setIsVisible(false)
          }
        })
      },
      {
        threshold,
        rootMargin: '0px',
      },
    )

    observer.observe(elementRef.current)

    return () => {
      observer.disconnect()
    }
  }, [delay, once, threshold])

  if (!shouldAnimate) {
    return <div className={className}>{children}</div>
  }

  const styles = animationStyles[variant]
  const currentClass = isVisible ? styles.animate : styles.initial

  return (
    <div ref={elementRef} className={`${currentClass} ${className}`}>
      {children}
    </div>
  )
}

