/**
 * Media Hydration Utility
 * 
 * Downloads images from URLs and uploads them to Payload Media collection.
 * Creates a mapping of original URLs to Media IDs for use in block hydration.
 */

import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import { createWriteStream } from 'node:fs'
import { pipeline } from 'node:stream/promises'
import { fileURLToPath } from 'node:url'
import type { Payload } from 'payload'

interface AssetInfo {
  path: string
  type: 'external' | 'local' | 'unknown'
}

interface MediaMapping {
  [originalUrl: string]: number | string // Media ID
}

interface HydrationStats {
  uploaded: number
  reused: number
  failed: number
  skipped: number
}

export class MediaHydrator {
  private payload: Payload
  private tenantId: number | string
  private syncPackPath: string
  private tempDir: string
  private mapping: MediaMapping = {}
  private stats: HydrationStats = {
    uploaded: 0,
    reused: 0,
    failed: 0,
    skipped: 0,
  }

  constructor(
    payload: Payload,
    tenantId: number | string,
    syncPackPath: string
  ) {
    this.payload = payload
    this.tenantId = tenantId
    this.syncPackPath = syncPackPath

    // Create temp directory for downloads
    const __filename = fileURLToPath(import.meta.url)
    const __dirname = path.dirname(__filename)
    this.tempDir = path.join(__dirname, '../../.temp-media')
  }

  /**
   * Main hydration method
   * Downloads and uploads all assets, returns mapping
   */
  async hydrate(): Promise<MediaMapping> {
    console.log('\n📦 Starting media hydration...')

    // Ensure temp directory exists
    await fs.mkdir(this.tempDir, { recursive: true })

    try {
      // Load assets list
      const assetsListPath = path.join(this.syncPackPath, 'assets-list.json')
      const assetsListContent = await fs.readFile(assetsListPath, 'utf-8')
      const assets: AssetInfo[] = JSON.parse(assetsListContent)

      console.log(`   Found ${assets.length} assets to process`)

      // Process each asset
      for (const asset of assets) {
        if (asset.type === 'external') {
          await this.processExternalAsset(asset.path)
        } else if (asset.type === 'local') {
          await this.processLocalAsset(asset.path)
        } else {
          console.log(`  ⚠ Skipping unknown asset type: ${asset.path}`)
          this.stats.skipped++
        }
      }

      // Cleanup temp directory
      await this.cleanup()

      // Print stats
      console.log(`\n📊 Media hydration complete:`)
      console.log(`   Uploaded: ${this.stats.uploaded}`)
      console.log(`   Reused: ${this.stats.reused}`)
      console.log(`   Failed: ${this.stats.failed}`)
      console.log(`   Skipped: ${this.stats.skipped}`)

      return this.mapping
    } catch (error) {
      console.error(`❌ Media hydration failed:`, error)
      // Cleanup on error
      await this.cleanup().catch(() => {})
      throw error
    }
  }

  /**
   * Process external asset (download and upload)
   */
  private async processExternalAsset(url: string): Promise<void> {
    try {
      // Check if already processed
      if (this.mapping[url]) {
        this.stats.reused++
        return
      }

      // Check if Media already exists (dedupe by URL/filename)
      const existingMedia = await this.findExistingMedia(url)
      if (existingMedia) {
        this.mapping[url] = existingMedia.id
        this.stats.reused++
        console.log(`  ♻ Reused: ${this.getFilename(url)}`)
        return
      }

      // Download image
      const tempFilePath = await this.downloadImage(url)

      // Upload to Payload
      const mediaId = await this.uploadToPayload(tempFilePath, url)

      // Store mapping
      this.mapping[url] = mediaId
      this.stats.uploaded++
      console.log(`  ✓ Uploaded: ${this.getFilename(url)}`)

      // Cleanup temp file
      await fs.unlink(tempFilePath).catch(() => {})
    } catch (error) {
      console.error(`  ❌ Failed to process ${url}:`, error instanceof Error ? error.message : error)
      this.stats.failed++
      // Continue processing other assets
    }
  }

  /**
   * Process local asset (upload from file system)
   */
  private async processLocalAsset(filePath: string): Promise<void> {
    try {
      // Resolve local path relative to sync pack or project root
      const resolvedPath = path.isAbsolute(filePath)
        ? filePath
        : path.resolve(this.syncPackPath, '..', filePath)

      // Check if file exists
      try {
        await fs.access(resolvedPath)
      } catch {
        console.error(`  ❌ Local file not found: ${filePath}`)
        this.stats.failed++
        return
      }

      // Check if already processed
      if (this.mapping[filePath]) {
        this.stats.reused++
        return
      }

      // Check if Media already exists
      const existingMedia = await this.findExistingMedia(filePath)
      if (existingMedia) {
        this.mapping[filePath] = existingMedia.id
        this.stats.reused++
        console.log(`  ♻ Reused: ${path.basename(filePath)}`)
        return
      }

      // Upload to Payload
      const mediaId = await this.uploadToPayload(resolvedPath, filePath)

      // Store mapping
      this.mapping[filePath] = mediaId
      this.stats.uploaded++
      console.log(`  ✓ Uploaded: ${path.basename(filePath)}`)
    } catch (error) {
      console.error(`  ❌ Failed to process local file ${filePath}:`, error instanceof Error ? error.message : error)
      this.stats.failed++
    }
  }

  /**
   * Download image from URL to temp file
   */
  private async downloadImage(url: string): Promise<string> {
    const filename = this.getFilename(url)
    const tempFilePath = path.join(this.tempDir, filename)

    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const fileStream = createWriteStream(tempFilePath)
      await pipeline(response.body as any, fileStream)

      return tempFilePath
    } catch (error) {
      throw new Error(`Failed to download ${url}: ${error instanceof Error ? error.message : error}`)
    }
  }

  /**
   * Upload file to Payload Media collection
   */
  private async uploadToPayload(filePath: string, originalUrl: string): Promise<number | string> {
    const filename = path.basename(filePath)
    const altText = this.generateAltText(filename)

    // Create Media document with file
    // Payload 3.x Local API accepts file path for uploads
    try {
      const media = await this.payload.create({
        collection: 'media',
        data: {
          tenant: typeof this.tenantId === 'number' ? this.tenantId : parseInt(String(this.tenantId), 10),
          alt: altText,
        },
        file: filePath as any, // Payload Local API accepts file path as string
      })

      return media.id
    } catch (error) {
      // If file path doesn't work, try reading file and using buffer
      // This is a fallback for different Payload versions
      const fileBuffer = await fs.readFile(filePath)
      const file = {
        name: filename,
        data: fileBuffer,
        size: fileBuffer.length,
        type: this.getMimeType(filename),
      }

      const media = await this.payload.create({
        collection: 'media',
        data: {
          tenant: typeof this.tenantId === 'number' ? this.tenantId : parseInt(String(this.tenantId), 10),
          alt: altText,
        },
        file: file as any,
      })

      return media.id
    }
  }

  /**
   * Find existing Media by filename and tenant (deduplication)
   */
  private async findExistingMedia(urlOrPath: string): Promise<{ id: number | string } | null> {
    const filename = this.getFilename(urlOrPath)

    // Search for existing media with same filename and tenant
    // Note: Payload stores filename in the file object, we need to check the actual file
    // For now, we'll do a simple check - in production you might want to store
    // a hash or original URL in a custom field for better deduplication

    const results = await this.payload.find({
      collection: 'media',
      where: {
        and: [
          { tenant: { equals: typeof this.tenantId === 'number' ? this.tenantId : parseInt(String(this.tenantId), 10) } },
          // We can't easily query by filename in Payload without custom fields
          // So we'll skip this check and rely on URL mapping instead
        ],
      },
      limit: 100, // Check recent media
    })

    // Try to match by filename (this is a best-effort approach)
    // In a production system, you'd want to store original URL in a custom field
    for (const media of results.docs) {
      // Payload stores file info in media.filename or similar
      // This is a simplified check - adjust based on your Payload version
      if ((media as any).filename === filename) {
        return { id: media.id }
      }
    }

    return null
  }

  /**
   * Extract filename from URL or path
   */
  private getFilename(urlOrPath: string): string {
    try {
      if (urlOrPath.startsWith('http://') || urlOrPath.startsWith('https://')) {
        const url = new URL(urlOrPath)
        const pathname = url.pathname
        const filename = path.basename(pathname)
        // Decode URL-encoded filenames
        return decodeURIComponent(filename) || 'image.jpg'
      }
      return path.basename(urlOrPath) || 'image.jpg'
    } catch {
      // Fallback
      return 'image.jpg'
    }
  }

  /**
   * Generate alt text from filename
   */
  private generateAltText(filename: string): string {
    // Remove extension and clean up
    const nameWithoutExt = path.parse(filename).name
    // Replace common separators with spaces
    const cleaned = nameWithoutExt.replace(/[-_]/g, ' ').trim()
    // Capitalize first letter
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1) || 'Image'
  }

  /**
   * Get MIME type from filename
   */
  private getMimeType(filename: string): string {
    const ext = path.extname(filename).toLowerCase()
    const mimeTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
    }
    return mimeTypes[ext] || 'image/jpeg'
  }

  /**
   * Cleanup temp directory
   */
  private async cleanup(): Promise<void> {
    try {
      const files = await fs.readdir(this.tempDir)
      for (const file of files) {
        await fs.unlink(path.join(this.tempDir, file)).catch(() => {})
      }
    } catch {
      // Ignore cleanup errors
    }
  }
}

