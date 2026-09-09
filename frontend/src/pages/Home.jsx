import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, ShieldCheck, Camera, Users, Lock, KeyRound, CheckCircle, Image as ImageIcon, Layers, Eye } from 'lucide-react';
import TrizenLogo from '../components/TrizenLogo';

export default function Home({ user }) {
  const navigate = useNavigate();
  const [quickSlug, setQuickSlug] = useState('');

  const handleQuickGalleryAccess = (e) => {
    e.preventDefault();
    if (!quickSlug.trim()) return;
    // Extract slug if full URL is pasted
    let slug = quickSlug.trim();
    if (slug.includes('/gallery/')) {
      slug = slug.split('/gallery/')[1].split('/')[0];
    }
    navigate(`/gallery/${slug}`);
  };

  const handleGoToApp = () => {
    if (!user) {
      navigate('/login');
    } else if (user.role === 'ADMIN') {
      navigate('/admin');
    } else {
      navigate('/team');
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF7] text-gray-900 flex flex-col relative overflow-hidden">
      {/* Snapflo Soft Gradient Blurs */}
      <div className="absolute top-10 left-[5%] w-72 h-72 bg-violet-200/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-20 right-[10%] w-80 h-80 bg-indigo-200/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-[35%] w-96 h-96 bg-blue-200/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 right-[5%] w-72 h-72 bg-orange-200/30 rounded-full blur-3xl pointer-events-none" />

      {/* Hero Section */}
      <section className="relative z-10 pt-12 pb-16 sm:pt-20 sm:pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center space-y-8 flex-1">
        {/* Top Announcement Pill */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-gray-200 shadow-sm text-xs font-bold text-gray-800 animate-fadeIn">
          <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
          <span>Photography Studio & Event Gallery Platform</span>
          <Sparkles className="w-3.5 h-3.5 text-indigo-600 ml-1" />
        </div>

        {/* Hero Title */}
        <div className="space-y-4 max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-gray-900 tracking-tight leading-[1.1]">
            Every frame, <br />
            <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(to right, #8B5CF6, #6366F1, #3B82F6, #00C4CC, #FF6600)' }}>
              captured. delivered.
            </span>
          </h1>
          <p className="text-base sm:text-xl text-gray-600 max-w-2xl mx-auto font-medium leading-relaxed">
            FrameVault is studio management software for event leads & photographers to organize shoots, upload assets, select client favorites, and deliver PIN-protected galleries.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
          <button
            onClick={handleGoToApp}
            className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-xl shadow-indigo-500/25 transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
          >
            <span>{user ? 'Go to Dashboard' : 'Get Started Free'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <a
            href="#features"
            className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-white hover:bg-gray-50 border border-gray-200 text-gray-800 font-bold text-sm transition-all hover:scale-[1.02] shadow-xs flex items-center justify-center gap-2"
          >
            <span>Explore Platform Features</span>
          </a>
        </div>

        {/* Quick Gallery Customer Access Box */}
        <div className="pt-8 max-w-lg mx-auto">
          <div className="bg-white border border-gray-200/90 rounded-3xl p-6 shadow-xl space-y-3 text-left">
            <div className="flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-indigo-600" />
              <h3 className="text-sm font-bold text-gray-900">Have a Customer Gallery Code or Link?</h3>
            </div>
            <p className="text-xs text-gray-500">
              Enter your gallery slug or paste your shareable link to view your PIN-protected photo collection.
            </p>

            <form onSubmit={handleQuickGalleryAccess} className="flex gap-2 pt-1">
              <input
                type="text"
                value={quickSlug}
                onChange={(e) => setQuickSlug(e.target.value)}
                placeholder="e.g. abc12345 or full gallery URL"
                className="flex-1 px-4 py-2.5 rounded-xl snapflo-input text-xs font-medium"
                required
              />
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold transition-all shadow-xs shrink-0"
              >
                Open Gallery
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section id="features" className="relative z-10 py-16 bg-white border-t border-gray-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
              Everything You Need to <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(to right, #6366F1, #FF6600)' }}>Run Your Studio</span>
            </h2>
            <p className="text-sm text-gray-500 font-medium">
              Designed specifically for photography teams, lead admins, and clients.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1 */}
            <div className="p-6 rounded-3xl bg-[#FAFAF7] border border-gray-200/80 space-y-3 hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shadow-xs">
                <Camera className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-gray-900">Events & Shoots</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Create event profiles, specify shoot details, and assign dedicated team photographers to every event.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-3xl bg-[#FAFAF7] border border-gray-200/80 space-y-3 hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-xs">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-gray-900">Multi-Photo Uploads</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                High-speed drag and drop photo upload pipeline for team members with real-time progress indicators.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-3xl bg-[#FAFAF7] border border-gray-200/80 space-y-3 hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 shadow-xs">
                <ImageIcon className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-gray-900">Lead Photo Selection</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Lead admins curate and select best shots for customer delivery with 1-click batch selection tools.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-3xl bg-[#FAFAF7] border border-gray-200/80 space-y-3 hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-xs">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-gray-900">PIN Gallery Delivery</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Deliver branded customer galleries protected by a secure 6-digit access PIN and shareable URL.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-8 px-4 text-center text-xs text-gray-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <TrizenLogo className="w-7 h-7" showText={true} />
          </div>
          <p>&copy; 2026 TrizenAI Technologies Private Limited. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
