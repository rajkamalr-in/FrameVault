import api from './api';

export const authService = {
  async login(email, password) {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.access_token) {
      // Use sessionStorage so each browser tab has its own independent session.
      // This prevents cross-tab overwrites when multiple users log in on different tabs.
      sessionStorage.setItem('token', response.data.access_token);
      sessionStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  async register(name, email, password, role = 'TEAM_MEMBER') {
    const response = await api.post('/auth/register', { name, email, password, role });
    return response.data;
  },

  async getCurrentUser() {
    const response = await api.get('/auth/me');
    return response.data;
  },

  async getTeamMembers() {
    const response = await api.get('/auth/team-members');
    return response.data;
  },

  logout() {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
  },

  getUserFromStorage() {
    const userStr = sessionStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }
};
