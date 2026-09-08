import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Lock, KeyRound, Camera, AlertCircle, Eye, Download, X, Sparkles, ShieldCheck } from 'lucide-react';
import { galleryService } from '../services/galleryService';
import TrizenLogo from '../components/TrizenLogo';

export default function PublicGallery() {
  const { shareSlug } = useParams();
  
  // States
  const [meta, setMeta] = useState(null);
  const [pin, setPin] = useState('');
  const [galleryData, setGalleryData] = useState(null);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const [activePhoto, setActivePhoto] = useState(null);

  useEffect(() => {
    fetchMeta();
  }, [shareSlug]);

  const fetchMeta = async () => {
    setLoadingMeta(true);
    try {
      const data = await galleryService.getPublicMeta(shareSlug);
      setMeta(data);
    } catch (err) {
      setError(err.response?.data?.detail || 'This photo gallery is unavailable or does not exist.');
    } finally {
      setLoadingMeta(false);
    }
  };

  const handleVerifyPin = async (e) => {
    e.preventDefault();
    if (!pin) return;

    setVerifying(true);
    setError('');

    try {
      const data = await galleryService.verifyPinAndAccess(shareSlug, pin.trim());
      setGalleryData(data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Incorrect access PIN. Please verify and try again.');
    } finally {
      setVerifying(false);
    }
  };

  if (loadingMeta) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAF7]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 rounded-full border-3 border-indigo-600 border-t-transparent animate-spin mx-auto" />
          <p className="text-xs text-gray-500 font-semibold">Verifying gallery access link...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8 bg-[#FAFAF7]">
      {/* If Not Authenticated with PIN yet -> Display PIN Entry Screen */}
      {!galleryData ? (
        <div className="max-w-md mx-auto pt-8 space-y-6">
          <div className="bg-white p-8 rounded-3xl border border-gray-200/80 shadow-xl text-center space-y-6 relative overflow-hidden">
            <div className="inline-flex justify-center mb-1">
              <TrizenLogo className="w-12 h-12" showText={false} />
            </div>

            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-100 mb-2">
                <ShieldCheck className="w-3.5 h-3.5" />
                PIN-Protected Customer Gallery
              </span>
              <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">{meta?.event_title || 'Photo Gallery'}</h1>
              {meta?.event_description && (
                <p className="text-xs text-gray-500 mt-1">{meta.event_description}</p>
              )}
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs text-left">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleVerifyPin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">
                  Enter 6-Digit Access PIN
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    maxLength={6}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="e.g. 482917"
                    className="w-full pl-10 pr-4 py-3 rounded-xl snapflo-input font-mono text-center tracking-widest text-lg font-bold"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={verifying || pin.length < 4}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-50"
              >
                {verifying ? 'Verifying PIN...' : 'Unlock Gallery'}
              </button>
            </form>
          </div>
        </div>
      ) : (
        /* Gallery Photos Unlocked Screen */
        <div className="space-y-8 animate-fadeIn">
          {/* Header Banner */}
          <div className="bg-white p-8 rounded-3xl border border-gray-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-1.5 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-1">
                <Camera className="w-4 h-4" />
                <span>Official Delivered Gallery</span>
              </div>
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">{galleryData.event_title}</h1>
              {galleryData.event_description && (
                <p className="text-sm text-gray-500 mt-1 max-w-2xl">{galleryData.event_description}</p>
              )}
            </div>

            <div className="px-4 py-2 rounded-2xl bg-indigo-50 border border-indigo-100 text-xs font-bold text-indigo-900 self-start md:self-auto">
              Delivered <strong className="text-indigo-600">{galleryData.photos.length}</strong> Selected Photos
            </div>
          </div>

          {/* Photo Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {galleryData.photos.map((photo) => (
              <div
                key={photo.id}
                onClick={() => setActivePhoto(photo)}
                className="group relative rounded-2xl overflow-hidden aspect-square bg-gray-100 border border-gray-200/80 cursor-pointer hover:border-indigo-500 transition-all duration-300 shadow-xs hover:shadow-xl"
              >
                <img
                  src={photo.file_url}
                  alt={photo.filename}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end">
                  <div className="flex items-center justify-between text-xs text-white">
                    <span className="truncate font-medium">{photo.filename}</span>
                    <Eye className="w-4 h-4 text-indigo-400" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Lightbox Modal */}
          {activePhoto && (
            <div
              onClick={() => setActivePhoto(null)}
              className="fixed inset-0 z-50 bg-gray-900/90 backdrop-blur-md flex items-center justify-center p-4"
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className="relative max-w-5xl w-full bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-2xl space-y-0"
              >
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                  <h4 className="text-sm font-bold text-gray-900 truncate">{activePhoto.filename}</h4>
                  <div className="flex items-center gap-3">
                    <a
                      href={activePhoto.file_url}
                      download={activePhoto.filename}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors shadow-md shadow-indigo-500/20"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download High Res</span>
                    </a>
                    <button
                      onClick={() => setActivePhoto(null)}
                      className="p-1.5 text-gray-400 hover:text-gray-900 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="p-4 flex items-center justify-center bg-gray-950/90 max-h-[75vh]">
                  <img
                    src={activePhoto.file_url}
                    alt={activePhoto.filename}
                    className="max-h-[70vh] max-w-full object-contain rounded-lg shadow-xl"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
