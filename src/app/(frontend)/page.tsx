import { getPayload } from 'payload'
import config from '@payload-config'
import SafeSections from '../../rendering/SafeSections'
import { notFound } from 'next/navigation'

interface HomePageProps {
  searchParams: Promise<{ tenant?: string }>
}

/**
 * Homepage route
 * Fetches homepage for tenant and renders sections
 */
export default async function HomePage(props: HomePageProps) {
  const searchParams = await props.searchParams

  // Get tenant from query param or determine from domain
  // For now, using query param - in production, determine from request headers/domain
  const tenantCode = searchParams.tenant || 'kallitechnia'

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

    // Find homepage for tenant
    const homepageResult = await payload.find({
      collection: 'homepages',
      where: {
        and: [
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

    if (homepageResult.docs.length === 0) {
      // Homepage doesn't exist yet - render empty state
      return (
        <main style={{ padding: '4rem', textAlign: 'center' }}>
          <h1>Welcome</h1>
          <p>Homepage content is being prepared.</p>
        </main>
      )
    }

    const homepage = homepageResult.docs[0]

    // Safely extract sections
    const sections = homepage.sections || null

    return (
      <main>
        <SafeSections
          sections={sections}
          tenantCode={tenantCode}
          context={{
            isHomepage: true,
          }}
        />
      </main>
    )
  } catch (error) {
    console.error('[HomePage] Error fetching homepage:', error)
    notFound()
  }
}
