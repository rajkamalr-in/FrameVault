// import React, { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { Lock, Mail, User, Shield, Users, AlertCircle, ArrowRight, Sparkles } from 'lucide-react';
// import { authService } from '../services/authService';
// import TrizenLogo from '../components/TrizenLogo';

// export default function Login({ onLoginSuccess }) {
//   const navigate = useNavigate();
//   const [isRegistering, setIsRegistering] = useState(false);

//   // Form State
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [name, setName] = useState('');
//   const [role, setRole] = useState('ADMIN');

//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError('');
//     setLoading(true);

//     try {
//       if (isRegistering) {
//         await authService.register(name, email, password, role);
//         const authData = await authService.login(email, password);
//         if (onLoginSuccess) onLoginSuccess(authData.user);
//         navigate(authData.user.role === 'ADMIN' ? '/admin' : '/team');
//       } else {
//         const authData = await authService.login(email, password);
//         if (onLoginSuccess) onLoginSuccess(authData.user);
//         navigate(authData.user.role === 'ADMIN' ? '/admin' : '/team');
//       }
//     } catch (err) {
//       let msg = 'Authentication failed. Please check your credentials.';
//       if (err.response?.data?.detail) {
//         if (typeof err.response.data.detail === 'string') {
//           msg = err.response.data.detail;
//         } else if (Array.isArray(err.response.data.detail)) {
//           msg = err.response.data.detail.map(d => d.msg || d.message || JSON.stringify(d)).join(', ');
//         }
//       }
//       setError(msg);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 relative overflow-hidden bg-[#FAFAF7]">
//       {/* Snapflo Studio Ambient Soft Pastel Gradient Blurs */}
//       <div className="absolute top-10 left-[15%] w-72 h-72 bg-violet-200/50 rounded-full blur-3xl pointer-events-none" />
//       <div className="absolute top-20 right-[15%] w-80 h-80 bg-blue-200/40 rounded-full blur-3xl pointer-events-none" />
//       <div className="absolute bottom-10 left-[30%] w-64 h-64 bg-orange-200/30 rounded-full blur-3xl pointer-events-none" />

//       <div className="max-w-md w-full bg-white border border-gray-200/80 p-8 rounded-3xl shadow-xl relative z-10 space-y-6">
//         {/* Brand Header */}
//         <div className="text-center space-y-3">
//           <div className="inline-flex justify-center mb-1">
//             <TrizenLogo className="w-12 h-12" showText={false} />
//           </div>
//           <div>
//             {/* <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-[11px] font-bold uppercase tracking-wider mb-2">
//               <Sparkles className="w-3.5 h-3.5" />
//               TrizenAI Studio Portal
//             </div> */}
//             <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
//               {isRegistering ? 'Create Studio Account' : 'Welcome Back'}
//             </h1>
//             <p className="text-xs text-gray-500 mt-1">
//               {isRegistering
//                 ? 'Register your account to manage shoots, team members, and galleries'
//                 : 'Sign in to access your FrameVault dashboard'}
//             </p>
//           </div>
//         </div>

//         {error && (
//           <div className="flex items-center gap-2 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs">
//             <AlertCircle className="w-4 h-4 shrink-0" />
//             <span>{error}</span>
//           </div>
//         )}

//         <form onSubmit={handleSubmit} className="space-y-4">
//           {isRegistering && (
//             <div>
//               <label className="block text-xs font-semibold text-gray-700 mb-1.5">Full Name</label>
//               <div className="relative">
//                 <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
//                 <input
//                   type="text"
//                   value={name}
//                   onChange={(e) => setName(e.target.value)}
//                   placeholder="e.g. Rajkamal"
//                   className="w-full pl-10 pr-4 py-2.5 rounded-xl snapflo-input text-xs font-medium"
//                   required
//                 />
//               </div>
//             </div>
//           )}

//           <div>
//             <label className="block text-xs font-semibold text-gray-700 mb-1.5">Email Address</label>
//             <div className="relative">
//               <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
//               <input
//                 type="email"
//                 value={email}
//                 onChange={(e) => setEmail(e.target.value)}
//                 placeholder="name@abc.com"
//                 className="w-full pl-10 pr-4 py-2.5 rounded-xl snapflo-input text-xs font-medium"
//                 required
//               />
//             </div>
//           </div>

//           <div>
//             <label className="block text-xs font-semibold text-gray-700 mb-1.5">Password</label>
//             <div className="relative">
//               <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
//               <input
//                 type="password"
//                 value={password}
//                 onChange={(e) => setPassword(e.target.value)}
//                 placeholder="••••••••"
//                 className="w-full pl-10 pr-4 py-2.5 rounded-xl snapflo-input text-xs font-medium"
//                 required
//               />
//             </div>
//           </div>

//           {isRegistering && (
//             <div>
//               <label className="block text-xs font-semibold text-gray-700 mb-1.5">Select Role</label>
//               <div className="grid grid-cols-2 gap-2">
//                 <button
//                   type="button"
//                   onClick={() => setRole('ADMIN')}
//                   className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all ${role === 'ADMIN'
//                     ? 'bg-indigo-50 border-indigo-600 text-indigo-700 shadow-xs'
//                     : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
//                     }`}
//                 >
//                   <Shield className="w-4 h-4 text-indigo-600" />
//                   <span>Admin / Lead</span>
//                 </button>
//                 <button
//                   type="button"
//                   onClick={() => setRole('TEAM_MEMBER')}
//                   className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all ${role === 'TEAM_MEMBER'
//                     ? 'bg-emerald-50 border-emerald-600 text-emerald-700 shadow-xs'
//                     : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
//                     }`}
//                 >
//                   <Users className="w-4 h-4 text-emerald-600" />
//                   <span>Team Member</span>
//                 </button>
//               </div>
//             </div>
//           )}

//           <button
//             type="submit"
//             disabled={loading}
//             className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-50 mt-2"
//           >
//             <span>{isRegistering ? 'Create Account' : 'Sign In'}</span>
//             <ArrowRight className="w-4 h-4" />
//           </button>
//         </form>

//         <div className="text-center pt-3 border-t border-gray-100">
//           <button
//             type="button"
//             onClick={() => setIsRegistering(!isRegistering)}
//             className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
//           >
//             {isRegistering
//               ? 'Already have an account? Sign In'
//               : "Don't have an account yet? Register"}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, User, Shield, Users, AlertCircle, ArrowRight } from 'lucide-react';
import { authService } from '../services/authService';
import TrizenLogo from '../components/TrizenLogo';

const GoogleIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 48 48"
    className="w-5 h-5 shrink-0"
    aria-hidden="true"
  >
    <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
    <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
    <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
    <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
  </svg>
);

export default function Login({ onLoginSuccess }) {
  const navigate = useNavigate();
  const [isRegistering, setIsRegistering] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('ADMIN');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGooglePlaceholder = () => {
    setError('Google sign-in will be enabled when the app is deployed with the OAuth backend configuration.');
  };

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
      <div className="absolute top-10 left-[15%] w-72 h-72 bg-violet-200/50 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-20 right-[15%] w-80 h-80 bg-blue-200/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-[30%] w-64 h-64 bg-orange-200/30 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full bg-white border border-gray-200/80 p-8 rounded-3xl shadow-xl relative z-10 space-y-6">
        <div className="text-center space-y-3">
          <div className="inline-flex justify-center mb-1">
            <TrizenLogo className="w-12 h-12" showText={false} />
          </div>
          <div>
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

        <div className="space-y-3">
          <button
            type="button"
            onClick={handleGooglePlaceholder}
            className="w-full flex items-center justify-center gap-3 py-3 rounded-xl border border-gray-200 bg-white text-gray-700 text-xs font-semibold shadow-sm hover:bg-gray-50 transition-all"
          >
            <GoogleIcon />
            <span className="leading-none">{isRegistering ? 'Sign up with Google' : 'Continue with Google'}</span>
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-[11px] font-medium text-gray-500">
              <span className="bg-white px-3">or continue with email</span>
            </div>
          </div>
        </div>

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
                  placeholder="e.g. Rajkamal"
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
                placeholder="name@abc.com"
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