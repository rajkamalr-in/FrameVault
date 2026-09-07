import React, { useState } from 'react';
import { Check, Eye, Trash2, Download, CheckSquare, Square, X } from 'lucide-react';
import { photoService } from '../services/photoService';

export default function PhotoGrid({
  photos,
  isAdmin = false,
  onToggleSelection,
  onPhotoDeleted,
  onBatchSelectToggle
}) {
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const selectedCount = photos.filter(p => p.is_selected).length;

  const handleDelete = async (photoId, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this photo?')) return;
    setDeletingId(photoId);
    try {
      await photoService.deletePhoto(photoId);
      if (onPhotoDeleted) onPhotoDeleted(photoId);
    } catch (err) {
      alert('Failed to delete photo.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSelectAll = () => {
    if (onBatchSelectToggle) {
      const allIds = photos.map(p => p.id);
      onBatchSelectToggle(allIds, true);
    }
  };

  const handleDeselectAll = () => {
    if (onBatchSelectToggle) {
      const allIds = photos.map(p => p.id);
      onBatchSelectToggle(allIds, false);
    }
  };

  if (photos.length === 0) {
    return (
      <div className="py-16 text-center rounded-3xl bg-white border border-gray-200">
        <p className="text-gray-500 text-sm font-medium">No photos uploaded yet for this event.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Admin Action Bar */}
      {isAdmin && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-white border border-gray-200/80 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-700">
              Selected for Customer Gallery: <span className="text-indigo-600 font-extrabold">{selectedCount}</span> / {photos.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSelectAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-colors"
            >
              <CheckSquare className="w-3.5 h-3.5 text-indigo-600" />
              <span>Select All</span>
            </button>
            <button
              onClick={handleDeselectAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition-colors"
            >
              <Square className="w-3.5 h-3.5 text-gray-400" />
              <span>Deselect All</span>
            </button>
          </div>
        </div>
      )}

      {/* Grid View */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {photos.map((photo) => (
          <div
            key={photo.id}
            onClick={() => setSelectedPhoto(photo)}
            className={`group relative rounded-2xl overflow-hidden aspect-square bg-gray-100 border cursor-pointer transition-all duration-300 ${
              photo.is_selected
                ? 'border-indigo-600 ring-2 ring-indigo-500/30 shadow-md'
                : 'border-gray-200 hover:border-gray-300 shadow-xs'
            }`}
          >
            <img
              src={photo.file_url}
              alt={photo.filename}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />

            {/* Selection Checkbox for Admin */}
            {isAdmin && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onToggleSelection) onToggleSelection(photo.id);
                }}
                className={`absolute top-2.5 left-2.5 z-10 w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                  photo.is_selected
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-white/80 backdrop-blur-sm border border-gray-300 text-gray-400 opacity-90 group-hover:opacity-100 hover:text-gray-900'
                }`}
              >
                <Check className={`w-4 h-4 ${photo.is_selected ? 'stroke-[3]' : ''}`} />
              </button>
            )}

            {/* Overlay Gradient on Hover */}
            <div className="absolute inset-0 bg-gradient-to-t from-gray-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-end">
              <p className="text-[11px] font-medium text-white truncate">{photo.filename}</p>
              <div className="flex items-center justify-between text-[10px] text-gray-300 mt-1">
                <span>By {photo.uploader_name || 'Team'}</span>
                <button
                  onClick={(e) => handleDelete(photo.id, e)}
                  className="p-1 text-gray-300 hover:text-red-400 transition-colors"
                  title="Delete Photo"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      {selectedPhoto && (
        <div
          onClick={() => setSelectedPhoto(null)}
          className="fixed inset-0 z-50 bg-gray-900/80 backdrop-blur-md flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl w-full bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-2xl"
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div>
                <h4 className="text-sm font-bold text-gray-900 truncate max-w-xs sm:max-w-md">
                  {selectedPhoto.filename}
                </h4>
                <p className="text-xs text-gray-500">Uploaded by {selectedPhoto.uploader_name}</p>
              </div>
              <div className="flex items-center gap-3">
                <a
                  href={selectedPhoto.file_url}
                  download={selectedPhoto.filename}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors shadow-md shadow-indigo-500/20"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </a>
                <button
                  onClick={() => setSelectedPhoto(null)}
                  className="p-1.5 text-gray-400 hover:text-gray-900 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-4 flex items-center justify-center bg-gray-950/90 max-h-[70vh]">
              <img
                src={selectedPhoto.file_url}
                alt={selectedPhoto.filename}
                className="max-h-[65vh] max-w-full object-contain rounded-lg shadow-md"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
