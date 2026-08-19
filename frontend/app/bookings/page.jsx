'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import API from '@/lib/api';
import Navbar from '@/components/Navbar';
import { getCurrentUser } from '@/lib/auth';
import ChatBox from '@/components/ChatBox';

export default function BookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL');

  // Action State
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  // Review State
  const [reviewingId, setReviewingId] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
          router.push('/login');
          return;
        }
        setUser(currentUser);

        const res = await API.get('/bookings/');
        setBookings(res.data || []);
      } catch (error) {
        console.error('Failed to fetch bookings:', error);
        showToast('Error loading bookings. Please refresh.', 'error');
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [router]);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 4000);
  };

  const handleAction = async (bookingId, action) => {
    setActionLoadingId(bookingId);
    try {
      await API.post(`/bookings/${bookingId}/${action}/`);
      const res = await API.get('/bookings/');
      setBookings(res.data || []);
      showToast(`Booking ${action}ed successfully!`, 'success');
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.error || `Failed to ${action} booking`;
      showToast(msg, 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleSubmitReview = async (bookingId) => {
    setSubmittingReview(true);
    try {
      await API.post('/reviews/', {
        booking: bookingId,
        rating: Number(rating),
        comment: comment.trim(),
      });
      showToast('Thank you! Your review has been published.', 'success');
      setReviewingId(null);
      setRating(5);
      setComment('');
      
      const res = await API.get('/bookings/');
      setBookings(res.data || []);
    } catch (error) {
      console.error(error);
      const message = error.response?.data?.error || 'Failed to submit review';
      showToast(message, 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            Pending Approval
          </span>
        );
      case 'ACCEPTED':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            In Progress
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Completed
          </span>
        );
      case 'CANCELLED':
      case 'REJECTED':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            {status}
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
            {status}
          </span>
        );
    }
  };

  const filteredBookings = bookings.filter((booking) => {
    if (activeTab === 'ALL') return true;
    return booking.status === activeTab;
  });

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 font-sans selection:bg-blue-500/30">
      <Navbar />

      {/* Floating Notification Toast */}
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

      {/* Glow Backdrop Effects */}
      <div className="absolute top-24 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-blue-600/10 blur-[130px] pointer-events-none rounded-full" />

      <main className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-28 pb-20">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 border-b border-white/10 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">
              My Bookings
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Manage your upcoming appointments and track past completed jobs.
            </p>
          </div>

          {user && (
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-white/10 text-xs font-medium text-slate-300">
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              Role: <strong className="text-white capitalize">{user.role?.toLowerCase()}</strong>
            </div>
          )}
        </div>

        {/* Tab Filter Navigation */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 border-b border-white/5 scrollbar-none">
          {['ALL', 'PENDING', 'ACCEPTED', 'COMPLETED', 'CANCELLED'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
                activeTab === tab
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                  : 'bg-slate-900/60 text-slate-400 border border-white/5 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              {tab === 'ALL' ? 'All Bookings' : tab.charAt(0) + tab.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {/* Main Content Area */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-44 bg-slate-900/50 rounded-2xl border border-white/5 animate-pulse"
              />
            ))}
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="bg-slate-900/40 border border-white/10 rounded-3xl p-12 text-center backdrop-blur-xl space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-white/10 text-slate-400 flex items-center justify-center mx-auto text-2xl font-bold">
              📅
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">No bookings found</h3>
              <p className="text-sm text-slate-400 mt-1">
                {activeTab === 'ALL'
                  ? "You haven't placed or received any service bookings yet."
                  : `There are currently no bookings with status "${activeTab.toLowerCase()}".`}
              </p>
            </div>
            {user?.role === 'CUSTOMER' && (
              <Link
                href="/"
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl text-sm font-semibold transition shadow-lg shadow-blue-600/25"
              >
                Browse Services →
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-5">
            {filteredBookings.map((booking) => (
              <div
                key={booking.id}
                className="group relative bg-slate-900/60 border border-white/10 rounded-2xl p-6 backdrop-blur-xl transition duration-300 hover:border-blue-500/30 hover:bg-slate-900/80 shadow-xl"
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-white/5">
                  <div className="space-y-1">
                    <h2 className="text-xl font-bold text-white group-hover:text-blue-300 transition-colors">
                      {booking.title || booking.service?.title || 'Service Booking'}
                    </h2>
                    <p className="text-xs text-slate-400 flex items-center gap-2">
                      <span>🗓️ {booking.scheduled_date || 'Date TBD'}</span>
                      <span>•</span>
                      <span>⏰ {booking.scheduled_time || 'Time TBD'}</span>
                    </p>
                  </div>
                  <div>{getStatusBadge(booking.status)}</div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 text-sm">
                  <div className="space-y-1">
                    <span className="text-xs text-slate-500 font-medium uppercase tracking-wider block">
                      Service Address
                    </span>
                    <p className="text-slate-300 font-medium">
                      {booking.address || 'Standard Location'}, {booking.city || 'Lagos'}
                    </p>
                  </div>

                  <div className="space-y-1 sm:text-right">
                    <span className="text-xs text-slate-500 font-medium uppercase tracking-wider block">
                      Agreed Price
                    </span>
                    <p className="text-lg font-bold text-emerald-400">
                      ₦{Number(booking.price || 0).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Customer Note */}
                {booking.customer_note && (
                  <div className="bg-slate-950/60 border border-white/5 rounded-xl p-3.5 mb-4 text-xs text-slate-300 space-y-1">
                    <span className="font-semibold text-blue-400 block">Customer Note:</span>
                    <p className="italic">"{booking.customer_note}"</p>
                  </div>
                )}

                {/* CHAT BOX INTEGRATION */}
                {booking.chat_room && (
                  <div className="my-4">
                    <ChatBox roomId={booking.chat_room} />
                  </div>
                )}

                {/* PROVIDER ACTIONS */}
                {user?.role === 'PROVIDER' && booking.status === 'PENDING' && (
                  <div className="flex items-center gap-3 pt-3 border-t border-white/5">
                    <button
                      onClick={() => handleAction(booking.id, 'accept')}
                      disabled={actionLoadingId === booking.id}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition shadow-lg shadow-emerald-600/20 disabled:opacity-50"
                    >
                      {actionLoadingId === booking.id ? 'Accepting...' : 'Accept Booking'}
                    </button>
                    <button
                      onClick={() => handleAction(booking.id, 'reject')}
                      disabled={actionLoadingId === booking.id}
                      className="bg-slate-800 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition disabled:opacity-50"
                    >
                      {actionLoadingId === booking.id ? 'Rejecting...' : 'Decline'}
                    </button>
                  </div>
                )}

                {user?.role === 'PROVIDER' && booking.status === 'ACCEPTED' && (
                  <div className="pt-3 border-t border-white/5">
                    <button
                      onClick={() => handleAction(booking.id, 'complete')}
                      disabled={actionLoadingId === booking.id}
                      className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition shadow-lg shadow-blue-600/20 disabled:opacity-50"
                    >
                      {actionLoadingId === booking.id ? 'Updating...' : 'Mark as Completed'}
                    </button>
                  </div>
                )}

                {/* CUSTOMER REVIEW SECTION */}
                {user?.role === 'CUSTOMER' && booking.status === 'COMPLETED' && (
                  <div className="mt-2 pt-4 border-t border-white/5">
                    {reviewingId === booking.id ? (
                      <div className="bg-slate-950/80 border border-white/10 rounded-2xl p-5 space-y-4">
                        <h4 className="font-bold text-white text-sm">
                          Leave a Review & Rating
                        </h4>

                        {/* Interactive Star Picker */}
                        <div className="space-y-1">
                          <label className="block text-xs font-medium text-slate-400">
                            Rating
                          </label>
                          <div className="flex items-center gap-1.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setRating(star)}
                                className={`text-2xl transition ${
                                  star <= rating ? 'text-amber-400 scale-110' : 'text-slate-700'
                                }`}
                              >
                                ★
                              </button>
                            ))}
                            <span className="text-xs text-slate-400 font-semibold ml-2">
                              {rating} / 5 Stars
                            </span>
                          </div>
                        </div>

                        {/* Comment Input */}
                        <div className="space-y-1">
                          <label className="block text-xs font-medium text-slate-400">
                            Comment (optional)
                          </label>
                          <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            rows={3}
                            className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                            placeholder="How was your experience with this artisan?"
                          />
                        </div>

                        {/* Buttons */}
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleSubmitReview(booking.id)}
                            disabled={submittingReview}
                            className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-xl text-xs font-semibold transition disabled:opacity-50"
                          >
                            {submittingReview ? 'Submitting...' : 'Submit Review'}
                          </button>
                          <button
                            onClick={() => {
                              setReviewingId(null);
                              setComment('');
                              setRating(5);
                            }}
                            className="text-xs text-slate-400 hover:text-white transition"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setReviewingId(booking.id)}
                        className="inline-flex items-center gap-2 text-xs font-semibold text-blue-400 hover:text-blue-300 bg-blue-500/10 border border-blue-500/20 px-4 py-2 rounded-xl transition"
                      >
                        <span>★</span> Leave a Review
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}