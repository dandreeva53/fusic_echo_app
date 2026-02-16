import './globals.css'
import React from 'react'
import NavBar from '@/components/NavBar'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'FUSIC Echo',
  description: 'Training & supervision',
  manifest: '/manifest.json',
  themeColor: '#123E73',
  icons: {
    icon: '/icon-192.png',
    apple: '/icon-192.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <NavBar />
        <div className="max-w-5xl mx-auto">
          <main>{children}</main>
        </div>
      </body>
    </html>
  )
}