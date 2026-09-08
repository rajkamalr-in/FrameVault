import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token to requests if available
// Uses sessionStorage so each browser tab has its own independent session.
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401 Unauthorized globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Don't auto-redirect if we are checking PIN on public gallery
      if (!error.config.url.includes('/galleries/public/')) {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
