'use client'

import { useEffect, useState } from 'react'

export type Breakpoint = 'mobile' | 'tablet' | 'desktop'

interface BreakpointState {
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  breakpoint: Breakpoint
}

const MOBILE_MAX = 767
const TABLET_MAX = 1023

function getBreakpoint(): BreakpointState {
  if (typeof window === 'undefined') {
    // SSR default
    return {
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      breakpoint: 'desktop',
    }
  }

  const width = window.innerWidth

  if (width <= MOBILE_MAX) {
    return {
      isMobile: true,
      isTablet: false,
      isDesktop: false,
      breakpoint: 'mobile',
    }
  }

  if (width <= TABLET_MAX) {
    return {
      isMobile: false,
      isTablet: true,
      isDesktop: false,
      breakpoint: 'tablet',
    }
  }

  return {
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    breakpoint: 'desktop',
  }
}

/**
 * Hook to detect current breakpoint
 * Returns: { isMobile, isTablet, isDesktop, breakpoint }
 */
export function useBreakpoint(): BreakpointState {
  const [breakpoint, setBreakpoint] = useState<BreakpointState>(getBreakpoint)

  useEffect(() => {
    // Set initial breakpoint
    setBreakpoint(getBreakpoint())

    // Create media query listeners
    const mobileQuery = window.matchMedia(`(max-width: ${MOBILE_MAX}px)`)
    const tabletQuery = window.matchMedia(
      `(min-width: ${MOBILE_MAX + 1}px) and (max-width: ${TABLET_MAX}px)`,
    )
    const desktopQuery = window.matchMedia(`(min-width: ${TABLET_MAX + 1}px)`)

    function handleChange() {
      setBreakpoint(getBreakpoint())
    }

    // Use modern addEventListener if available
    if (mobileQuery.addEventListener) {
      mobileQuery.addEventListener('change', handleChange)
      tabletQuery.addEventListener('change', handleChange)
      desktopQuery.addEventListener('change', handleChange)
    } else {
      // Fallback for older browsers
      mobileQuery.addListener(handleChange)
      tabletQuery.addListener(handleChange)
      desktopQuery.addListener(handleChange)
    }

    // Also listen to window resize as fallback
    window.addEventListener('resize', handleChange)

    return () => {
      if (mobileQuery.removeEventListener) {
        mobileQuery.removeEventListener('change', handleChange)
        tabletQuery.removeEventListener('change', handleChange)
        desktopQuery.removeEventListener('change', handleChange)
      } else {
        mobileQuery.removeListener(handleChange)
        tabletQuery.removeListener(handleChange)
        desktopQuery.removeListener(handleChange)
      }
      window.removeEventListener('resize', handleChange)
    }
  }, [])

  return breakpoint
}

