import { getPayload } from 'payload'
import config from '@payload-config'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

/**
 * Preview Route
 * 
 * Allows previewing draft content when user is authenticated
 * 
 * Usage:
 * /preview?tenant=kallitechnia&slug=about&collection=pages
 * /preview?tenant=kallitechnia&collection=homepages
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const tenantCode = searchParams.get('tenant')
  const slug = searchParams.get('slug')
  const collection = searchParams.get('collection') || 'pages'

  if (!tenantCode) {
    return NextResponse.json({ error: 'tenant parameter is required' }, { status: 400 })
  }

  // Check if user is authenticated (basic check via cookie)
  const cookieStore = await cookies()
  const token = cookieStore.get('payload-token')

  if (!token) {
    return NextResponse.json(
      { error: 'Authentication required for preview' },
      { status: 401 },
    )
  }

  const payload = await getPayload({ config })

  try {
    // Find tenant
    const tenantResult = await payload.find({
      collection: 'tenants',
      where: {
        code: {
          equals: tenantCode,
        },
      },
      limit: 1,
      depth: 0,
    })

    if (tenantResult.docs.length === 0) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    const tenant = tenantResult.docs[0]

    // Fetch content (including drafts)
    let content

    if (collection === 'homepages') {
      const result = await payload.find({
        collection: 'homepages',
        where: {
          tenant: {
            equals: tenant.id,
          },
        },
        limit: 1,
        depth: 2,
        draft: true, // Include drafts
      })

      content = result.docs[0] || null
    } else if (collection === 'pages' && slug) {
      const result = await payload.find({
        collection: 'pages',
        where: {
          and: [
            {
              slug: {
                equals: slug,
              },
            },
            {
              tenant: {
                equals: tenant.id,
              },
            },
          ],
        },
        limit: 1,
        depth: 2,
        draft: true, // Include drafts
      })

      content = result.docs[0] || null
    } else {
      return NextResponse.json(
        { error: 'Invalid collection or missing slug' },
        { status: 400 },
      )
    }

    if (!content) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 })
    }

    // Return content with preview flag
    return NextResponse.json({
      ...content,
      _preview: true,
    })
  } catch (error) {
    console.error('[Preview] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

