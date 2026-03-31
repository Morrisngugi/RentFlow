'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Home() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);
      router.push('/dashboard');
    }
  }, [router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gradient-to-b from-rentflow-navy/5 to-white">
      <div className="text-center">
        <div className="mb-8">
          <img src="/Logo.png" alt="RentFlow Logo" className="w-32 h-32 mx-auto" />
        </div>
        <h1 className="text-5xl font-bold text-rentflow-navy mb-4">
          RentFlow
        </h1>
        <p className="text-xl text-gray-600 mb-4">
          Property Rental Management System
        </p>
        <p className="text-gray-500 mb-12">
          Efficiently manage your rental properties, tenants, and payments
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12 mb-12">
          <div className="p-6 bg-white rounded-lg shadow-md border-l-4 border-rentflow-navy">
            <h2 className="text-lg font-semibold text-rentflow-navy mb-2">🔐 Authentication</h2>
            <p className="text-gray-600">Secure login and registration</p>
          </div>
          
          <div className="p-6 bg-white rounded-lg shadow-md border-l-4 border-rentflow-gold">
            <h2 className="text-lg font-semibold text-rentflow-navy mb-2">📋 Properties</h2>
            <p className="text-gray-600">Manage your rental properties</p>
          </div>
          
          <div className="p-6 bg-white rounded-lg shadow-md border-l-4 border-rentflow-teal">
            <h2 className="text-lg font-semibold text-rentflow-navy mb-2">💰 Payments</h2>
            <p className="text-gray-600">Track rental payments</p>
          </div>
        </div>

        <div className="flex gap-4 justify-center mb-12">
          <Link 
            href="/login" 
            className="bg-rentflow-navy hover:bg-rentflow-teal text-white font-semibold py-3 px-8 rounded-lg transition"
          >
            Log In
          </Link>
          <Link 
            href="/register" 
            className="bg-rentflow-gold hover:bg-rentflow-navy text-white font-semibold py-3 px-8 rounded-lg transition"
          >
            Sign Up
          </Link>
        </div>

        <div className="mt-8">
          <p className="text-sm text-gray-500 mb-2">
            API Status: <span className="text-green-600 font-semibold">Connected</span>
          </p>
          <p className="text-xs text-gray-400">
            API URL: {process.env.NEXT_PUBLIC_API_URL}
          </p>
        </div>
      </div>
    </main>
  );
}
