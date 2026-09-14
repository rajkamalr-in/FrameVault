import api from './api';

export const photoService = {
  async uploadPhotos(eventId, files, onProgress) {
    const fileList = Array.from(files);
    const totalFiles = fileList.length;
    if (totalFiles === 0) return [];

    const allUploaded = [];
    if (onProgress) onProgress(5);

    // Upload files individually to guarantee no Cloud Run payload size limit issues and smooth progress
    for (let i = 0; i < totalFiles; i++) {
      const file = fileList[i];
      const formData = new FormData();
      formData.append('event_id', eventId);
      formData.append('files', file);

      const response = await api.post('/photos/upload', formData, {
        headers: {
          'Content-Type': undefined, // Let browser set multipart boundary
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total && onProgress) {
            const filePct = progressEvent.loaded / progressEvent.total;
            const overallPct = Math.round(((i + filePct) / totalFiles) * 90) + 5;
            onProgress(Math.min(overallPct, 95));
          }
        },
      });

      if (response.data && Array.isArray(response.data)) {
        allUploaded.push(...response.data);
      }
      if (onProgress) {
        onProgress(Math.round(((i + 1) / totalFiles) * 95));
      }
    }

    if (onProgress) onProgress(100);
    return allUploaded;
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
