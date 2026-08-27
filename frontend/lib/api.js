import axios from 'axios';
import Cookies from 'js-cookie';

const API = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Backend origin for media files (profile pictures, portfolio, etc.)
export const MEDIA_BASE = (
  process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api'
).replace(/\/api\/?$/, '');

/**
 * Resolve a possibly-relative media path from the API into an absolute URL.
 * e.g. '/media/profiles/x.jpg' → 'https://taskify.pythonanywhere.com/media/profiles/x.jpg'
 */
export function getMediaUrl(path) {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  return MEDIA_BASE + String(path).replace(/^(?!\/)/, '/');
}


// Automatically add token to every request if it exists
API.interceptors.request.use((config) => {
  const token = Cookies.get('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // For file uploads (FormData), drop the JSON content-type so the
  // browser sets the correct multipart boundary — otherwise the backend
  // can't parse the file and it silently fails to save.
  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    delete config.headers['Content-Type'];
    delete config.headers['Content-type'];
    delete config.headers['content-type'];
  }
  return config;
});

export default API;