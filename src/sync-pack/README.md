# Sync Pack Extractor

Automated tool that converts a Next.js 15 frontend (exported from v0.app) into a Payload CMS sync package format.

## Overview

The extractor scans your frontend codebase and generates:
- `site.json` - Tenant and project configuration
- `header.json` - Navigation and header data
- `footer.json` - Footer content and social links
- `menu.json` - Navigation menu structure
- `pages/*.json` - Individual page data with extracted blocks
- `assets-list.json` - List of referenced images/assets
- `manifest.json` - Extraction summary with warnings

## Usage

### Basic Command

```bash
pnpm extract:sync -- --tenant <code> --projectName "<name>" --domains "a.com,b.com"
```

### Example

```bash
pnpm extract:sync -- --tenant kallitechnia --projectName "Kallitechnia Gymnastics" --domains "kallitechnia-kefalonia.gr,www.kallitechnia-kefalonia.gr"
```

### Options

- `--tenant` / `-t` (required): Tenant code (e.g., "kallitechnia")
- `--projectName` / `-p` (required): Project display name
- `--domains` / `-d` (required): Comma-separated list of domains
- `--frontendPath` / `-f` (optional): Path to frontend repo (defaults to `../../../frontend-kallitechnia`)
- `--outputPath` / `-o` (optional): Output directory (defaults to `src/sync-pack/<tenant>`)

## Output Structure

```
src/sync-pack/<tenant>/
├── site.json              # Tenant configuration
├── header.json            # Navigation data
├── footer.json            # Footer content
├── menu.json              # Menu structure
├── pages/
│   ├── home.json          # Homepage
│   ├── about.json         # Static routes
│   ├── contact.json
│   └── ...
├── assets-list.json       # Referenced assets
└── manifest.json          # Extraction summary
```

## How It Works

1. **Site Configuration**: Extracts tenant code, project name, and domains
2. **Header Extraction**: Parses `Navigation` component to extract logo and menu items
3. **Footer Extraction**: Parses `Footer` component to extract copyright, social links, etc.
4. **Menu Extraction**: Extracts navigation menu structure
5. **Page Extraction**:
   - Scans `src/app/page.tsx` for homepage
   - Scans `src/app/*/page.tsx` for static routes
   - Extracts `sections` arrays from page files
   - Converts component props to block format
6. **Block Mapping**: Maps components to tenant-prefixed block types:
   - `Hero` → `<tenant>.hero`
   - `PageHero` → `<tenant>.pageHero`
   - `RichText` / `RichTextSection` → `<tenant>.richText`
   - `Gallery` / `ImageGrid` / `ImageGallery` → `<tenant>.imageGallery`
   - `CTA` / `CTASection` / `CTABanner` → `<tenant>.cta`
   - Unknown components → `<tenant>.genericSection`
7. **Asset Detection**: Collects image URLs from blocks (backgroundImage, image, images arrays, etc.)
8. **SEO Extraction**: Extracts metadata from page files when available

## Block Format

Each block in `pages/*.json` follows this structure:

```json
{
  "blockType": "kallitechnia.hero",
  "title": "Hero Title",
  "subtitle": "Hero subtitle",
  "backgroundImage": "https://...",
  "ctaLabel": "Click here",
  "ctaUrl": "/programs"
}
```

Blocks are automatically prefixed with the tenant code to ensure tenant isolation.

## Error Handling

The extractor is designed to **never crash**. If it encounters issues:

- Generates fallback JSON structures
- Logs warnings to `manifest.json`
- Continues processing remaining pages/components
- Always produces valid JSON output

## Copying to CMS Repo

After extraction, copy the generated sync pack to your CMS repository:

```bash
# From CMS repo root
cp -r ../cmsftiaxesite/src/sync-pack/kallitechnia ./sync-packs/kallitechnia
```

Then use the CMS sync engine to import the pack.

## Limitations

- **Dynamic Routes**: `[slug]` routes are not extracted (only static routes)
- **Component Parsing**: Complex component structures may require manual adjustment
- **Assets**: External URLs are listed but not downloaded (CMS uploader handles this)
- **TypeScript Complexity**: Very complex TypeScript expressions may not parse correctly

## Troubleshooting

### No pages extracted

- Check that `src/app/page.tsx` exists
- Verify static routes are in `src/app/*/page.tsx` format
- Check `manifest.json` for warnings

### Blocks missing or incorrect

- Verify `sections` array exists in page files
- Check that block types match expected format
- Review warnings in `manifest.json`

### Assets not detected

- Ensure image URLs are in string format (not variables)
- Check that images are in common fields: `backgroundImage`, `image`, `images[]`

## Development

The extractor uses:
- TypeScript Compiler API for parsing TSX files
- AST traversal for extracting component props
- Regex fallback for complex expressions

To improve extraction accuracy, update the `COMPONENT_REGISTRY` in `extract.ts` to add new component mappings.

