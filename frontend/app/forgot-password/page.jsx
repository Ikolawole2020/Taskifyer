'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import API from '@/lib/api';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await API.post('/password-reset/', { email });
      // Redirect to confirmation page and pass email along via query params
      router.push(`/reset-password?email=${encodeURIComponent(email)}`);
    } catch (err) {
      console.error('Password reset request error:', err);
      const errorMsg =
        err.response?.data?.error || err.response?.data?.email?.[0] || 'Failed to send reset code. Please check your email.';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 font-sans selection:bg-blue-500/30 flex items-center justify-center px-4 py-12 relative overflow-hidden">
      
      {/* Background Glow Accents */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-blue-600/20 via-cyan-500/15 to-indigo-600/20 blur-[140px] pointer-events-none rounded-full" />
      <div className="absolute top-10 right-10 w-72 h-72 bg-blue-500/10 blur-[100px] pointer-events-none" />

      <div className="relative w-full max-w-md">
        
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link
            href="/"
            className="inline-block text-3xl font-extrabold tracking-tight text-white hover:opacity-90 transition focus:outline-none"
          >
            Skill<span className="text-blue-400">Link</span>
          </Link>
          <h1 className="text-xl font-bold text-white mt-4">Reset your password</h1>
          <p className="text-sm text-slate-400 mt-1">
            Enter your email address and we&apos;ll send you a confirmation code
          </p>
        </div>

        {/* Form Container */}
        <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-2xl shadow-2xl space-y-6">
          
          {/* Error Banner */}
          {error && (
            <div className="bg-rose-950/80 border border-rose-500/40 text-rose-200 text-sm px-4 py-3 rounded-xl flex items-start gap-3 animate-in fade-in">
              <span className="text-base leading-none">⚠️</span>
              <span className="flex-1 font-medium">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Email Input */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError('');
                  }}
                  required
                  placeholder="Enter your registered email"
                  className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold py-3.5 rounded-xl transition-all duration-300 shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Sending code...</span>
                </>
              ) : (
                <span>Send Reset Code</span>
              )}
            </button>
          </form>

          {/* Back to Login Link */}
          <div className="pt-4 border-t border-white/5 text-center text-xs text-slate-400">
            Remembered your password?{' '}
            <Link
              href="/login"
              className="text-blue-400 hover:text-blue-300 font-semibold underline underline-offset-4 transition"
            >
              Log in
            </Link>
          </div>

        </div>

        {/* Footer Link */}
        <div className="text-center mt-8">
          <Link
            href="/"
            className="text-xs text-slate-500 hover:text-slate-400 transition"
          >
            ← Back to homepage
          </Link>
        </div>

      </div>
    </div>
  );
}