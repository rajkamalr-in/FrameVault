import api from './api';
import { firebaseAuth, firebaseAuthError, googleProvider } from './firebase';
import { signInWithPopup } from 'firebase/auth';

function storeSession(authData) {
  if (authData.access_token) {
    sessionStorage.setItem('token', authData.access_token);
    sessionStorage.setItem('user', JSON.stringify(authData.user));
  }
}

export const authService = {
  async login(email, password) {
    const response = await api.post('/auth/login', { email, password });
    storeSession(response.data);
    return response.data;
  },

  async register(name, email, password, role = 'TEAM_MEMBER') {
    const response = await api.post('/auth/register', { name, email, password, role });
    return response.data;
  },

  async createTeamMember(name, email, password) {
    const response = await api.post('/auth/team-members', {
      name,
      email,
      password,
      role: 'TEAM_MEMBER',
    });
    return response.data;
  },

  async googleLogin() {
    if (firebaseAuthError || !firebaseAuth || !googleProvider) {
      throw new Error('Google sign-in is unavailable because the Firebase web API key is invalid or not configured.');
    }
    const result = await signInWithPopup(firebaseAuth, googleProvider);
    const idToken = await result.user.getIdToken();
    const response = await api.post('/auth/google', { id_token: idToken });
    storeSession(response.data);
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
