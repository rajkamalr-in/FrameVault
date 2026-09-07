import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, User, Shield, Users, AlertCircle, ArrowRight, Sparkles } from 'lucide-react';
import { authService } from '../services/authService';
import TrizenLogo from '../components/TrizenLogo';

export default function Login({ onLoginSuccess }) {
  const navigate = useNavigate();
  const [isRegistering, setIsRegistering] = useState(false);
  
  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('ADMIN');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegistering) {
        await authService.register(name, email, password, role);
        const authData = await authService.login(email, password);
        if (onLoginSuccess) onLoginSuccess(authData.user);
        navigate(authData.user.role === 'ADMIN' ? '/admin' : '/team');
      } else {
        const authData = await authService.login(email, password);
        if (onLoginSuccess) onLoginSuccess(authData.user);
        navigate(authData.user.role === 'ADMIN' ? '/admin' : '/team');
      }
    } catch (err) {
      let msg = 'Authentication failed. Please check your credentials.';
      if (err.response?.data?.detail) {
        if (typeof err.response.data.detail === 'string') {
          msg = err.response.data.detail;
        } else if (Array.isArray(err.response.data.detail)) {
          msg = err.response.data.detail.map(d => d.msg || d.message || JSON.stringify(d)).join(', ');
        }
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 relative overflow-hidden bg-[#FAFAF7]">
      {/* Snapflo Studio Ambient Soft Pastel Gradient Blurs */}
      <div className="absolute top-10 left-[15%] w-72 h-72 bg-violet-200/50 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-20 right-[15%] w-80 h-80 bg-blue-200/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-[30%] w-64 h-64 bg-orange-200/30 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full bg-white border border-gray-200/80 p-8 rounded-3xl shadow-xl relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex justify-center mb-1">
            <TrizenLogo className="w-12 h-12" showText={false} />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-[11px] font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              TrizenAI Studio Portal
            </div>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
              {isRegistering ? 'Create Studio Account' : 'Welcome Back'}
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              {isRegistering
                ? 'Register your account to manage shoots, team members, and galleries'
                : 'Sign in to access your FrameVault dashboard'}
            </p>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegistering && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Arjun Sharma"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl snapflo-input text-xs font-medium"
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@trizen-ai.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl snapflo-input text-xs font-medium"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl snapflo-input text-xs font-medium"
                required
              />
            </div>
          </div>

          {isRegistering && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Select Role</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('ADMIN')}
                  className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all ${
                    role === 'ADMIN'
                      ? 'bg-indigo-50 border-indigo-600 text-indigo-700 shadow-xs'
                      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Shield className="w-4 h-4 text-indigo-600" />
                  <span>Admin / Lead</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('TEAM_MEMBER')}
                  className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all ${
                    role === 'TEAM_MEMBER'
                      ? 'bg-emerald-50 border-emerald-600 text-emerald-700 shadow-xs'
                      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Users className="w-4 h-4 text-emerald-600" />
                  <span>Team Member</span>
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-50 mt-2"
          >
            <span>{isRegistering ? 'Create Account' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center pt-3 border-t border-gray-100">
          <button
            type="button"
            onClick={() => setIsRegistering(!isRegistering)}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            {isRegistering
              ? 'Already have an account? Sign In'
              : "Don't have an account yet? Register"}
          </button>
        </div>
      </div>
    </div>
  );
}
