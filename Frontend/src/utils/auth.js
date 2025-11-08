import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Auth = {
  async login(email, password) {
    const res = await axios.post(`${API}/api/auth/login`, { email, password });
    if (res?.data?.token) {
      localStorage.setItem('token', res.data.token);
      // store optional ids returned by backend
      if (res.data.user?.patientId) localStorage.setItem('patientId', res.data.user.patientId);
      if (res.data.user?.doctorId) localStorage.setItem('doctorId', res.data.user.doctorId);
      // store role and user id for routing/UX
      if (res.data.user?.role) localStorage.setItem('role', res.data.user.role);
      if (res.data.user?.id) localStorage.setItem('userId', res.data.user.id);
    }
    return res.data;
  },

  async register(payload) {
    // payload: { name, email, password, role, specialization }
    const res = await axios.post(`${API}/api/auth/register`, payload);
    if (res?.data?.token) {
      localStorage.setItem('token', res.data.token);
      if (res.data.user?.patientId) localStorage.setItem('patientId', res.data.user.patientId);
      if (res.data.user?.doctorId) localStorage.setItem('doctorId', res.data.user.doctorId);
      // store role and user id for routing/UX
      if (res.data.user?.role) localStorage.setItem('role', res.data.user.role);
      if (res.data.user?.id) localStorage.setItem('userId', res.data.user.id);
    }
    return res.data;
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('patientId');
    localStorage.removeItem('doctorId');
    localStorage.removeItem('role');
    localStorage.removeItem('userId');
    return true;
  },

  getToken() {
    return localStorage.getItem('token');
  }
};

// convenience helpers
Auth.isAuthenticated = () => !!Auth.getToken();
Auth.getRole = () => localStorage.getItem('role');
Auth.getUserId = () => localStorage.getItem('userId');

export default Auth;
