import Cookies from 'js-cookie';
import API from './api';

export const getCurrentUser = async () => {
  const token = Cookies.get('access_token');
  if (!token) return null;

  try {
    const res = await API.get('/me/');
    return res.data; // contains id, username, role, etc.
  } catch (error) {
    // Token might be expired
    Cookies.remove('access_token');
    Cookies.remove('refresh_token');
    return null;
  }
};

export const logout = () => {
  Cookies.remove('access_token');
  Cookies.remove('refresh_token');
};