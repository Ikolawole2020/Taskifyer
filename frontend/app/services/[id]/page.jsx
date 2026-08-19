'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import API from '@/lib/api';
import Navbar from '@/components/Navbar';
import Cookies from 'js-cookie';

export default function ServiceDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);

  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  const [formData, setFormData] = useState({
    scheduled_date: '',
    scheduled_time: '',
    address: '',
    city: 'Lagos',
    customer_note: '',
  });

  useEffect(() => {
    const fetchService = async () => {
      try {
        const res = await API.get(`/services/${id}/`);
        setService(res.data);
      } catch (error) {
        console.error('Error fetching service:', error);
        showToast('Failed to load service details.', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchService();
  }, [id]);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 4000);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleBooking = async (e) => {
    e.preventDefault();

    const token = Cookies.get('access_token');
    if (!token) {
      showToast('Please login to book a service', 'error');
      setTimeout(() => router.push('/login'), 1500);
      return;
    }

    setBookingLoading(true);

    try {
      await API.post('/bookings/', {
        provider_id: service.provider?.id,
        service_id: service.id,
        title: service.title,
        description: service.description,
        price: service.price,
        ...formData,
      });

      showToast('Booking created successfully!', 'success');
      setTimeout(() => router.push('/bookings'), 1200);
    } catch (error) {
      console.error('Booking error:', error);
      const detail =
        error.response?.data?.detail || 'Failed to create booking. Please try again.';
      showToast(detail, 'error');
    } finally {
      setBookingLoading(false);
    }
  };

  const getInitials = (name = '') =>
    name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

  const today = new Date().toISOString().split('T')[0];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070b14] text-slate-100 font-sans">
        <Navbar />
        <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-28 pb-20 grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 h-96 bg-slate-900/60 rounded-3xl border border-white/5 animate-pulse" />
          <div className="lg:col-span-5 h-80 bg-slate-900/60 rounded-3xl border border-white/5 animate-pulse" />
        </main>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-[#070b14] text-slate-100 font-sans">
        <Navbar />
        <main className="max-w-3xl mx-auto px-4 pt-32 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-white/10 text-slate-400 flex items-center justify-center mx-auto text-2xl font-bold">
            🔍
          </div>
          <h2 className="text-2xl font-bold text-white">Service Not Found</h2>
          <p className="text-sm text-slate-400">
            The service you are looking for is unavailable or may have been removed by the provider.
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

  const providerUser = service.provider?.user;

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 font-sans selection:bg-blue-500/30 overflow-x-hidden">
      <Navbar />

      {/* Toast */}
      {toast.show && (
        <div className="fixed top-20 right-4 z-50 animate-in slide-in-from-top-2">
          <div
            className={`px-4 py-3 rounded-xl border backdrop-blur-xl shadow-2xl text-sm font-medium flex items-center gap-3 ${
              toast.type === 'error'
                ? 'bg-rose-950/80 border-rose-500/40 text-rose-200'
                : 'bg-emerald-950/80 border-emerald-500/40 text-emerald-200'
            }`}
          >
            <span>{toast.type === 'error' ? '⚠️' : '✓'}</span>
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Ambient Glow */}
      <div className="absolute top-24 left-1/2 -translate-x-1/2 w-full max-w-4xl h-72 bg-gradient-to-tr from-blue-600/15 via-cyan-500/10 to-indigo-600/10 blur-[120px] pointer-events-none rounded-full" />

      <main className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-28 pb-20 space-y-6">
        <div>
          <Link
            href="/"
            className="text-xs text-slate-400 hover:text-white transition inline-flex items-center gap-1"
          >
            ← Back to Services
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left - Service Information */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-2xl shadow-2xl space-y-6">
              
              {/* Service Image */}
              {service.image && (
                <div className="rounded-2xl overflow-hidden border border-white/10 -mx-2 sm:mx-0">
                  <img
                    src={service.image}
                    alt={service.title}
                    className="w-full h-56 sm:h-72 object-cover"
                  />
                </div>
              )}

              {/* Category Badge */}
              <div>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  {service.category?.name || 'General'}
                </span>
              </div>

              {/* Title */}
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
                {service.title}
              </h1>

              {/* Provider Info */}
              {service.provider && (
                <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-950/60 border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-white flex items-center justify-center font-bold text-sm shrink-0">
                      {getInitials(providerUser?.username || 'P')}
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 font-medium block">
                        Service Provided By
                      </span>
                      <span className="text-sm font-bold text-white block">
                        {providerUser?.username || 'Verified Artisan'}
                      </span>
                    </div>
                  </div>

                  {service.provider.id && (
                    <Link
                      href={`/providers/${service.provider.id}`}
                      className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition"
                    >
                      View Profile →
                    </Link>
                  )}
                </div>
              )}

              {/* Description */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Description
                </h3>
                <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
                  {service.description || 'No detailed description provided for this service.'}
                </p>
              </div>

              {/* Price & Duration */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/5">
                  <span className="text-xs text-slate-400 font-medium block">Service Fee</span>
                  <span className="text-xl sm:text-2xl font-extrabold text-emerald-400">
                    ₦{Number(service.price || 0).toLocaleString()}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/5">
                  <span className="text-xs text-slate-400 font-medium block">Est. Duration</span>
                  <span className="text-xl sm:text-2xl font-extrabold text-blue-400">
                    {service.duration_hours || 1} hr{service.duration_hours > 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right - Booking Form */}
          <div className="lg:col-span-5 sticky top-28">
            <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-6 backdrop-blur-2xl shadow-2xl space-y-5">
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  Book Appointment
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Select a schedule and provide meeting address
                </p>
              </div>

              <form onSubmit={handleBooking} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Scheduled Date *
                  </label>
                  <input
                    type="date"
                    name="scheduled_date"
                    min={today}
                    value={formData.scheduled_date}
                    onChange={handleChange}
                    required
                    className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Scheduled Time *
                  </label>
                  <input
                    type="time"
                    name="scheduled_time"
                    value={formData.scheduled_time}
                    onChange={handleChange}
                    required
                    className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Service Address *
                  </label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    required
                    rows={3}
                    placeholder="Enter street address, area, or nearest landmark..."
                    className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Special Instructions (Optional)
                  </label>
                  <textarea
                    name="customer_note"
                    value={formData.customer_note}
                    onChange={handleChange}
                    rows={2}
                    placeholder="Any specific tools needed or gate codes..."
                    className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
                  />
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-white/5 space-y-1 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Total Amount</span>
                    <span className="font-bold text-emerald-400 text-sm">
                      ₦{Number(service.price || 0).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Payment is handled securely after job completion.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={bookingLoading}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold py-3.5 rounded-xl transition-all duration-300 shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm mt-2"
                >
                  {bookingLoading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Confirming Booking...</span>
                    </>
                  ) : (
                    <span>Confirm & Request Booking</span>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}