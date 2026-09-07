import api from './api';

export const eventService = {
  async getEvents() {
    const response = await api.get('/events');
    return response.data;
  },

  async getEventDetail(eventId) {
    const response = await api.get(`/events/${eventId}`);
    return response.data;
  },

  async createEvent(title, description, member_ids = []) {
    const response = await api.post('/events', { title, description, member_ids });
    return response.data;
  },

  async assignMembers(eventId, user_ids) {
    const response = await api.post(`/events/${eventId}/members`, { user_ids });
    return response.data;
  },

  async deleteEvent(eventId) {
    const response = await api.delete(`/events/${eventId}`);
    return response.data;
  }
};
