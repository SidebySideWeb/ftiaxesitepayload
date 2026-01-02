#!/usr/bin/env node
/**
 * Sync Site Script
 * 
 * Imports a sync pack into Payload CMS.
 * Reads from src/sync-pack/<tenant>/ and creates/updates:
 * - Tenant
 * - Navigation Menu
 * - Header
 * - Footer
 * - Homepage
 * - Pages
 */

import { config as dotenvConfig } from 'dotenv'
import { parseArgs } from 'node:util'
import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'
import { existsSync } from 'node:fs'

// Load environment variables BEFORE importing config
// This ensures .env.local is loaded before @payload-config imports 'dotenv/config'
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '../..')
const envPath = path.join(projectRoot, '.env')
const envLocalPath = path.join(projectRoot, '.env.local')

// Load .env first, then .env.local (so .env.local overrides)
if (existsSync(envPath)) {
  dotenvConfig({ path: envPath })
}
if (existsSync(envLocalPath)) {
  dotenvConfig({ path: envLocalPath, override: true })
}

// Import getPayload (doesn't need config yet)
import { getPayload } from 'payload'
import { MediaHydrator } from './hydrateMedia'
import { hydrateBlocks } from './hydrateBlocks'

interface SyncPack {
  site: {
    tenant: string
    projectName: string
    domains: string[]
  }
  header: {
    logo?: string
    logoAlt?: string
    navigationMenu?: Array<{ href: string; label: string }>
  }
  footer: {
    copyrightText?: string
    socialLinks?: Array<{ platform: string; url: string }>
    footerMenus?: any[]
  }
  menu: {
    menuTitle: string
    items: Array<{ href: string; label: string }>
  }
  pages: Map<string, {
    title: string
    slug: string
    seo?: {
      title?: string
      description?: string
    }
    blocks: any[]
  }>
}

class SiteSyncer {
  private tenantCode: string
  private syncPackPath: string
  private payload: Awaited<ReturnType<typeof getPayload>>

  constructor(tenantCode: string, payload: Awaited<ReturnType<typeof getPayload>>) {
    this.tenantCode = tenantCode
    this.syncPackPath = path.resolve(__dirname, `../sync-pack/${tenantCode}`)
    this.payload = payload
  }

  async sync(): Promise<void> {
    console.log(`🔄 Syncing site for tenant: ${this.tenantCode}`)
    console.log(`   Sync pack path: ${this.syncPackPath}`)

    // Load sync pack
    const syncPack = await this.loadSyncPack()

    // Sync in order (dependencies first)
    const tenant = await this.syncTenant(syncPack.site)
    const navMenu = await this.syncNavigationMenu(syncPack.menu, tenant.id)
    const navMenuId = 'id' in navMenu ? navMenu.id : (navMenu as any).docs?.[0]?.id || (navMenu as any).id
    await this.syncHeader(syncPack.header, tenant.id, navMenuId)
    await this.syncFooter(syncPack.footer, tenant.id)
    
    // Hydrate media before syncing pages
    const mediaMapping = await this.hydrateMedia(tenant.id)
    
    // Sync pages (need tenant ID and media mapping)
    const pages = await this.syncPages(syncPack.pages, tenant.id, mediaMapping)
    
    // Sync homepage (needs tenant ID and media mapping)
    const homePage = syncPack.pages.get('home')
    if (homePage) {
      await this.syncHomepage(homePage, tenant.id, mediaMapping)
    }

    console.log(`\n✅ Sync complete!`)
    console.log(`   Tenant: ${tenant.id}`)
    console.log(`   Navigation Menu: ${navMenu.id}`)
    console.log(`   Pages: ${pages.length}`)
  }

  private async loadSyncPack(): Promise<SyncPack> {
    const sitePath = path.join(this.syncPackPath, 'site.json')
    const headerPath = path.join(this.syncPackPath, 'header.json')
    const footerPath = path.join(this.syncPackPath, 'footer.json')
    const menuPath = path.join(this.syncPackPath, 'menu.json')
    const pagesDir = path.join(this.syncPackPath, 'pages')

    const [site, header, footer, menu] = await Promise.all([
      fs.readFile(sitePath, 'utf-8').then(JSON.parse),
      fs.readFile(headerPath, 'utf-8').then(JSON.parse).catch(() => ({})),
      fs.readFile(footerPath, 'utf-8').then(JSON.parse).catch(() => ({})),
      fs.readFile(menuPath, 'utf-8').then(JSON.parse).catch(() => ({ menuTitle: 'Main Navigation', items: [] })),
    ])

    // Load all pages
    const pages = new Map<string, any>()
    try {
      const pageFiles = await fs.readdir(pagesDir)
      for (const file of pageFiles) {
        if (file.endsWith('.json')) {
          const pagePath = path.join(pagesDir, file)
          const pageData = JSON.parse(await fs.readFile(pagePath, 'utf-8'))
          const slug = file.replace('.json', '')
          pages.set(slug, pageData)
        }
      }
    } catch (error) {
      console.warn(`⚠ Could not load pages: ${error}`)
    }

    return { site, header, footer, menu, pages }
  }

  private async syncTenant(siteData: SyncPack['site']) {
    // Find existing tenant
    const existing = await this.payload.find({
      collection: 'tenants',
      where: { code: { equals: this.tenantCode } },
      limit: 1,
    })

    const tenantData = {
      name: siteData.projectName,
      code: siteData.tenant,
      domains: siteData.domains.map((domain) => ({
        domain,
        status: 'active' as const,
      })),
    }

    if (existing.docs.length > 0) {
      const tenant = existing.docs[0]
      console.log(`✓ Updating tenant: ${tenant.id}`)
      return await this.payload.update({
        collection: 'tenants',
        id: tenant.id,
        data: tenantData,
      })
    } else {
      console.log(`✓ Creating tenant: ${this.tenantCode}`)
      return await this.payload.create({
        collection: 'tenants',
        data: tenantData,
      })
    }
  }

  private async syncNavigationMenu(menuData: SyncPack['menu'], tenantId: number | string) {
    // Find existing menu for tenant
    const existing = await this.payload.find({
      collection: 'navigation-menus',
      where: {
        and: [
          { tenant: { equals: tenantId } },
          { title: { equals: menuData.menuTitle } },
        ],
      },
      limit: 1,
    })

    // Convert menu items to CMS format
    // For internal links, we need to find the page by slug
    const items = await Promise.all(
      (menuData.items || []).map(async (item) => {
        const isInternal = item.href.startsWith('/')
        const itemData: any = {
          label: item.label,
          type: isInternal ? ('internal' as const) : ('external' as const),
          openInNewTab: false,
        }

        if (isInternal) {
          // Extract slug from href (e.g., "/about" -> "about", "/" -> "home")
          const slug = item.href === '/' ? 'home' : item.href.slice(1)
          
          // Find page by slug
          const pageResult = await this.payload.find({
            collection: 'pages',
            where: {
              and: [
                { tenant: { equals: tenantId } },
                { slug: { equals: slug } },
              ],
            },
            limit: 1,
          })

          if (pageResult.docs.length > 0) {
            itemData.page = pageResult.docs[0].id
          } else {
            // If page not found, check if it's homepage
            if (slug === 'home') {
              const homepageResult = await this.payload.find({
                collection: 'homepages',
                where: { tenant: { equals: tenantId } },
                limit: 1,
              })
              // Homepage can't be linked directly, so use external URL
              itemData.type = 'external'
              itemData.url = item.href
            } else {
              // Page not found, use external URL as fallback
              console.warn(`  ⚠ Page not found for slug "${slug}", using URL fallback`)
              itemData.type = 'external'
              itemData.url = item.href
            }
          }
        } else {
          itemData.url = item.href
        }

        return itemData
      })
    )

    const menuPayload = {
      tenant: typeof tenantId === 'number' ? tenantId : parseInt(String(tenantId), 10),
      title: menuData.menuTitle,
      items,
    }

    if (existing.docs.length > 0) {
      const menu = existing.docs[0]
      console.log(`✓ Updating navigation menu: ${menu.id}`)
      await this.payload.update({
        collection: 'navigation-menus',
        id: menu.id,
        data: menuPayload,
        overrideAccess: true,
      })
      return menu
    } else {
      console.log(`✓ Creating navigation menu: ${menuData.menuTitle}`)
      const menuResult = await this.payload.create({
        collection: 'navigation-menus',
        data: menuPayload,
      })
      return ('id' in menuResult ? menuResult : (menuResult as any).docs?.[0] || menuResult) as any
    }
  }

  private async syncHeader(headerData: SyncPack['header'], tenantId: number | string, navMenuId: number | string) {
    // Find existing header for tenant
    const existing = await this.payload.find({
      collection: 'headers',
      where: { tenant: { equals: tenantId } },
      limit: 1,
    })

    const headerPayload: any = {
      tenant: typeof tenantId === 'number' ? tenantId : parseInt(String(tenantId), 10),
      navigationMenu: typeof navMenuId === 'number' ? navMenuId : parseInt(String(navMenuId), 10),
      enableTopBar: false,
    }

    // Handle logo (for now, just store URL - CMS can upload later)
    // TODO: Upload logo to media collection if URL provided
    if (headerData.logo) {
      // Store logo URL in a custom field or skip for now
      // Logo upload would require downloading and uploading to media collection
      console.log(`  ℹ Logo URL found: ${headerData.logo} (manual upload required)`)
    }

    if (existing.docs.length > 0) {
      const header = existing.docs[0]
      console.log(`✓ Updating header: ${header.id}`)
      return await this.payload.update({
        collection: 'headers',
        id: header.id,
        data: headerPayload,
      })
    } else {
      console.log(`✓ Creating header`)
      return await this.payload.create({
        collection: 'headers',
        data: headerPayload,
      })
    }
  }

  private async syncFooter(footerData: SyncPack['footer'], tenantId: number | string) {
    // Find existing footer for tenant
    const existing = await this.payload.find({
      collection: 'footers',
      where: { tenant: { equals: tenantId } },
      limit: 1,
    })

    const footerPayload = {
      tenant: typeof tenantId === 'number' ? tenantId : parseInt(String(tenantId), 10),
      copyrightText: footerData.copyrightText || '',
      socialLinks: (footerData.socialLinks || []).map((link) => ({
        platform: link.platform,
        url: link.url,
      })),
    }

    if (existing.docs.length > 0) {
      const footer = existing.docs[0]
      console.log(`✓ Updating footer: ${footer.id}`)
      return await this.payload.update({
        collection: 'footers',
        id: footer.id,
        data: footerPayload,
      })
    } else {
      console.log(`✓ Creating footer`)
      return await this.payload.create({
        collection: 'footers',
        data: footerPayload,
      })
    }
  }

  private async hydrateMedia(tenantId: number | string): Promise<Record<string, number | string>> {
    try {
      const hydrator = new MediaHydrator(this.payload, tenantId, this.syncPackPath)
      return await hydrator.hydrate()
    } catch (error) {
      console.error(`⚠ Media hydration failed, continuing without media mapping:`, error)
      // Return empty mapping so sync can continue
      return {}
    }
  }

  private async syncHomepage(homePage: SyncPack['pages'] extends Map<string, infer V> ? V : never, tenantId: number | string, mediaMapping: Record<string, number | string>) {
    // Find existing homepage for tenant
    const existing = await this.payload.find({
      collection: 'homepages',
      where: { tenant: { equals: tenantId } },
      limit: 1,
    })

    // Hydrate blocks with Media IDs
    const hydratedBlocks = hydrateBlocks(homePage.blocks || [], mediaMapping)

    const homepagePayload: any = {
      tenant: typeof tenantId === 'number' ? tenantId : parseInt(String(tenantId), 10),
      sections: hydratedBlocks,
      status: 'published',
      schemaVersion: 1,
    }

    if (homePage.seo) {
      homepagePayload.seo = {
        title: homePage.seo.title || '',
        description: homePage.seo.description || '',
      }
    }

    if (existing.docs.length > 0) {
      const homepage = existing.docs[0]
      console.log(`✓ Updating homepage: ${homepage.id} (${hydratedBlocks.length} sections)`)
      // First unset sections to ensure clean replacement
      await this.payload.update({
        collection: 'homepages',
        id: homepage.id,
        data: {},
        // unset is not a valid option in Payload v3, use empty array instead
        overrideAccess: true,
      })
      // Then set new sections (full replace)
      return await this.payload.update({
        collection: 'homepages',
        id: homepage.id,
        data: homepagePayload,
        overrideAccess: true,
      })
    } else {
      console.log(`✓ Creating homepage`)
      return await this.payload.create({
        collection: 'homepages',
        data: homepagePayload,
      })
    }
  }

  private async syncPages(pages: Map<string, any>, tenantId: number | string, mediaMapping: Record<string, number | string>) {
    const syncedPages = []

    for (const [slug, pageData] of pages.entries()) {
      // Skip homepage (handled separately)
      if (slug === 'home') continue

      // Find existing page
      const existing = await this.payload.find({
        collection: 'pages',
        where: {
          and: [
            { tenant: { equals: tenantId } },
            { slug: { equals: pageData.slug } },
          ],
        },
        limit: 1,
      })

      // Hydrate blocks with Media IDs
      const hydratedBlocks = hydrateBlocks(pageData.blocks || [], mediaMapping)

      const pagePayload: any = {
        tenant: typeof tenantId === 'number' ? tenantId : parseInt(String(tenantId), 10),
        title: pageData.title,
        slug: pageData.slug,
        sections: hydratedBlocks,
        status: 'published',
        schemaVersion: 1,
      }

      if (pageData.seo) {
        pagePayload.seo = {
          title: pageData.seo.title || '',
          description: pageData.seo.description || '',
        }
      }

      if (existing.docs.length > 0) {
        const page = existing.docs[0]
        console.log(`✓ Updating page: ${pageData.slug} (${page.id}) (${hydratedBlocks.length} sections)`)
        try {
          // Set new sections (full replace)
          await this.payload.update({
            collection: 'pages',
            id: page.id,
            data: pagePayload,
            overrideAccess: true,
          })
          syncedPages.push(page)
        } catch (error: any) {
          console.error(`  ❌ Failed to update page ${pageData.slug}:`, error.message)
          if (error.data?.errors) {
            console.error(`     Validation errors detected. This may be due to image URLs that need to be uploaded to Media collection first.`)
          }
        }
      } else {
        console.log(`✓ Creating page: ${pageData.slug}`)
        try {
          const page = await this.payload.create({
            collection: 'pages',
            data: pagePayload,
          })
          syncedPages.push(page)
        } catch (error: any) {
          console.error(`  ❌ Failed to create page ${pageData.slug}:`, error.message)
          if (error.data?.errors) {
            console.error(`     Validation errors detected. This may be due to image URLs that need to be uploaded to Media collection first.`)
            console.error(`     Note: Image URLs in blocks need to be uploaded to Media collection and replaced with Media IDs.`)
          }
        }
      }
    }

    return syncedPages
  }
}

// CLI entry point
async function main() {
  const { values } = parseArgs({
    options: {
      tenant: { type: 'string', short: 't' },
    },
  })

  if (!values.tenant) {
    console.error('❌ Missing required argument: --tenant <code>')
    console.error('   Example: pnpm sync:site -- --tenant kallitechnia')
    process.exit(1)
  }

  // Check for required environment variables
  const missingVars: string[] = []
  if (!process.env.PAYLOAD_SECRET) {
    missingVars.push('PAYLOAD_SECRET')
  }
  if (!process.env.DATABASE_URI) {
    missingVars.push('DATABASE_URI')
  }

  if (missingVars.length > 0) {
    console.error(`❌ Missing required environment variables: ${missingVars.join(', ')}`)
    console.error('   Please ensure .env or .env.local file exists in the project root.')
    console.error('   Required variables:')
    console.error('   - PAYLOAD_SECRET=your-secret-key-here')
    console.error('   - DATABASE_URI=your-database-connection-string')
    process.exit(1)
  }

  // Dynamically import config AFTER env vars are loaded
  const configModule = await import('@payload-config')
  const config = configModule.default

  let payload
  try {
    payload = await getPayload({ config })
  } catch (error: any) {
    console.error('❌ Failed to initialize Payload:', error.message)
    if (error.payloadInitError || error.message?.includes('secret')) {
      console.error('   Please check your .env or .env.local file.')
      console.error('   Required variables: PAYLOAD_SECRET, DATABASE_URI')
    }
    process.exit(1)
  }

  try {
    const syncer = new SiteSyncer(values.tenant, payload)
    await syncer.sync()
  } catch (error) {
    console.error('❌ Sync failed:', error)
    process.exit(1)
  } finally {
    process.exit(0)
  }
}

main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})

