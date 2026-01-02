#!/usr/bin/env node
/**
 * Create Forms Script
 * 
 * Creates contact and registration forms for kallitechnia tenant
 * 
 * Usage:
 *   tsx src/scripts/createForms.ts
 */

import { config as dotenvConfig } from 'dotenv'
import { existsSync } from 'node:fs'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getPayload } from 'payload'

// Load environment variables
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '../..')
const envPath = path.join(projectRoot, '.env')
const envLocalPath = path.join(projectRoot, '.env.local')

if (existsSync(envPath)) {
  dotenvConfig({ path: envPath })
}
if (existsSync(envLocalPath)) {
  dotenvConfig({ path: envLocalPath, override: true })
}

// Dynamically import config AFTER env vars are loaded
const configModule = await import('@payload-config')
const config = configModule.default

async function createForms() {
  const payload = await getPayload({ config })

  try {
    // Find kallitechnia tenant
    const tenantResult = await payload.find({
      collection: 'tenants',
      where: {
        code: {
          equals: 'kallitechnia',
        },
      },
      limit: 1,
    })

    if (tenantResult.docs.length === 0) {
      console.error('❌ Tenant "kallitechnia" not found. Please sync the site first.')
      process.exit(1)
    }

    const tenant = tenantResult.docs[0]

    // Contact Form
    const contactFormData = {
      tenant: tenant.id,
      name: 'Contact Form',
      slug: 'contact',
      status: 'active',
      fields: [
        {
          type: 'text',
          label: 'Όνομα',
          name: 'firstName',
          required: true,
          placeholder: 'Το όνομά σας',
        },
        {
          type: 'text',
          label: 'Επώνυμο',
          name: 'lastName',
          required: true,
          placeholder: 'Το επώνυμό σας',
        },
        {
          type: 'email',
          label: 'Email',
          name: 'email',
          required: true,
          placeholder: 'email@example.com',
        },
        {
          type: 'tel',
          label: 'Τηλέφωνο',
          name: 'phone',
          required: false,
          placeholder: '+30 123 456 7890',
        },
        {
          type: 'text',
          label: 'Θέμα',
          name: 'subject',
          required: true,
          placeholder: 'Πώς μπορούμε να σας βοηθήσουμε;',
        },
        {
          type: 'textarea',
          label: 'Μήνυμα',
          name: 'message',
          required: true,
          placeholder: 'Γράψτε το μήνυμά σας εδώ...',
        },
      ],
      successMessage: 'Ευχαριστούμε! Το μήνυμά σας στάλθηκε επιτυχώς.',
    }

    // Registration Form
    const registrationFormData = {
      tenant: tenant.id,
      name: 'Registration Form',
      slug: 'registration',
      status: 'active',
      fields: [
        {
          type: 'text',
          label: 'Όνομα Παιδιού',
          name: 'childFirstName',
          required: true,
          placeholder: 'Εισάγετε το όνομα του παιδιού',
        },
        {
          type: 'text',
          label: 'Επώνυμο',
          name: 'childLastName',
          required: true,
          placeholder: 'Εισάγετε το επώνυμο του παιδιού',
        },
        {
          type: 'number',
          label: 'Ηλικία',
          name: 'age',
          required: true,
          placeholder: 'Εισάγετε την ηλικία',
        },
        {
          type: 'text',
          label: 'Όνομα Γονέα',
          name: 'parentName',
          required: true,
          placeholder: 'Εισάγετε το όνομα του γονέα',
        },
        {
          type: 'tel',
          label: 'Τηλέφωνο',
          name: 'phone',
          required: true,
          placeholder: '+30 123 456 7890',
        },
        {
          type: 'email',
          label: 'Email',
          name: 'email',
          required: true,
          placeholder: 'email@example.com',
        },
        {
          type: 'select',
          label: 'Επιλογή Τμήματος',
          name: 'department',
          required: true,
          placeholder: 'Επιλέξτε τμήμα',
          options: [
            { label: 'Καλλιτεχνική Γυμναστική', value: 'artistic' },
            { label: 'Ρυθμική Γυμναστική', value: 'rhythmic' },
            { label: 'Προαγωνιστικά Τμήματα', value: 'precompetitive' },
            { label: 'Παιδικά Τμήματα', value: 'children' },
            { label: 'Γυμναστική για Όλους', value: 'gfa' },
            { label: 'Adults Group GfA', value: 'adults' },
          ],
        },
        {
          type: 'textarea',
          label: 'Μήνυμα',
          name: 'message',
          required: false,
          placeholder: 'Πείτε μας περισσότερα για το παιδί σας ή τυχόν ερωτήσεις...',
        },
        {
          type: 'checkbox',
          label: 'Αποδέχομαι τους Όρους Χρήσης και την Πολιτική Απορρήτου',
          name: 'terms',
          required: true,
        },
      ],
      successMessage: 'Ευχαριστούμε! Η εγγραφή σας υποβλήθηκε επιτυχώς.',
    }

    // Check if forms already exist
    const existingContact = await payload.find({
      collection: 'forms',
      where: {
        and: [
          { tenant: { equals: tenant.id } },
          { slug: { equals: 'contact' } },
        ],
      },
      limit: 1,
    })

    const existingRegistration = await payload.find({
      collection: 'forms',
      where: {
        and: [
          { tenant: { equals: tenant.id } },
          { slug: { equals: 'registration' } },
        ],
      },
      limit: 1,
    })

    // Create or update contact form
    if (existingContact.docs.length > 0) {
      console.log(`✓ Updating contact form: ${existingContact.docs[0].id}`)
      await payload.update({
        collection: 'forms',
        id: existingContact.docs[0].id,
        data: contactFormData,
      })
    } else {
      console.log(`✓ Creating contact form`)
      await payload.create({
        collection: 'forms',
        data: contactFormData,
      })
    }

    // Create or update registration form
    if (existingRegistration.docs.length > 0) {
      console.log(`✓ Updating registration form: ${existingRegistration.docs[0].id}`)
      await payload.update({
        collection: 'forms',
        id: existingRegistration.docs[0].id,
        data: registrationFormData,
      })
    } else {
      console.log(`✓ Creating registration form`)
      await payload.create({
        collection: 'forms',
        data: registrationFormData,
      })
    }

    console.log('\n✅ Forms created/updated successfully!')
    console.log('   Contact form slug: contact')
    console.log('   Registration form slug: registration')
  } catch (error) {
    console.error('❌ Failed to create forms:', error)
    process.exit(1)
  } finally {
    process.exit(0)
  }
}

createForms().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
