import api from './api';

export const photoService = {
  async uploadPhotos(eventId, files, onProgress) {
    const formData = new FormData();
    formData.append('event_id', eventId);
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }

    const response = await api.post('/photos/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      }
    });
    return response.data;
  },

  async getEventPhotos(eventId) {
    const response = await api.get(`/photos/event/${eventId}`);
    return response.data;
  },

  async toggleSelection(photoId) {
    const response = await api.patch(`/photos/${photoId}/toggle-selection`);
    return response.data;
  },

  async batchSelect(photoIds, isSelected) {
    const response = await api.post('/photos/batch-select', {
      photo_ids: photoIds,
      is_selected: isSelected
    });
    return response.data;
  },

  async deletePhoto(photoId) {
    const response = await api.delete(`/photos/${photoId}`);
    return response.data;
  }
};
