'use client';

import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import API from '@/lib/api';
import { getCurrentUser, logout } from '@/lib/auth';

export default function Navbar() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const fetchUserAndNotifications = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);

        if (currentUser) {
          const res = await API.get('/notifications/');
          setNotifications(res.data || []);
        }
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    fetchUserAndNotifications();

    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);

    // Close dropdown on click outside
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [pathname]);

  const handleLogout = () => {
    logout();
    setUser(null);
    setMobileMenuOpen(false);
    router.push('/login');
  };

  const markAsRead = async (id) => {
    try {
      await API.patch(`/notifications/${id}/`, { is_read: true });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (error) {
      console.error('Failed to mark notification as read', error);
    }
  };

  const closeMenu = () => setMobileMenuOpen(false);
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-[#0b1120]/80 backdrop-blur-xl border-b border-white/10 shadow-lg shadow-black/20'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" onClick={closeMenu} className="text-xl font-bold text-white">
            Skill<span className="text-blue-400">Link</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-1">
            {loading ? (
              <div className="w-20 h-4 bg-white/10 rounded animate-pulse" />
            ) : user ? (
              <>
                <Link
                  href="/bookings"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-white/10 transition"
                >
                  <span>📅</span> Bookings
                </Link>

                {/* NOTIFICATION BELL & DROPDOWN */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-white/10 transition"
                  >
                    <span>🔔</span> Alerts
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 w-4 h-4 bg-blue-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {showNotifications && (
                    <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-slate-900 border border-white/15 rounded-2xl shadow-2xl overflow-hidden z-50 backdrop-blur-2xl">
                      <div className="p-4 border-b border-white/10 flex items-center justify-between">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                          Notifications
                        </h3>
                        <span className="text-[10px] text-slate-400">
                          {unreadCount} unread
                        </span>
                      </div>

                      <div className="max-h-80 overflow-y-auto divide-y divide-white/5">
                        {notifications.length === 0 ? (
                          <div className="p-6 text-center text-xs text-slate-500">
                            No notifications yet.
                          </div>
                        ) : (
                          notifications.map((n) => (
                            <div
                              key={n.id}
                              onClick={() => !n.is_read && markAsRead(n.id)}
                              className={`p-4 transition cursor-pointer text-left space-y-1 ${
                                n.is_read ? 'bg-slate-900/40 opacity-70' : 'bg-slate-800/60'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-white">
                                  {n.title}
                                </span>
                                {!n.is_read && (
                                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                                )}
                              </div>
                              <p className="text-xs text-slate-300 leading-relaxed">
                                {n.message}
                              </p>
                              <span className="text-[10px] text-slate-500 block pt-1">
                                {new Date(n.created_at).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {user.role === 'PROVIDER' && (
                  <>
                    <Link
                      href="/providers/dashboard"
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-white/10 transition"
                    >
                      <span>📊</span> Dashboard
                    </Link>
                    <Link
                      href="/providers/services"
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-white/10 transition"
                    >
                      <span>🛠️</span> Services
                    </Link>
                    <Link
                      href="/providers/services/new"
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-white/10 transition"
                    >
                      <span>➕</span> Add
                    </Link>
                  </>
                )}

                <Link
                  href="/profile"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-white/10 transition"
                >
                  <span>👤</span> Profile
                </Link>

                <div className="w-px h-5 bg-white/10 mx-2" />

                <span className="text-sm text-slate-400">{user.username}</span>

                <button
                  onClick={handleLogout}
                  className="ml-1 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-white/10 transition"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="ml-1 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-semibold transition"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-white/10 transition"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span className="text-white text-xl">{mobileMenuOpen ? '✕' : '☰'}</span>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#0b1120]/95 backdrop-blur-xl border-t border-white/10 py-3 space-y-1">
            {user ? (
              <>
                <div className="px-4 py-2 text-xs text-slate-400 border-b border-white/10 mb-1">
                  {user.username}
                </div>

                <Link href="/bookings" onClick={closeMenu} className="flex items-center gap-2 px-4 py-3 text-slate-300 hover:bg-white/5 rounded-lg mx-2">
                  <span>📅</span> Bookings
                </Link>
                <Link href="/notifications" onClick={closeMenu} className="flex items-center justify-between px-4 py-3 text-slate-300 hover:bg-white/5 rounded-lg mx-2">
                  <span className="flex items-center gap-2"><span>🔔</span> Alerts</span>
                  {unreadCount > 0 && (
                    <span className="bg-blue-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </Link>

                {user.role === 'PROVIDER' && (
                  <>
                    <Link href="/providers/dashboard" onClick={closeMenu} className="flex items-center gap-2 px-4 py-3 text-slate-300 hover:bg-white/5 rounded-lg mx-2">
                      <span>📊</span> Dashboard
                    </Link>
                    <Link href="/providers/services" onClick={closeMenu} className="flex items-center gap-2 px-4 py-3 text-slate-300 hover:bg-white/5 rounded-lg mx-2">
                      <span>🛠️</span> Services
                    </Link>
                    <Link href="/providers/services/new" onClick={closeMenu} className="flex items-center gap-2 px-4 py-3 text-slate-300 hover:bg-white/5 rounded-lg mx-2">
                      <span>➕</span> Add Service
                    </Link>
                  </>
                )}

                <Link href="/profile" onClick={closeMenu} className="flex items-center gap-2 px-4 py-3 text-slate-300 hover:bg-white/5 rounded-lg mx-2">
                  <span>👤</span> Profile
                </Link>

                <button onClick={handleLogout} className="w-full text-left flex items-center gap-2 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-lg mx-2">
                  <span>🚪</span> Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={closeMenu} className="block px-4 py-3 text-slate-300 hover:bg-white/5 rounded-lg mx-2">
                  Login
                </Link>
                <Link href="/register" onClick={closeMenu} className="block px-4 py-3 bg-blue-600 text-white text-center rounded-xl mx-2 font-medium">
                  Get Started
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}