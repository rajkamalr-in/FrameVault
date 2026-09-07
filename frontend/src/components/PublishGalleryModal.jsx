import React, { useState } from 'react';
import { Share2, Lock, CheckCircle, AlertCircle, Copy, Check, X, KeyRound } from 'lucide-react';
import { galleryService } from '../services/galleryService';

export default function PublishGalleryModal({ event, onClose, onPublished }) {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [publishedData, setPublishedData] = useState(null);
  const [copied, setCopied] = useState(false);

  const handlePublish = async (e) => {
    e.preventDefault();
    setError('');

    if (!pin || pin.trim().length < 4) {
      setError('Please set an access PIN of at least 4 digits (e.g. 482917).');
      return;
    }

    setLoading(true);
    try {
      const result = await galleryService.publishGallery(event.id, pin.trim());
      setPublishedData(result);
      if (onPublished) onPublished(result);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to publish gallery.');
    } finally {
      setLoading(false);
    }
  };

  const getShareUrl = (shareSlug) => {
    return `${window.location.origin}/gallery/${shareSlug}`;
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative max-w-md w-full bg-white rounded-3xl border border-gray-200 p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shadow-xs">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Publish Gallery</h3>
              <p className="text-xs text-gray-500 truncate max-w-[200px]">{event.title}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-900 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!publishedData ? (
          <form onSubmit={handlePublish} className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-[#FAFAF7] border border-gray-200/80 text-xs space-y-1">
              <div className="flex justify-between text-gray-700 font-semibold">
                <span>Selected Photos:</span>
                <span className="font-extrabold text-indigo-600">{event.selected_photo_count || 0}</span>
              </div>
              <p className="text-gray-500">Only selected photos will be delivered in the customer gallery.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
                Set Access PIN
              </label>
              <input
                type="text"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                placeholder="e.g. 482917"
                className="w-full px-4 py-2.5 rounded-xl snapflo-input text-sm tracking-widest font-mono font-bold text-center"
                required
              />
              <p className="text-[11px] text-gray-400 mt-1">Set a 4 to 6 digit numerical PIN to protect customer access.</p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !event.selected_photo_count}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20 disabled:opacity-50"
              >
                <Lock className="w-4 h-4" />
                <span>Publish Gallery</span>
              </button>
            </div>
          </form>
        ) : (
          /* Published Success State */
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-3">
              <CheckCircle className="w-6 h-6 shrink-0 text-emerald-600" />
              <div>
                <p className="font-bold text-emerald-900">Gallery Published Successfully!</p>
                <p className="text-emerald-700 mt-0.5">Shareable URL and PIN are active.</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700">Shareable Customer Link</label>
              <div className="flex items-center gap-2 p-2 rounded-xl bg-gray-50 border border-gray-200">
                <input
                  type="text"
                  readOnly
                  value={getShareUrl(publishedData.share_slug)}
                  className="bg-transparent text-xs text-indigo-700 font-mono font-semibold w-full focus:outline-none px-2"
                />
                <button
                  onClick={() => copyToClipboard(getShareUrl(publishedData.share_slug))}
                  className="p-2 rounded-lg bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 transition-colors"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-between text-xs">
              <span className="text-gray-500 font-medium">Access PIN Required:</span>
              <span className="font-mono font-extrabold text-lg text-gray-900 tracking-widest">{pin}</span>
            </div>

            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
