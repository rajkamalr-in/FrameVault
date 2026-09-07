import api from './api';

export const galleryService = {
  async publishGallery(eventId, pin) {
    const response = await api.post('/galleries/publish', { event_id: eventId, pin });
    return response.data;
  },

  async getPublicMeta(shareSlug) {
    const response = await api.get(`/galleries/public/${shareSlug}/meta`);
    return response.data;
  },

  async verifyPinAndAccess(shareSlug, pin) {
    const response = await api.post(`/galleries/public/${shareSlug}/access`, { pin });
    return response.data;
  }
};
