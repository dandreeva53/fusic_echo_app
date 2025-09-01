import './globals.css';
import React from 'react';

export const metadata = { title: 'FUSIC Echo', description: 'Training & supervision' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <div className="max-w-5xl mx-auto p-4">
          <header className="flex items-center justify-between py-4">
            <h1 className="text-xl font-semibold">FUSIC Echo</h1>
            <nav className="flex gap-3 text-sm">
              <a href="/login">Login</a>
              <a href="/profile">Profile</a>
              <a href="/directory">Directory</a>
              <a href="/availability">Availability</a>
              <a href="/logbook">Logbook</a>
              <a href="/knowledge">Knowledge</a>
            </nav>
          </header>
          <main>{children}</main>
        </div>
      </body>
    </html>
  )
}
