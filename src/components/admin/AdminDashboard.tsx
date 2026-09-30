import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Users,
  Store,
  Box,
  Package,
  Bike,
  CreditCard,
  Settings as SettingsIcon,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Sliders,
  DollarSign,
  AlertTriangle,
  RefreshCw,
  Plus,
  Trash2,
  Edit2,
  Check,
  LogOut,
  Send,
  Database,
  BarChart3,
  FileText,
  Copy,
  ExternalLink,
  ChevronRight,
  Search,
  CheckCheck,
} from 'lucide-react';
import {
  Shop,
  DeliveryPartner,
  Product,
  Category,
  Order,
  PayoutRequest,
  PlatformSettings,
  UserProfile,
  Wallet,
  WalletTransaction,
  DeliveryAssignment,
  AppNotification,
} from '../../types';
import {
  listenToShops,
  updateShopStatus,
  listenToDeliveryPartners,
  updateDeliveryPartnerStatus,
  listenToProducts,
  saveProduct,
  deleteProduct,
  listenToCategories,
  saveCategory,
  deleteCategory,
  listenToAllOrders,
  listenToPayoutRequests,
  updatePayoutStatus,
  updatePlatformSettings,
  seedMarketplaceIfEmpty,
  clearMarketplaceDemoData,
  listenToUsers,
  listenToDeliveryAssignments,
  listenToAllWallets,
  listenToAllWalletTransactions,
  reassignDeliveryPartner,
  toggleProductApproval,
  toggleProductActive,
  createNotification,
} from '../../services/dbService';
import { supabase, checkSupabaseConnection } from '../../supabase';
import { VillageDeliveryRatesManager } from './VillageDeliveryRatesManager';

interface PartnerHubProps {
  settings: PlatformSettings;
  activeSubTab?: string;
  onSelectSubTab?: (tab: string) => void;
  onLogout?: () => void;
  adminUser?: {
    username: string;
    displayName: string;
    email: string;
  };
}

export const AdminDashboard: React.FC<PartnerHubProps> = ({
  settings,
  activeSubTab = 'dashboard',
  onSelectSubTab,
  onLogout,
  adminUser = { username: 'Gamjinmarak', displayName: 'Gamjinmarak', email: 'gamjinmarak@bazaarx.com' },
}) => {
  // Navigation
  const [activeTab, setActiveTab] = useState(activeSubTab || 'dashboard');

  // Real-time datasets
  const [shops, setShops] = useState<Shop[]>([]);
  const [partners, setPartners] = useState<DeliveryPartner[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [assignments, setAssignments] = useState<DeliveryAssignment[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);

  // UI state
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [txRefInput, setTxRefInput] = useState<Record<string, string>>({});
  const [adminNotesInput, setAdminNotesInput] = useState<Record<string, string>>({});
  const [seedStatus, setSeedStatus] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [supabaseStatus, setSupabaseStatus] = useState<{ connected: boolean; tablesExist: boolean; message: string }>({
    connected: true,
    tablesExist: false,
    message: 'Checking Supabase backend...',
  });
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  // Settings form state
  const [sellerCommission, setSellerCommission] = useState(settings.sellerCommissionPercent);
  const [platformFee, setPlatformFee] = useState(settings.platformFee);
  const [deliveryCharge, setDeliveryCharge] = useState(settings.deliveryBaseCharge);
  const [partnerEarning, setPartnerEarning] = useState(settings.deliveryPartnerEarningPerOrder);
  const [minPayout, setMinPayout] = useState(settings.minPayoutAmount);
  const [codEnabled, setCodEnabled] = useState(settings.cashOnDeliveryEnabled);
  const [autoApprove, setAutoApprove] = useState(settings.autoApproveProducts);
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Category form state
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('Box');
  const [newCatDesc, setNewCatDesc] = useState('');

  // Notification broadcast state
  const [broadcastRole, setBroadcastRole] = useState<'all' | 'customer' | 'seller' | 'delivery_partner'>('all');
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [broadcastSent, setBroadcastSent] = useState(false);

  // Reassignment state
  const [reassignModalAssignId, setReassignModalAssignId] = useState<string | null>(null);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>('');
  const [selectedShopForRates, setSelectedShopForRates] = useState<Shop | null>(null);

  // Sync active sub-tab prop
  useEffect(() => {
    if (activeSubTab) {
      setActiveTab(activeSubTab);
    }
  }, [activeSubTab]);

  // Check Supabase connection
  useEffect(() => {
    checkSupabaseConnection().then((res) => setSupabaseStatus(res));
  }, []);

  // Real-time subscriptions
  useEffect(() => {
    const unsubShops = listenToShops(setShops);
    const unsubPartners = listenToDeliveryPartners(setPartners);
    const unsubProducts = listenToProducts(setProducts);
    const unsubCategories = listenToCategories(setCategories);
    const unsubOrders = listenToAllOrders(setOrders);
    const unsubPayouts = listenToPayoutRequests(setPayouts);
    const unsubUsers = listenToUsers(setUsers);
    const unsubAssignments = listenToDeliveryAssignments(setAssignments);
    const unsubWallets = listenToAllWallets(setWallets);
    const unsubTransactions = listenToAllWalletTransactions(setTransactions);

    return () => {
      unsubShops();
      unsubPartners();
      unsubProducts();
      unsubCategories();
      unsubOrders();
      unsubPayouts();
      unsubUsers();
      unsubAssignments();
      unsubWallets();
      unsubTransactions();
    };
  }, []);

  useEffect(() => {
    setSellerCommission(settings.sellerCommissionPercent);
    setPlatformFee(settings.platformFee);
    setDeliveryCharge(settings.deliveryBaseCharge);
    setPartnerEarning(settings.deliveryPartnerEarningPerOrder);
    setMinPayout(settings.minPayoutAmount);
    setCodEnabled(settings.cashOnDeliveryEnabled);
    setAutoApprove(settings.autoApproveProducts);
  }, [settings]);

  // Exact 12 Required Dashboard Statistics:
  const statTotalUsers = users.length || 4;
  const statTotalShops = shops.length;
  const statTotalProducts = products.length;
  const statTotalOrders = orders.length;
  const statPendingOrders = orders.filter((o) => o.orderStatus !== 'delivered' && o.orderStatus !== 'cancelled').length;
  const statCompletedOrders = orders.filter((o) => o.orderStatus === 'delivered').length;
  const statTotalSales = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const statTotalDeliveryPartners = partners.length;
  const statPendingShopRegistrations = shops.filter((s) => s.status === 'pending_approval').length;
  const statPendingDeliveryPartnerRegistrations = partners.filter((p) => p.status === 'pending').length;
  const statPendingSellerPayouts = payouts.filter((p) => p.requesterRole === 'seller' && p.status === 'pending').length;
  const statPendingDeliveryPartnerPayouts = payouts.filter(
    (p) => p.requesterRole === 'delivery_partner' && p.status === 'pending'
  ).length;

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    if (onSelectSubTab) onSelectSubTab(tabId);
  };

  // Shop Approvals
  const handleApproveShop = async (shopId: string) => {
    setActionLoading(shopId);
    try {
      await updateShopStatus(shopId, 'approved');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectShop = async (shopId: string) => {
    const reason = prompt('Enter rejection reason:') || 'Documentation incomplete';
    setActionLoading(shopId);
    try {
      await updateShopStatus(shopId, 'rejected', reason);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSuspendShop = async (shopId: string) => {
    if (!confirm('Are you sure you want to suspend this shop?')) return;
    setActionLoading(shopId);
    try {
      await updateShopStatus(shopId, 'suspended', 'Administrative policy compliance review');
    } finally {
      setActionLoading(null);
    }
  };

  // Delivery Partner Approvals
  const handleApprovePartner = async (partnerId: string) => {
    setActionLoading(partnerId);
    try {
      await updateDeliveryPartnerStatus(partnerId, 'approved');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectPartner = async (partnerId: string) => {
    const reason = prompt('Enter rejection reason:') || 'Vehicle / License verification pending';
    setActionLoading(partnerId);
    try {
      await updateDeliveryPartnerStatus(partnerId, 'rejected', reason);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSuspendPartner = async (partnerId: string) => {
    if (!confirm('Suspend this delivery partner?')) return;
    setActionLoading(partnerId);
    try {
      await updateDeliveryPartnerStatus(partnerId, 'suspended', 'Administrative suspension');
    } finally {
      setActionLoading(null);
    }
  };

  // Payout processing
  const handleProcessPayout = async (payoutId: string, status: 'approved' | 'paid' | 'rejected') => {
    const txRef = txRefInput[payoutId] || 'UPI-' + Date.now().toString().slice(-8);
    const notes = adminNotesInput[payoutId] || '';
    setActionLoading(payoutId);
    try {
      await updatePayoutStatus(payoutId, status, txRef, notes);
    } finally {
      setActionLoading(null);
    }
  };

  // Save platform settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await updatePlatformSettings({
      sellerCommissionPercent: Number(sellerCommission),
      platformFee: Number(platformFee),
      deliveryBaseCharge: Number(deliveryCharge),
      deliveryPartnerEarningPerOrder: Number(partnerEarning),
      minPayoutAmount: Number(minPayout),
      cashOnDeliveryEnabled: codEnabled,
      autoApproveProducts: autoApprove,
    });
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 3000);
  };

  // Add Category
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    const catId = 'cat_' + newCatName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    await saveCategory({
      id: catId,
      name: newCatName.trim(),
      icon: newCatIcon,
      description: newCatDesc.trim() || undefined,
      order: categories.length + 1,
    });
    setNewCatName('');
    setNewCatDesc('');
  };

  // Broadcast notification
  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastMsg.trim()) return;
    await createNotification({
      recipientRole: broadcastRole,
      title: broadcastTitle.trim(),
      message: broadcastMsg.trim(),
      type: 'system',
    });
    setBroadcastTitle('');
    setBroadcastMsg('');
    setBroadcastSent(true);
    setTimeout(() => setBroadcastSent(false), 3000);
  };

  // Execute Reassignment
  const handleReassignSubmit = async () => {
    if (!reassignModalAssignId || !selectedPartnerId) return;
    const partnerObj = partners.find((p) => p.id === selectedPartnerId);
    if (!partnerObj) return;
    await reassignDeliveryPartner(reassignModalAssignId, partnerObj);
    setReassignModalAssignId(null);
    setSelectedPartnerId('');
  };

  // Permanently delete product from Supabase and UI
  const handleDeleteProduct = async (productId: string, productName?: string) => {
    const label = productName ? `"${productName}"` : 'this product';
    if (!window.confirm(`Are you sure you want to permanently delete ${label} from the catalog?`)) {
      return;
    }

    // 1. Instantly update local state so the product disappears from screen immediately
    setProducts((prev) => prev.filter((item) => item.id !== productId));

    // 2. Direct Supabase deletion
    try {
      const { error } = await supabase.from('products').delete().eq('id', productId);
      if (error) {
        console.error('Supabase product delete error:', error);
      }
    } catch (err) {
      console.error('Supabase product delete exception:', err);
    }

    // 3. Fallback / mirror deletion
    try {
      await deleteProduct(productId);
    } catch (err) {
      console.warn('Fallback deleteProduct notice:', err);
    }
  };

  // Seed initial marketplace
  const handleSeedData = async () => {
    setSeedStatus('Seeding catalog...');
    await seedMarketplaceIfEmpty();
    setSeedStatus('Catalog synced!');
    setTimeout(() => setSeedStatus(null), 3000);
  };

  // Copy SQL script
  const handleCopySql = () => {
    navigator.clipboard.writeText(`-- BAZAARX SUPABASE SETUP SCHEMA
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/nnytbwjnhmhusrbfycju/sql
CREATE TABLE IF NOT EXISTS public.settings (
  id TEXT PRIMARY KEY,
  seller_commission_percent NUMERIC NOT NULL DEFAULT 5,
  platform_fee NUMERIC NOT NULL DEFAULT 5,
  delivery_base_charge NUMERIC NOT NULL DEFAULT 40,
  delivery_partner_earning_per_order NUMERIC NOT NULL DEFAULT 35,
  min_payout_amount NUMERIC NOT NULL DEFAULT 100,
  auto_approve_products BOOLEAN DEFAULT TRUE,
  cash_on_delivery_enabled BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
INSERT INTO public.settings (id, seller_commission_percent, platform_fee, delivery_base_charge, delivery_partner_earning_per_order, min_payout_amount, auto_approve_products, cash_on_delivery_enabled)
VALUES ('global', 5, 5, 40, 35, 100, true, true) ON CONFLICT (id) DO NOTHING;`);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  // Navigation tabs matching Requirement 3:
  const navTabs = [
    { id: 'dashboard', label: 'Dashboard', badge: null },
    { id: 'users', label: 'Users', badge: statTotalUsers },
    { id: 'shops', label: 'Shops', badge: statPendingShopRegistrations || null },
    { id: 'products', label: 'Products', badge: statTotalProducts },
    { id: 'categories', label: 'Categories', badge: categories.length },
    { id: 'orders', label: 'Orders', badge: statPendingOrders || null },
    { id: 'delivery_partners', label: 'Delivery Partners', badge: statPendingDeliveryPartnerRegistrations || null },
    { id: 'delivery_assignments', label: 'Delivery Assignments', badge: assignments.length },
    { id: 'seller_wallets', label: 'Seller Wallets', badge: null },
    { id: 'delivery_wallets', label: 'Delivery Wallets', badge: null },
    {
      id: 'payout_requests',
      label: 'Payout Requests',
      badge: statPendingSellerPayouts + statPendingDeliveryPartnerPayouts || null,
    },
    { id: 'transactions', label: 'Transactions', badge: null },
    { id: 'notifications', label: 'Notifications', badge: null },
    { id: 'village_rates', label: 'Village Rates (₹10+)', badge: null },
    { id: 'settings', label: 'Settings', badge: null },
    { id: 'reports', label: 'Reports', badge: null },
  ];

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-4 py-4 space-y-5 pb-24">
      {/* 1. TOP PARTNER HUB HEADER */}
      <div className="bg-linear-to-r from-slate-900 via-indigo-950 to-purple-950 text-white rounded-2xl p-4 sm:p-6 shadow-xl border border-indigo-900/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-white/10 rounded-2xl border border-white/20 shadow-inner">
            <ShieldCheck className="w-8 h-8 text-yellow-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white uppercase">PARTNER HUB</h1>
              <span className="text-[10px] bg-yellow-400 text-purple-950 font-black px-2 py-0.5 rounded uppercase tracking-wider">
                Enterprise Command
              </span>
              <span className="text-[11px] bg-indigo-800/80 text-indigo-200 px-2 py-0.5 rounded-full border border-indigo-700">
                Administrator: <strong className="text-white font-bold">{adminUser.username}</strong>
              </span>
            </div>
            <p className="text-xs text-indigo-200 mt-1">
              Centralized platform governance, multi-vendor fulfillment, fleet management & financial settlements
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto justify-end">
          {/* Supabase connection indicator */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 border border-white/15 rounded-xl text-[11px]">
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span>Supabase:</span>
            <span className="text-emerald-300 font-bold">nnytbwjnhmhusrbfycju</span>
          </div>

          <button
            onClick={handleSeedData}
            className="px-3 py-1.5 bg-yellow-400 hover:bg-yellow-500 text-purple-950 font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{seedStatus || 'Seed Catalog'}</span>
          </button>

          {onLogout && (
            <button
              onClick={onLogout}
              className="px-3 py-1.5 bg-red-600/80 hover:bg-red-600 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5 cursor-pointer border border-red-500/50"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. NAVIGATION BAR (All 15 Required Navigation Items) */}
      <div className="bg-white border border-slate-200 p-1.5 rounded-2xl shadow-xs overflow-x-auto">
        <div className="flex items-center gap-1 min-w-max">
          {navTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-indigo-900 text-white shadow-md'
                  : 'text-slate-600 hover:text-indigo-900 hover:bg-slate-100'
              }`}
            >
              <span>{tab.label}</span>
              {tab.badge !== null && tab.badge > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                    activeTab === tab.id ? 'bg-yellow-400 text-purple-950' : 'bg-red-500 text-white'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ========================================================== */}
      {/* 3. TAB 1: DASHBOARD (Exact 12 Required Statistics) */}
      {/* ========================================================== */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Action Alerts */}
          {(statPendingShopRegistrations > 0 ||
            statPendingDeliveryPartnerRegistrations > 0 ||
            statPendingSellerPayouts > 0 ||
            statPendingDeliveryPartnerPayouts > 0) && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl shadow-2xs space-y-3">
              <div className="flex items-center gap-2 text-amber-900 font-extrabold text-sm">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <span>Pending Approvals & Administrative Actions Required</span>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                {statPendingShopRegistrations > 0 && (
                  <button
                    onClick={() => handleTabClick('shops')}
                    className="px-3 py-1.5 bg-white border border-amber-300 rounded-xl font-bold hover:bg-amber-100 text-amber-900 shadow-2xs flex items-center gap-1.5"
                  >
                    🏬 {statPendingShopRegistrations} Pending Shop Registrations
                  </button>
                )}
                {statPendingDeliveryPartnerRegistrations > 0 && (
                  <button
                    onClick={() => handleTabClick('delivery_partners')}
                    className="px-3 py-1.5 bg-white border border-amber-300 rounded-xl font-bold hover:bg-amber-100 text-amber-900 shadow-2xs flex items-center gap-1.5"
                  >
                    🛵 {statPendingDeliveryPartnerRegistrations} Pending Delivery Partner Registrations
                  </button>
                )}
                {statPendingSellerPayouts > 0 && (
                  <button
                    onClick={() => handleTabClick('payout_requests')}
                    className="px-3 py-1.5 bg-white border border-amber-300 rounded-xl font-bold hover:bg-amber-100 text-amber-900 shadow-2xs flex items-center gap-1.5"
                  >
                    💳 {statPendingSellerPayouts} Pending Seller Payouts
                  </button>
                )}
                {statPendingDeliveryPartnerPayouts > 0 && (
                  <button
                    onClick={() => handleTabClick('payout_requests')}
                    className="px-3 py-1.5 bg-white border border-amber-300 rounded-xl font-bold hover:bg-amber-100 text-amber-900 shadow-2xs flex items-center gap-1.5"
                  >
                    🛵 {statPendingDeliveryPartnerPayouts} Pending Delivery Partner Payouts
                  </button>
                )}
              </div>
            </div>
          )}

          {/* 12 Dashboard Statistic Cards */}
          <div>
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-3">
              Platform Key Performance Indicators
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
              {/* 1. Total Users */}
              <div
                onClick={() => handleTabClick('users')}
                className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:border-indigo-600 transition cursor-pointer"
              >
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Total Users</span>
                  <Users className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-2xl font-black text-slate-900">{statTotalUsers}</div>
                <div className="text-[11px] text-slate-400 mt-1">Platform registered profiles</div>
              </div>

              {/* 2. Total Shops */}
              <div
                onClick={() => handleTabClick('shops')}
                className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:border-indigo-600 transition cursor-pointer"
              >
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Total Shops</span>
                  <Store className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-2xl font-black text-slate-900">{statTotalShops}</div>
                <div className="text-[11px] text-slate-400 mt-1">
                  {shops.filter((s) => s.status === 'approved').length} approved sellers
                </div>
              </div>

              {/* 3. Total Products */}
              <div
                onClick={() => handleTabClick('products')}
                className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:border-indigo-600 transition cursor-pointer"
              >
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Total Products</span>
                  <Box className="w-4 h-4 text-purple-600" />
                </div>
                <div className="text-2xl font-black text-slate-900">{statTotalProducts}</div>
                <div className="text-[11px] text-slate-400 mt-1">Active multi-vendor catalog</div>
              </div>

              {/* 4. Total Orders */}
              <div
                onClick={() => handleTabClick('orders')}
                className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:border-indigo-600 transition cursor-pointer"
              >
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Total Orders</span>
                  <Package className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="text-2xl font-black text-slate-900">{statTotalOrders}</div>
                <div className="text-[11px] text-slate-400 mt-1">Lifetime customer orders</div>
              </div>

              {/* 5. Pending Orders */}
              <div
                onClick={() => handleTabClick('orders')}
                className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:border-amber-600 transition cursor-pointer"
              >
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Pending Orders</span>
                  <Clock className="w-4 h-4 text-amber-600" />
                </div>
                <div className="text-2xl font-black text-amber-700">{statPendingOrders}</div>
                <div className="text-[11px] text-amber-600 font-semibold mt-1">In processing & transit</div>
              </div>

              {/* 6. Completed Orders */}
              <div
                onClick={() => handleTabClick('orders')}
                className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:border-emerald-600 transition cursor-pointer"
              >
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Completed Orders</span>
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-2xl font-black text-emerald-700">{statCompletedOrders}</div>
                <div className="text-[11px] text-emerald-600 font-semibold mt-1">Successfully delivered</div>
              </div>

              {/* 7. Total Sales */}
              <div
                onClick={() => handleTabClick('orders')}
                className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:border-blue-600 transition cursor-pointer"
              >
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Total Sales</span>
                  <DollarSign className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-2xl font-black text-slate-900">₹{statTotalSales.toLocaleString('en-IN')}</div>
                <div className="text-[11px] text-blue-600 font-semibold mt-1">Gross merchandise value</div>
              </div>

              {/* 8. Total Delivery Partners */}
              <div
                onClick={() => handleTabClick('delivery_partners')}
                className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:border-indigo-600 transition cursor-pointer"
              >
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Total Delivery Partners</span>
                  <Bike className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="text-2xl font-black text-slate-900">{statTotalDeliveryPartners}</div>
                <div className="text-[11px] text-slate-400 mt-1">
                  {partners.filter((p) => p.isOnline).length} riders online now
                </div>
              </div>

              {/* 9. Pending Shop Registrations */}
              <div
                onClick={() => handleTabClick('shops')}
                className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:border-amber-600 transition cursor-pointer"
              >
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Pending Shop Registrations</span>
                  <Store className="w-4 h-4 text-amber-500" />
                </div>
                <div className="text-2xl font-black text-amber-700">{statPendingShopRegistrations}</div>
                <div className="text-[11px] text-amber-600 font-semibold mt-1">Awaiting approval</div>
              </div>

              {/* 10. Pending Delivery Partner Registrations */}
              <div
                onClick={() => handleTabClick('delivery_partners')}
                className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:border-amber-600 transition cursor-pointer"
              >
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Pending Delivery Reg.</span>
                  <Bike className="w-4 h-4 text-amber-500" />
                </div>
                <div className="text-2xl font-black text-amber-700">{statPendingDeliveryPartnerRegistrations}</div>
                <div className="text-[11px] text-amber-600 font-semibold mt-1">KYC review pending</div>
              </div>

              {/* 11. Pending Seller Payouts */}
              <div
                onClick={() => handleTabClick('payout_requests')}
                className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:border-purple-600 transition cursor-pointer"
              >
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Pending Seller Payouts</span>
                  <CreditCard className="w-4 h-4 text-purple-600" />
                </div>
                <div className="text-2xl font-black text-purple-700">{statPendingSellerPayouts}</div>
                <div className="text-[11px] text-purple-600 font-semibold mt-1">Vendor settlement queue</div>
              </div>

              {/* 12. Pending Delivery Partner Payouts */}
              <div
                onClick={() => handleTabClick('payout_requests')}
                className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:border-purple-600 transition cursor-pointer"
              >
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Pending Delivery Payouts</span>
                  <CreditCard className="w-4 h-4 text-purple-600" />
                </div>
                <div className="text-2xl font-black text-purple-700">{statPendingDeliveryPartnerPayouts}</div>
                <div className="text-[11px] text-purple-600 font-semibold mt-1">Rider earnings payout queue</div>
              </div>
            </div>
          </div>

          {/* Quick Realtime Feed */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-slate-800 text-sm">Recent Platform Orders</h3>
                <button
                  onClick={() => handleTabClick('orders')}
                  className="text-xs text-indigo-700 font-bold hover:underline flex items-center gap-1"
                >
                  <span>View All</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
              <div className="divide-y divide-slate-100 text-xs">
                {orders.slice(0, 5).map((o) => (
                  <div key={o.id} className="py-2.5 flex items-center justify-between gap-2">
                    <div>
                      <span className="font-bold text-slate-900">#{o.id}</span>
                      <span className="text-slate-500 ml-2">{o.customerName}</span>
                      <div className="text-[11px] text-slate-400">
                        {o.items.length} items • OTP: <strong className="text-slate-700">{o.deliveryOtp}</strong>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-black text-slate-900">₹{o.totalAmount.toLocaleString('en-IN')}</div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold uppercase">
                        {o.orderStatus.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-slate-800 text-sm">Active Delivery Assignments</h3>
                <button
                  onClick={() => handleTabClick('delivery_assignments')}
                  className="text-xs text-indigo-700 font-bold hover:underline flex items-center gap-1"
                >
                  <span>View Fleet</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
              <div className="divide-y divide-slate-100 text-xs">
                {assignments.slice(0, 5).map((a) => (
                  <div key={a.id} className="py-2.5 flex items-center justify-between gap-2">
                    <div>
                      <div className="font-bold text-slate-900">{a.shopName}</div>
                      <div className="text-[11px] text-slate-500">
                        Rider: {a.deliveryPartnerName || 'Unassigned (Broadcasted)'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-emerald-700">₹{a.earningAmount} earning</div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold uppercase">
                        {a.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>
                ))}
                {assignments.length === 0 && (
                  <div className="py-6 text-center text-slate-400 text-xs">No active delivery assignments.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* 4. TAB 2: USERS */}
      {/* ========================================================== */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-slate-900">Registered Platform Users ({users.length})</h2>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase text-[10px]">
                  <tr>
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">UID / Contact</th>
                    <th className="px-4 py-3">Registered</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((u) => (
                    <tr key={u.uid} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-bold text-slate-900">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                            {u.displayName?.[0] || 'U'}
                          </div>
                          <div>
                            <div>{u.displayName || 'Unnamed User'}</div>
                            <div className="text-[11px] text-slate-400">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                            u.role === 'admin'
                              ? 'bg-purple-100 text-purple-800'
                              : u.role === 'seller'
                              ? 'bg-emerald-100 text-emerald-800'
                              : u.role === 'delivery_partner'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        <div>{u.phoneNumber || 'No phone set'}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{u.uid}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'Active'}
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                        No registered users yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* 5. TAB 3: SHOPS */}
      {/* ========================================================== */}
      {activeTab === 'shops' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-slate-900">
              Registered Shops & Verification Requests ({shops.length})
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {shops.map((shop) => (
              <div
                key={shop.id}
                className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-slate-900 text-sm">{shop.shopName}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        shop.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : shop.status === 'pending_approval'
                          ? 'bg-amber-100 text-amber-800'
                          : shop.status === 'suspended'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {shop.status.replace(/_/g, ' ')}
                    </span>
                    <span className="text-slate-400">Category: {shop.category}</span>
                  </div>
                  <p className="text-slate-600">
                    Owner: <strong>{shop.ownerName}</strong> • Phone: {shop.phoneNumber} • Email: {shop.email}
                  </p>
                  <p className="text-slate-500">
                    Address: {shop.shopAddress}, {shop.city}, {shop.state} - {shop.postalCode}
                  </p>
                  <p className="text-slate-500">
                    Bank: {shop.bankDetails?.accountHolderName || 'N/A'} • A/C: {shop.bankDetails?.accountNumber || 'N/A'}{' '}
                    • IFSC: {shop.bankDetails?.ifsc || 'N/A'} • UPI: <strong>{shop.bankDetails?.upiId || 'N/A'}</strong>
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  {shop.status === 'pending_approval' && (
                    <>
                      <button
                        onClick={() => handleApproveShop(shop.id)}
                        disabled={actionLoading === shop.id}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-2xs transition flex items-center gap-1 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Approve Shop</span>
                      </button>
                      <button
                        onClick={() => handleRejectShop(shop.id)}
                        disabled={actionLoading === shop.id}
                        className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs rounded-xl border border-red-200 transition cursor-pointer"
                      >
                        Reject
                      </button>
                    </>
                  )}
                  {shop.status === 'approved' && (
                    <button
                      onClick={() => handleSuspendShop(shop.id)}
                      disabled={actionLoading === shop.id}
                      className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs rounded-xl border border-amber-200 transition cursor-pointer"
                    >
                      Suspend
                    </button>
                  )}
                  {shop.status === 'suspended' && (
                    <button
                      onClick={() => handleApproveShop(shop.id)}
                      disabled={actionLoading === shop.id}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition cursor-pointer"
                    >
                      Reactivate
                    </button>
                  )}
                </div>
              </div>
            ))}
            {shops.length === 0 && (
              <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs">
                No shops registered yet.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* 6. TAB 4: PRODUCTS */}
      {/* ========================================================== */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-base font-extrabold text-slate-900">All Products Catalog ({products.length})</h2>
            <button
              type="button"
              onClick={async () => {
                if (confirm('Clear all demo products and sample shops from the marketplace?')) {
                  await clearMarketplaceDemoData();
                }
              }}
              className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clean Preview Data</span>
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {products.map((p) => (
              <div
                key={p.id}
                className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-2.5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start gap-3">
                    <img
                      src={p.images[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=150&q=80'}
                      alt={p.name}
                      className="w-16 h-16 object-cover rounded-xl border border-slate-100 shrink-0"
                    />
                    <div className="space-y-1">
                      <h4 className="font-extrabold text-slate-900 text-xs line-clamp-2">{p.name}</h4>
                      <p className="text-[11px] text-slate-400">Shop: {p.shopName}</p>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-900 text-sm">₹{p.discountPrice}</span>
                        <span className="text-slate-400 line-through text-xs">₹{p.price}</span>
                        <span className="text-[10px] bg-slate-100 px-1.5 py-0.2 rounded text-slate-600 font-bold">
                          Stock: {p.stock}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => toggleProductActive(p.id, !p.isActive)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold ${
                        p.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {p.isActive ? 'Published' : 'Hidden'}
                    </button>
                    <button
                      onClick={() => toggleProductApproval(p.id, !p.isApproved)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold ${
                        p.isApproved ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {p.isApproved ? 'Approved' : 'Pending Approval'}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteProduct(p.id, p.name)}
                    className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition cursor-pointer"
                    title="Delete product"
                    aria-label={`Delete ${p.name}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          {products.length === 0 && (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs">
              No products found. The catalog is clean and ready for real seller listings.
            </div>
          )}
        </div>
      )}

      {/* ========================================================== */}
      {/* 7. TAB 5: CATEGORIES */}
      {/* ========================================================== */}
      {activeTab === 'categories' && (
        <div className="space-y-5">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <h3 className="font-extrabold text-slate-900 text-sm">Add New Marketplace Category</h3>
            <form onSubmit={handleAddCategory} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <input
                type="text"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="Category Name (e.g. Footwear)"
                required
                className="px-3 py-2 text-xs border border-slate-300 rounded-xl"
              />
              <input
                type="text"
                value={newCatIcon}
                onChange={(e) => setNewCatIcon(e.target.value)}
                placeholder="Icon name (e.g. Box, Shirt, ShoppingBag)"
                className="px-3 py-2 text-xs border border-slate-300 rounded-xl"
              />
              <input
                type="text"
                value={newCatDesc}
                onChange={(e) => setNewCatDesc(e.target.value)}
                placeholder="Description"
                className="px-3 py-2 text-xs border border-slate-300 rounded-xl"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-900 hover:bg-indigo-950 text-white font-bold text-xs rounded-xl shadow transition flex items-center justify-center gap-1 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Save Category</span>
              </button>
            </form>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between group"
              >
                <div>
                  <div className="font-bold text-slate-900 text-sm">{cat.name}</div>
                  <div className="text-[11px] text-slate-400">{cat.description || 'Catalog category'}</div>
                </div>
                <button
                  onClick={() => {
                    if (confirm(`Delete category "${cat.name}"?`)) deleteCategory(cat.id);
                  }}
                  className="text-slate-300 hover:text-red-600 p-1 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* 8. TAB 6: ORDERS */}
      {/* ========================================================== */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-slate-900">All Marketplace Orders ({orders.length})</h2>
          </div>
          <div className="space-y-3">
            {orders.map((o) => (
              <div key={o.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5 text-xs">
                  <div>
                    <span className="font-black text-slate-900 text-sm">#{o.id}</span>
                    <span className="text-slate-400 ml-2">
                      {new Date(o.createdAt).toLocaleDateString()} {new Date(o.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 font-bold">
                      OTP: <strong className="text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">{o.deliveryOtp}</strong>
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                        o.orderStatus === 'delivered'
                          ? 'bg-emerald-100 text-emerald-800'
                          : o.orderStatus === 'cancelled'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {o.orderStatus.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-600">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Customer Details</span>
                    <strong className="text-slate-900">{o.customerName}</strong>
                    <div>{o.customerPhone}</div>
                    <div className="text-slate-500 text-[11px] line-clamp-1">
                      {o.deliveryAddress?.streetAddress}, {o.deliveryAddress?.city}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Payment & Fee</span>
                    <div>Total: <strong className="text-slate-900">₹{o.totalAmount}</strong> ({o.paymentMethod.toUpperCase()})</div>
                    <div className="text-[11px] text-slate-400">
                      Subtotal: ₹{o.subtotal} | Delivery: ₹{o.deliveryCharge} | Fee: ₹{o.platformFee}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Delivery Rider</span>
                    <div>{o.deliveryPartnerName || 'Unassigned / Pending Pickup'}</div>
                    <div className="text-slate-400 text-[11px]">{o.deliveryPartnerPhone || 'Awaiting acceptance'}</div>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-xl p-2.5 space-y-1.5">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Ordered Items ({o.items.length})</span>
                  {o.items.map((it, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs text-slate-700">
                      <span>
                        {it.name} <strong className="text-slate-900">x{it.quantity}</strong> ({it.shopName})
                      </span>
                      <span className="font-bold">₹{it.discountPrice * it.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {orders.length === 0 && (
              <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs">
                No customer orders placed yet.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* 9. TAB 7: DELIVERY PARTNERS */}
      {/* ========================================================== */}
      {activeTab === 'delivery_partners' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-slate-900">
              Delivery Partners Fleet ({partners.length})
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {partners.map((partner) => (
              <div
                key={partner.id}
                className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-slate-900 text-sm">{partner.fullName}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        partner.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : partner.status === 'pending'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {partner.status}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                        partner.isOnline ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {partner.isOnline ? 'Online' : 'Offline'}
                    </span>
                  </div>
                  <p className="text-slate-600">
                    Phone: <strong>{partner.phoneNumber}</strong> • Email: {partner.email} • Area: {partner.serviceArea}
                  </p>
                  <p className="text-slate-500">
                    Vehicle: <strong>{partner.vehicleType}</strong> ({partner.vehicleNumber}) • DL:{' '}
                    {partner.drivingLicenceNumber || 'Verified'}
                  </p>
                  <p className="text-slate-500">
                    Bank: {partner.bankDetails?.accountHolderName || 'N/A'} • A/C:{' '}
                    {partner.bankDetails?.accountNumber || 'N/A'} • UPI: <strong>{partner.bankDetails?.upiId || 'N/A'}</strong>
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  {partner.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleApprovePartner(partner.id)}
                        disabled={actionLoading === partner.id}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-2xs transition flex items-center gap-1 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Approve Partner</span>
                      </button>
                      <button
                        onClick={() => handleRejectPartner(partner.id)}
                        disabled={actionLoading === partner.id}
                        className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs rounded-xl border border-red-200 transition cursor-pointer"
                      >
                        Reject
                      </button>
                    </>
                  )}
                  {partner.status === 'approved' && (
                    <button
                      onClick={() => handleSuspendPartner(partner.id)}
                      disabled={actionLoading === partner.id}
                      className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs rounded-xl border border-amber-200 transition cursor-pointer"
                    >
                      Suspend
                    </button>
                  )}
                  {partner.status === 'suspended' && (
                    <button
                      onClick={() => handleApprovePartner(partner.id)}
                      disabled={actionLoading === partner.id}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition cursor-pointer"
                    >
                      Reactivate
                    </button>
                  )}
                </div>
              </div>
            ))}
            {partners.length === 0 && (
              <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs">
                No delivery partners registered yet.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* 10. TAB 8: DELIVERY ASSIGNMENTS */}
      {/* ========================================================== */}
      {activeTab === 'delivery_assignments' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-slate-900">
              Live Delivery Assignments ({assignments.length})
            </h2>
          </div>
          <div className="space-y-3">
            {assignments.map((a) => (
              <div key={a.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs border-b border-slate-100 pb-2">
                  <div>
                    <span className="font-black text-slate-900 text-sm">Order #{a.orderId}</span>
                    <span className="text-slate-400 ml-2">Pickup: {a.shopName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-700 font-bold">Rider Earning: ₹{a.earningAmount}</span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold uppercase text-[10px]">
                      {a.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-600">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Pickup Location</span>
                    <div className="font-bold text-slate-900">{a.shopName}</div>
                    <div className="text-slate-500">{a.shopAddress}</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Customer Drop-off</span>
                    <div className="font-bold text-slate-900">{a.customerName} ({a.customerPhone})</div>
                    <div className="text-slate-500">{a.deliveryAddress?.streetAddress}, {a.deliveryAddress?.city}</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Assigned Partner</span>
                    <div className="font-bold text-slate-900">{a.deliveryPartnerName || 'Broadcasting to all riders'}</div>
                    <div className="text-slate-500">{a.deliveryPartnerPhone || 'Pending pickup'}</div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-400">
                    OTP: <strong className="text-indigo-700 font-mono">{a.otp}</strong>
                  </span>
                  <button
                    onClick={() => {
                      setReassignModalAssignId(a.id);
                      setSelectedPartnerId(a.deliveryPartnerId || '');
                    }}
                    className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 font-bold text-xs rounded-xl border border-indigo-200 transition cursor-pointer"
                  >
                    Reassign Delivery Rider
                  </button>
                </div>
              </div>
            ))}
            {assignments.length === 0 && (
              <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs">
                No delivery assignments yet. Place an order and pack it in Seller Hub to generate a delivery dispatch!
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* 11. TAB 9: SELLER WALLETS */}
      {/* ========================================================== */}
      {activeTab === 'seller_wallets' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-slate-900">Seller Accounts & Wallets</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {wallets
              .filter((w) => w.role === 'seller')
              .map((w) => {
                const shopObj = shops.find((s) => s.ownerId === w.ownerId);
                return (
                  <div key={w.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-slate-900 text-sm">{shopObj?.shopName || w.ownerId}</span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold uppercase">
                        Seller Wallet
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center pt-2">
                      <div className="bg-slate-50 p-2 rounded-xl">
                        <div className="text-[10px] text-slate-400 uppercase font-bold">Balance</div>
                        <div className="text-base font-black text-slate-900">₹{w.currentBalance}</div>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-xl">
                        <div className="text-[10px] text-slate-400 uppercase font-bold">Total Sales</div>
                        <div className="text-base font-black text-emerald-700">₹{w.totalEarnings}</div>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-xl">
                        <div className="text-[10px] text-slate-400 uppercase font-bold">Paid Out</div>
                        <div className="text-base font-black text-indigo-700">₹{w.totalPayouts}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            {wallets.filter((w) => w.role === 'seller').length === 0 && (
              <div className="col-span-2 bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs">
                No seller wallets created yet. Wallets initialize automatically upon first order delivery.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* 12. TAB 10: DELIVERY WALLETS */}
      {/* ========================================================== */}
      {activeTab === 'delivery_wallets' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-slate-900">Delivery Partner Wallets & Earnings</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {wallets
              .filter((w) => w.role === 'delivery_partner')
              .map((w) => {
                const partnerObj = partners.find((p) => p.id === w.ownerId);
                return (
                  <div key={w.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-slate-900 text-sm">{partnerObj?.fullName || w.ownerId}</span>
                      <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold uppercase">
                        Delivery Fleet Wallet
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center pt-2">
                      <div className="bg-slate-50 p-2 rounded-xl">
                        <div className="text-[10px] text-slate-400 uppercase font-bold">Balance</div>
                        <div className="text-base font-black text-slate-900">₹{w.currentBalance}</div>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-xl">
                        <div className="text-[10px] text-slate-400 uppercase font-bold">Today</div>
                        <div className="text-base font-black text-amber-700">₹{w.todayEarnings}</div>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-xl">
                        <div className="text-[10px] text-slate-400 uppercase font-bold">Total Paid</div>
                        <div className="text-base font-black text-indigo-700">₹{w.totalPayouts}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            {wallets.filter((w) => w.role === 'delivery_partner').length === 0 && (
              <div className="col-span-2 bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs">
                No delivery fleet wallets created yet.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* 13. TAB 11: PAYOUT REQUESTS (Separate Seller & Delivery) */}
      {/* ========================================================== */}
      {activeTab === 'payout_requests' && (
        <div className="space-y-6">
          {/* Seller Payouts */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">
                Seller Payout Requests ({payouts.filter((p) => p.requesterRole === 'seller').length})
              </h3>
            </div>
            <div className="space-y-3">
              {payouts
                .filter((p) => p.requesterRole === 'seller')
                .map((p) => (
                  <div
                    key={p.id}
                    className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-900 text-sm">₹{p.amount.toLocaleString('en-IN')}</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                            p.status === 'paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : p.status === 'pending'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {p.status}
                        </span>
                        <span className="text-slate-400">Seller: {p.requesterName}</span>
                      </div>
                      <p className="text-slate-600">
                        UPI ID: <strong className="font-mono text-indigo-700">{p.upiId}</strong>
                      </p>
                      {p.transactionRef && (
                        <p className="text-slate-500 font-mono text-[11px]">Bank Ref: {p.transactionRef}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                      {p.status === 'pending' && (
                        <>
                          <input
                            type="text"
                            placeholder="Bank/UPI Ref ID"
                            value={txRefInput[p.id] || ''}
                            onChange={(e) => setTxRefInput({ ...txRefInput, [p.id]: e.target.value })}
                            className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-xl"
                          />
                          <button
                            onClick={() => handleProcessPayout(p.id, 'paid')}
                            disabled={actionLoading === p.id}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-2xs transition cursor-pointer"
                          >
                            Mark Paid
                          </button>
                          <button
                            onClick={() => handleProcessPayout(p.id, 'rejected')}
                            disabled={actionLoading === p.id}
                            className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs rounded-xl border border-red-200 transition cursor-pointer"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              {payouts.filter((p) => p.requesterRole === 'seller').length === 0 && (
                <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs">
                  No seller payout requests pending.
                </div>
              )}
            </div>
          </div>

          {/* Delivery Partner Payouts */}
          <div className="space-y-3 pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">
                Delivery Fleet Payout Requests ({payouts.filter((p) => p.requesterRole === 'delivery_partner').length})
              </h3>
            </div>
            <div className="space-y-3">
              {payouts
                .filter((p) => p.requesterRole === 'delivery_partner')
                .map((p) => (
                  <div
                    key={p.id}
                    className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-900 text-sm">₹{p.amount.toLocaleString('en-IN')}</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                            p.status === 'paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : p.status === 'pending'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {p.status}
                        </span>
                        <span className="text-slate-400">Rider: {p.requesterName}</span>
                      </div>
                      <p className="text-slate-600">
                        UPI ID: <strong className="font-mono text-indigo-700">{p.upiId}</strong>
                      </p>
                      {p.transactionRef && (
                        <p className="text-slate-500 font-mono text-[11px]">Bank Ref: {p.transactionRef}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                      {p.status === 'pending' && (
                        <>
                          <input
                            type="text"
                            placeholder="Bank/UPI Ref ID"
                            value={txRefInput[p.id] || ''}
                            onChange={(e) => setTxRefInput({ ...txRefInput, [p.id]: e.target.value })}
                            className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-xl"
                          />
                          <button
                            onClick={() => handleProcessPayout(p.id, 'paid')}
                            disabled={actionLoading === p.id}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-2xs transition cursor-pointer"
                          >
                            Mark Paid
                          </button>
                          <button
                            onClick={() => handleProcessPayout(p.id, 'rejected')}
                            disabled={actionLoading === p.id}
                            className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs rounded-xl border border-red-200 transition cursor-pointer"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              {payouts.filter((p) => p.requesterRole === 'delivery_partner').length === 0 && (
                <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs">
                  No delivery partner payout requests pending.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* 14. TAB 12: TRANSACTIONS (Unified Ledger) */}
      {/* ========================================================== */}
      {activeTab === 'transactions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-slate-900">Unified Platform Ledger & Transactions</h2>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Txn ID / Date</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Description</th>
                    <th className="px-4 py-3">Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="font-mono text-slate-900 font-bold">{tx.id}</div>
                        <div className="text-[10px] text-slate-400">
                          {tx.createdAt ? new Date(tx.createdAt).toLocaleString() : ''}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                            tx.type === 'credit'
                              ? 'bg-emerald-100 text-emerald-800'
                              : tx.type === 'payout'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {tx.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-black text-slate-900">
                        {tx.type === 'credit' ? '+' : '-'}₹{tx.amount}
                      </td>
                      <td className="px-4 py-3 text-slate-600 max-w-xs truncate">{tx.description}</td>
                      <td className="px-4 py-3 uppercase text-[10px] font-bold text-slate-500">
                        {tx.role.replace('_', ' ')}
                      </td>
                    </tr>
                  ))}
                  {transactions.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                        No transactions recorded in ledger yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* 15. TAB 13: NOTIFICATIONS (Broadcast Center) */}
      {/* ========================================================== */}
      {activeTab === 'notifications' && (
        <div className="space-y-5">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <h3 className="font-extrabold text-slate-900 text-sm">Send Broadcast Platform Announcement</h3>
            {broadcastSent && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-bold flex items-center gap-2">
                <CheckCheck className="w-4 h-4 text-emerald-600" />
                <span>Notification successfully broadcasted to selected audience!</span>
              </div>
            )}
            <form onSubmit={handleSendBroadcast} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Target Audience</label>
                  <select
                    value={broadcastRole}
                    onChange={(e: any) => setBroadcastRole(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                  >
                    <option value="all">📢 All Users (Everyone)</option>
                    <option value="customer">🛍️ Customers Only</option>
                    <option value="seller">🏬 Sellers Only</option>
                    <option value="delivery_partner">🛵 Delivery Partners Only</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Headline / Title</label>
                  <input
                    type="text"
                    value={broadcastTitle}
                    onChange={(e) => setBroadcastTitle(e.target.value)}
                    placeholder="e.g. Festive Super Sale Is Now Live!"
                    required
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Message Body</label>
                <textarea
                  rows={3}
                  value={broadcastMsg}
                  onChange={(e) => setBroadcastMsg(e.target.value)}
                  placeholder="Enter details of your announcement..."
                  required
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-900 hover:bg-indigo-950 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Broadcast Notification</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* 15b. TAB: VILLAGE DELIVERY RATES MANAGER (Hyper-local delivery charges) */}
      {/* ========================================================== */}
      {activeTab === 'village_rates' && (
        <div className="space-y-5">
          {shops.length > 0 && (
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <span className="font-bold text-slate-700">Select Registered Shop to Manage Rates:</span>
              <select
                className="p-2 border border-slate-300 rounded-lg font-semibold text-slate-800 outline-none focus:border-indigo-600 bg-slate-50 cursor-pointer"
                value={selectedShopForRates?.id || shops[0]?.id || ''}
                onChange={(e) => {
                  const found = shops.find((s) => s.id === e.target.value);
                  if (found) setSelectedShopForRates(found);
                }}
              >
                {shops.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.shopName} (PIN: {s.servicePinCode || s.postalCode || '794114'})
                  </option>
                ))}
              </select>
            </div>
          )}
          <VillageDeliveryRatesManager
            shop={selectedShopForRates || shops[0] || null}
            fixedPinCode={selectedShopForRates?.servicePinCode || selectedShopForRates?.postalCode || shops[0]?.servicePinCode || shops[0]?.postalCode || '794114'}
          />
        </div>
      )}

      {/* ========================================================== */}
      {/* 16. TAB 14: SETTINGS (Configurable Rules) */}
      {/* ========================================================== */}
      {activeTab === 'settings' && (
        <div className="space-y-5">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">Platform Financial & Commission Rules</h3>
                <p className="text-xs text-slate-500">
                  Configured values come directly from the database and are never hard-coded.
                </p>
              </div>
              {settingsSaved && (
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  ✓ Rules Saved Successfully
                </span>
              )}
            </div>

            <form onSubmit={handleSaveSettings} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Seller Commission (%)</label>
                <input
                  type="number"
                  value={sellerCommission}
                  onChange={(e) => setSellerCommission(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold"
                />
                <span className="text-[10px] text-slate-400">Percentage deducted per seller order</span>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Platform Fee (₹)</label>
                <input
                  type="number"
                  value={platformFee}
                  onChange={(e) => setPlatformFee(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold"
                />
                <span className="text-[10px] text-slate-400">Customer checkout convenience fee</span>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Customer Delivery Charge (₹)</label>
                <input
                  type="number"
                  value={deliveryCharge}
                  onChange={(e) => setDeliveryCharge(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold"
                />
                <span className="text-[10px] text-slate-400">Base shipping charged to customer</span>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Delivery Partner Earning (₹/Order)</label>
                <input
                  type="number"
                  value={partnerEarning}
                  onChange={(e) => setPartnerEarning(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-emerald-700"
                />
                <span className="text-[10px] text-slate-400">Credited to rider wallet upon OTP delivery</span>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Minimum Payout Amount (₹)</label>
                <input
                  type="number"
                  value={minPayout}
                  onChange={(e) => setMinPayout(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold"
                />
                <span className="text-[10px] text-slate-400">Minimum threshold for withdrawal request</span>
              </div>

              <div className="flex flex-col justify-center space-y-2 pt-2">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                  <input
                    type="checkbox"
                    checked={codEnabled}
                    onChange={(e) => setCodEnabled(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-900"
                  />
                  <span>Enable Cash on Delivery (COD)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                  <input
                    type="checkbox"
                    checked={autoApprove}
                    onChange={(e) => setAutoApprove(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-900"
                  />
                  <span>Auto-Approve Seller Products</span>
                </label>
              </div>

              <div className="sm:col-span-2 lg:col-span-3 pt-2">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-900 hover:bg-indigo-950 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer"
                >
                  Save Platform Settings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* 17. TAB 15: REPORTS */}
      {/* ========================================================== */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-slate-900">Marketplace Executive Analytics</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
              <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wider">Revenue Breakdown</h4>
              <div className="text-2xl font-black text-slate-900">₹{statTotalSales.toLocaleString('en-IN')}</div>
              <p className="text-xs text-slate-500">Gross Merchandise Value (GMV)</p>
              <div className="pt-2 border-t border-slate-100 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Platform Commission (5% avg):</span>
                  <span className="font-bold text-emerald-700">
                    ₹{Math.round((statTotalSales * settings.sellerCommissionPercent) / 100).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Orders Processed:</span>
                  <span className="font-bold">{statTotalOrders}</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
              <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wider">Fulfillment Velocity</h4>
              <div className="text-2xl font-black text-indigo-900">
                {statTotalOrders > 0 ? Math.round((statCompletedOrders / statTotalOrders) * 100) : 100}%
              </div>
              <p className="text-xs text-slate-500">Delivery Success Rate</p>
              <div className="pt-2 border-t border-slate-100 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Delivered Orders:</span>
                  <span className="font-bold text-emerald-700">{statCompletedOrders}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">In-Transit / Pending:</span>
                  <span className="font-bold text-amber-600">{statPendingOrders}</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
              <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wider">Fleet & Merchant Capacity</h4>
              <div className="text-2xl font-black text-emerald-800">
                {shops.filter((s) => s.status === 'approved').length} Shops
              </div>
              <p className="text-xs text-slate-500">Active Supply Base</p>
              <div className="pt-2 border-t border-slate-100 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Approved Delivery Riders:</span>
                  <span className="font-bold text-indigo-700">
                    {partners.filter((p) => p.status === 'approved').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Riders Online Now:</span>
                  <span className="font-bold text-emerald-600">{partners.filter((p) => p.isOnline).length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Reassign Delivery Rider */}
      {reassignModalAssignId && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <h3 className="font-extrabold text-slate-900 text-sm">Reassign Delivery Rider</h3>
            <p className="text-xs text-slate-500">Select an approved delivery partner to take over this shipment:</p>
            <select
              value={selectedPartnerId}
              onChange={(e) => setSelectedPartnerId(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
            >
              <option value="">-- Choose Rider --</option>
              {partners
                .filter((p) => p.status === 'approved')
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.fullName} ({p.vehicleType} - {p.vehicleNumber}) {p.isOnline ? '🟢 Online' : '⚪ Offline'}
                  </option>
                ))}
            </select>
            <div className="flex justify-end gap-2 text-xs pt-2">
              <button
                type="button"
                onClick={() => setReassignModalAssignId(null)}
                className="px-3 py-1.5 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReassignSubmit}
                disabled={!selectedPartnerId}
                className="px-4 py-1.5 bg-indigo-900 text-white rounded-xl hover:bg-indigo-950 font-bold disabled:opacity-50"
              >
                Confirm Reassignment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
