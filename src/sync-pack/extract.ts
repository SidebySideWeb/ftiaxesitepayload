#!/usr/bin/env node
/**
 * Sync Pack Extractor
 * 
 * Converts Next.js frontend into Payload CMS sync package format.
 * Extracts pages, header, footer, menu, and blocks from TSX files.
 */

import { parseArgs } from 'node:util'
import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'
import * as ts from 'typescript'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

interface ExtractOptions {
  tenant: string
  projectName: string
  domains: string[]
  frontendPath?: string
  outputPath?: string
}

interface Block {
  blockType: string
  [key: string]: any
}

interface PageData {
  title: string
  slug: string
  seo?: {
    title?: string
    description?: string
  }
  blocks: Block[]
}

interface SiteData {
  tenant: string
  projectName: string
  domains: string[]
}

interface HeaderData {
  logo?: string
  logoAlt?: string
  topBar?: any
  navigationMenu?: Array<{ href: string; label: string }>
}

interface FooterData {
  copyrightText?: string
  footerMenus?: any[]
  socialLinks?: Array<{ platform: string; url: string }>
}

interface MenuData {
  menuTitle: string
  items: Array<{ href: string; label: string }>
}

interface Manifest {
  warnings: string[]
  counts: {
    pages: number
    blocks: number
    assets: number
  }
  generatedAt: string
}

// Component to block type registry
const COMPONENT_REGISTRY: Record<string, (tenant: string) => string> = {
  Hero: (tenant) => `${tenant}.hero`,
  PageHero: (tenant) => `${tenant}.pageHero`,
  RichTextSection: (tenant) => `${tenant}.richText`,
  RichText: (tenant) => `${tenant}.richText`,
  Gallery: (tenant) => `${tenant}.imageGallery`,
  ImageGrid: (tenant) => `${tenant}.imageGallery`,
  ImageGallery: (tenant) => `${tenant}.imageGallery`,
  CTASection: (tenant) => `${tenant}.cta`,
  CTA: (tenant) => `${tenant}.cta`,
  CTABanner: (tenant) => `${tenant}.cta`,
}

// Known section component names (from tenant sections)
const KNOWN_SECTIONS = [
  'KallitechniaHero',
  'KallitechniaRichText',
  'KallitechniaImageGallery',
  'KallitechniaCta',
  'KallitechniaCtaBanner',
  'KallitechniaWelcome',
  'KallitechniaProgramsGrid',
  'KallitechniaNewsGrid',
  'KallitechniaSponsors',
  'KallitechniaQuote',
  'KallitechniaSlogan',
  'KallitechniaImageText',
  'KallitechniaProgramDetail',
]

class SyncPackExtractor {
  private options: ExtractOptions
  private warnings: string[] = []
  private assets: Set<string> = new Set()
  private pages: Map<string, PageData> = new Map()

  constructor(options: ExtractOptions) {
    this.options = options
  }

  async extract(): Promise<void> {
    const frontendRoot = this.options.frontendPath || path.resolve(__dirname, '../../../frontend-kallitechnia')
    const outputRoot = this.options.outputPath || path.resolve(__dirname, `../sync-pack/${this.options.tenant}`)

    console.log(`📦 Extracting sync pack for tenant: ${this.options.tenant}`)
    console.log(`   Frontend path: ${frontendRoot}`)
    console.log(`   Output path: ${outputRoot}`)

    // Ensure output directory exists
    await fs.mkdir(outputRoot, { recursive: true })

    try {
      // Extract site.json
      await this.extractSite(outputRoot)

      // Extract header.json
      await this.extractHeader(frontendRoot, outputRoot)

      // Extract footer.json
      await this.extractFooter(frontendRoot, outputRoot)

      // Extract menu.json
      await this.extractMenu(frontendRoot, outputRoot)

      // Extract pages
      await this.extractPages(frontendRoot, outputRoot)

      // Extract assets list
      await this.extractAssets(outputRoot)

      // Generate manifest
      await this.generateManifest(outputRoot)

      console.log(`\n✅ Extraction complete!`)
      console.log(`   Pages: ${this.pages.size}`)
      console.log(`   Assets: ${this.assets.size}`)
      if (this.warnings.length > 0) {
        console.log(`   Warnings: ${this.warnings.length}`)
      }
    } catch (error) {
      console.error(`\n❌ Extraction failed:`, error)
      throw error
    }
  }

  private async extractSite(outputRoot: string): Promise<void> {
    const siteData: SiteData = {
      tenant: this.options.tenant,
      projectName: this.options.projectName,
      domains: this.options.domains,
    }

    await fs.writeFile(
      path.join(outputRoot, 'site.json'),
      JSON.stringify(siteData, null, 2),
      'utf-8'
    )
    console.log(`✓ Generated site.json`)
  }

  /**
   * Finds navigation component file, trying multiple common paths and names
   */
  private async findNavigationFile(frontendRoot: string): Promise<string> {
    const possiblePaths = [
      'src/components/navigation.tsx',
      'src/components/Navbar.tsx',
      'components/navigation.tsx',
      'components/Navbar.tsx',
      'src/components/Navigation.tsx',
      'components/Navigation.tsx',
    ]

    for (const relPath of possiblePaths) {
      const fullPath = path.join(frontendRoot, relPath)
      try {
        await fs.access(fullPath)
        return fullPath
      } catch {
        // Continue to next path
      }
    }

    throw new Error(`Navigation component not found. Tried: ${possiblePaths.join(', ')}`)
  }

  private async extractHeader(frontendRoot: string, outputRoot: string): Promise<void> {
    try {
      const navPath = await this.findNavigationFile(frontendRoot)
      const navContent = await fs.readFile(navPath, 'utf-8')
      const navData = this.parseNavigationComponent(navContent)

      const headerData: HeaderData = {
        logo: navData.logo,
        logoAlt: navData.logoAlt,
        navigationMenu: navData.items,
      }

      await fs.writeFile(
        path.join(outputRoot, 'header.json'),
        JSON.stringify(headerData, null, 2),
        'utf-8'
      )
      console.log(`✓ Generated header.json`)
    } catch (error) {
      this.warnings.push(`Failed to extract header: ${error}`)
      // Generate fallback
      const fallback: HeaderData = {
        navigationMenu: [],
      }
      await fs.writeFile(
        path.join(outputRoot, 'header.json'),
        JSON.stringify(fallback, null, 2),
        'utf-8'
      )
      console.log(`⚠ Generated fallback header.json`)
    }
  }

  /**
   * Finds footer component file, trying multiple common paths
   */
  private async findFooterFile(frontendRoot: string): Promise<string> {
    const possiblePaths = [
      'src/components/footer.tsx',
      'components/footer.tsx',
      'src/components/Footer.tsx',
      'components/Footer.tsx',
    ]

    for (const relPath of possiblePaths) {
      const fullPath = path.join(frontendRoot, relPath)
      try {
        await fs.access(fullPath)
        return fullPath
      } catch {
        // Continue to next path
      }
    }

    throw new Error(`Footer component not found. Tried: ${possiblePaths.join(', ')}`)
  }

  private async extractFooter(frontendRoot: string, outputRoot: string): Promise<void> {
    try {
      const footerPath = await this.findFooterFile(frontendRoot)
      const footerContent = await fs.readFile(footerPath, 'utf-8')
      const footerData = this.parseFooterComponent(footerContent)

      const footerJson: FooterData = {
        copyrightText: footerData.copyrightText,
        socialLinks: footerData.socialLinks,
        footerMenus: footerData.footerMenus,
      }

      await fs.writeFile(
        path.join(outputRoot, 'footer.json'),
        JSON.stringify(footerJson, null, 2),
        'utf-8'
      )
      console.log(`✓ Generated footer.json`)
    } catch (error) {
      this.warnings.push(`Failed to extract footer: ${error}`)
      // Generate fallback
      const fallback: FooterData = {
        copyrightText: '',
        socialLinks: [],
        footerMenus: [],
      }
      await fs.writeFile(
        path.join(outputRoot, 'footer.json'),
        JSON.stringify(fallback, null, 2),
        'utf-8'
      )
      console.log(`⚠ Generated fallback footer.json`)
    }
  }

  private async extractMenu(frontendRoot: string, outputRoot: string): Promise<void> {
    try {
      const navPath = await this.findNavigationFile(frontendRoot)
      const navContent = await fs.readFile(navPath, 'utf-8')
      const navData = this.parseNavigationComponent(navContent)

      const menuData: MenuData = {
        menuTitle: 'Main Navigation',
        items: navData.items || [],
      }

      await fs.writeFile(
        path.join(outputRoot, 'menu.json'),
        JSON.stringify(menuData, null, 2),
        'utf-8'
      )
      console.log(`✓ Generated menu.json`)
    } catch (error) {
      this.warnings.push(`Failed to extract menu: ${error}`)
      // Generate fallback
      const fallback: MenuData = {
        menuTitle: 'Main Navigation',
        items: [],
      }
      await fs.writeFile(
        path.join(outputRoot, 'menu.json'),
        JSON.stringify(fallback, null, 2),
        'utf-8'
      )
      console.log(`⚠ Generated fallback menu.json`)
    }
  }

  /**
   * Finds app directory, trying both src/app and app
   */
  private async findAppDir(frontendRoot: string): Promise<string> {
    const possiblePaths = [
      'src/app',
      'app',
    ]

    for (const relPath of possiblePaths) {
      const fullPath = path.join(frontendRoot, relPath)
      try {
        await fs.access(fullPath)
        return fullPath
      } catch {
        // Continue to next path
      }
    }

    throw new Error(`App directory not found. Tried: ${possiblePaths.join(', ')}`)
  }

  private async extractPages(frontendRoot: string, outputRoot: string): Promise<void> {
    const appDir = await this.findAppDir(frontendRoot)
    const pagesDir = path.join(outputRoot, 'pages')

    await fs.mkdir(pagesDir, { recursive: true })

    // Extract homepage
    await this.extractHomepage(appDir, pagesDir)

    // Extract static routes
    await this.extractStaticRoutes(appDir, pagesDir)

    console.log(`✓ Generated ${this.pages.size} page(s)`)
  }

  private async extractHomepage(appDir: string, pagesDir: string): Promise<void> {
    try {
      const homepagePath = path.join(appDir, 'page.tsx')
      const content = await fs.readFile(homepagePath, 'utf-8')

      const pageData = await this.parsePageFile(content, 'homepage')
      pageData.slug = 'home'

      // Extract SEO from metadata if available
      const metadata = this.extractMetadata(content)
      if (metadata) {
        pageData.seo = {
          title: metadata.title || pageData.title,
          description: metadata.description,
        }
      }

      this.pages.set('home', pageData)

      await fs.writeFile(
        path.join(pagesDir, 'home.json'),
        JSON.stringify(pageData, null, 2),
        'utf-8'
      )
    } catch (error) {
      this.warnings.push(`Failed to extract homepage: ${error}`)
      // Generate fallback
      const fallback: PageData = {
        title: 'Home',
        slug: 'home',
        blocks: [],
      }
      this.pages.set('home', fallback)
      await fs.writeFile(
        path.join(pagesDir, 'home.json'),
        JSON.stringify(fallback, null, 2),
        'utf-8'
      )
    }
  }

  private async extractStaticRoutes(appDir: string, pagesDir: string): Promise<void> {
    try {
      const entries = await fs.readdir(appDir, { withFileTypes: true })

      for (const entry of entries) {
        if (entry.isDirectory() && entry.name !== 'layout.tsx') {
          const pagePath = path.join(appDir, entry.name, 'page.tsx')
          try {
            const content = await fs.readFile(pagePath, 'utf-8')
            const pageData = await this.parsePageFile(content, entry.name)
            pageData.slug = entry.name

            // Extract SEO from metadata if available
            const metadata = this.extractMetadata(content)
            if (metadata) {
              pageData.seo = {
                title: metadata.title || pageData.title,
                description: metadata.description,
              }
            }

            this.pages.set(entry.name, pageData)

            await fs.writeFile(
              path.join(pagesDir, `${entry.name}.json`),
              JSON.stringify(pageData, null, 2),
              'utf-8'
            )
          } catch (error) {
            this.warnings.push(`Failed to extract page ${entry.name}: ${error}`)
          }
        }
      }
    } catch (error) {
      this.warnings.push(`Failed to scan static routes: ${error}`)
    }
  }

  private async parsePageFile(content: string, pageName: string): Promise<PageData> {
    const blocks: Block[] = []

    // Try to extract sections array from the file
    // Look for patterns like: const sections = [...]
    // Handle multi-line arrays by finding matching brackets
    const sectionsMatch = content.match(/const\s+sections\s*=\s*\[/m)
    if (sectionsMatch) {
      try {
        const startPos = sectionsMatch.index! + sectionsMatch[0].length - 1 // Position of '['
        const sectionsCode = this.extractArrayCode(content, startPos)
        
        if (sectionsCode) {
          // Parse with TypeScript compiler
          const sections = this.extractSectionsFromCode(sectionsCode)
          blocks.push(...sections)
        }
      } catch (error) {
        this.warnings.push(`Failed to parse sections array in ${pageName}: ${error}`)
      }
    }

    // If no sections array found, try to extract from inline JSX sections
    if (blocks.length === 0) {
      try {
        const jsxSections = this.extractSectionsFromJSX(content)
        blocks.push(...jsxSections)
      } catch (error) {
        this.warnings.push(`Failed to parse JSX sections in ${pageName}: ${error}`)
      }
    }

    // Extract title from PageHeaderGradient if present
    let title = this.capitalize(pageName)
    const pageHeaderMatch = content.match(/<PageHeaderGradient\s+title=["']([^"']+)["']/i)
    if (pageHeaderMatch) {
      title = pageHeaderMatch[1]
    }

    return {
      title,
      slug: pageName,
      blocks,
    }
  }

  /**
   * Extracts blocks from inline JSX sections
   * Looks for <section> elements and converts them to blocks
   */
  private extractSectionsFromJSX(content: string): Block[] {
    const blocks: Block[] = []
    
    // Find the return statement and extract JSX
    const returnMatch = content.match(/return\s*\(([\s\S]*?)\)\s*;?\s*}/m)
    if (!returnMatch) {
      return blocks
    }

    const jsxContent = returnMatch[1]
    
    // Extract sections - look for <section> tags with comments that indicate section type
    // Pattern: {/* Hero Section */} <section>...</section>
    const sectionPattern = /\/\*\s*([^*]+?)\s*Section\s*\*\/[\s\S]*?<section[^>]*>([\s\S]*?)<\/section>/gi
    let sectionMatch

    while ((sectionMatch = sectionPattern.exec(jsxContent)) !== null) {
      const sectionType = sectionMatch[1].trim().toLowerCase()
      const sectionContent = sectionMatch[2]

      // Map section types to block types
      let blockType = `${this.options.tenant}.genericSection`
      
      if (sectionType.includes('hero')) {
        blockType = `${this.options.tenant}.hero`
      } else if (sectionType.includes('about') || sectionType.includes('text') || sectionType.includes('rich')) {
        blockType = `${this.options.tenant}.richText`
      } else if (sectionType.includes('gallery') || sectionType.includes('image')) {
        blockType = `${this.options.tenant}.imageGallery`
      } else if (sectionType.includes('cta') || sectionType.includes('call')) {
        blockType = `${this.options.tenant}.cta`
      }

      // Extract content from the section
      const block: any = {
        blockType,
      }

      // Extract title (h1, h2, h3)
      const titleMatch = sectionContent.match(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/i)
      if (titleMatch) {
        block.title = this.stripHtmlTags(titleMatch[1]).trim()
      }

      // Extract subtitle (h2, h3, or first paragraph)
      const subtitleMatch = sectionContent.match(/<h[2-3][^>]*>([\s\S]*?)<\/h[2-3]>/i)
      if (subtitleMatch && !titleMatch) {
        block.subtitle = this.stripHtmlTags(subtitleMatch[1]).trim()
      } else {
        const pMatch = sectionContent.match(/<p[^>]*>([\s\S]*?)<\/p>/i)
        if (pMatch) {
          block.subtitle = this.stripHtmlTags(pMatch[1]).trim()
        }
      }

      // Extract background image
      const imgMatch = sectionContent.match(/<img[^>]+src=["']([^"']+)["']/i)
      if (imgMatch) {
        block.backgroundImage = imgMatch[1]
      }

      // Extract CTA buttons
      const linkMatches = sectionContent.matchAll(/<Link[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/Link>/gi)
      const links: Array<{ href: string; label: string }> = []
      for (const linkMatch of linkMatches) {
        links.push({
          href: linkMatch[1],
          label: this.stripHtmlTags(linkMatch[2]).trim(),
        })
      }
      
      if (links.length > 0) {
        block.hasPrimaryCTA = true
        block.primaryCTALabel = links[0].label
        block.primaryCTAUrl = links[0].href
        
        if (links.length > 1) {
          block.hasSecondaryCTA = true
          block.secondaryCTALabel = links[1].label
          block.secondaryCTAUrl = links[1].href
        }
      }

      // Extract description/paragraphs
      const paragraphs = sectionContent.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)
      const descriptions: string[] = []
      for (const pMatch of paragraphs) {
        const text = this.stripHtmlTags(pMatch[1]).trim()
        if (text && text.length > 10) {
          descriptions.push(text)
        }
      }
      
      if (descriptions.length > 0) {
        block.description = descriptions.join('\n\n')
      }

      blocks.push(block)
    }

    // If no commented sections found, try to extract all <section> tags
    if (blocks.length === 0) {
      const allSectionsPattern = /<section[^>]*>([\s\S]*?)<\/section>/gi
      let allSectionMatch
      let sectionIndex = 0

      while ((allSectionMatch = allSectionsPattern.exec(jsxContent)) !== null) {
        const sectionContent = allSectionMatch[1]
        
        // Determine block type based on content
        let blockType = `${this.options.tenant}.genericSection`
        
        // Check for hero indicators
        if (sectionContent.includes('h-[90vh]') || sectionContent.includes('hero') || sectionIndex === 0) {
          blockType = `${this.options.tenant}.hero`
        } else if (sectionContent.includes('bg-white') || sectionContent.includes('py-24')) {
          blockType = `${this.options.tenant}.richText`
        } else if (sectionContent.includes('bg-black') || sectionContent.includes('bg-zinc')) {
          blockType = `${this.options.tenant}.cta`
        }

        const block: any = {
          blockType,
        }

        // Extract title
        const titleMatch = sectionContent.match(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/i)
        if (titleMatch) {
          block.title = this.stripHtmlTags(titleMatch[1]).trim()
        }

        // Extract subtitle
        const subtitleMatch = sectionContent.match(/<h[2-3][^>]*>([\s\S]*?)<\/h[2-3]>/i)
        if (subtitleMatch) {
          block.subtitle = this.stripHtmlTags(subtitleMatch[1]).trim()
        }

        // Extract background image
        const imgMatch = sectionContent.match(/<img[^>]+src=["']([^"']+)["']/i)
        if (imgMatch) {
          block.backgroundImage = imgMatch[1]
        }

        // Extract CTA buttons
        const linkMatches = sectionContent.matchAll(/<Link[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/Link>/gi)
        const links: Array<{ href: string; label: string }> = []
        for (const linkMatch of linkMatches) {
          links.push({
            href: linkMatch[1],
            label: this.stripHtmlTags(linkMatch[2]).trim(),
          })
        }
        
        if (links.length > 0) {
          block.hasPrimaryCTA = true
          block.primaryCTALabel = links[0].label
          block.primaryCTAUrl = links[0].href
          
          if (links.length > 1) {
            block.hasSecondaryCTA = true
            block.secondaryCTALabel = links[1].label
            block.secondaryCTAUrl = links[1].href
          }
        }

        blocks.push(block)
        sectionIndex++
      }
    }

    return blocks
  }

  /**
   * Strips HTML tags from a string
   */
  private stripHtmlTags(html: string): string {
    return html
      .replace(/<[^>]+>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
      .replace(/&amp;/g, '&') // Replace &amp; with &
      .replace(/&lt;/g, '<') // Replace &lt; with <
      .replace(/&gt;/g, '>') // Replace &gt; with >
      .replace(/&quot;/g, '"') // Replace &quot; with "
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()
  }

  private extractArrayCode(content: string, startPos: number): string | null {
    let depth = 0
    let inString = false
    let stringChar = ''
    let i = startPos

    for (; i < content.length; i++) {
      const char = content[i]
      const prevChar = i > 0 ? content[i - 1] : ''

      // Handle string literals
      if (!inString && (char === '"' || char === "'" || char === '`')) {
        inString = true
        stringChar = char
      } else if (inString && char === stringChar && prevChar !== '\\') {
        inString = false
      }

      if (!inString) {
        if (char === '[') {
          depth++
        } else if (char === ']') {
          depth--
          if (depth === 0) {
            // Found matching closing bracket
            return content.substring(startPos, i + 1)
          }
        }
      }
    }

    return null
  }

  private extractSectionsFromCode(code: string): Block[] {
    const blocks: Block[] = []

    // Wrap in array literal if needed for parsing
    const wrappedCode = code.trim().startsWith('[') ? code : `[${code}]`

    // Parse the code using TypeScript compiler API
    try {
      const sourceFile = ts.createSourceFile(
        'temp.ts',
        wrappedCode,
        ts.ScriptTarget.Latest,
        true
      )

      // Traverse AST to find array elements (object literals)
      const visit = (node: ts.Node) => {
        if (ts.isArrayLiteralExpression(node)) {
          // Found the array, process each element
          for (const element of node.elements) {
            if (ts.isObjectLiteralExpression(element)) {
              const block = this.parseObjectLiteralToBlock(element)
              if (block) {
                blocks.push(block)
              }
            }
          }
        } else if (ts.isObjectLiteralExpression(node)) {
          // Also handle direct object literals (in case array wrapper wasn't needed)
          const block = this.parseObjectLiteralToBlock(node)
          if (block) {
            blocks.push(block)
          }
        }
        ts.forEachChild(node, visit)
      }

      visit(sourceFile)
    } catch (error) {
      this.warnings.push(`Failed to parse sections code with TypeScript: ${error}`)
      // Fallback: try regex-based extraction
      return this.extractBlocksWithRegex(code)
    }

    return blocks
  }

  private parseObjectLiteralToBlock(node: ts.ObjectLiteralExpression): Block | null {
    const block: any = {}

    for (const prop of node.properties) {
      if (ts.isPropertyAssignment(prop) && ts.isIdentifier(prop.name)) {
        const key = prop.name.text
        const value = this.extractValue(prop.initializer)
        block[key] = value
      }
    }

    // Ensure blockType exists
    if (!block.blockType) {
      // Try to infer from component name or use generic
      block.blockType = `${this.options.tenant}.genericSection`
    } else {
      // Ensure blockType is tenant-prefixed
      if (!block.blockType.includes('.')) {
        block.blockType = `${this.options.tenant}.${block.blockType}`
      }
    }

    return block as Block
  }

  private extractValue(node: ts.Expression | undefined): any {
    if (!node) return undefined

    if (ts.isStringLiteral(node)) {
      return node.text
    }

    if (ts.isNumericLiteral(node)) {
      return Number(node.text)
    }

    if (node.kind === ts.SyntaxKind.TrueKeyword) {
      return true
    }

    if (node.kind === ts.SyntaxKind.FalseKeyword) {
      return false
    }

    if (node.kind === ts.SyntaxKind.NullKeyword) {
      return null
    }

    if (ts.isArrayLiteralExpression(node)) {
      return node.elements.map((el) => this.extractValue(el)).filter((v) => v !== undefined)
    }

    if (ts.isObjectLiteralExpression(node)) {
      const obj: any = {}
      for (const prop of node.properties) {
        if (ts.isPropertyAssignment(prop)) {
          let key: string
          if (ts.isIdentifier(prop.name)) {
            key = prop.name.text
          } else if (ts.isStringLiteral(prop.name)) {
            key = prop.name.text
          } else {
            continue
          }
          obj[key] = this.extractValue(prop.initializer)
        } else if (ts.isShorthandPropertyAssignment(prop)) {
          // Handle { key } shorthand
          if (ts.isIdentifier(prop.name)) {
            obj[prop.name.text] = prop.name.text
          }
        }
      }
      return obj
    }

    // Handle template literals (backtick strings)
    if (ts.isTemplateExpression(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      return node.getText().slice(1, -1) // Remove backticks
    }

    // For complex expressions, try to get text representation
    const text = node.getText()
    // Try to extract string from template or expression
    if (text.startsWith('`') && text.endsWith('`')) {
      return text.slice(1, -1)
    }
    return text
  }

  private extractBlocksWithRegex(code: string): Block[] {
    const blocks: Block[] = []

    // Find blockType patterns
    const blockTypeRegex = /blockType:\s*['"]([^'"]+)['"]/g
    let match

    while ((match = blockTypeRegex.exec(code)) !== null) {
      const blockType = match[1]
      // Extract the object containing this blockType
      const startPos = code.lastIndexOf('{', match.index)
      const endPos = code.indexOf('}', match.index) + 1

      if (startPos !== -1 && endPos > startPos) {
        const blockCode = code.substring(startPos, endPos)
        try {
          // Try to parse as JSON-like structure
          const block = this.parseBlockFromString(blockCode, blockType)
          if (block) {
            blocks.push(block)
          }
        } catch (error) {
          this.warnings.push(`Failed to parse block: ${error}`)
        }
      }
    }

    return blocks
  }

  private parseBlockFromString(code: string, blockType: string): Block | null {
    const block: any = { blockType }

    // Extract simple key-value pairs
    const propRegex = /(\w+):\s*([^,}]+)/g
    let match

    while ((match = propRegex.exec(code)) !== null) {
      const key = match[1]
      let value = match[2].trim()

      // Remove quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1)
      }

      // Handle arrays (simplified)
      if (value.startsWith('[')) {
        // Try to extract array items
        const arrayMatch = value.match(/\[(.*?)\]/s)
        if (arrayMatch) {
          // This is simplified - full parsing would need more work
          block[key] = []
        } else {
          block[key] = []
        }
      } else {
        block[key] = value
      }
    }

    // Ensure tenant prefix
    if (!block.blockType.includes('.')) {
      block.blockType = `${this.options.tenant}.${block.blockType}`
    }

    return block as Block
  }

  private parseNavigationComponent(content: string): { logo?: string; logoAlt?: string; items: Array<{ href: string; label: string }> } {
    const result: { logo?: string; logoAlt?: string; items: Array<{ href: string; label: string }> } = {
      items: [],
    }

    // Extract logo from safeLogo assignment
    const logoMatch = content.match(/const\s+safeLogo\s*=\s*logo\s*\|\|\s*['"]([^'"]+)['"]/)
    if (logoMatch) {
      result.logo = logoMatch[1]
    }

    // Extract logoAlt
    const logoAltMatch = content.match(/const\s+safeLogoAlt\s*=\s*logoAlt\s*\|\|\s*['"]([^'"]+)['"]/)
    if (logoAltMatch) {
      result.logoAlt = logoAltMatch[1]
    }

    // Extract navigation items from various array names (safeItems, navLinks, navigationLinks, etc.)
    const itemsPatterns = [
      /const\s+(?:safeItems|navLinks|navigationLinks|links|menuItems)\s*=\s*\[([\s\S]*?)\];/m,
      /const\s+(?:safeItems|navLinks|navigationLinks|links|menuItems)\s*=\s*\[([\s\S]*?)\]/m,
    ]

    for (const pattern of itemsPatterns) {
      const itemsMatch = content.match(pattern)
      if (itemsMatch) {
        const itemsCode = itemsMatch[1]
        
        // Match both formats:
        // { href: "...", label: "..." } 
        // { name: "...", path: "..." }
        // Order doesn't matter
        const itemRegex = /\{\s*(?:name|label):\s*['"]([^'"]+)['"],\s*(?:path|href):\s*['"]([^'"]+)['"]\s*\}|\{\s*(?:path|href):\s*['"]([^'"]+)['"],\s*(?:name|label):\s*['"]([^'"]+)['"]\s*\}/g
        let itemMatch

        while ((itemMatch = itemRegex.exec(itemsCode)) !== null) {
          // Handle both orderings: name/path or path/name
          const label = itemMatch[1] || itemMatch[4]
          const href = itemMatch[2] || itemMatch[3]
          
          if (label && href) {
            result.items.push({
              href: href,
              label: label,
            })
          }
        }
        
        // If we found items, break (don't try other patterns)
        if (result.items.length > 0) {
          break
        }
      }
    }

    return result
  }

  private parseFooterComponent(content: string): { copyrightText?: string; socialLinks?: Array<{ platform: string; url: string }>; footerMenus?: any[] } {
    const result: { copyrightText?: string; socialLinks?: Array<{ platform: string; url: string }>; footerMenus?: any[] } = {
      socialLinks: [],
      footerMenus: [],
    }

    // Extract copyright text
    const copyrightMatch = content.match(/const\s+safeCopyrightText\s*=\s*copyrightText\s*\|\|\s*['"]([^'"]+)['"]/)
    if (copyrightMatch) {
      result.copyrightText = copyrightMatch[1]
    }

    // Extract social links
    const socialLinksMatch = content.match(/const\s+safeSocialLinks\s*=\s*.*?\[([\s\S]*?)\]/m)
    if (socialLinksMatch) {
      const linksCode = socialLinksMatch[1]
      const linkRegex = /\{\s*platform:\s*['"]([^'"]+)['"],\s*url:\s*['"]([^'"]+)['"]\s*\}/g
      let linkMatch

      while ((linkMatch = linkRegex.exec(linksCode)) !== null) {
        result.socialLinks!.push({
          platform: linkMatch[1],
          url: linkMatch[2],
        })
      }
    }

    return result
  }

  private extractMetadata(content: string): { title?: string; description?: string } | null {
    // Look for metadata export
    const metadataMatch = content.match(/export\s+const\s+metadata[^=]*=\s*\{([\s\S]*?)\}/m)
    if (metadataMatch) {
      const metadataCode = metadataMatch[1]
      const result: { title?: string; description?: string } = {}

      const titleMatch = metadataCode.match(/title:\s*['"]([^'"]+)['"]/)
      if (titleMatch) {
        result.title = titleMatch[1]
      }

      const descMatch = metadataCode.match(/description:\s*['"]([^'"]+)['"]/)
      if (descMatch) {
        result.description = descMatch[1]
      }

      return result
    }

    return null
  }

  private async extractAssets(outputRoot: string): Promise<void> {
    // Collect all image URLs from blocks
    for (const page of this.pages.values()) {
      this.collectAssetsFromBlocks(page.blocks)
    }

    const assetsList = Array.from(this.assets).map((asset) => ({
      path: asset,
      type: this.getAssetType(asset),
    }))

    await fs.writeFile(
      path.join(outputRoot, 'assets-list.json'),
      JSON.stringify(assetsList, null, 2),
      'utf-8'
    )
    console.log(`✓ Generated assets-list.json (${this.assets.size} assets)`)
  }

  private collectAssetsFromBlocks(blocks: Block[]): void {
    for (const block of blocks) {
      // Check common image fields
      if (block.backgroundImage && typeof block.backgroundImage === 'string') {
        this.assets.add(block.backgroundImage)
      }
      if (block.image && typeof block.image === 'string') {
        this.assets.add(block.image)
      }
      if (block.logo && typeof block.logo === 'string') {
        this.assets.add(block.logo)
      }
      if (Array.isArray(block.images)) {
        for (const img of block.images) {
          if (typeof img === 'object' && img.image && typeof img.image === 'string') {
            this.assets.add(img.image)
          } else if (typeof img === 'string') {
            this.assets.add(img)
          }
        }
      }
      if (Array.isArray(block.programs)) {
        for (const program of block.programs) {
          if (program.image && typeof program.image === 'string') {
            this.assets.add(program.image)
          }
        }
      }
      if (Array.isArray(block.newsItems)) {
        for (const news of block.newsItems) {
          if (news.image && typeof news.image === 'string') {
            this.assets.add(news.image)
          }
        }
      }
    }
  }

  private getAssetType(path: string): string {
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return 'external'
    }
    if (path.startsWith('/')) {
      return 'local'
    }
    return 'unknown'
  }

  private async generateManifest(outputRoot: string): Promise<void> {
    const totalBlocks = Array.from(this.pages.values()).reduce((sum, page) => sum + page.blocks.length, 0)

    const manifest: Manifest = {
      warnings: this.warnings,
      counts: {
        pages: this.pages.size,
        blocks: totalBlocks,
        assets: this.assets.size,
      },
      generatedAt: new Date().toISOString(),
    }

    await fs.writeFile(
      path.join(outputRoot, 'manifest.json'),
      JSON.stringify(manifest, null, 2),
      'utf-8'
    )
    console.log(`✓ Generated manifest.json`)
  }

  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1)
  }
}

// CLI entry point
async function main() {
  const { values } = parseArgs({
    options: {
      tenant: { type: 'string', short: 't' },
      projectName: { type: 'string', short: 'p' },
      domains: { type: 'string', short: 'd' },
      frontendPath: { type: 'string', short: 'f' },
      outputPath: { type: 'string', short: 'o' },
    },
  })

  if (!values.tenant || !values.projectName || !values.domains) {
    console.error('❌ Missing required arguments:')
    console.error('   --tenant <code>')
    console.error('   --projectName "<name>"')
    console.error('   --domains "a.com,b.com"')
    process.exit(1)
  }

  const domains = values.domains.split(',').map((d) => d.trim())

  const extractor = new SyncPackExtractor({
    tenant: values.tenant,
    projectName: values.projectName,
    domains,
    frontendPath: values.frontendPath,
    outputPath: values.outputPath,
  })

  await extractor.extract()
}

main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})

