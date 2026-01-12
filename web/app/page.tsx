'use client';

import Link from 'next/link';

export default function Welcome() {
  return (
    <div className="min-h-screen bg-blue-500 text-white">
      <div className="mx-auto max-w-3xl px-4 py-8">
       <div className="flex justify-center mb-8">
          <img 
            src="/cardiology.png" 
            alt="ECHO Hub Logo"
            className="w-48 h-48 sm:w-64 sm:h-64 md:w-80 md:h-80 object-contain"
          />
        </div>
        <h1 className="text-center text-3xl font-bold">Welcome to the ECHO Hub</h1>

        <div className="bg-white text-black mt-6 rounded-2xl p-6 shadow">
          <p className="text-lg">Get started:</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Link href="/signup" className="rounded-xl bg-blue-600 text-white py-3 text-center font-semibold">
              Create your profile
            </Link>
            <Link href="/login" className="rounded-xl bg-gray-100 py-3 text-center font-semibold">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
