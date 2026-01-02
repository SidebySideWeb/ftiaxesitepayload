import { getPayload } from 'payload'
import config from '@payload-config'
import SafeSections from '../../../rendering/SafeSections'
import { notFound } from 'next/navigation'

interface PageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ tenant?: string }>
}

/**
 * Dynamic page route
 * Fetches page by slug and renders sections
 */
export default async function PageRoute(props: PageProps) {
  const params = await props.params
  const searchParams = await props.searchParams
  const { slug } = params

  // Get tenant from query param or determine from domain
  // For now, using query param - in production, determine from request headers/domain
  const tenantCode = searchParams.tenant || 'kallitechnia'

  if (!slug) {
    notFound()
  }

  const payload = await getPayload({ config })

  try {
    // Find tenant by code
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
      notFound()
    }

    const tenant = tenantResult.docs[0]

    // Find page by slug and tenant
    const pageResult = await payload.find({
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
          {
            status: {
              equals: 'published',
            },
          },
        ],
      },
      limit: 1,
      depth: 2, // Populate relationships including media
    })

    if (pageResult.docs.length === 0) {
      notFound()
    }

    const page = pageResult.docs[0]

    // Safely extract sections
    const sections = page.sections || null

    return (
      <div>
        <h1>{page.title}</h1>
        <SafeSections
          sections={sections}
          tenantCode={tenantCode}
          context={{
            pageSlug: slug,
            isHomepage: false,
          }}
        />
      </div>
    )
  } catch (error) {
    console.error('[PageRoute] Error fetching page:', error)
    notFound()
  }
}

