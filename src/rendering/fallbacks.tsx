/**
 * Fallback UI Components
 * 
 * Simple, safe components used when content is missing or invalid
 */

export function MissingImage({ alt }: { alt?: string }) {
  return (
    <div
      style={{
        width: '100%',
        aspectRatio: '16/9',
        backgroundColor: '#f3f4f6',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#9ca3af',
        fontSize: '0.875rem',
      }}
    >
      {alt || 'Image not available'}
    </div>
  )
}

export function EmptyRichText() {
  return null // Render nothing for empty rich text
}

export function UnknownSection({ blockType }: { blockType: string }) {
  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <div
      style={{
        padding: '1rem',
        margin: '1rem 0',
        backgroundColor: '#fef3c7',
        border: '1px solid #fbbf24',
        borderRadius: '0.375rem',
        fontSize: '0.875rem',
        color: '#92400e',
      }}
    >
      <strong>Unknown Block Type:</strong> {blockType}
      <br />
      <small>This block type is not registered in the renderer.</small>
    </div>
  )
}

