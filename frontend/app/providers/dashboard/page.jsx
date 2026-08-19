'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import API from '@/lib/api';
import Navbar from '@/components/Navbar';
import { getCurrentUser } from '@/lib/auth';

export default function ProviderDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        const currentUser = await getCurrentUser();

        if (!currentUser) {
          router.push('/login');
          return;
        }

        if (currentUser.role !== 'PROVIDER') {
          router.push('/');
          return;
        }

        setUser(currentUser);

        const [bookingsRes, servicesRes] = await Promise.all([
          API.get('/bookings/'),
          API.get('/services/?mine=true'),
        ]);

        setBookings(bookingsRes.data || []);
        setServices(servicesRes.data || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [router]);

  const pendingBookings = bookings.filter((b) => b.status === 'PENDING');
  const acceptedBookings = bookings.filter((b) => b.status === 'ACCEPTED');
  const completedBookings = bookings.filter((b) => b.status === 'COMPLETED');

  const totalEarnings = completedBookings.reduce(
    (sum, b) => sum + Number(b.price || 0),
    0
  );

  const activeServices = services.filter((s) => s.is_active).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070b14] text-white">
        <Navbar />
        <div className="max-w-6xl mx-auto px-4 pt-32 text-center text-slate-400">
          Loading dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-28 pb-20">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Provider Dashboard
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Welcome back, {user?.first_name || user?.username}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-5">
            <p className="text-xs text-slate-400 mb-1">Pending Requests</p>
            <p className="text-2xl font-bold text-amber-400">{pendingBookings.length}</p>
          </div>

          <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-5">
            <p className="text-xs text-slate-400 mb-1">Active Jobs</p>
            <p className="text-2xl font-bold text-blue-400">{acceptedBookings.length}</p>
          </div>

          <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-5">
            <p className="text-xs text-slate-400 mb-1">Completed Jobs</p>
            <p className="text-2xl font-bold text-emerald-400">{completedBookings.length}</p>
          </div>

          <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-5">
            <p className="text-xs text-slate-400 mb-1">Total Earnings</p>
            <p className="text-2xl font-bold text-white">
              ₦{totalEarnings.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
          <Link
            href="/providers/services"
            className="bg-slate-900/60 border border-white/10 hover:border-blue-500/40 rounded-2xl p-5 transition group"
          >
            <h3 className="font-semibold text-white group-hover:text-blue-400 transition">
              My Services
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {activeServices} active · {services.length} total
            </p>
          </Link>

          <Link
            href="/bookings"
            className="bg-slate-900/60 border border-white/10 hover:border-blue-500/40 rounded-2xl p-5 transition group"
          >
            <h3 className="font-semibold text-white group-hover:text-blue-400 transition">
              All Bookings
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Manage requests & jobs
            </p>
          </Link>

          <Link
            href="/profile"
            className="bg-slate-900/60 border border-white/10 hover:border-blue-500/40 rounded-2xl p-5 transition group"
          >
            <h3 className="font-semibold text-white group-hover:text-blue-400 transition">
              My Profile
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Update bio & details
            </p>
          </Link>
        </div>

        {/* Pending Requests */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-white">Pending Requests</h2>
            {pendingBookings.length > 0 && (
              <Link href="/bookings" className="text-sm text-blue-400 hover:text-blue-300">
                View all →
              </Link>
            )}
          </div>

          {pendingBookings.length === 0 ? (
            <div className="bg-slate-900/40 border border-white/10 rounded-2xl p-8 text-center text-slate-400 text-sm">
              No pending booking requests at the moment.
            </div>
          ) : (
            <div className="space-y-3">
              {pendingBookings.slice(0, 3).map((booking) => (
                <div
                  key={booking.id}
                  className="bg-slate-900/60 border border-white/10 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div>
                    <h3 className="font-semibold text-white">
                      {booking.title || booking.service?.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      {booking.scheduled_date} · {booking.scheduled_time} · ₦
                      {Number(booking.price || 0).toLocaleString()}
                    </p>
                  </div>
                  <Link
                    href="/bookings"
                    className="text-sm font-medium text-blue-400 hover:text-blue-300"
                  >
                    Review →
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Active Jobs */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-white">Active Jobs</h2>
          </div>

          {acceptedBookings.length === 0 ? (
            <div className="bg-slate-900/40 border border-white/10 rounded-2xl p-8 text-center text-slate-400 text-sm">
              No active jobs right now.
            </div>
          ) : (
            <div className="space-y-3">
              {acceptedBookings.slice(0, 3).map((booking) => (
                <div
                  key={booking.id}
                  className="bg-slate-900/60 border border-white/10 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div>
                    <h3 className="font-semibold text-white">
                      {booking.title || booking.service?.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      {booking.scheduled_date} · {booking.address}
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full">
                    In Progress
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}