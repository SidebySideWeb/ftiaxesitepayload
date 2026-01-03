import { getPayload } from 'payload'
import config from '@payload-config'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Form Submission API
 * 
 * POST /api/forms/submit
 * 
 * Body: {
 *   formSlug: string
 *   data: Record<string, any>
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { formSlug, data } = body

    if (!formSlug || !data) {
      return NextResponse.json(
        { error: 'formSlug and data are required' },
        { status: 400 },
      )
    }

    const payload = await getPayload({ config })

    // Find form
    const formResult = await payload.find({
      collection: 'forms',
      where: {
        and: [
          {
            slug: {
              equals: formSlug,
            },
          },
          {
            status: {
              equals: 'active',
            },
          },
        ],
      },
      limit: 1,
      depth: 0,
    })

    if (formResult.docs.length === 0) {
      return NextResponse.json({ error: 'Form not found or inactive' }, { status: 404 })
    }

    const form = formResult.docs[0]

    // Validate fields
    const validationErrors: Record<string, string> = {}

    for (const field of form.fields || []) {
      const value = data[field.name]

      // Check required
      if (field.required) {
        if (field.type === 'checkbox') {
          // For checkboxes, value must be true
          if (value !== true) {
            validationErrors[field.name] = `${field.label} is required`
            continue
          }
        } else {
          // For other fields, check if empty
          if (!value || value === '') {
            validationErrors[field.name] = `${field.label} is required`
            continue
          }
        }
      }

      // Type-specific validation
      if (value) {
        switch (field.type) {
          case 'email':
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            if (!emailRegex.test(value)) {
              validationErrors[field.name] = `${field.label} must be a valid email`
            }
            break

          case 'number':
            if (isNaN(Number(value))) {
              validationErrors[field.name] = `${field.label} must be a number`
            }
            break

          case 'select':
            const validOptions = (field.options || []).map((opt: any) => opt.value)
            if (!validOptions.includes(value)) {
              validationErrors[field.name] = `${field.label} has an invalid value`
            }
            break
        }
      }
    }

    if (Object.keys(validationErrors).length > 0) {
      return NextResponse.json(
        { error: 'Validation failed', errors: validationErrors },
        { status: 400 },
      )
    }

    // Get metadata
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || ''
    const userAgent = request.headers.get('user-agent') || ''

    // Create submission (tenant will be auto-assigned via hook)
    let submission
    try {
      submission = await payload.create({
        collection: 'form-submissions',
        data: {
          form: form.id,
          tenant: form.tenant, // Set tenant explicitly (hook will also set it)
          payload: data,
          metadata: {
            ip: ip.split(',')[0].trim(), // Get first IP if multiple
            userAgent,
          },
        },
      })
      console.log('[FormSubmit] Submission created:', submission.id, 'for tenant:', submission.tenant)
    } catch (createError) {
      console.error('[FormSubmit] Failed to create submission:', createError)
      return NextResponse.json(
        { error: 'Failed to save submission', details: createError instanceof Error ? createError.message : 'Unknown error' },
        { status: 500 },
      )
    }

    // Return success response
    const response: any = {
      success: true,
      message: form.successMessage || 'Thank you! Your submission has been received.',
    }

    // Add redirect URL if provided
    if (form.redirectUrl) {
      response.redirectUrl = form.redirectUrl
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.error('[FormSubmit] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}

