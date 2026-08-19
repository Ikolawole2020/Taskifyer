'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import API from '@/lib/api';
import Navbar from '@/components/Navbar';
import { getCurrentUser } from '@/lib/auth';
import PortfolioGallery from '@/components/PortfolioGallery';

export default function ProviderProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const [provider, setProvider] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || id === 'undefined') {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const [providerRes, reviewsRes, userRes] = await Promise.all([
          API.get(`/providers/${id}/`),
          API.get(`/reviews/?provider=${id}`).catch(() => ({ data: [] })),
          getCurrentUser().catch(() => null),
        ]);

        setProvider(providerRes.data);
        setCurrentUser(userRes);

        const providerReviews = Array.isArray(reviewsRes.data)
          ? reviewsRes.data.filter(
              (r) => r.provider === Number(id) || r.provider?.id === Number(id)
            )
          : [];
        setReviews(providerReviews);
      } catch (error) {
        console.error('Failed to load provider profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const getInitials = (name = '') =>
    name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070b14] text-slate-100 font-sans">
        <Navbar />
        <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-28 pb-20 space-y-8">
          <div className="h-64 bg-slate-900/60 rounded-3xl border border-white/5 animate-pulse" />
          <div className="h-48 bg-slate-900/60 rounded-3xl border border-white/5 animate-pulse" />
        </main>
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="min-h-screen bg-[#070b14] text-slate-100 font-sans">
        <Navbar />
        <main className="max-w-3xl mx-auto px-4 pt-32 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-white/10 text-slate-400 flex items-center justify-center mx-auto text-2xl font-bold">
            👤
          </div>
          <h2 className="text-2xl font-bold text-white">Provider Not Found</h2>
          <p className="text-sm text-slate-400">
            The service provider profile you are looking for does not exist or has been removed.
          </p>
          <button
            onClick={() => router.push('/')}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition shadow-lg shadow-blue-600/25 mt-2"
          >
            ← Back to Home
          </button>
        </main>
      </div>
    );
  }

  const username = provider.user?.username || 'Artisan';
  const isOwner = currentUser && currentUser.id === provider.user?.id;

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 font-sans selection:bg-blue-500/30 overflow-x-hidden">
      <Navbar />

      {/* Ambient Glow */}
      <div className="absolute top-24 left-1/2 -translate-x-1/2 w-full max-w-4xl h-72 bg-gradient-to-tr from-blue-600/15 via-cyan-500/10 to-indigo-600/10 blur-[120px] pointer-events-none rounded-full" />

      <main className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-28 pb-20 space-y-10">
        
        <div>
          <Link
            href="/"
            className="text-xs text-slate-400 hover:text-white transition inline-flex items-center gap-1"
          >
            ← Back to Search
          </Link>
        </div>

        {/* Provider Header */}
        <section className="bg-slate-900/80 border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-2xl shadow-2xl space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-white/10">
            
            <div className="flex items-start gap-4 sm:gap-5 min-w-0">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-white flex items-center justify-center font-extrabold text-xl sm:text-2xl shrink-0 shadow-lg shadow-blue-500/20">
                {getInitials(username)}
              </div>

              <div className="space-y-1.5 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight truncate">
                    {username}
                  </h1>
                  {provider.is_verified && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      Verified Pro
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-400 flex-wrap">
                  <span>📍 {provider.city || 'Lagos'}</span>
                  <span>•</span>
                  <span>
                    ⚡ {provider.years_of_experience || 1} year
                    {provider.years_of_experience !== 1 ? 's' : ''} experience
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-white/5 gap-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-extrabold text-amber-400">★</span>
                <span className="text-2xl font-extrabold text-white">
                  {provider.average_rating > 0
                    ? Number(provider.average_rating).toFixed(1)
                    : 'New'}
                </span>
              </div>

              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                  provider.is_available
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                }`}
              >
                {provider.is_available ? 'Available for Hiring' : 'Currently Busy'}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              About Provider
            </h3>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
              {provider.bio ||
                'This provider has not added a detailed biography yet, but is available for direct job bookings.'}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 pt-4 border-t border-white/5">
            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-white/5 text-center">
              <span className="text-[11px] text-slate-400 font-medium block">Jobs Completed</span>
              <span className="text-lg sm:text-xl font-bold text-white">
                {provider.total_jobs_completed || 0}
              </span>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-white/5 text-center">
              <span className="text-[11px] text-slate-400 font-medium block">Total Reviews</span>
              <span className="text-lg sm:text-xl font-bold text-blue-400">
                {provider.total_reviews || reviews.length}
              </span>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-white/5 text-center col-span-2 sm:col-span-1">
              <span className="text-[11px] text-slate-400 font-medium block">Service City</span>
              <span className="text-lg sm:text-xl font-bold text-emerald-400 truncate block">
                {provider.city || 'Lagos'}
              </span>
            </div>
          </div>
        </section>

        {/* Services Offered */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Services Offered
            </h2>
            <span className="text-xs font-semibold text-slate-400">
              {provider.services?.length || 0} Listed
            </span>
          </div>

          {provider.services && provider.services.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {provider.services.map((service) => (
                <div
                  key={service.id}
                  className="group relative bg-slate-900/60 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-xl flex flex-col hover:border-blue-500/40 hover:bg-slate-900/80 transition shadow-xl"
                >
                  {service.image ? (
                    <img
                      src={service.image}
                      alt={service.title}
                      className="w-full h-40 object-cover"
                    />
                  ) : (
                    <div className="w-full h-40 bg-slate-800 flex items-center justify-center text-slate-500 text-sm">
                      No Image
                    </div>
                  )}

                  <div className="p-5 sm:p-6 flex flex-col justify-between space-y-4 flex-1">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 truncate">
                          {service.category_name || service.category?.name || 'General'}
                        </span>
                        <span className="text-xs text-slate-400">
                          ⏱️ {service.duration_hours || 1} hr{service.duration_hours > 1 ? 's' : ''}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-white group-hover:text-blue-300 transition-colors">
                        {service.title}
                      </h3>

                      <p className="text-xs sm:text-sm text-slate-400 line-clamp-2 leading-relaxed">
                        {service.description || 'Professional execution with satisfaction guaranteed.'}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                      <span className="text-lg font-extrabold text-emerald-400">
                        ₦{Number(service.price || 0).toLocaleString()}
                      </span>
                      <Link
                        href={`/services/${service.id}`}
                        className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-semibold transition shadow-md shadow-blue-600/20"
                      >
                        Book Service →
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-slate-900/40 border border-white/10 rounded-3xl p-10 text-center backdrop-blur-xl">
              <p className="text-sm text-slate-400">This provider has no active service listings available.</p>
            </div>
          )}
        </section>

        {/* Portfolio Gallery Section */}
        <section className="bg-slate-900/40 border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-xl">
          <PortfolioGallery
            providerId={provider.id}
            images={provider.portfolio_images || []}
            isOwner={isOwner}
          />
        </section>

        {/* Reviews */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Client Reviews ({reviews.length})
            </h2>
          </div>

          {reviews.length === 0 ? (
            <div className="bg-slate-900/40 border border-white/10 rounded-3xl p-10 text-center backdrop-blur-xl">
              <p className="text-sm text-slate-400">No reviews recorded for this provider yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="bg-slate-900/60 border border-white/10 rounded-2xl p-5 sm:p-6 backdrop-blur-xl space-y-3 shadow-lg"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="font-semibold text-white text-sm">
                      {review.customer_name || review.customer?.username || 'Verified Customer'}
                    </div>

                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <span
                          key={i}
                          className={`text-sm ${
                            i < (review.rating || 5) ? 'text-amber-400' : 'text-slate-700'
                          }`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  </div>

                  {review.comment && (
                    <p className="text-slate-300 text-xs sm:text-sm leading-relaxed italic">
                      "{review.comment}"
                    </p>
                  )}

                  <div className="text-[10px] text-slate-500 pt-1">
                    {review.created_at
                      ? new Date(review.created_at).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })
                      : 'Recently submitted'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}