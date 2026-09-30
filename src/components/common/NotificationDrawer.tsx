import React from 'react';
import { X, Bell, CheckCheck, Package, Bike, Store, ShieldAlert, Sparkles } from 'lucide-react';
import { AppNotification } from '../../types';
import { markNotificationAsRead } from '../../services/dbService';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  onSelectNotification?: (notif: AppNotification) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  onSelectNotification,
}) => {
  if (!isOpen) return null;

  const getIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'order':
        return <Package className="w-4 h-4 text-blue-600" />;
      case 'delivery':
        return <Bike className="w-4 h-4 text-amber-600" />;
      case 'payout':
        return <Sparkles className="w-4 h-4 text-emerald-600" />;
      case 'approval':
        return <Store className="w-4 h-4 text-purple-600" />;
      default:
        return <Bell className="w-4 h-4 text-slate-600" />;
    }
  };

  const handleNotificationClick = async (n: AppNotification) => {
    if (!n.isRead) {
      await markNotificationAsRead(n.id);
    }
    if (onSelectNotification) {
      onSelectNotification(n);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
      />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-sm bg-white shadow-2xl flex flex-col">
          {/* Header */}
          <div className="px-4 py-3 bg-[#2874f0] text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-yellow-300" />
              <h2 className="text-base font-bold">Notifications</h2>
              <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-medium">
                {notifications.filter((n) => !n.isRead).length} new
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-white/20 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2">
            {notifications.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-slate-400 p-4 text-center">
                <Bell className="w-12 h-12 stroke-1 text-slate-300 mb-2" />
                <p className="font-semibold text-slate-600">No notifications yet</p>
                <p className="text-xs text-slate-400 mt-1">
                  Updates on orders, deliveries, and approvals will show up here in real time.
                </p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`p-3 rounded-lg my-1 transition cursor-pointer flex gap-3 ${
                    n.isRead ? 'bg-white hover:bg-slate-50' : 'bg-blue-50/70 hover:bg-blue-50 border-l-4 border-blue-600'
                  }`}
                >
                  <div className="mt-0.5 p-2 rounded-full bg-white shadow-xs border border-slate-100 h-fit">
                    {getIcon(n.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="text-xs font-bold text-slate-800 truncate">{n.title}</h4>
                      <span className="text-[10px] text-slate-400 whitespace-nowrap">
                        {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed break-words">{n.message}</p>
                    {!n.isRead && (
                      <span className="inline-block mt-1 text-[10px] font-semibold text-blue-600">
                        Tap to mark as read
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
