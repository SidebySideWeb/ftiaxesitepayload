import React from 'react'
import './styles.css'

export const metadata = {
  description: 'Payload CMS - Content Management System',
  title: 'Payload CMS',
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  )
}
