import React, { useState, useRef } from 'react';
import { UploadCloud, FileImage, CheckCircle, AlertCircle, Loader2, X } from 'lucide-react';
import { photoService } from '../services/photoService';

export default function PhotoUploader({ eventId, onUploadSuccess }) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const fileInputRef = useRef(null);

  const handleFiles = (files) => {
    setError('');
    setSuccessMsg('');
    const validFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (validFiles.length === 0) {
      setError('Please select valid image files (JPG, PNG, WebP).');
      return;
    }
    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (!eventId) {
      setError('Please select an event before uploading.');
      return;
    }
    if (selectedFiles.length === 0) {
      setError('Please select at least one photo file.');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setError('');
    setSuccessMsg('');

    try {
      const uploaded = await photoService.uploadPhotos(
        eventId,
        selectedFiles,
        (progress) => setUploadProgress(progress)
      );
      setSuccessMsg(`Successfully uploaded ${uploaded.length} photo(s)!`);
      setSelectedFiles([]);
      if (onUploadSuccess) onUploadSuccess(uploaded);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to upload photos. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-200/80 p-6 space-y-4 shadow-xs">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-gray-900">Upload Event Photos</h3>
          <p className="text-xs text-gray-500">Select multiple high-resolution photos for this shoot</p>
        </div>
        {selectedFiles.length > 0 && (
          <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
            {selectedFiles.length} file(s) selected
          </span>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Drag & Drop Zone */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
          dragActive
            ? 'border-indigo-600 bg-indigo-50/50'
            : 'border-gray-200 hover:border-indigo-400 bg-[#FAFAF7]'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3 border border-indigo-100 shadow-xs">
          <UploadCloud className="w-6 h-6" />
        </div>
        <p className="text-sm font-bold text-gray-900">
          Drag & drop photos here, or <span className="text-indigo-600 hover:underline">browse files</span>
        </p>
        <p className="text-xs text-gray-400 mt-1">Supports JPG, PNG, WEBP files up to 25MB each</p>
      </div>

      {/* File Queue List */}
      {selectedFiles.length > 0 && (
        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
          {selectedFiles.map((file, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs"
            >
              <div className="flex items-center gap-2.5 truncate">
                <FileImage className="w-4 h-4 text-indigo-600 shrink-0" />
                <span className="text-gray-900 font-medium truncate">{file.name}</span>
                <span className="text-gray-400">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(idx);
                }}
                disabled={uploading}
                className="text-gray-400 hover:text-gray-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload Progress & Action Button */}
      {uploading && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-gray-600 font-semibold">
            <span>Uploading asset files...</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full bg-indigo-600 transition-all duration-300 rounded-full"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {selectedFiles.length > 0 && (
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => setSelectedFiles([])}
            disabled={uploading}
            className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition-colors"
          >
            Clear Selection
          </button>
          <button
            type="button"
            onClick={handleUpload}
            disabled={uploading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition-all disabled:opacity-50"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <UploadCloud className="w-4 h-4" />
                <span>Upload {selectedFiles.length} Photo(s)</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
