'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import API from '@/lib/api';

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get('email') || '';

  const [email, setEmail] = useState(emailParam);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await API.post('/verify-email/', { email, code });
      setSuccess(response.data.message || 'Email verified successfully!');
      setTimeout(() => {
        router.push('/login?verified=true');
      }, 2000);
    } catch (err) {
      console.error('Verification error:', err);
      const data = err.response?.data;
      if (typeof data === 'string') {
        setError(data);
      } else if (data?.error) {
        setError(data.error);
      } else {
        setError('Verification failed. Please check your code and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 font-sans selection:bg-blue-500/30 flex items-center justify-center px-4 py-12 relative overflow-hidden">
      
      {/* Background Glow Accents */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-blue-600/20 via-indigo-600/15 to-cyan-500/20 blur-[150px] pointer-events-none rounded-full" />
      <div className="absolute top-10 left-10 w-80 h-80 bg-blue-500/10 blur-[120px] pointer-events-none" />

      <div className="relative w-full max-w-md">
        
        {/* Header */}
        <div className="text-center mb-8">
          <Link
            href="/"
            className="inline-block text-3xl font-extrabold tracking-tight text-white hover:opacity-95 transition focus:outline-none"
          >
            Skill<span className="text-blue-400">Link</span>
          </Link>
          <h1 className="text-xl font-bold text-white mt-3">Verify your email</h1>
          <p className="text-sm text-slate-400 mt-1">
            Enter the 6-digit code sent to your inbox to activate your account
          </p>
        </div>

        {/* Card Form */}
        <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-2xl shadow-2xl space-y-6">
          
          {/* Success Alert */}
          {success && (
            <div className="bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 text-sm px-4 py-3 rounded-xl flex items-center gap-3 animate-in fade-in">
              <span>✅</span>
              <span className="font-medium">{success} Redirecting to login...</span>
            </div>
          )}

          {/* Error Alert */}
          {error && (
            <div className="bg-rose-950/80 border border-rose-500/40 text-rose-200 text-sm px-4 py-3 rounded-xl flex items-start gap-3 animate-in fade-in">
              <span className="text-base leading-none">⚠️</span>
              <span className="flex-1 font-medium">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Email Address *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="john@example.com"
                className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
              />
            </div>

            {/* Verification Code Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Verification Code *
              </label>
              <input
                type="text"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                placeholder="123456"
                className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-3.5 py-3 text-center tracking-[0.5em] text-lg font-bold text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold py-3 rounded-xl transition-all duration-300 shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <span>Verify Account</span>
              )}
            </button>
          </form>

          {/* Footer Link */}
          <div className="pt-4 border-t border-white/5 text-center text-xs text-slate-400">
            Already verified?{' '}
            <Link
              href="/login"
              className="text-blue-400 hover:text-blue-300 font-semibold underline underline-offset-4 transition"
            >
              Log in
            </Link>
          </div>

        </div>

      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#070b14] flex items-center justify-center text-white">Loading...</div>}>
      <VerifyEmailForm />
    </Suspense>
  );
}