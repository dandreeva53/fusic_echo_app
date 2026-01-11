import './globals.css';
import React from 'react';
import NavBar from '@/components/NavBar';

export const metadata = { title: 'FUSIC Echo', description: 'Training & supervision' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fullcalendar/core@6.1.15/index.css" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fullcalendar/daygrid@6.1.15/index.css" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fullcalendar/timegrid@6.1.15/index.css" />
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