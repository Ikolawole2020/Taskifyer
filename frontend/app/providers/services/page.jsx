'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import API from '@/lib/api';
import Navbar from '@/components/Navbar';
import { getCurrentUser } from '@/lib/auth';

export default function MyServicesPage() {
  const router = useRouter();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [deletingId, setDeletingId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  useEffect(() => {
    const init = async () => {
      try {
        const user = await getCurrentUser();

        if (!user) {
          router.push('/login');
          return;
        }

        if (user.role !== 'PROVIDER') {
          showToast('Only providers can access this page', 'error');
          setTimeout(() => router.push('/'), 1500);
          return;
        }

        const res = await API.get('/services/?mine=true');
        setServices(res.data || []);
      } catch (error) {
        console.error('Error fetching services:', error);
        showToast('Failed to load your services', 'error');
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

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    setIsDeleting(true);

    try {
      await API.delete(`/services/${deletingId}/`);
      setServices((prev) => prev.filter((s) => s.id !== deletingId));
      showToast('Service deleted successfully', 'success');
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.detail || 'Failed to delete service';
      showToast(msg, 'error');
    } finally {
      setIsDeleting(false);
      setDeletingId(null);
    }
  };

  const handleToggleStatus = async (service) => {
    setTogglingId(service.id);
    const updatedStatus = !service.is_active;

    try {
      await API.patch(`/services/${service.id}/`, { is_active: updatedStatus });
      setServices((prev) =>
        prev.map((s) => (s.id === service.id ? { ...s, is_active: updatedStatus } : s))
      );
      showToast(
        `Service marked as ${updatedStatus ? 'Active' : 'Inactive'}`,
        'success'
      );
    } catch (error) {
      console.error(error);
      showToast('Failed to update service status', 'error');
    } finally {
      setTogglingId(null);
    }
  };

  const filteredServices = useMemo(() => {
    return services.filter((service) => {
      const matchesSearch =
        service.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.category?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.description?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === 'ALL'
          ? true
          : statusFilter === 'ACTIVE'
          ? service.is_active
          : !service.is_active;

      return matchesSearch && matchesStatus;
    });
  }, [services, searchQuery, statusFilter]);

  const stats = useMemo(() => {
    const total = services.length;
    const active = services.filter((s) => s.is_active).length;
    const avgPrice =
      total > 0
        ? Math.round(
            services.reduce((acc, curr) => acc + Number(curr.price || 0), 0) / total
          )
        : 0;

    return { total, active, avgPrice };
  }, [services]);

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

      {/* Delete Modal */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center text-xl font-bold">
              🗑️
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Delete Service</h3>
              <p className="text-sm text-slate-400 mt-1">
                Are you sure you want to remove this service? Customers will no longer be able to find or book it.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingId(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-400 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/20 transition flex items-center gap-2"
              >
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ambient Glow */}
      <div className="absolute top-24 left-1/2 -translate-x-1/2 w-full max-w-4xl h-72 bg-gradient-to-tr from-blue-600/15 via-cyan-500/10 to-indigo-600/10 blur-[120px] pointer-events-none rounded-full" />

      <main className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-28 pb-20">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 border-b border-white/10 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">
              My Services
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              List, edit, and control the active status of your offerings.
            </p>
          </div>

          <Link
            href="/providers/services/new"
            className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-cyan-500 text-white px-5 py-3 rounded-xl text-sm font-semibold transition shadow-lg shadow-blue-500/25 active:scale-95"
          >
            <span>+ Add New Service</span>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 sm:gap-6 mb-8">
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/60 border border-white/10 backdrop-blur-xl">
            <span className="text-xs text-slate-400 font-medium block mb-1">Total Listed</span>
            <span className="text-2xl sm:text-3xl font-extrabold text-white">{stats.total}</span>
          </div>
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/60 border border-white/10 backdrop-blur-xl">
            <span className="text-xs text-slate-400 font-medium block mb-1">Active Now</span>
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-400">{stats.active}</span>
          </div>
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/60 border border-white/10 backdrop-blur-xl">
            <span className="text-xs text-slate-400 font-medium block mb-1">Avg. Price</span>
            <span className="text-2xl sm:text-3xl font-extrabold text-blue-400">
              ₦{stats.avgPrice.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, category, or description..."
              className="w-full bg-slate-900/80 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
            />
            <svg
              className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-900/80 p-1 rounded-xl border border-white/10 self-start sm:self-auto">
            {['ALL', 'ACTIVE', 'INACTIVE'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                  statusFilter === status
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {status.charAt(0) + status.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Services List */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-36 bg-slate-900/50 rounded-2xl border border-white/5 animate-pulse" />
            ))}
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="bg-slate-900/40 border border-white/10 rounded-3xl p-12 text-center backdrop-blur-xl space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-white/10 text-slate-400 flex items-center justify-center mx-auto text-2xl">
              🛠️
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">No services found</h3>
              <p className="text-sm text-slate-400 mt-1">
                {searchQuery || statusFilter !== 'ALL'
                  ? 'Try clearing your search query or status filter.'
                  : "You haven't listed any services yet. Start earning by creating your first service."}
              </p>
            </div>
            <Link
              href="/providers/services/new"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl text-sm font-semibold transition shadow-lg shadow-blue-600/25"
            >
              Add Your First Service →
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredServices.map((service) => (
              <div
                key={service.id}
                className="group relative bg-slate-900/60 border border-white/10 rounded-2xl p-5 sm:p-6 backdrop-blur-xl transition duration-300 hover:border-blue-500/30 hover:bg-slate-900/80 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-5"
              >
                {/* Image + Metadata */}
                <div className="flex gap-4 flex-1 min-w-0">
                  {/* Service Image */}
                  <div className="shrink-0">
                    {service.image ? (
                      <img
                        src={service.image}
                        alt={service.title}
                        className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-xl border border-white/10"
                      />
                    ) : (
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-slate-800 border border-white/10 flex items-center justify-center text-slate-500 text-xs">
                        No Image
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h3 className="text-lg font-bold text-white group-hover:text-blue-300 transition-colors truncate">
                        {service.title}
                      </h3>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        {service.category?.name || 'General'}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1 border ${
                          service.is_active
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            service.is_active ? 'bg-emerald-400' : 'bg-slate-500'
                          }`}
                        />
                        {service.is_active ? 'Active' : 'Paused'}
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-400 line-clamp-2 leading-relaxed">
                      {service.description || 'No detailed description provided.'}
                    </p>

                    <div className="pt-1">
                      <span className="text-lg font-extrabold text-emerald-400">
                        ₦{Number(service.price || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2.5 pt-3 sm:pt-0 border-t sm:border-t-0 border-white/5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(service)}
                    disabled={togglingId === service.id}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition ${
                      service.is_active
                        ? 'bg-slate-800/80 text-amber-300 border-amber-500/30 hover:bg-amber-500/10'
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                    }`}
                  >
                    {togglingId === service.id
                      ? 'Updating...'
                      : service.is_active
                      ? 'Pause Listing'
                      : 'Activate'}
                  </button>

                  <Link
                    href={`/providers/services/edit/${service.id}`}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-200 border border-white/10 hover:bg-slate-700 hover:text-white transition"
                  >
                    Edit
                  </Link>

                  <button
                    type="button"
                    onClick={() => setDeletingId(service.id)}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}