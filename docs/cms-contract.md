# CMS → Frontend Contract

This document defines the contract between the CMS (Payload) and the frontend renderer. It ensures that editors cannot break the frontend regardless of what they do.

## Principles

1. **All fields are optional at the frontend level** - Frontend handles missing/empty values gracefully
2. **All fields have safe defaults** - CMS provides defaults to prevent undefined values
3. **Validation prevents invalid data** - CMS rejects dangerous/invalid values before save
4. **Tenant isolation is enforced** - Content is always scoped to a tenant
5. **Versioning preserves history** - Drafts never affect published content

## Block Types

### `kallitechnia.hero`

**Purpose**: Hero section with title, subtitle, background image, and optional CTA.

**Fields**:
- `blockType`: `"kallitechnia.hero"` (readOnly, auto-set)
- `schemaVersion`: `number` (default: 1, readOnly)
- `__deprecated`: `boolean` (default: false, hidden)
- `title`: `string` (default: "", max 120 chars)
- `subtitle`: `string` (default: "", max 240 chars)
- `backgroundImage`: `Media | null` (optional, fallback to gradient)
- `hasCTA`: `boolean` (default: false)
- `ctaLabel`: `string` (default: "", max 50 chars, shown only if hasCTA=true)
- `ctaUrl`: `string` (default: "", validated URL, shown only if hasCTA=true)

**Frontend Expectations**:
- If title/subtitle empty → render empty string
- If backgroundImage missing → use gradient fallback
- If hasCTA=false or ctaUrl invalid → hide CTA button
- All fields safe to be empty

**Validation**:
- URLs must start with `/`, `http://`, or `https://`
- Rejects `javascript:`, `data:`, `vbscript:`, `file:`
- Text length limits enforced

---

### `kallitechnia.richText`

**Purpose**: Rich text content using Lexical editor.

**Fields**:
- `blockType`: `"kallitechnia.richText"` (readOnly, auto-set)
- `schemaVersion`: `number` (default: 1, readOnly)
- `__deprecated`: `boolean` (default: false, hidden)
- `content`: `LexicalDocument` (default: empty root with empty children array)

**Frontend Expectations**:
- If content empty or invalid → render nothing (EmptyRichText component)
- Lexical document structure always valid (even if empty)
- Safe to render empty rich text blocks

**Validation**:
- Content always has valid Lexical structure
- Empty content is valid (empty children array)

---

### `kallitechnia.imageGallery`

**Purpose**: Responsive image gallery with optional captions.

**Fields**:
- `blockType`: `"kallitechnia.imageGallery"` (readOnly, auto-set)
- `schemaVersion`: `number` (default: 1, readOnly)
- `__deprecated`: `boolean` (default: false, hidden)
- `enableCaptions`: `boolean` (default: false)
- `images`: `Array<{image: Media | null, caption: string}>` (default: [])

**Frontend Expectations**:
- If images array empty → render nothing
- If image missing in item → skip that item (MissingImage fallback)
- If enableCaptions=false → hide caption fields
- Caption max 200 chars if enabled
- Gallery adapts: 1 col (mobile), 2 cols (tablet), 3 cols (desktop)

**Validation**:
- Images array can be empty (frontend handles gracefully)
- Individual image items can have missing image (skipped)
- Caption length validated only if enableCaptions=true

---

### `kallitechnia.cta`

**Purpose**: Call-to-action section with title, description, and button.

**Fields**:
- `blockType`: `"kallitechnia.cta"` (readOnly, auto-set)
- `schemaVersion`: `number` (default: 1, readOnly)
- `__deprecated`: `boolean` (default: false, hidden)
- `title`: `string` (default: "", max 100 chars)
- `description`: `string` (default: "", max 300 chars)
- `buttonLabel`: `string` (default: "", max 50 chars)
- `buttonUrl`: `string` (default: "", validated URL)

**Frontend Expectations**:
- If all fields empty → render nothing
- If buttonUrl missing/invalid → show disabled button or hide
- All fields safe to be empty

**Validation**:
- URLs validated (rejects dangerous protocols)
- Text length limits enforced

---

## Collections

### Pages

**Fields**:
- `tenant`: `Tenant` (required, readOnly after creation, auto-scoped)
- `title`: `string` (required)
- `slug`: `string` (required, unique per tenant)
- `sections`: `Block[]` (default: [], can be empty)
- `schemaVersion`: `number` (default: 1, readOnly)
- `status`: `"draft" | "published"` (default: "published", required)
- `seo.title`: `string` (default: "", max 60 chars recommended)
- `seo.description`: `string` (default: "", max 160 chars recommended)

**Frontend Expectations**:
- If sections empty → page renders with title only
- Only published pages are shown (drafts isolated)
- SEO fields optional (page title used if SEO title missing)

**Versioning**:
- Drafts enabled (max 15 versions per doc)
- Published content is what frontend reads
- Drafts only visible in admin/preview

---

### Homepages

**Fields**:
- `tenant`: `Tenant` (required, unique, readOnly after creation)
- `sections`: `Block[]` (default: [], can be empty)
- `schemaVersion`: `number` (default: 1, readOnly)
- `status`: `"draft" | "published"` (default: "published", required)
- `seo.title`: `string` (default: "", max 60 chars recommended)
- `seo.description`: `string` (default: "", max 160 chars recommended)

**Frontend Expectations**:
- If sections empty → homepage shows empty state
- Only published homepages are shown
- One homepage per tenant (unique constraint)

**Versioning**:
- Drafts enabled (max 15 versions per doc)
- Published content is what frontend reads

---

### Headers

**Fields**:
- `tenant`: `Tenant` (required, unique, readOnly after creation)
- `logo`: `Media | null` (optional)
- `navigationMenu`: `NavigationMenu | null` (optional)
- `enableTopBar`: `boolean` (default: false)
- `topBarText`: `string` (default: "", max 100 chars, shown only if enableTopBar=true)

**Frontend Expectations**:
- All fields optional
- If logo missing → no logo shown
- If navigationMenu missing → no menu shown
- Top bar shown only if enableTopBar=true

---

### Footers

**Fields**:
- `tenant`: `Tenant` (required, unique, readOnly after creation)
- `copyrightText`: `string` (default: "", max 200 chars)
- `socialLinks`: `Array<{platform: string, url: string}>` (default: [])

**Frontend Expectations**:
- All fields optional
- If copyrightText empty → no copyright shown
- If socialLinks empty → no social links shown
- URLs validated (rejects dangerous protocols)

---

### NavigationMenus

**Fields**:
- `tenant`: `Tenant` (required, readOnly after creation)
- `title`: `string` (required, max 50 chars)
- `items`: `Array<NavigationItem>` (default: [])

**NavigationItem**:
- `label`: `string` (required, max 50 chars)
- `type`: `"internal" | "external"` (required, default: "internal")
- `page`: `Page | null` (shown only if type="internal")
- `url`: `string` (required if type="external", validated URL)
- `openInNewTab`: `boolean` (default: false)

**Frontend Expectations**:
- If items empty → menu renders empty
- Internal links use page relationship
- External links use URL (validated)
- Invalid URLs rejected by CMS

---

### Media

**Fields**:
- `tenant`: `Tenant` (required, readOnly after creation)
- `alt`: `string` (required, max 200 chars)

**Frontend Expectations**:
- Alt text always present (required for accessibility)
- Media always scoped to tenant

---

## Tenant Isolation

**Guarantees**:
- All content (Pages, Homepages, Headers, Footers, NavigationMenus, Media) is tenant-scoped
- Tenant field is readOnly after creation
- Editors cannot assign content to another tenant
- Access control enforces tenant filtering

**Implementation**:
- Tenant field in sidebar (readOnly)
- Access control filters by user's tenant
- Super admins can see all tenants

---

## Versioning & Drafts

**Pages & Homepages**:
- Versions enabled (max 15 per document)
- Drafts isolated from published content
- Frontend only reads published content
- Preview route allows viewing drafts (authenticated only)

**Safety**:
- Drafts never break frontend (frontend doesn't read them)
- Published content is always valid (validation before publish)
- Version history preserved

---

## Validation Rules

### URLs
- Must start with `/` (internal), `http://`, or `https://`
- Rejects: `javascript:`, `data:`, `vbscript:`, `file:`
- Empty URLs allowed (optional fields)

### Text Length
- Titles: 100-120 chars max (varies by field)
- Descriptions: 200-300 chars max (varies by field)
- Labels: 50 chars max
- SEO: 60 chars (title), 160 chars (description) recommended

### Required Fields
- Only truly required fields are enforced (title, slug, tenant, alt text)
- All block fields are optional (safe defaults provided)
- Arrays can be empty (frontend handles gracefully)

---

## Safety Guarantees

✅ **A page with zero blocks does not crash**
- Sections default to empty array
- Frontend renders page with title only

✅ **A block with all empty fields does not crash**
- All fields have safe defaults
- Frontend handles empty values gracefully

✅ **A block missing images does not crash**
- Images optional or skipped if missing
- Fallback components handle missing media

✅ **An invalid URL never renders as a link**
- URLs validated before save
- Invalid URLs rejected by CMS
- Frontend also sanitizes URLs

✅ **Editors cannot accidentally break layout logic**
- Conditional fields prevent irrelevant data
- Validation prevents invalid values
- ReadOnly fields prevent accidental changes

✅ **Unknown fields are ignored safely**
- Frontend only reads known fields
- Unknown fields don't cause errors

✅ **CMS changes never require frontend refactor**
- Block versioning allows schema evolution
- Normalization ensures backward compatibility
- Frontend handles missing fields gracefully

---

## Default Values Summary

| Field Type | Default Value |
|------------|---------------|
| `string` | `""` (empty string) |
| `boolean` | `false` |
| `array` | `[]` (empty array) |
| `object` | `{}` (empty object) or structure-specific default |
| `number` | `1` (for schemaVersion) or `0` |
| `richText` | Empty Lexical document with root structure |
| `upload` | `null` |
| `relationship` | `null` |

---

## Frontend Renderer Contract

The frontend `SafeSections` component guarantees:
- Unknown block types are skipped (dev warning only)
- Missing fields use safe defaults
- Invalid data types are handled gracefully
- Empty arrays/objects don't cause crashes
- Tenant mismatch blocks are filtered out

**No frontend changes required** when:
- Adding new block fields (optional)
- Changing field defaults
- Adding new block types (if properly registered)
- Modifying validation rules

---

## Migration Strategy

**Schema Versioning**:
- Each block has `schemaVersion` field
- Normalization ensures backward compatibility
- Old blocks upgraded in-memory (non-destructive)

**Block Evolution**:
- Never remove fields (mark as deprecated)
- Always add new fields as optional
- Provide defaults for all new fields
- Update normalization logic for new versions

---

## Editor Guidelines (Internal)

While editors don't need to know this contract, the CMS enforces it automatically:
- All fields have helpful descriptions
- Validation errors are clear and actionable
- Conditional fields reduce confusion
- Safe defaults prevent errors
- ReadOnly fields prevent accidental changes

---

## Developer Notes

**When Adding New Blocks**:
1. Add all fields with safe defaults
2. Add validation for critical fields (URLs, lengths)
3. Use conditional fields where appropriate
4. Add to normalization logic
5. Update this documentation

**When Modifying Existing Blocks**:
1. Never remove fields (deprecate instead)
2. Always add new fields as optional
3. Update schemaVersion if structure changes
4. Update normalization logic
5. Test with empty/invalid data

**Testing Checklist**:
- ✅ Empty blocks render without errors
- ✅ Missing fields don't crash
- ✅ Invalid URLs are rejected
- ✅ Empty arrays are handled
- ✅ Tenant isolation works
- ✅ Drafts don't affect published content

