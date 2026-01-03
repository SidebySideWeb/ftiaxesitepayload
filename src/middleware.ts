import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Only apply CORS to API routes
  if (request.nextUrl.pathname.startsWith('/api')) {
    // Get the origin from the request
    const origin = request.headers.get('origin')
    
    // List of allowed origins (add your frontend domains here)
    // Can also be configured via environment variable CORS_ORIGINS (comma-separated)
    const envOrigins = process.env.CORS_ORIGINS?.split(',').map(o => o.trim()).filter(Boolean) || []
    const allowedOrigins = [
      'https://www.kallitechnia.gr',
      'https://kallitechnia.gr',
      'http://localhost:3000',
      'http://localhost:3001',
      ...envOrigins,
      // Add other frontend domains as needed
    ]
    
    // Check if origin is allowed (or if it's a same-origin request)
    const isAllowedOrigin = 
      !origin || // Same-origin request (no origin header)
      allowedOrigins.includes(origin) ||
      origin.includes('localhost') // Allow localhost for development
    
    // Handle preflight OPTIONS request
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': isAllowedOrigin ? origin || '*' : allowedOrigins[0],
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
          'Access-Control-Max-Age': '86400', // 24 hours
        },
      })
    }
    
    // For actual requests, add CORS headers
    const response = NextResponse.next()
    
    if (isAllowedOrigin) {
      response.headers.set('Access-Control-Allow-Origin', origin || '*')
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
      response.headers.set('Access-Control-Allow-Credentials', 'true')
    }
    
    return response
  }
  
  // For non-API routes, just pass through
  return NextResponse.next()
}

export const config = {
  matcher: '/api/:path*',
}
