'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Always redirect to login as the entry point
    router.push('/login');
  }, [router]);

  return null;
}

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
