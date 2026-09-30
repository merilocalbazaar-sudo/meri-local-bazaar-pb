import React, { useState } from 'react';
import { ShieldCheck, Lock, UserCheck, AlertCircle, ArrowRight, Eye, EyeOff } from 'lucide-react';

interface PartnerHubLoginProps {
  onLoginSuccess: (sessionData: {
    token: string;
    user: {
      uid: string;
      username: string;
      displayName: string;
      email: string;
      role: 'admin';
    };
  }) => void;
  onCancel?: () => void;
}

export const PartnerHubLogin: React.FC<PartnerHubLoginProps> = ({ onLoginSuccess, onCancel }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authStage, setAuthStage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!username.trim() || !password) {
      setErrorMessage('Invalid Partner Hub credentials');
      return;
    }

    setIsLoading(true);
    setAuthStage('Authenticating credentials with Partner Hub...');

    try {
      // Step 1: Server Authentication
      const res = await fetch('/api/partner-hub/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success || !data.token) {
        throw new Error(data.message || 'Invalid Partner Hub credentials');
      }

      // Step 2: Role Verification Stage
      setAuthStage('Verifying Administrator privileges & permissions...');
      await new Promise((resolve) => setTimeout(resolve, 500));

      if (data.user?.role !== 'admin' || data.user?.username !== 'Gamjinmarak') {
        throw new Error('Invalid Partner Hub credentials');
      }

      // Step 3: Success Transition
      setAuthStage('Access granted. Initializing Partner Hub Dashboard...');
      await new Promise((resolve) => setTimeout(resolve, 350));

      // Save token securely in session storage
      sessionStorage.setItem('partner_hub_token', data.token);
      sessionStorage.setItem('partner_hub_admin', JSON.stringify(data.user));

      onLoginSuccess({
        token: data.token,
        user: data.user,
      });
    } catch (err: any) {
      setErrorMessage('Invalid Partner Hub credentials');
    } finally {
      setIsLoading(false);
      setAuthStage(null);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-linear-to-r from-slate-900 via-indigo-950 to-purple-950 text-white p-6 text-center relative">
          <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-white/20 shadow-inner">
            <ShieldCheck className="w-8 h-8 text-yellow-400" />
          </div>
          <h2 className="text-xl font-black tracking-tight text-white uppercase">
            Partner Hub
          </h2>
          <p className="text-xs text-indigo-200 mt-1">
            Secure Platform Administration & Multi-Vendor Console
          </p>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 mt-3 rounded-full bg-yellow-400/20 text-yellow-300 text-[11px] font-semibold border border-yellow-400/30">
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
            Backend Role-Based Access Control
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {authStage && (
            <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-800 flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin shrink-0" />
              <span className="font-medium">{authStage}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Username</label>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter Partner Hub username"
                required
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
              />
              <UserCheck className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                className="w-full pl-9 pr-10 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-2.5 px-4 bg-indigo-900 hover:bg-indigo-950 text-white font-bold text-sm rounded-lg shadow transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <span>Login to Partner Hub</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="w-full py-1.5 text-xs text-slate-500 hover:text-slate-700 transition"
            >
              Return to Marketplace
            </button>
          )}

          <div className="pt-3 border-t border-slate-100 text-center">
            <p className="text-[11px] text-slate-400">
              Only authorized Partner Hub administrators may access this portal.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};
