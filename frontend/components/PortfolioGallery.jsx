'use client';
import { useState } from 'react';
import API from '@/lib/api';

export default function PortfolioGallery({ providerId, images = [], isOwner = false, onImageAdded }) {
  const [portfolioList, setPortfolioList] = useState(images);
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append('image', selectedFile);
    if (caption) formData.append('caption', caption);

    setUploading(true);
    try {
      const response = await API.post('/portfolio/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setPortfolioList((prev) => [...prev, response.data]);
      setSelectedFile(null);
      setCaption('');
      if (onImageAdded) onImageAdded();
    } catch (error) {
      console.error('Failed to upload portfolio image', error);
      alert('Failed to upload image.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this photo?')) return;
    try {
      await API.delete(`/portfolio/${id}/`);
      setPortfolioList((prev) => prev.filter((img) => img.id !== id));
    } catch (error) {
      console.error('Failed to delete image', error);
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-white">Past Work & Portfolio</h3>

      {/* Upload Form for Providers */}
      {isOwner && (
        <form onSubmit={handleUpload} className="bg-slate-900/80 border border-white/10 rounded-2xl p-5 space-y-4">
          <h4 className="text-sm font-semibold text-blue-400">Add New Project Photo</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setSelectedFile(e.target.files[0])}
              className="text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer"
            />
            <input
              type="text"
              placeholder="Caption (optional e.g., 'Custom Kitchen Cabinet')"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>
          <button
            type="submit"
            disabled={uploading || !selectedFile}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-5 py-2 rounded-xl text-xs font-semibold transition"
          >
            {uploading ? 'Uploading...' : 'Upload Photo'}
          </button>
        </form>
      )}

      {/* Gallery Grid */}
      {portfolioList.length === 0 ? (
        <div className="text-slate-500 text-sm py-8 bg-slate-900/30 rounded-2xl border border-white/5 text-center">
          No portfolio photos uploaded yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {portfolioList.map((item) => (
            <div key={item.id} className="relative group bg-slate-900 rounded-2xl overflow-hidden border border-white/10 shadow-lg">
              <img src={item.image} alt={item.caption || 'Portfolio work'} className="w-full h-48 object-cover group-hover:scale-105 transition duration-300" />
              {item.caption && (
                <div className="p-3 bg-slate-950/90 text-xs text-slate-300 border-t border-white/5">
                  {item.caption}
                </div>
              )}
              {isOwner && (
                <button
                  onClick={() => handleDelete(item.id)}
                  className="absolute top-2 right-2 bg-rose-600/80 hover:bg-rose-600 text-white w-7 h-7 rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition shadow-lg"
                  title="Delete photo"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}