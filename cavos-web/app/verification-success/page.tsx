'use client';

import { useSearchParams } from 'next/navigation';
import { Header } from '@/components/Header';

export default function VerificationSuccessPage() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email');

  return (
    <main className="min-h-screen bg-[#FFFFFF]">
      <Header />
      <div className="pt-24 md:pt-32 pb-12 md:pb-20 px-4 md:px-6 flex items-center justify-center min-h-screen">
        <div className="w-full max-w-md">
          <div className="bg-white border border-black/10 rounded-2xl p-6 md:p-8 shadow-sm text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-semibold mb-2">Email Verified</h1>
            <p className="text-black/60 mb-6">
              Your email{' '}
              {email && (
                <span className="font-medium text-black">{email}</span>
              )}{' '}
              has been successfully verified.
            </p>
            <p className="text-black/60 mb-6">
              You can now close this window and return to the application to log
              in.
            </p>
            <button
              onClick={() => window.close()}
              className="w-full px-8 py-3.5 bg-black text-white rounded-full font-medium hover:bg-black/90 transition-all"
            >
              Close Window
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
