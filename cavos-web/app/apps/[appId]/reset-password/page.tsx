'use client';

import { Suspense, useEffect, useState } from 'react';
import Image from 'next/image';
import { useSearchParams, useParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

function AppResetPasswordContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const appId = params.appId as string;
  const oobCode = searchParams.get('oobCode');

  const [branding, setBranding] = useState<{ name: string; logo_url: string | null } | null>(null);
  const [loadingBranding, setLoadingBranding] = useState(true);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!appId) {
      setLoadingBranding(false);
      return;
    }
    fetch(`/api/oauth/firebase/app-branding?app_id=${encodeURIComponent(appId)}`)
      .then((res) => (res.ok ? res.json() : { name: 'App', logo_url: null }))
      .then((data) => {
        setBranding({ name: data.name || 'App', logo_url: data.logo_url || null });
      })
      .catch(() => setBranding({ name: 'App', logo_url: null }))
      .finally(() => setLoadingBranding(false));
  }, [appId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!oobCode) {
      setError('Invalid or expired reset link. Please request a new one.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/oauth/firebase/update-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oobCode, newPassword: password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Failed to update password.');
        return;
      }
      setSuccess(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!appId) {
    return (
      <div className="pt-12 md:pt-16 pb-12 md:pb-20 px-4 md:px-6 flex items-center justify-center min-h-screen">
        <div className="w-full max-w-md">
          <div className="bg-white border border-black/10 rounded-2xl p-6 md:p-8 shadow-sm text-center">
            <h1 className="text-xl font-semibold mb-2">Invalid link</h1>
            <p className="text-black/60">This password reset link is invalid. Please request a new one from the application.</p>
          </div>
        </div>
      </div>
    );
  }

  if (!oobCode && !success) {
    return (
      <div className="pt-12 md:pt-16 pb-12 md:pb-20 px-4 md:px-6 flex items-center justify-center min-h-screen">
        <div className="w-full max-w-md">
          <div className="bg-white border border-black/10 rounded-2xl p-6 md:p-8 shadow-sm text-center">
            <h1 className="text-xl font-semibold mb-2">Invalid or expired link</h1>
            <p className="text-black/60">This password reset link is invalid or has expired. Please request a new one from the application.</p>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="pt-12 md:pt-16 pb-12 md:pb-20 px-4 md:px-6 flex items-center justify-center min-h-screen">
        <div className="w-full max-w-md">
          <div className="bg-white border border-black/10 rounded-2xl p-6 md:p-8 shadow-sm text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-semibold mb-2">Password updated</h1>
            <p className="text-black/60 mb-6">You can now sign in with your new password.</p>
            <button onClick={() => window.close()} className="w-full px-8 py-3.5 bg-black text-white rounded-full font-medium hover:bg-black/90 transition-all">
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  const appName = branding?.name || 'App';

  return (
    <div className="pt-12 md:pt-16 pb-12 md:pb-20 px-4 md:px-6 flex items-center justify-center min-h-screen">
      <div className="w-full max-w-md">
        <div className="bg-white border border-black/10 rounded-2xl p-6 md:p-8 shadow-sm">
          {loadingBranding ? (
            <div className="text-center py-8 text-black/50">Loading...</div>
          ) : (
            <>
              <div className="text-center mb-6">
                {branding?.logo_url ? (
                  <div className="relative w-14 h-14 rounded-xl overflow-hidden mx-auto mb-3">
                    <Image src={branding.logo_url} alt={appName} fill className="object-cover" />
                  </div>
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-black/5 flex items-center justify-center mx-auto mb-3 text-black/40 font-semibold text-lg">
                    {appName.slice(0, 1)}
                  </div>
                )}
                <h1 className="text-xl font-semibold">Set new password</h1>
                <p className="text-sm text-black/60 mt-1">Choose a new password for your {appName} account.</p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  type="password"
                  label="New password"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                  disabled={submitting}
                  autoComplete="new-password"
                />
                <Input
                  type="password"
                  label="Confirm password"
                  placeholder="Repeat password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={submitting}
                  autoComplete="new-password"
                />
                {error && <p className="text-sm text-red-600">{error}</p>}
                <Button type="submit" variant="primary" className="w-full" loading={submitting} disabled={submitting}>
                  Update password
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AppResetPasswordPage() {
  return (
    <main className="min-h-screen bg-[#FFFFFF]">
      <Suspense
        fallback={
          <div className="pt-16 pb-12 md:pb-20 px-4 md:px-6 flex items-center justify-center min-h-screen">
            <div className="text-center text-black/50">Loading...</div>
          </div>
        }
      >
        <AppResetPasswordContent />
      </Suspense>
    </main>
  );
}
