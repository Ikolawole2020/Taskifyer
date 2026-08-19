'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import API from '@/lib/api';
import Navbar from '@/components/Navbar';
import { getCurrentUser } from '@/lib/auth';
import PortfolioGallery from '@/components/PortfolioGallery';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [message, setMessage] = useState('');
  const [preview, setPreview] = useState(null);

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone_number: '',
    bio: '',
    city: 'Lagos',
    years_of_experience: 0,
    profile_picture: null,
  });

  useEffect(() => {
    const init = async () => {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        router.push('/login');
        return;
      }

      setUser(currentUser);
      setFormData({
        first_name: currentUser.first_name || '',
        last_name: currentUser.last_name || '',
        phone_number: currentUser.phone_number || '',
        bio: '',
        city: 'Lagos',
        years_of_experience: 0,
        profile_picture: null,
      });

      if (currentUser.profile_picture) {
        setPreview(currentUser.profile_picture);
      }

      if (currentUser.role === 'PROVIDER') {
        try {
          const res = await API.get('/me/provider/');
          setProvider(res.data);
          setFormData((prev) => ({
            ...prev,
            bio: res.data.bio || '',
            city: res.data.city || 'Lagos',
            years_of_experience: res.data.years_of_experience || 0,
          }));
        } catch (error) {
          console.error(error);
        }
      }

      setLoading(false);
    };

    init();
  }, [router]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, profile_picture: file });
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      const data = new FormData();
      data.append('first_name', formData.first_name);
      data.append('last_name', formData.last_name);
      data.append('phone_number', formData.phone_number);

      if (formData.profile_picture) {
        data.append('profile_picture', formData.profile_picture);
      }

      const userRes = await API.patch('/me/', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setUser(userRes.data);

      if (user?.role === 'PROVIDER') {
        const providerRes = await API.patch('/me/provider/', {
          bio: formData.bio,
          city: formData.city,
          years_of_experience: Number(formData.years_of_experience),
        });
        setProvider(providerRes.data);
      }

      setMessage('Profile updated successfully');
      setEditing(false);
    } catch (error) {
      console.error(error);
      setMessage('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const confirmDeleteAccount = async () => {
    setDeleting(true);
    try {
      await API.delete('/me/');
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      router.push('/register?deleted=true');
    } catch (error) {
      console.error('Delete account error:', error);
      setMessage('Failed to delete account. Please try again.');
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const getInitials = () => {
    const name = `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || user?.username || 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070b14] text-white">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 py-32 text-center text-slate-400">
          Loading profile...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070b14] text-white">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 py-28 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-1">My Profile</h1>
            <p className="text-slate-400 text-sm">Your account overview</p>
          </div>

          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition"
            >
              Edit Profile
            </button>
          )}
        </div>

        {message && (
          <div
            className={`text-sm px-4 py-3 rounded-xl ${
              message.includes('success')
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-red-500/10 text-red-400 border border-red-500/20'
            }`}
          >
            {message}
          </div>
        )}

        <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-6 sm:p-8">
          {/* Avatar + Name */}
          <div className="flex items-center gap-5 mb-8">
            {preview || user?.profile_picture ? (
              <img
                src={preview || user.profile_picture}
                alt="Profile"
                className="w-16 h-16 rounded-2xl object-cover border border-white/10"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-xl font-bold">
                {getInitials()}
              </div>
            )}

            <div>
              <h2 className="text-xl font-bold">
                {user?.first_name || user?.last_name
                  ? `${user.first_name} ${user.last_name}`.trim()
                  : user?.username}
              </h2>
              <p className="text-slate-400 text-sm mt-0.5">
                @{user?.username} · {user?.role}
              </p>
            </div>
          </div>

          {/* Provider Stats */}
          {user?.role === 'PROVIDER' && provider && (
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-slate-950/50 rounded-xl p-4 text-center border border-white/5">
                <div className="text-lg font-bold text-white">
                  {provider.average_rating > 0
                    ? Number(provider.average_rating).toFixed(1)
                    : 'New'}
                </div>
                <div className="text-xs text-slate-500 mt-1">Rating</div>
              </div>
              <div className="bg-slate-950/50 rounded-xl p-4 text-center border border-white/5">
                <div className="text-lg font-bold text-white">
                  {provider.total_jobs_completed || 0}
                </div>
                <div className="text-xs text-slate-500 mt-1">Jobs Done</div>
              </div>
              <div className="bg-slate-950/50 rounded-xl p-4 text-center border border-white/5">
                <div className="text-lg font-bold text-white">
                  {provider.total_reviews || 0}
                </div>
                <div className="text-xs text-slate-500 mt-1">Reviews</div>
              </div>
            </div>
          )}

          {/* View Mode */}
          {!editing ? (
            <div className="space-y-4 text-sm">
              <div className="flex justify-between py-3 border-b border-white/5">
                <span className="text-slate-400">Email</span>
                <span className="text-white">{user?.email || '—'}</span>
              </div>
              <div className="flex justify-between py-3 border-b border-white/5">
                <span className="text-slate-400">Phone</span>
                <span className="text-white">{user?.phone_number || '—'}</span>
              </div>

              {user?.role === 'PROVIDER' && (
                <>
                  <div className="flex justify-between py-3 border-b border-white/5">
                    <span className="text-slate-400">City</span>
                    <span className="text-white">{provider?.city || 'Lagos'}</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-white/5">
                    <span className="text-slate-400">Experience</span>
                    <span className="text-white">
                      {provider?.years_of_experience || 0} year(s)
                    </span>
                  </div>
                  <div className="py-3">
                    <span className="text-slate-400 block mb-2">Bio</span>
                    <p className="text-white text-sm leading-relaxed">
                      {provider?.bio || 'No bio added yet.'}
                    </p>
                  </div>
                </>
              )}
            </div>
          ) : (
            /* Edit Mode */
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">
                  Profile Picture
                </label>
                <div className="flex items-center gap-4">
                  {preview ? (
                    <img
                      src={preview}
                      alt="Preview"
                      className="w-16 h-16 rounded-2xl object-cover border border-white/10"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-white/10 flex items-center justify-center text-slate-500 text-xs">
                      No photo
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1.5">First Name</label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 transition"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1.5">Last Name</label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Phone Number</label>
                <input
                  type="text"
                  name="phone_number"
                  value={formData.phone_number}
                  onChange={handleChange}
                  className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 transition"
                />
              </div>

              {user?.role === 'PROVIDER' && (
                <>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1.5">City</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-slate-400 mb-1.5">
                      Years of Experience
                    </label>
                    <input
                      type="number"
                      name="years_of_experience"
                      value={formData.years_of_experience}
                      onChange={handleChange}
                      min="0"
                      className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-slate-400 mb-1.5">Bio</label>
                    <textarea
                      name="bio"
                      value={formData.bio}
                      onChange={handleChange}
                      rows={4}
                      placeholder="Tell customers about yourself and your experience..."
                      className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 transition"
                    />
                  </div>
                </>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl transition disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditing(false);
                    setMessage('');
                  }}
                  className="px-6 py-3 rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Portfolio Gallery Section (Only shown for Providers) */}
        {user?.role === 'PROVIDER' && provider && (
          <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-6 sm:p-8">
            <PortfolioGallery
              providerId={provider.id}
              images={provider.portfolio_images || []}
              isOwner={true}
            />
          </div>
        )}

        {/* Danger Zone: Delete Account */}
        <div className="bg-rose-950/20 border border-rose-500/20 rounded-2xl p-6 sm:p-8 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h3 className="text-base font-bold text-rose-400">Danger Zone</h3>
            <p className="text-sm text-slate-400 mt-0.5">
              Permanently delete your account and all associated data.
            </p>
          </div>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition"
          >
            Delete Account
          </button>
        </div>

      </div>

      {/* Custom Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto text-xl">
                ⚠️
              </div>
              <h3 className="text-lg font-bold text-white">Delete Account</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Are you sure you want to permanently delete your account? This action cannot be undone and all your data will be removed.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-3 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteAccount}
                disabled={deleting}
                className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-semibold py-3 rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Yes, Delete</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}