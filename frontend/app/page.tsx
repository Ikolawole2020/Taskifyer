'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import API from '@/lib/api';
import Navbar from '@/components/Navbar';

const categoryIcons: Record<string, string> = {
  electrician: '⚡',
  plumber: '🔧',
  cleaner: '🧹',
  'house cleaner': '🧹',
  barber: '✂️',
  carpenter: '🪚',
  painter: '🎨',
  ac: '❄️',
  'ac repair': '❄️',
  generator: '⚙️',
  mechanic: '🔩',
  tailor: '🧵',
  chef: '👨‍🍳',
  driver: '🚗',
  default: '🛠️',
};

const getCategoryIcon = (name = '') => {
  const key = name.toLowerCase();
  for (const [k, icon] of Object.entries(categoryIcons)) {
    if (key.includes(k)) return icon;
  }
  return categoryIcons.default;
};

function HomePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [categories, setCategories] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const query = searchParams.get('q') || '';

  useEffect(() => {
    if (query) setSearch(query);
  }, [query]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [categoriesRes, providersRes, servicesRes] = await Promise.all([
          API.get('/categories/'),
          API.get('/providers/'),
          API.get(query ? `/services/?search=${encodeURIComponent(query)}` : '/services/'),
        ]);
        setCategories(categoriesRes.data || []);
        setProviders(providersRes.data || []);
        setServices(servicesRes.data || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [query]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/?q=${encodeURIComponent(search.trim())}`);
    } else {
      router.push('/');
    }
  };

  const filteredServices =
    selectedCategory === 'All'
      ? services
      : services.filter(
          (s: any) => s.category?.name?.toLowerCase() === selectedCategory.toLowerCase()
        );

  const popularCategories = categories.slice(0, 8);
  const topProviders = providers.slice(0, 4);

  const getInitials = (name = '') =>
    name
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 font-sans overflow-x-hidden selection:bg-blue-500/30">
      <Navbar />

      {/* HERO SECTION */}
      <section className="relative pt-32 sm:pt-40 pb-20 overflow-hidden border-b border-white/5">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-blue-600/20 to-cyan-400/15 blur-[150px] pointer-events-none rounded-full" />
        <div className="absolute top-1/2 left-10 w-72 h-72 bg-purple-600/10 blur-[120px] pointer-events-none rounded-full" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold tracking-wide animate-pulse">
            <span>✨</span> Trusted Local Artisans & Service Professionals
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight">
            Book expert local pros for <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-indigo-400">
              any task, instantly.
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-400">
            From emergency repairs to home transformations and personal services—hire verified professionals with transparent pricing and live chat.
          </p>

          {/* SEARCH BAR */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto pt-2">
            <div className="flex items-center bg-slate-900/90 border border-white/15 rounded-2xl p-2 shadow-2xl backdrop-blur-xl focus-within:border-blue-500/50 transition duration-300">
              <span className="pl-4 text-slate-400 text-lg">🔍</span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="What service do you need today? (e.g. Plumber, AC Repair)"
                className="w-full px-4 py-3 bg-transparent text-sm sm:text-base text-white placeholder-slate-500 focus:outline-none"
              />
              <button
                type="submit"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-7 py-3.5 rounded-xl text-sm font-bold transition shadow-lg shadow-blue-600/25 shrink-0"
              >
                Explore
              </button>
            </div>
          </form>

          {/* TRUST BADGES MINI BAR */}
          <div className="pt-8 flex flex-wrap items-center justify-center gap-6 sm:gap-12 text-xs text-slate-400 font-medium">
            <div className="flex items-center gap-2">
              <span className="text-emerald-400 text-base">✓</span> Verified Background Pros
            </div>
            <div className="flex items-center gap-2">
              <span className="text-blue-400 text-base">🛡️</span> Secure Bookings
            </div>
            <div className="flex items-center gap-2">
              <span className="text-amber-400 text-base">★</span> Rated 4.9/5 by Customers
            </div>
          </div>
        </div>
      </section>

      {/* STICKY CATEGORY FILTER PILLS */}
      <section className="border-b border-white/5 bg-slate-950/80 sticky top-16 z-40 backdrop-blur-xl shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5">
          <div className="flex gap-2.5 overflow-x-auto scrollbar-none items-center">
            <button
              onClick={() => setSelectedCategory('All')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-200 ${
                selectedCategory === 'All'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 scale-105'
                  : 'bg-slate-900/80 text-slate-400 border border-white/10 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span>🏠</span> All Services
            </button>

            {categories.map((cat: any) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.name)}
                className={`flex items-center gap-2 px-4.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
                  selectedCategory === cat.name
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 scale-105'
                    : 'bg-slate-900/80 text-slate-400 border border-white/10 hover:text-white hover:bg-slate-800'
                }`}
              >
                <span>{getCategoryIcon(cat.name)}</span>
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* SERVICES GRID MARKETPLACE */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-extrabold text-white tracking-tight">
              {selectedCategory === 'All' ? 'Featured Services' : `${selectedCategory} Services`}
            </h2>
            <p className="text-xs text-slate-400 mt-1">Book top-rated professionals instantly</p>
          </div>
          <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-slate-900 border border-white/10 text-slate-300">
            {filteredServices.length} available
          </span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-72 bg-slate-900/40 rounded-3xl border border-white/5 animate-pulse" />
            ))}
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="bg-slate-900/30 border border-white/10 rounded-3xl p-16 text-center space-y-3 backdrop-blur-xl">
            <div className="text-4xl">🔍</div>
            <h3 className="text-lg font-bold text-white">No services found</h3>
            <p className="text-sm text-slate-400">Try selecting another category or searching different keywords.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredServices.map((service: any) => (
              <div
                key={service.id}
                onClick={() => router.push(`/services/${service.id}`)}
                className="group cursor-pointer bg-slate-900/60 border border-white/10 rounded-3xl overflow-hidden hover:border-blue-500/50 hover:bg-slate-900/90 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/10 flex flex-col justify-between"
              >
                <div>
                  <div className="relative overflow-hidden h-44 bg-slate-800">
                    {service.image ? (
                      <img
                        src={service.image}
                        alt={service.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl bg-gradient-to-br from-slate-800 to-slate-900">
                        {getCategoryIcon(service.category?.name)}
                      </div>
                    )}
                    <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-xs font-semibold text-white flex items-center gap-1.5">
                      <span>{getCategoryIcon(service.category?.name)}</span>
                      {service.category?.name || 'General'}
                    </div>
                  </div>

                  <div className="p-5 space-y-3">
                    <h3 className="font-bold text-white text-base line-clamp-1 group-hover:text-blue-400 transition">
                      {service.title}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-2">
                      {service.description || 'Professional and reliable service provider ready to assist you.'}
                    </p>
                  </div>
                </div>

                <div className="p-5 pt-0 flex items-center justify-between border-t border-white/5 mt-3">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 block font-semibold">Starting at</span>
                    <span className="text-base font-extrabold text-emerald-400">
                      ₦{Number(service.price || 0).toLocaleString()}
                    </span>
                  </div>
                  <span className="bg-blue-600/10 border border-blue-500/20 text-blue-400 px-3 py-1.5 rounded-xl text-xs font-bold group-hover:bg-blue-600 group-hover:text-white transition duration-200">
                    Book →
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* CATEGORY BROWSE TILES */}
      <section className="py-16 border-t border-white/5 bg-slate-950/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-extrabold text-white tracking-tight">Explore Categories</h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-4">
            {popularCategories.map((cat: any) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.name)}
                className="group p-5 rounded-3xl bg-slate-900/60 border border-white/10 hover:border-blue-500/40 hover:bg-slate-900 transition-all duration-300 text-center flex flex-col items-center justify-center space-y-3 shadow-lg"
              >
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-2xl group-hover:scale-110 transition duration-300">
                  {getCategoryIcon(cat.name)}
                </div>
                <h3 className="text-xs font-bold text-white group-hover:text-blue-300 transition truncate w-full">
                  {cat.name}
                </h3>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* TOP RATED PROS */}
      <section className="py-16 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-extrabold text-white tracking-tight">Top Rated Artisans</h2>
              <p className="text-xs text-slate-400 mt-1">Hire the highest-rated experts on BookNfix</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {topProviders.map((provider: any) => (
              <Link
                key={provider.id}
                href={`/providers/${provider.id}`}
                className="group p-5 rounded-3xl bg-slate-900/60 border border-white/10 hover:border-blue-500/40 hover:bg-slate-900 transition-all duration-300 space-y-4 shadow-xl"
              >
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center font-bold text-lg shrink-0 shadow-lg shadow-blue-600/20">
                    {getInitials(provider.user?.username || 'P')}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-white group-hover:text-blue-300 transition truncate text-base">
                      {provider.user?.username || 'Provider'}
                    </h3>
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                      <span>📍</span> {provider.city || 'Lagos'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-white/5 text-xs">
                  <span className="font-semibold text-amber-400 flex items-center gap-1">
                    ★ {provider.average_rating > 0 ? Number(provider.average_rating).toFixed(1) : 'New'}
                  </span>
                  <span className="text-blue-400 font-semibold group-hover:translate-x-1 transition duration-200">
                    View Profile →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/10 py-10 text-center text-xs text-slate-500 bg-slate-950/80">
        <p>© {new Date().getFullYear()} BookNfix Marketplace. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#070b14] text-white flex items-center justify-center font-bold text-lg">
          Loading BookNfix...
        </div>
      }
    >
      <HomePageContent />
    </Suspense>
  );
}