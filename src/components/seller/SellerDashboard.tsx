import React, { useState, useEffect } from 'react';
import {
  Store,
  Box,
  Package,
  Wallet,
  Clock,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Settings,
  Plus,
  ArrowRight,
  ShieldAlert,
  MapPin,
  Bell,
  Volume2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  Shop,
  Product,
  SellerOrder,
  Wallet as WalletType,
  WalletTransaction,
  PayoutRequest,
  PlatformSettings,
} from '../../types';
import {
  listenToShopByOwnerId,
  listenToSellerProducts,
  listenToSellerOrders,
  listenToWallet,
  listenToWalletTransactions,
  listenToUserPayouts,
} from '../../services/dbService';
import {
  setupSellerOrderRealtime,
  getNotificationPermission,
  requestNotificationPermission,
  playTestSound,
} from '../../services/notificationService';
import { SellerProducts } from './SellerProducts';
import { SellerOrders } from './SellerOrders';
import { SellerWallet } from './SellerWallet';
import { PostProductAdModal } from './PostProductAdModal';
import { VillageDeliveryRatesManager } from '../admin/VillageDeliveryRatesManager';

interface SellerDashboardProps {
  onOpenRegistration: () => void;
  settings: PlatformSettings;
  activeSubTab?: string;
  onSelectSubTab?: (tab: string) => void;
}

export const SellerDashboard: React.FC<SellerDashboardProps> = ({
  onOpenRegistration,
  settings,
  activeSubTab = 'dashboard',
  onSelectSubTab,
}) => {
  const { user } = useAuth();
  const [shop, setShop] = useState<Shop | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<SellerOrder[]>([]);
  const [wallet, setWallet] = useState<WalletType | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPostAdOpen, setIsPostAdOpen] = useState(false);

  // Tab state
  const currentTab = activeSubTab;
  const setTab = onSelectSubTab || (() => {});

  useEffect(() => {
    if (!user) return;
    const unsubShop = listenToShopByOwnerId(user.uid, (data) => {
      setShop(data);
      setLoading(false);
    });

    const unsubWallet = listenToWallet(user.uid, 'seller', (w) => setWallet(w));
    const unsubTx = listenToWalletTransactions(user.uid, (txs) => setTransactions(txs));
    const unsubPayouts = listenToUserPayouts(user.uid, (ps) => setPayouts(ps));

    return () => {
      unsubShop();
      unsubWallet();
      unsubTx();
      unsubPayouts();
    };
  }, [user]);

  const [notifPermission, setNotifPermission] = useState<NotificationPermission | 'unsupported'>('default');

  useEffect(() => {
    setNotifPermission(getNotificationPermission());
  }, []);

  useEffect(() => {
    if (!shop || !user) return;
    const unsubProd = listenToSellerProducts(shop.id, (p) => setProducts(p));
    // Listen to orders matching either the shop ID or the seller user UID
    const unsubOrd = listenToSellerOrders([shop.id, user.uid], (o) => setOrders(o));

    // Supabase Realtime channel for order arrival: plays loud cash-register chime + native device push
    const unsubRealtimePush = setupSellerOrderRealtime(shop.id, user.uid, () => {
      // Automatically refresh orders if new one arrives
    });

    return () => {
      unsubProd();
      unsubOrd();
      unsubRealtimePush();
    };
  }, [shop, user]);

  const handleEnablePush = async () => {
    const res = await requestNotificationPermission();
    setNotifPermission(res);
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-xl shadow-2xs border border-slate-200 mt-8 text-center">
        <Store className="w-12 h-12 text-slate-300 mx-auto mb-2" />
        <h2 className="text-base font-bold text-slate-800">Sign in to Access Seller Hub</h2>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-400 text-xs">
        Loading Shop Dashboard...
      </div>
    );
  }

  // If no shop registered yet
  if (!shop) {
    return (
      <div className="max-w-2xl mx-auto p-6 sm:p-8 bg-white rounded-2xl shadow-sm border border-slate-200 mt-6 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto text-2xl font-bold">
          🏬
        </div>
        <h2 className="text-xl font-black text-slate-900">Start Selling on BazaarX</h2>
        <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
          Register your retail shop, upload your products, receive local customer orders, and dispatch with our on-demand delivery fleet.
        </p>
        <button
          onClick={onOpenRegistration}
          className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition cursor-pointer"
        >
          Register Shop Now
        </button>
      </div>
    );
  }

  // Pending Approval Banner
  const isPending = shop.status === 'pending_approval';
  const isRejected = shop.status === 'rejected';
  const isSuspended = shop.status === 'suspended';

  const pendingOrdersCount = orders.filter((o) => o.status === 'confirmed' || o.status === 'processing').length;
  const completedOrdersCount = orders.filter((o) => o.status === 'delivered').length;

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-4 space-y-5 pb-20">
      {/* Real-time Order Alert Bar */}
      <div className="bg-linear-to-r from-emerald-950 via-slate-900 to-indigo-950 text-white rounded-2xl p-3 sm:p-4 border border-emerald-800/40 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
            <Bell className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
                Live Order Push Alerts
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                ⚡ Supabase Realtime Active
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mt-0.5">
              Instant double-bell cash register chime & device notifications trigger on every customer order.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
          <button
            onClick={() => playTestSound('order')}
            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-xs font-bold text-slate-200 flex items-center gap-1.5 transition cursor-pointer"
            title="Listen to order chime"
          >
            <Volume2 className="w-4 h-4 text-emerald-400" />
            <span>Test Sound</span>
          </button>

          {notifPermission !== 'granted' ? (
            <button
              onClick={handleEnablePush}
              className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-black shadow-md flex items-center gap-1.5 transition cursor-pointer"
            >
              <Bell className="w-4 h-4" />
              <span>Enable Device Push</span>
            </button>
          ) : (
            <span className="px-3 py-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>Push Enabled</span>
            </span>
          )}
        </div>
      </div>

      {/* Top Shop Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {shop.logoUrl ? (
            <img
              src={shop.logoUrl}
              alt={shop.shopName}
              className="w-14 h-14 rounded-xl object-cover border border-slate-200"
            />
          ) : (
            <div className="w-14 h-14 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-xl font-black">
              {shop.shopName.charAt(0)}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black text-slate-900">{shop.shopName}</h1>
              <span
                className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                  shop.status === 'approved'
                    ? 'bg-emerald-100 text-emerald-800'
                    : shop.status === 'pending_approval'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {shop.status.replace('_', ' ')}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {shop.category} • {shop.city}, {shop.state}
            </p>
          </div>
        </div>

        {/* Quick Tabs Bar */}
        <div className="w-full sm:w-auto flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold overflow-x-auto scrollbar-none gap-1">
          <button
            onClick={() => setTab('dashboard')}
            className={`min-h-[38px] px-3 py-1.5 rounded-lg transition touch-manipulation active:scale-95 cursor-pointer whitespace-nowrap ${
              currentTab === 'dashboard'
                ? 'bg-white text-emerald-800 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setTab('products')}
            className={`min-h-[38px] px-3 py-1.5 rounded-lg transition touch-manipulation active:scale-95 cursor-pointer whitespace-nowrap ${
              currentTab === 'products'
                ? 'bg-white text-emerald-800 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Products ({products.length})
          </button>
          <button
            onClick={() => setTab('orders')}
            className={`min-h-[38px] px-3 py-1.5 rounded-lg transition touch-manipulation active:scale-95 cursor-pointer whitespace-nowrap ${
              currentTab === 'orders'
                ? 'bg-white text-emerald-800 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Orders ({orders.length})
          </button>
          <button
            onClick={() => setTab('wallet')}
            className={`min-h-[38px] px-3 py-1.5 rounded-lg transition touch-manipulation active:scale-95 cursor-pointer whitespace-nowrap ${
              currentTab === 'wallet'
                ? 'bg-white text-emerald-800 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Wallet (₹{wallet?.currentBalance || 0})
          </button>
          <button
            onClick={() => setTab('village_rates')}
            className={`min-h-[38px] px-3 py-1.5 rounded-lg transition touch-manipulation active:scale-95 cursor-pointer whitespace-nowrap ${
              currentTab === 'village_rates'
                ? 'bg-white text-emerald-800 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Village Delivery Rates (₹10+)
          </button>
        </div>

        <button
          onClick={() => setIsPostAdOpen(true)}
          className="w-full sm:w-auto min-h-[42px] px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer touch-manipulation active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4 text-yellow-300" />
          <span>Post Ad / List Product</span>
        </button>
      </div>

      {/* Warning status banners */}
      {isPending && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 text-xs text-amber-900">
          <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block text-sm">Shop Application Under Review</span>
            <span>
              Your registration is pending approval by the Admin. You can prepare products in the catalog, but they will become visible to customers once the admin approves your shop.
            </span>
          </div>
        </div>
      )}

      {isRejected && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 text-xs text-red-900">
          <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block text-sm">Application Rejected</span>
            <span>Reason: {shop.rejectionReason || 'Business verification could not be completed.'}</span>
          </div>
        </div>
      )}

      {/* Tab 1: Overview */}
      {currentTab === 'dashboard' && (
        <div className="space-y-5">
          {/* Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Total Products</span>
              <div className="text-xl sm:text-2xl font-black text-slate-900 mt-1">{products.length}</div>
              <span className="text-[11px] text-emerald-600 font-semibold">
                {products.filter((p) => p.isActive).length} active
              </span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Total Orders</span>
              <div className="text-xl sm:text-2xl font-black text-slate-900 mt-1">{orders.length}</div>
              <span className="text-[11px] text-blue-600 font-semibold">{pendingOrdersCount} pending</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Net Earnings</span>
              <div className="text-xl sm:text-2xl font-black text-emerald-700 mt-1">
                ₹{(wallet?.totalEarnings || 0).toLocaleString('en-IN')}
              </div>
              <span className="text-[11px] text-slate-400">Available: ₹{wallet?.currentBalance || 0}</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Shop Rating</span>
              <div className="text-xl sm:text-2xl font-black text-amber-500 mt-1">4.8 ★</div>
              <span className="text-[11px] text-slate-400">Super Delivery Verified</span>
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Featured Post Ad / Product Listing Shortcut */}
            <div
              onClick={() => setIsPostAdOpen(true)}
              className="col-span-1 sm:col-span-2 bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 text-white p-4 sm:p-5 rounded-2xl shadow-sm hover:shadow-md cursor-pointer transition flex flex-wrap items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/10 rounded-xl shrink-0">
                  <Plus className="w-6 h-6 text-yellow-300" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-white">Post Ad / Product Listing</h3>
                  <p className="text-xs text-emerald-100">
                    Publish an item with pricing, description, stock, and photos to reach local shoppers immediately
                  </p>
                </div>
              </div>
              <span className="px-4 py-2 bg-white text-emerald-800 rounded-xl font-bold text-xs shrink-0 flex items-center gap-1.5 shadow-xs">
                Post New Ad <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>

            <div
              onClick={() => setTab('products')}
              className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-emerald-500 shadow-2xs cursor-pointer transition flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-100 text-emerald-800 rounded-xl">
                  <Box className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Manage Product Inventory</h3>
                  <p className="text-xs text-slate-500">Add products, edit prices, and manage stock</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-400" />
            </div>

            <div
              onClick={() => setTab('orders')}
              className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-blue-500 shadow-2xs cursor-pointer transition flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 text-blue-800 rounded-xl">
                  <Package className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Fulfill Incoming Orders</h3>
                  <p className="text-xs text-slate-500">
                    {pendingOrdersCount} orders waiting for your action
                  </p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-400" />
            </div>

            <div
              onClick={() => setTab('village_rates')}
              className="col-span-1 sm:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 hover:border-emerald-500 shadow-2xs cursor-pointer transition flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-100 text-emerald-800 rounded-xl">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Hyper-Local Village Delivery Rates (₹10+)</h3>
                  <p className="text-xs text-slate-500">
                    Configure and assign dynamic delivery fees for up to 10 distinct villages under each PIN code
                  </p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-400" />
            </div>
          </div>

          {/* Recent Orders Preview */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-800">Recent Customer Orders</h3>
              <button onClick={() => setTab('orders')} className="text-xs font-bold text-emerald-700 hover:underline">
                View All Orders
              </button>
            </div>

            {orders.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No orders received yet.</p>
            ) : (
              <div className="divide-y divide-slate-100 text-xs">
                {orders.slice(0, 3).map((o) => (
                  <div key={o.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-800">#{o.id}</span>
                      <span className="text-slate-400 ml-2">by {o.customerName}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-slate-900">₹{o.sellerEarnings.toLocaleString('en-IN')}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 font-bold uppercase">
                        {o.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Products */}
      {currentTab === 'products' && (
        <SellerProducts
          shop={shop}
          products={products}
          onOpenPostAd={() => setIsPostAdOpen(true)}
        />
      )}

      {/* Tab 3: Orders */}
      {currentTab === 'orders' && <SellerOrders orders={orders} shop={shop} />}

      {/* Tab 4: Wallet */}
      {currentTab === 'wallet' && (
        <SellerWallet
          wallet={wallet}
          transactions={transactions}
          payouts={payouts}
          shop={shop}
          settings={settings}
        />
      )}

      {/* Tab 5: Village Delivery Rates */}
      {currentTab === 'village_rates' && (
        <div className="space-y-4">
          <VillageDeliveryRatesManager shop={shop} />
        </div>
      )}

      {/* Post Ad / Product Listing Modal */}
      <PostProductAdModal
        isOpen={isPostAdOpen}
        onClose={() => setIsPostAdOpen(false)}
        shop={shop}
      />
    </div>
  );
};
