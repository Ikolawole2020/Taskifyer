'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import API from '@/lib/api';
import Navbar from '@/components/Navbar';
import { getCurrentUser } from '@/lib/auth';

export default function EditServicePage() {
  const { id } = useParams();
  const router = useRouter();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState(null);
  const [preview, setPreview] = useState(null);

  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    duration_hours: 1,
    category_id: '',
    is_active: true,
    image: null,
  });

  useEffect(() => {
    const init = async () => {
      try {
        const currentUser = await getCurrentUser();

        if (!currentUser) {
          router.push('/login');
          return;
        }

        if (currentUser.role !== 'PROVIDER') {
          showToast('Only providers can edit services', 'error');
          setTimeout(() => router.push('/'), 1500);
          return;
        }

        setUser(currentUser);

        const [categoriesRes, serviceRes] = await Promise.all([
          API.get('/categories/'),
          API.get(`/services/${id}/`),
        ]);

        setCategories(categoriesRes.data || []);

        const service = serviceRes.data;
        setFormData({
          title: service.title || '',
          description: service.description || '',
          price: service.price || '',
          duration_hours: service.duration_hours || 1,
          category_id: service.category?.id || service.category_id || '',
          is_active: service.is_active ?? true,
          image: null,
        });

        if (service.image) {
          setPreview(service.image);
        }
      } catch (error) {
        console.error('Failed to load service:', error);
        showToast('Failed to load service details', 'error');
        setTimeout(() => router.push('/providers/services'), 1500);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [id, router]);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 4000);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({ ...prev, image: file }));
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.category_id) {
      showToast('Please select a service category', 'error');
      return;
    }

    if (Number(formData.price) <= 0) {
      showToast('Please set a price greater than zero', 'error');
      return;
    }

    setSubmitting(true);

    try {
      const data = new FormData();
      data.append('title', formData.title);
      data.append('description', formData.description);
      data.append('price', formData.price);
      data.append('duration_hours', formData.duration_hours);
      data.append('category_id', formData.category_id);
      data.append('is_active', formData.is_active);

      if (formData.image) {
        data.append('image', formData.image);
      }

      await API.patch(`/services/${id}/`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      showToast('Service updated successfully!', 'success');
      setTimeout(() => router.push('/providers/services'), 1000);
    } catch (error) {
      console.error('Update failed:', error);
      const msg =
        error.response?.data?.detail ||
        error.response?.data?.title?.[0] ||
        'Failed to update service';
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedCategoryObj = categories.find(
    (c) => String(c.id) === String(formData.category_id)
  );

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

      <main className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-28 pb-20">
        <div className="mb-8">
          <Link
            href="/providers/services"
            className="text-xs text-slate-400 hover:text-white transition flex items-center gap-1 mb-3"
          >
            ← Back to My Services
          </Link>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Edit Service Listing
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Update pricing, description, image or toggle visibility.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-7 bg-slate-900/60 border border-white/5 rounded-3xl p-8 space-y-6 animate-pulse">
              <div className="h-10 bg-slate-800/80 rounded-xl w-3/4" />
              <div className="h-10 bg-slate-800/80 rounded-xl w-1/2" />
              <div className="h-28 bg-slate-800/80 rounded-xl w-full" />
              <div className="h-12 bg-slate-800/80 rounded-xl w-full" />
            </div>
            <div className="lg:col-span-5 hidden lg:block bg-slate-900/60 border border-white/5 rounded-3xl p-6 h-64 animate-pulse" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Form */}
            <div className="lg:col-span-7 bg-slate-900/80 border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-2xl shadow-2xl space-y-6">
              <form onSubmit={handleSubmit} className="space-y-6">

                {/* Image Upload */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Service Image
                  </label>
                  <div className="flex items-center gap-4">
                    {preview ? (
                      <img
                        src={preview}
                        alt="Preview"
                        className="w-20 h-20 object-cover rounded-xl border border-white/10"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-xl bg-slate-950/80 border border-white/10 flex items-center justify-center text-slate-500 text-xs">
                        No image
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white file:cursor-pointer hover:file:bg-blue-500"
                    />
                  </div>
                </div>

                {/* Title */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Service Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    maxLength={100}
                    className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
                  />
                </div>

                {/* Category */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Category *
                  </label>
                  <select
                    name="category_id"
                    value={formData.category_id}
                    onChange={handleChange}
                    required
                    className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition cursor-pointer"
                  >
                    <option value="" disabled className="bg-slate-900 text-slate-400">
                      Select a category
                    </option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id} className="bg-slate-900 text-white">
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Price + Duration */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                      Price (₦) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                        ₦
                      </span>
                      <input
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={handleChange}
                        required
                        min="100"
                        step="500"
                        className="w-full bg-slate-950/80 border border-white/10 rounded-xl pl-9 pr-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                      Duration (Hours) *
                    </label>
                    <input
                      type="number"
                      name="duration_hours"
                      value={formData.duration_hours}
                      onChange={handleChange}
                      required
                      min="1"
                      max="48"
                      className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Detailed Description *
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    required
                    rows={4}
                    className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
                  />
                </div>

                {/* Active Toggle */}
                <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-950/60 border border-white/5">
                  <div>
                    <span className="text-sm font-semibold text-white block">
                      Active Status
                    </span>
                    <span className="text-xs text-slate-400">
                      When active, customers can search and book this service.
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={formData.is_active}
                      onChange={handleChange}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
                  </label>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-4 pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold py-3.5 rounded-xl transition-all duration-300 shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    {submitting ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Updating Changes...</span>
                      </>
                    ) : (
                      <span>Save Changes</span>
                    )}
                  </button>
                  <Link
                    href="/providers/services"
                    className="px-5 py-3.5 rounded-xl text-sm font-semibold text-slate-400 hover:text-white transition bg-slate-800/40 border border-white/5"
                  >
                    Cancel
                  </Link>
                </div>
              </form>
            </div>

            {/* Live Preview */}
            <div className="lg:col-span-5 space-y-4 sticky top-28">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block px-1">
                Updated Card Preview
              </span>

              <div className="p-6 rounded-3xl bg-slate-900/80 border border-white/10 backdrop-blur-2xl space-y-4 shadow-xl">
                {preview && (
                  <img
                    src={preview}
                    alt="Service preview"
                    className="w-full h-40 object-cover rounded-2xl border border-white/10"
                  />
                )}

                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    {selectedCategoryObj?.name || 'Category'}
                  </span>
                  <span className="text-lg font-extrabold text-emerald-400">
                    ₦{formData.price ? Number(formData.price).toLocaleString() : '0'}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-white break-words">
                  {formData.title || 'Service Title'}
                </h3>

                <p className="text-slate-400 text-xs line-clamp-3 leading-relaxed">
                  {formData.description || 'Service description preview...'}
                </p>

                <div className="flex items-center gap-4 text-xs text-slate-400 pt-2 border-t border-white/5">
                  <span>⏰ Est. {formData.duration_hours || 1} Hour(s)</span>
                  <span>•</span>
                  <span className={formData.is_active ? 'text-emerald-400' : 'text-slate-500'}>
                    {formData.is_active ? 'Active Listing' : 'Paused'}
                  </span>
                </div>

                <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs text-slate-500">
                  <span>Provider: {user?.username || 'You'}</span>
                  <span className="text-blue-400 font-semibold">Ready to Book →</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}