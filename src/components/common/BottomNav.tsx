import React from 'react';
import {
  Home,
  Grid,
  ShoppingCart,
  Package,
  User,
  LayoutDashboard,
  Box,
  Wallet,
  Store,
  Bike,
  CheckCircle2,
  TrendingUp,
  Settings,
  Users,
  CreditCard,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { UserRole } from '../../types';

interface BottomNavProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onSelectTab }) => {
  const { role } = useAuth();
  const { itemCount } = useCart();

  // Navigation tabs definition based on role
  const getNavItems = () => {
    switch (role) {
      case 'customer':
        return [
          { id: 'home', label: 'Home', icon: Home },
          { id: 'categories', label: 'Categories', icon: Grid },
          { id: 'cart', label: 'Cart', icon: ShoppingCart, badge: itemCount },
          { id: 'orders', label: 'Orders', icon: Package },
          { id: 'profile', label: 'Account', icon: User },
        ];
      case 'seller':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'products', label: 'Products', icon: Box },
          { id: 'orders', label: 'Orders', icon: Package },
          { id: 'wallet', label: 'Wallet', icon: Wallet },
          { id: 'profile', label: 'Shop Info', icon: Store },
        ];
      case 'delivery_partner':
        return [
          { id: 'home', label: 'Available', icon: Bike },
          { id: 'deliveries', label: 'My Tasks', icon: Package },
          { id: 'wallet', label: 'Wallet', icon: Wallet },
          { id: 'earnings', label: 'Earnings', icon: TrendingUp },
          { id: 'profile', label: 'Profile', icon: User },
        ];
      case 'admin':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'shops', label: 'Shops', icon: Store },
          { id: 'orders', label: 'Orders', icon: Package },
          { id: 'delivery', label: 'Fleet', icon: Bike },
          { id: 'payouts', label: 'Payouts', icon: CreditCard },
          { id: 'settings', label: 'Settings', icon: Settings },
        ];
    }
  };

  const navItems = getNavItems();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-200 shadow-lg px-2 py-1 flex items-center justify-around md:hidden pb-[max(0.5rem,env(safe-area-inset-bottom))]">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onSelectTab(item.id)}
            className={`flex flex-col items-center justify-center py-2 px-3 min-w-[54px] min-h-[48px] relative transition active:scale-95 cursor-pointer touch-manipulation ${
              isActive
                ? 'text-[#2874f0] font-bold'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <div className="relative">
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
              {Boolean(item.badge && item.badge > 0) && (
                <span className="absolute -top-1.5 -right-2 bg-red-500 text-white text-[10px] font-extrabold rounded-full px-1 min-w-4 text-center shadow-xs">
                  {item.badge}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
