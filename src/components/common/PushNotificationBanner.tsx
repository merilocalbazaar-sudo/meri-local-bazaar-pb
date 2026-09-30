import React, { useState, useEffect } from 'react';
import {
  Bell,
  Volume2,
  VolumeX,
  CheckCircle,
  X,
  Package,
  Bike,
  Sparkles,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import {
  InAppAlert,
  subscribeToInAppAlerts,
  getNotificationPermission,
  requestNotificationPermission,
  playTestSound,
  isNotificationSupported,
} from '../../services/notificationService';

interface PushNotificationBannerProps {
  role?: string;
  onNavigateToTab?: (tab: string) => void;
}

export const PushNotificationBanner: React.FC<PushNotificationBannerProps> = ({
  role = 'customer',
  onNavigateToTab,
}) => {
  const [activeAlerts, setActiveAlerts] = useState<InAppAlert[]>([]);
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [showPromptBanner, setShowPromptBanner] = useState<boolean>(false);
  const [bannerDismissed, setBannerDismissed] = useState<boolean>(false);

  useEffect(() => {
    // Check permission status
    const perm = getNotificationPermission();
    setPermission(perm);

    // Show prompt to Sellers and Delivery Partners if permission not granted yet
    if ((role === 'seller' || role === 'delivery_partner') && perm === 'default') {
      const dismissed = sessionStorage.getItem('bazaarx_prompt_dismissed');
      if (!dismissed) {
        setShowPromptBanner(true);
      }
    } else {
      setShowPromptBanner(false);
    }
  }, [role]);

  // Subscribe to real-time in-app alerts (triggered by Supabase Realtime)
  useEffect(() => {
    const unsubscribe = subscribeToInAppAlerts((alert) => {
      setActiveAlerts((prev) => [alert, ...prev.slice(0, 4)]);

      // Auto dismiss after 9 seconds
      setTimeout(() => {
        setActiveAlerts((current) => current.filter((a) => a.id !== alert.id));
      }, 9000);
    });

    return () => unsubscribe();
  }, []);

  const handleRequestPermission = async () => {
    const res = await requestNotificationPermission();
    setPermission(res);
    if (res === 'granted') {
      setShowPromptBanner(false);
    }
  };

  const dismissPrompt = () => {
    setShowPromptBanner(false);
    setBannerDismissed(true);
    sessionStorage.setItem('bazaarx_prompt_dismissed', 'true');
  };

  const removeAlert = (id: string) => {
    setActiveAlerts((current) => current.filter((a) => a.id !== id));
  };

  return (
    <>
      {/* 1. SELLER / DELIVERY PARTNER PUSH NOTIFICATION ENABLE BAR (Top subtle sticky banner) */}
      {showPromptBanner && !bannerDismissed && (role === 'seller' || role === 'delivery_partner') && (
        <div className="bg-linear-to-r from-indigo-900 via-purple-900 to-slate-900 text-white px-4 py-2.5 shadow-lg border-b border-indigo-700/50 relative z-40">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
              </span>
              <Bell className="w-4 h-4 text-yellow-400 shrink-0" />
              <div>
                <span className="font-bold text-white">
                  {role === 'seller'
                    ? 'Turn On Order Push Alerts & Sound'
                    : 'Turn On Delivery Assignment Alerts & Sound'}
                </span>
                <span className="text-slate-300 hidden md:inline ml-1.5">
                  Get instant audio chimes and native device notifications whenever new orders or assignments arrive!
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
              <button
                onClick={() => playTestSound(role === 'delivery_partner' ? 'delivery' : 'order')}
                className="px-2.5 py-1 bg-white/10 hover:bg-white/20 border border-white/20 text-slate-200 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer"
                title="Test notification sound chime"
              >
                <Volume2 className="w-3.5 h-3.5 text-yellow-400" />
                <span>Test Sound</span>
              </button>

              <button
                onClick={handleRequestPermission}
                className="px-3.5 py-1 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-bold rounded-lg text-[11px] shadow-sm transition cursor-pointer flex items-center gap-1"
              >
                <Bell className="w-3.5 h-3.5" />
                <span>Allow Push Notifications</span>
              </button>

              <button
                onClick={dismissPrompt}
                className="p-1 text-slate-400 hover:text-white transition cursor-pointer ml-1"
                aria-label="Dismiss banner"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. FLOATING REAL-TIME IN-APP ALERT TOASTS */}
      {activeAlerts.length > 0 && (
        <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-2 sm:px-0">
          {activeAlerts.map((alert) => {
            const isOrder = alert.type === 'order';
            const isDelivery = alert.type === 'delivery';

            return (
              <div
                key={alert.id}
                className={`pointer-events-auto rounded-2xl shadow-2xl border p-4 backdrop-blur-md transition-all duration-300 animate-in slide-in-from-top-4 fade-in ${
                  isOrder
                    ? 'bg-slate-900/95 border-emerald-500/50 text-white shadow-emerald-950/40'
                    : isDelivery
                    ? 'bg-slate-900/95 border-amber-500/50 text-white shadow-amber-950/40'
                    : 'bg-slate-900/95 border-indigo-500/50 text-white shadow-indigo-950/40'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Icon with glowing pulse */}
                  <div
                    className={`p-2.5 rounded-xl shrink-0 ${
                      isOrder
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : isDelivery
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                    }`}
                  >
                    {isOrder ? (
                      <Package className="w-6 h-6 animate-bounce" />
                    ) : isDelivery ? (
                      <Bike className="w-6 h-6 animate-pulse" />
                    ) : (
                      <Bell className="w-6 h-6" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1.5">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <h4 className="text-xs font-black tracking-wide uppercase text-white truncate">
                          {alert.title}
                        </h4>
                      </div>
                      <button
                        onClick={() => removeAlert(alert.id)}
                        className="text-slate-400 hover:text-white p-0.5 rounded transition cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      {alert.message}
                    </p>

                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/10 text-[11px]">
                      <span className="text-[10px] text-slate-400">
                        {new Date(alert.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            if (alert.onAction) {
                              alert.onAction();
                            } else if (onNavigateToTab) {
                              onNavigateToTab(isOrder ? 'orders' : 'home');
                            }
                            removeAlert(alert.id);
                          }}
                          className={`px-3 py-1 font-bold rounded-lg flex items-center gap-1 transition cursor-pointer shadow-xs ${
                            isOrder
                              ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                              : isDelivery
                              ? 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                              : 'bg-indigo-500 hover:bg-indigo-400 text-white'
                          }`}
                        >
                          <span>{alert.actionLabel || 'View Now'}</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
};
