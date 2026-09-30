import React, { useState } from 'react';
import { X, Mail, Lock, User, Sparkles, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRole?: UserRole;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultRole = 'customer',
}) => {
  const { signInEmail, signUpEmail, signInGoogle, quickLoginAsRole } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [chosenRole, setChosenRole] = useState<UserRole>(defaultRole);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      if (isRegister) {
        if (!displayName.trim()) {
          throw new Error('Please enter your full name');
        }
        await signUpEmail(email, password, displayName, chosenRole);
      } else {
        await signInEmail(email, password);
      }
      onClose();
    } catch (err: any) {
      console.error('Auth submit error:', err);
      let msg = err.message || 'Authentication failed. Please check credentials.';
      if (err.code === 'auth/operation-not-allowed' || msg.includes('operation-not-allowed')) {
        msg = 'Email provider initialization failed. Please use one of the Instant Role buttons above.';
      } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        msg = 'Invalid email or password.';
      }
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleFillAdmin = () => {
    setEmail('merilocalbazaar@gmail.com');
    setPassword('admin123');
    setIsRegister(false);
    setErrorMsg(null);
  };

  const handleGoogle = async () => {
    setErrorMsg(null);
    setLoading(true);
    try {
      await signInGoogle(chosenRole);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Google sign in cancelled or failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (role: UserRole) => {
    setLoading(true);
    try {
      await quickLoginAsRole(role);
      onClose();
    } catch (err: any) {
      setErrorMsg('Quick login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/50 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Top Banner */}
        <div className="bg-[#2874f0] p-5 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black italic">Bazaar<span className="text-yellow-400">X</span></span>
            <span className="text-[10px] bg-yellow-400 text-blue-900 font-extrabold px-1.5 py-0.5 rounded uppercase">
              Secure Access
            </span>
          </div>
          <p className="text-xs text-blue-100 mt-1">
            {isRegister
              ? 'Join as a Customer, Seller, or Delivery Hero today'
              : 'Sign in to access orders, cart, shop, and live deliveries'}
          </p>
        </div>

        {/* Quick Demo Selector */}
        <div className="bg-slate-50 border-b border-slate-200 p-3">
          <div className="flex items-center gap-1 text-[11px] font-bold text-slate-600 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Instant Role Testing (One-Click)</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            <button
              onClick={() => handleQuickDemo('customer')}
              className="px-2 py-1.5 bg-white border border-blue-200 text-blue-700 rounded text-xs font-semibold hover:bg-blue-50 transition shadow-2xs text-center"
            >
              🛍️ Customer
            </button>
            <button
              onClick={() => handleQuickDemo('seller')}
              className="px-2 py-1.5 bg-white border border-emerald-200 text-emerald-700 rounded text-xs font-semibold hover:bg-emerald-50 transition shadow-2xs text-center"
            >
              🏬 Seller
            </button>
            <button
              onClick={() => handleQuickDemo('delivery_partner')}
              className="px-2 py-1.5 bg-white border border-amber-200 text-amber-700 rounded text-xs font-semibold hover:bg-amber-50 transition shadow-2xs text-center"
            >
              🛵 Delivery
            </button>
            <button
              onClick={() => handleQuickDemo('admin')}
              className="px-2 py-1.5 bg-white border border-indigo-200 text-indigo-800 rounded text-xs font-semibold hover:bg-indigo-50 transition shadow-2xs text-center"
            >
              👑 Partner Hub
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-5">
          {/* Toggle Login / Register */}
          <div className="flex border-b border-slate-200 mb-4">
            <button
              type="button"
              onClick={() => setIsRegister(false)}
              className={`flex-1 py-2 text-center text-xs sm:text-sm font-bold border-b-2 transition ${
                !isRegister
                  ? 'border-[#2874f0] text-[#2874f0]'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setIsRegister(true)}
              className={`flex-1 py-2 text-center text-xs sm:text-sm font-bold border-b-2 transition ${
                isRegister
                  ? 'border-[#2874f0] text-[#2874f0]'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              Create Account
            </button>
          </div>

          {errorMsg && (
            <div className="mb-3 p-2.5 bg-red-50 border border-red-200 rounded text-xs text-red-600 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            {isRegister && (
              <>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Full Name</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="e.g. Rahul Sharma"
                      className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-300 rounded focus:border-[#2874f0] focus:ring-1 focus:ring-[#2874f0] outline-none"
                    />
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Primary Role</label>
                  <div className="grid grid-cols-3 gap-2">
                    <label
                      className={`flex flex-col items-center justify-center p-2 rounded border cursor-pointer text-xs font-medium text-center ${
                        chosenRole === 'customer'
                          ? 'border-blue-600 bg-blue-50 text-blue-700 font-bold'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="role"
                        value="customer"
                        checked={chosenRole === 'customer'}
                        onChange={() => setChosenRole('customer')}
                        className="sr-only"
                      />
                      <span>🛍️ Customer</span>
                    </label>

                    <label
                      className={`flex flex-col items-center justify-center p-2 rounded border cursor-pointer text-xs font-medium text-center ${
                        chosenRole === 'seller'
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-700 font-bold'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="role"
                        value="seller"
                        checked={chosenRole === 'seller'}
                        onChange={() => setChosenRole('seller')}
                        className="sr-only"
                      />
                      <span>🏬 Shop/Seller</span>
                    </label>

                    <label
                      className={`flex flex-col items-center justify-center p-2 rounded border cursor-pointer text-xs font-medium text-center ${
                        chosenRole === 'delivery_partner'
                          ? 'border-amber-600 bg-amber-50 text-amber-700 font-bold'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="role"
                        value="delivery_partner"
                        checked={chosenRole === 'delivery_partner'}
                        onChange={() => setChosenRole('delivery_partner')}
                        className="sr-only"
                      />
                      <span>🛵 Delivery</span>
                    </label>
                  </div>
                </div>
              </>
            )}

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-slate-600">Email Address</label>
                <button
                  type="button"
                  onClick={handleFillAdmin}
                  className="text-[11px] font-semibold text-[#2874f0] hover:underline"
                >
                  Fill merilocalbazaar@gmail.com
                </button>
              </div>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-300 rounded focus:border-[#2874f0] focus:ring-1 focus:ring-[#2874f0] outline-none"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Password</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-300 rounded focus:border-[#2874f0] focus:ring-1 focus:ring-[#2874f0] outline-none"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full min-h-[44px] py-2.5 bg-[#fb641b] hover:bg-[#e85b17] text-white font-bold rounded-xl text-xs sm:text-sm shadow-md transition cursor-pointer touch-manipulation active:scale-95 disabled:opacity-50"
            >
              {loading ? 'Processing...' : isRegister ? 'Create Account' : 'Continue to Sign In'}
            </button>
          </form>

          {/* Google Sign In */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold text-slate-400 bg-white px-2">
              Or continue with
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogle}
            disabled={loading}
            className="w-full min-h-[44px] py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 transition shadow-2xs cursor-pointer touch-manipulation active:scale-95"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Google Account</span>
          </button>
        </div>
      </div>
    </div>
  );
};
