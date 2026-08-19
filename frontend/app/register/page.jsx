'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import API from '@/lib/api';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    phone_number: '',
    role: 'CUSTOMER',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleRoleSelect = (role) => {
    setFormData({ ...formData, role });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      await API.post('/register/', formData);
      setSuccess(true);
      setTimeout(() => {
        router.push(`/verify-email?email=${encodeURIComponent(formData.email)}`);
      }, 2000);
    } catch (err) {
      console.error('Registration error:', err);
      const data = err.response?.data;
      
      let message = 'Registration failed. Please check your details.';
      if (data) {
        if (typeof data === 'string') {
          message = data;
        } else {
          // Extract first validation error from Django object response
          const firstKey = Object.keys(data)[0];
          if (firstKey) {
            const val = data[firstKey];
            const detail = Array.isArray(val) ? val[0] : val;
            message = `${firstKey.replace('_', ' ')}: ${detail}`;
          }
        }
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // Basic Password Strength Calculator
  const getPasswordStrength = (pass) => {
    if (!pass) return { label: '', color: 'bg-transparent', width: 'w-0' };
    if (pass.length < 6) return { label: 'Weak', color: 'bg-rose-500', width: 'w-1/3' };
    if (pass.length < 10) return { label: 'Medium', color: 'bg-amber-500', width: 'w-2/3' };
    return { label: 'Strong', color: 'bg-emerald-500', width: 'w-full' };
  };

  const strength = getPasswordStrength(formData.password);

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 font-sans selection:bg-blue-500/30 flex items-center justify-center px-4 py-12 relative overflow-hidden">
      
      {/* Background Glow Accents */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-blue-600/20 via-indigo-600/15 to-cyan-500/20 blur-[150px] pointer-events-none rounded-full" />
      <div className="absolute top-10 left-10 w-80 h-80 bg-blue-500/10 blur-[120px] pointer-events-none" />

      <div className="relative w-full max-w-xl">
        
        {/* Header */}
        <div className="text-center mb-8">
          <Link
            href="/"
            className="inline-block text-3xl font-extrabold tracking-tight text-white hover:opacity-90 transition focus:outline-none"
          >
            Skill<span className="text-blue-400">Link</span>
          </Link>
          <h1 className="text-xl font-bold text-white mt-3">Create your account</h1>
          <p className="text-sm text-slate-400 mt-1">
            Connect with verified artisans or offer your professional services
          </p>
        </div>

        {/* Card Form */}
        <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-2xl shadow-2xl space-y-6">
          
          {/* Success Alert */}
          {success && (
            <div className="bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 text-sm px-4 py-3 rounded-xl flex items-center gap-3 animate-in fade-in">
              <span>✅</span>
              <span className="font-medium">Account created! Redirecting to email verification...</span>
            </div>
          )}

          {/* Error Alert */}
          {error && (
            <div className="bg-rose-950/80 border border-rose-500/40 text-rose-200 text-sm px-4 py-3 rounded-xl flex items-start gap-3 animate-in fade-in">
              <span className="text-base leading-none">⚠️</span>
              <span className="flex-1 font-medium capitalize">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Account Role Selection */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                I want to
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleRoleSelect('CUSTOMER')}
                  className={`p-3.5 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between ${
                    formData.role === 'CUSTOMER'
                      ? 'bg-blue-600/20 border-blue-500 text-white shadow-lg shadow-blue-500/10'
                      : 'bg-slate-950/60 border-white/10 text-slate-400 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="text-lg">🔍</span>
                    <span
                      className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        formData.role === 'CUSTOMER'
                          ? 'border-blue-400 bg-blue-500'
                          : 'border-slate-600'
                      }`}
                    >
                      {formData.role === 'CUSTOMER' && (
                        <span className="w-1.5 h-1.5 rounded-full bg-white" />
                      )}
                    </span>
                  </div>
                  <span className="text-xs font-bold block text-white">Hire Services</span>
                  <span className="text-[11px] text-slate-400">Book skilled artisans</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleRoleSelect('PROVIDER')}
                  className={`p-3.5 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between ${
                    formData.role === 'PROVIDER'
                      ? 'bg-blue-600/20 border-blue-500 text-white shadow-lg shadow-blue-500/10'
                      : 'bg-slate-950/60 border-white/10 text-slate-400 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="text-lg">🛠️</span>
                    <span
                      className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        formData.role === 'PROVIDER'
                          ? 'border-blue-400 bg-blue-500'
                          : 'border-slate-600'
                      }`}
                    >
                      {formData.role === 'PROVIDER' && (
                        <span className="w-1.5 h-1.5 rounded-full bg-white" />
                      )}
                    </span>
                  </div>
                  <span className="text-xs font-bold block text-white">Offer Services</span>
                  <span className="text-[11px] text-slate-400">Earn from your skills</span>
                </button>
              </div>
            </div>

            {/* Username & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Username *
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  placeholder="johndoe"
                  className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="john@example.com"
                  className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
                />
              </div>
            </div>

            {/* First & Last Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  First Name
                </label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  placeholder="John"
                  className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Last Name
                </label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  placeholder="Doe"
                  className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
                />
              </div>
            </div>

            {/* Phone Number */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Phone Number
              </label>
              <input
                type="tel"
                name="phone_number"
                value={formData.phone_number}
                onChange={handleChange}
                placeholder="+234 800 000 0000"
                className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Password *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={8}
                  placeholder="At least 8 characters"
                  className="w-full bg-slate-950/80 border border-white/10 rounded-xl pl-3.5 pr-11 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 focus:outline-none transition"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 1l22 22" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>

              {/* Password Strength Indicator */}
              {formData.password && (
                <div className="pt-1 space-y-1">
                  <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full transition-all duration-300 ${strength.color} ${strength.width}`} />
                  </div>
                  <p className="text-[10px] text-slate-400 text-right">
                    Strength: <span className="font-semibold text-slate-200">{strength.label}</span>
                  </p>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold py-3 rounded-xl transition-all duration-300 shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <span>Create Account</span>
              )}
            </button>
          </form>

          {/* Footer Link */}
          <div className="pt-4 border-t border-white/5 text-center text-xs text-slate-400">
            Already have an account?{' '}
            <Link
              href="/login"
              className="text-blue-400 hover:text-blue-300 font-semibold underline underline-offset-4 transition"
            >
              Log in
            </Link>
          </div>

        </div>

        {/* Back Link */}
        <div className="text-center mt-6">
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