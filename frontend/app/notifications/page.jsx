'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import API from '@/lib/api';
import Navbar from '@/components/Navbar';
import { getCurrentUser } from '@/lib/auth';

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const user = await getCurrentUser();
      if (!user) {
        router.push('/login');
        return;
      }

      try {
        const res = await API.get('/notifications/');
        setNotifications(res.data || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [router]);

  const markAsRead = async (id) => {
    try {
      await API.patch(`/notifications/${id}/`, { is_read: true });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-white">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 py-28">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-1">Notifications</h1>
          <p className="text-slate-400 text-sm">Your recent updates</p>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-slate-900/50 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-slate-900/40 border border-white/10 rounded-2xl p-12 text-center text-slate-400">
            No notifications yet.
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => !notification.is_read && markAsRead(notification.id)}
                className={`p-5 rounded-2xl border cursor-pointer transition ${
                  notification.is_read
                    ? 'bg-slate-900/40 border-white/5'
                    : 'bg-slate-900/70 border-blue-500/30'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-white text-sm">
                      {notification.title}
                    </h3>
                    <p className="text-slate-400 text-sm mt-1">
                      {notification.message}
                    </p>
                    <p className="text-xs text-slate-500 mt-2">
                      {new Date(notification.created_at).toLocaleString()}
                    </p>
                  </div>
                  {!notification.is_read && (
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0 mt-1" />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}