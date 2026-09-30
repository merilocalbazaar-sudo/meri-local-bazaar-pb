import React, { useState, useEffect } from 'react';
import {
  Search,
  ShoppingCart,
  Bell,
  User,
  Store,
  Bike,
  ShieldCheck,
  ChevronDown,
  LogOut,
  SlidersHorizontal,
  Package,
  Layers,
  HelpCircle,
  Menu,
  X,
  MapPin,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useLocation } from '../../context/LocationContext';
import { UserRole } from '../../types';

interface NavbarProps {
  onOpenAuth: () => void;
  onOpenNotifications: () => void;
  onOpenCart: () => void;
  unreadNotifsCount: number;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  activeTab: string;
  onSelectTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenAuth,
  onOpenNotifications,
  onOpenCart,
  unreadNotifsCount,
  searchQuery,
  onSearchChange,
  activeTab,
  onSelectTab,
}) => {
  const { user, role, switchRole, logout, quickLoginAsRole } = useAuth();
  const { itemCount } = useCart();
  const { buyerPinCode, setIsPinModalOpen } = useLocation();
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const getRoleLabel = (r: UserRole) => {
    switch (r) {
      case 'customer':
        return 'Customer App';
      case 'seller':
        return 'Seller Dashboard';
      case 'delivery_partner':
        return 'Delivery Dashboard';
      case 'admin':
        return 'Partner Hub';
    }
  };

  const getRoleColor = (r: UserRole) => {
    switch (r) {
      case 'customer':
        return 'bg-blue-600 text-white';
      case 'seller':
        return 'bg-emerald-600 text-white';
      case 'delivery_partner':
        return 'bg-amber-600 text-white';
      case 'admin':
        return 'bg-indigo-900 text-white';
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#2874f0] text-white shadow-md">
      {/* Top Banner / Role Quick Switch Bar */}
      <div className="bg-[#1e5bc6] px-3 py-1 text-xs flex items-center justify-between border-b border-blue-400/30">
        <div className="flex items-center space-x-2">
          <span className="text-yellow-300 font-semibold flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Multi-Vendor Live Network
          </span>
          <span className="hidden sm:inline text-blue-200">|</span>
          <span className="hidden sm:inline text-blue-100">Switch panels anytime to test all workflows</span>
        </div>

        {/* Quick Role Switcher Pill */}
        <div className="relative">
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 hover:bg-white/25 text-white text-xs font-medium transition cursor-pointer"
          >
            <span>Role:</span>
            <span className="font-bold underline decoration-yellow-300 decoration-2">{getRoleLabel(role)}</span>
            <ChevronDown className="w-3.5 h-3.5 text-yellow-300" />
          </button>

          {showRoleMenu && (
            <div className="absolute right-0 mt-1 w-56 bg-white text-slate-800 rounded-lg shadow-xl py-1.5 border border-slate-200 z-50 text-xs">
              <div className="px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Select View / Role
              </div>
              <button
                onClick={() => {
                  switchRole('customer');
                  setShowRoleMenu(false);
                }}
                className={`w-full text-left px-3 py-2 flex items-center gap-2.5 hover:bg-slate-50 ${
                  role === 'customer' ? 'bg-blue-50 text-blue-700 font-semibold' : ''
                }`}
              >
                <div className="w-6 h-6 rounded bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  🛍️
                </div>
                <div>
                  <div>Customer / Shopper</div>
                  <div className="text-[10px] text-slate-400 font-normal">Browse, order & track</div>
                </div>
              </button>

              <button
                onClick={() => {
                  switchRole('seller');
                  setShowRoleMenu(false);
                }}
                className={`w-full text-left px-3 py-2 flex items-center gap-2.5 hover:bg-slate-50 ${
                  role === 'seller' ? 'bg-emerald-50 text-emerald-700 font-semibold' : ''
                }`}
              >
                <div className="w-6 h-6 rounded bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  🏬
                </div>
                <div>
                  <div>Shop / Seller Hub</div>
                  <div className="text-[10px] text-slate-400 font-normal">Inventory, orders & payout</div>
                </div>
              </button>

              <button
                onClick={() => {
                  switchRole('delivery_partner');
                  setShowRoleMenu(false);
                }}
                className={`w-full text-left px-3 py-2 flex items-center gap-2.5 hover:bg-slate-50 ${
                  role === 'delivery_partner' ? 'bg-amber-50 text-amber-700 font-semibold' : ''
                }`}
              >
                <div className="w-6 h-6 rounded bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                  🛵
                </div>
                <div>
                  <div>Delivery Partner</div>
                  <div className="text-[10px] text-slate-400 font-normal">Pick up, OTP delivery & wallet</div>
                </div>
              </button>

              <button
                onClick={() => {
                  switchRole('admin');
                  setShowRoleMenu(false);
                }}
                className={`w-full text-left px-3 py-2 flex items-center gap-2.5 hover:bg-slate-50 ${
                  role === 'admin' ? 'bg-indigo-50 text-indigo-900 font-semibold' : ''
                }`}
              >
                <div className="w-6 h-6 rounded bg-indigo-100 text-indigo-900 flex items-center justify-center font-bold">
                  👑
                </div>
                <div>
                  <div>Partner Hub</div>
                  <div className="text-[10px] text-slate-400 font-normal">Governance, approvals & financials</div>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Header Row */}
      <div className="max-w-7xl mx-auto px-2.5 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-2 sm:gap-3">
        {/* Logo and PIN bar row on small screens */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Logo */}
          <div
            onClick={() => onSelectTab('home')}
            className="flex flex-col items-start cursor-pointer select-none group touch-manipulation"
          >
            <div className="flex items-center gap-1">
              <span className="text-xl sm:text-2xl font-black italic tracking-wide text-white">
                Bazaar<span className="text-yellow-400">X</span>
              </span>
              <span className="text-[10px] bg-yellow-400 text-blue-900 font-extrabold px-1.5 py-0.2 rounded-sm uppercase tracking-wider">
                PLUS
              </span>
            </div>
            <span className="text-[10px] text-blue-200 -mt-1 group-hover:text-yellow-200 flex items-center gap-1 font-medium">
              <span>Explore</span>
              <span className="text-yellow-300 font-bold">Plus ⭐</span>
            </span>
          </div>

          {/* Deliver to PIN Selector (Customer role) */}
          {role === 'customer' && (
            <button
              type="button"
              onClick={() => setIsPinModalOpen(true)}
              className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-lg bg-blue-700/80 hover:bg-blue-600 text-white text-xs font-medium transition cursor-pointer border border-blue-400/40 shrink-0 min-h-[36px] touch-manipulation active:scale-95"
              title="Change Delivery PIN Code"
            >
              <MapPin className="w-3.5 h-3.5 text-yellow-300 shrink-0" />
              <div className="text-left leading-none">
                <div className="text-[9px] text-blue-200 font-semibold">Deliver to</div>
                <div className="font-extrabold text-xs flex items-center gap-0.5">
                  <span>{buyerPinCode}</span>
                  <ChevronDown className="w-3 h-3 text-yellow-300" />
                </div>
              </div>
            </button>
          )}
        </div>

        {/* Right Action Icons */}
        <div className="flex items-center gap-1 sm:gap-3 ml-auto">
          {/* Notifications Bell */}
          <button
            onClick={onOpenNotifications}
            className="relative p-2 rounded-full hover:bg-blue-600 text-white transition min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer touch-manipulation active:scale-95"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadNotifsCount > 0 && (
              <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center animate-bounce shadow">
                {unreadNotifsCount > 9 ? '9+' : unreadNotifsCount}
              </span>
            )}
          </button>

          {/* Cart Icon (Customer) */}
          {role === 'customer' && (
            <button
              onClick={onOpenCart}
              className="relative flex items-center gap-1.5 px-2.5 py-1.5 rounded hover:bg-blue-600 text-white transition font-medium text-xs sm:text-sm cursor-pointer min-h-[40px] touch-manipulation active:scale-95"
            >
              <ShoppingCart className="w-5 h-5" />
              <span className="hidden sm:inline">Cart</span>
              {itemCount > 0 && (
                <span className="bg-yellow-400 text-blue-900 text-xs font-black px-1.5 py-0.5 rounded-full shadow-xs">
                  {itemCount}
                </span>
              )}
            </button>
          )}

          {/* User Profile / Login */}
          <div className="relative">
            {user ? (
              <div>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white text-blue-700 font-semibold rounded text-xs sm:text-sm hover:bg-blue-50 transition shadow-sm cursor-pointer min-h-[36px] touch-manipulation active:scale-95"
                >
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName}
                      className="w-5 h-5 rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-4 h-4" />
                  )}
                  <span className="max-w-[70px] sm:max-w-[120px] truncate">
                    {user.displayName.split(' ')[0]}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-1 w-52 bg-white text-slate-800 rounded-md shadow-xl py-1 border border-slate-200 z-50 text-xs">
                    <div className="px-3 py-2 border-b border-slate-100">
                      <div className="font-bold text-slate-800 truncate">{user.displayName}</div>
                      <div className="text-[11px] text-slate-500 truncate">{user.email}</div>
                      <span className="mt-1 inline-block text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold uppercase">
                        {user.role}
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        onSelectTab('profile');
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-3 py-2.5 hover:bg-slate-50 flex items-center gap-2 touch-manipulation"
                    >
                      <User className="w-4 h-4 text-slate-500" />
                      <span>My Profile & Addresses</span>
                    </button>

                    <button
                      onClick={() => {
                        logout();
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-3 py-2.5 hover:bg-red-50 text-red-600 flex items-center gap-2 border-t border-slate-100 font-medium touch-manipulation"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="bg-white text-blue-600 font-bold px-3.5 sm:px-4 py-1.5 rounded text-xs sm:text-sm hover:bg-yellow-300 hover:text-blue-900 transition shadow-sm min-h-[36px] flex items-center touch-manipulation active:scale-95"
              >
                Login
              </button>
            )}
          </div>
        </div>

        {/* Search Bar - Full width on small screens, center on larger */}
        {role === 'customer' && (
          <div className="w-full sm:flex-1 sm:max-w-xl sm:mx-2 order-last sm:order-none mt-1 sm:mt-0">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search for Products, Brands, and More..."
                className="w-full bg-white text-slate-900 placeholder:text-slate-400 text-xs sm:text-sm pl-9 pr-9 py-2.5 rounded-lg shadow-inner focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
              />
              <Search className="w-4 h-4 text-[#2874f0] absolute left-3 top-1/2 -translate-y-1/2" />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-full touch-manipulation"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}

        {role !== 'customer' && (
          <div className="w-full sm:flex-1 sm:max-w-md sm:mx-2 order-last sm:order-none mt-1 sm:mt-0">
            <div className="text-xs sm:text-sm font-semibold bg-white/10 rounded px-3 py-1.5 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>{getRoleLabel(role)} active</span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
