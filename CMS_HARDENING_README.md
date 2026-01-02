# CMS Hardening & Tenant-Unique Blocks System

This document explains the CMS hardening features and how to work with tenant-unique blocks.

## Overview

The CMS has been hardened to prevent editors from breaking the site, with comprehensive field validation, defaults, conditional UI, and structural guardrails. Each tenant has its own unique block set that can evolve independently.

## Features

### 1. Field Guards & Defaults

All block fields have:
- **Default values**: Empty strings, empty arrays, false booleans
- **Validation**: URL validation, max length, required fields
- **Helpful error messages**: Clear, editor-friendly validation errors

### 2. Conditional Admin UI

Fields are organized in tabs and shown conditionally:
- **Hero block**: Content / Media / Actions tabs
- **CTA block**: Content / Button tabs
- **Image Gallery**: Captions shown only when enabled
- **Header**: Top bar text shown only when top bar is enabled

### 3. Block Presets

Blocks are pre-filled with safe defaults when added:
- All required fields have defaults
- Optional fields are empty but safe
- Schema version is automatically set

### 4. Structural Guardrails

- **Homepages**: Warns if no hero block (doesn't fail)
- **Pages**: Warns if no sections (doesn't fail)
- **Blocks**: Validated before save, normalized automatically

### 5. Block Versioning

Each block has a `schemaVersion` field:
- Default: 1
- Used for future migrations
- Blocks are normalized before save
- Frontend handles missing fields gracefully

### 6. Preview System

Draft content can be previewed:
```
/preview?tenant=kallitechnia&slug=about&collection=pages
/preview?tenant=kallitechnia&collection=homepages
```

Requires authentication (Payload admin session).

### 7. Forms Builder

Two collections:
- **Forms**: Define form structure (fields, validation, success message)
- **FormSubmissions**: Store submissions with metadata

Submit via API:
```bash
POST /api/forms/submit
{
  "formSlug": "contact",
  "data": {
    "name": "John Doe",
    "email": "john@example.com",
    "message": "Hello"
  }
}
```

## Adding a New Tenant Block Set

### Step 1: Create Block Definitions

Create files in `src/tenants/<tenantCode>/blocks/`:

```typescript
// src/tenants/mytenant/blocks/customBlock.ts
import type { Block } from 'payload'
import { validateUrl, validateMaxLength } from '../../../utils/blockValidation'

export const mytenantCustomBlock: Block = {
  slug: 'mytenant.customBlock',
  labels: {
    singular: 'Custom Block',
    plural: 'Custom Blocks',
  },
  fields: [
    {
      name: '__deprecated',
      type: 'checkbox',
      defaultValue: false,
      admin: { hidden: true },
    },
    {
      name: 'schemaVersion',
      type: 'number',
      defaultValue: 1,
      admin: { hidden: true },
    },
    {
      name: 'title',
      type: 'text',
      defaultValue: '',
      validate: validateMaxLength(100, 'Title'),
      admin: {
        description: 'Block title (max 100 characters)',
      },
    },
    // ... more fields
  ],
}
```

### Step 2: Export Blocks

Update `src/tenants/<tenantCode>/index.ts`:

```typescript
import { mytenantCustomBlock } from './blocks/customBlock'

export const tenantCode = 'mytenant'
export const mytenantBlocks = [mytenantCustomBlock]
```

### Step 3: Create Schema

Create `src/tenants/<tenantCode>/schema.ts`:

```typescript
export const tenantCode = 'mytenant'
export const allowedBlocks = ['mytenant.customBlock'] as const
```

### Step 4: Create Renderer

Create `src/tenants/<tenantCode>/renderers/customBlock.tsx`:

```typescript
'use client'
import type { BlockRendererProps } from '../../../rendering/registry'

export function MytenantCustomBlock({ blockType, ...props }: BlockRendererProps) {
  // Render logic
  return <div>...</div>
}
```

Update `src/tenants/<tenantCode>/renderers/index.ts`:

```typescript
import { MytenantCustomBlock } from './customBlock'

export const mytenantRenderers = {
  'mytenant.customBlock': MytenantCustomBlock,
}
```

### Step 5: Register in Loader

Update `src/utils/tenantBlocksLoader.ts`:

```typescript
import { mytenantBlocks } from '../tenants/mytenant'

export function getTenantBlocks(tenantCode: string): Block[] {
  switch (tenantCode) {
    case 'mytenant':
      return mytenantBlocks
    // ... other tenants
  }
}
```

### Step 6: Register Renderer

Update `src/rendering/registry.ts`:

```typescript
import { mytenantRenderers } from '../tenants/mytenant/renderers'

registerTenantRenderers('mytenant', mytenantRenderers)
```

### Step 7: Update Registry

Update `src/tenantRegistry.ts`:

```typescript
import { mytenantBlocks } from './tenants/mytenant'

export const TENANTS = ['kallitechnia', 'ftiaxesite', 'mytenant'] as const
export const tenantBlocks = [...kallitechniaBlocks, ...ftiaxesiteBlocks, ...mytenantBlocks]
```

## Adding a New Block Type to Existing Tenant

### Step 1: Create Block Definition

Create `src/tenants/<tenantCode>/blocks/newBlock.ts` following the pattern above.

### Step 2: Export from Index

Add to `src/tenants/<tenantCode>/index.ts`:

```typescript
import { newBlock } from './blocks/newBlock'
export const <tenantCode>Blocks = [..., newBlock]
```

### Step 3: Update Schema

Add to `src/tenants/<tenantCode>/schema.ts`:

```typescript
export const allowedBlocks = [..., '<tenantCode>.newBlock'] as const
```

### Step 4: Create Renderer

Create renderer in `src/tenants/<tenantCode>/renderers/newBlock.tsx` and register in `index.ts`.

### Step 5: Add Preset

Update `src/utils/blockPresets.ts`:

```typescript
export function createBlockPreset(blockType: string): BlockPreset {
  const presets = {
    // ... existing
    '<tenantCode>.newBlock': {
      blockType: '<tenantCode>.newBlock',
      // ... defaults
    },
  }
}
```

### Step 6: Add Normalization

Update `src/utils/blockNormalization.ts`:

```typescript
switch (blockType) {
  // ... existing cases
  case '<tenantCode>.newBlock':
    // Set defaults
    break
}
```

## Preview System

### How It Works

1. Editor creates/edits content in Payload admin
2. Content is saved as draft
3. Editor clicks preview button (or uses preview URL)
4. Preview route checks authentication
5. Fetches draft content
6. Renders with SafeSections

### Preview URLs

- **Page**: `/preview?tenant=kallitechnia&slug=about&collection=pages`
- **Homepage**: `/preview?tenant=kallitechnia&collection=homepages`

### Authentication

Preview requires Payload admin session (cookie-based). Users must be logged into admin panel.

## Forms Builder

### Creating a Form

1. Go to Payload admin → Forms
2. Create new form
3. Set name, slug, tenant
4. Add fields (type, label, required, options)
5. Set success message and optional redirect URL
6. Set status to "Active"

### Submitting Forms

```javascript
// Frontend code
const response = await fetch('/api/forms/submit', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    formSlug: 'contact',
    data: {
      name: 'John Doe',
      email: 'john@example.com',
      message: 'Hello',
    },
  }),
})

const result = await response.json()
if (result.success) {
  if (result.redirectUrl) {
    window.location.href = result.redirectUrl
  } else {
    alert(result.message)
  }
}
```

### Viewing Submissions

Go to Payload admin → Form Submissions to view all submissions with metadata (IP, user agent, timestamp).

## Testing

Run validation tests:

```bash
npm run test:int
```

Tests cover:
- URL validation (rejects dangerous protocols)
- Max length validation
- Min items validation
- Block normalization
- Default values

## Best Practices

1. **Always add defaults** to block fields
2. **Use validation** for critical fields (URLs, lengths)
3. **Group fields** in tabs for better UX
4. **Use conditional fields** to reduce clutter
5. **Add schemaVersion** to all blocks
6. **Test blocks** in admin before deploying
7. **Use presets** when adding blocks programmatically
8. **Normalize blocks** before saving (automatic via hooks)

## Troubleshooting

### Block not showing in admin

- Check block is exported from tenant index.ts
- Check block is in tenantBlocks array
- Check block slug matches pattern: `<tenantCode>.<type>`
- Regenerate types: `npm run generate:types`

### Validation errors

- Check field validation functions
- Check field requirements
- Check field types match

### Preview not working

- Check user is authenticated
- Check tenant code is correct
- Check content exists (including drafts)
- Check collection name is correct

### Forms not submitting

- Check form status is "Active"
- Check form slug is correct
- Check field names match form definition
- Check validation rules

