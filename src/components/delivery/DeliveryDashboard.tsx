import React, { useState, useEffect } from 'react';
import {
  Bike,
  Power,
  Package,
  MapPin,
  Phone,
  KeyRound,
  CheckCircle,
  Clock,
  Wallet as WalletIcon,
  Navigation,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  User,
  ShieldCheck,
  Bell,
  Volume2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  DeliveryPartner,
  DeliveryAssignment,
  Wallet,
  WalletTransaction,
  PayoutRequest,
  PlatformSettings,
} from '../../types';
import {
  listenToDeliveryPartner,
  toggleDeliveryPartnerOnline,
  listenToPartnerDeliveries,
  acceptDeliveryAssignment,
  markDeliveryPickedUp,
  markDeliveryOutForDelivery,
  completeDeliveryWithOtp,
  listenToWallet,
  listenToWalletTransactions,
  listenToUserPayouts,
  requestPayout,
} from '../../services/dbService';
import {
  setupDeliveryPartnerRealtime,
  getNotificationPermission,
  requestNotificationPermission,
  playTestSound,
} from '../../services/notificationService';

interface DeliveryDashboardProps {
  onOpenRegistration: () => void;
  settings: PlatformSettings;
  activeSubTab?: string;
  onSelectSubTab?: (tab: string) => void;
}

export const DeliveryDashboard: React.FC<DeliveryDashboardProps> = ({
  onOpenRegistration,
  settings,
  activeSubTab = 'home',
  onSelectSubTab,
}) => {
  const { user } = useAuth();
  const [partner, setPartner] = useState<DeliveryPartner | null>(null);
  const [assignments, setAssignments] = useState<DeliveryAssignment[]>([]);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const [enteredOtp, setEnteredOtp] = useState<Record<string, string>>({});
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [otpError, setOtpError] = useState<{ id: string; msg: string } | null>(null);

  // Payout Form
  const [payoutAmount, setPayoutAmount] = useState<number>(settings.minPayoutAmount);
  const [upiId, setUpiId] = useState<string>('');
  const [payoutMsg, setPayoutMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const currentTab = activeSubTab;
  const setTab = onSelectSubTab || (() => {});

  useEffect(() => {
    if (!user) return;
    const unsubPartner = listenToDeliveryPartner(user.uid, (p) => {
      setPartner(p);
      setLoading(false);
      if (p?.bankDetails?.upiId) {
        setUpiId(p.bankDetails.upiId);
      }
    });

    const unsubWallet = listenToWallet(user.uid, 'delivery_partner', (w) => setWallet(w));
    const unsubTx = listenToWalletTransactions(user.uid, (txs) => setTransactions(txs));
    const unsubPayouts = listenToUserPayouts(user.uid, (ps) => setPayouts(ps));

    return () => {
      unsubPartner();
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
    if (!user) return;
    const unsubDeliveries = listenToPartnerDeliveries(user.uid, (list) => {
      setAssignments(list);
    });

    // Supabase Realtime channel for instant dispatch sirens & push alerts on order assignment
    const unsubRealtimePush = setupDeliveryPartnerRealtime(user.uid, () => {
      // Assignments updated automatically via listener
    });

    return () => {
      unsubDeliveries();
      unsubRealtimePush();
    };
  }, [user?.uid]);

  const handleEnablePush = async () => {
    const res = await requestNotificationPermission();
    setNotifPermission(res);
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-xl shadow-2xs border border-slate-200 mt-8 text-center">
        <Bike className="w-12 h-12 text-slate-300 mx-auto mb-2" />
        <h2 className="text-base font-bold text-slate-800">Sign in to Access Delivery Dashboard</h2>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-400 text-xs">
        Loading Delivery Partner Dashboard...
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="max-w-2xl mx-auto p-6 sm:p-8 bg-white rounded-2xl shadow-sm border border-slate-200 mt-6 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto text-2xl font-bold">
          🛵
        </div>
        <h2 className="text-xl font-black text-slate-900">Become a BazaarX Delivery Partner</h2>
        <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
          Deliver local customer packages, earn on every order with real-time OTP validation, and withdraw earnings daily via UPI.
        </p>
        <button
          onClick={onOpenRegistration}
          className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition cursor-pointer"
        >
          Register Delivery Profile
        </button>
      </div>
    );
  }

  // Partner status validation
  const isApproved = partner.status === 'approved';
  const isPending = partner.status === 'pending';

  const handleToggleOnline = async () => {
    if (!isApproved) return;
    await toggleDeliveryPartnerOnline(partner.id, !partner.isOnline);
  };

  const handleAccept = async (assignment: DeliveryAssignment) => {
    setActionLoading(assignment.id);
    try {
      await acceptDeliveryAssignment(assignment.id, partner);
      setTab('deliveries');
    } catch (e) {
      console.error('Accept assignment error:', e);
    } finally {
      setActionLoading(null);
    }
  };

  const handlePickedUp = async (assignmentId: string) => {
    setActionLoading(assignmentId);
    try {
      await markDeliveryPickedUp(assignmentId);
    } catch (e) {
      console.error('Pickup error:', e);
    } finally {
      setActionLoading(null);
    }
  };

  const handleOutForDelivery = async (assignmentId: string) => {
    setActionLoading(assignmentId);
    try {
      await markDeliveryOutForDelivery(assignmentId);
    } catch (e) {
      console.error('Out for delivery error:', e);
    } finally {
      setActionLoading(null);
    }
  };

  const handleVerifyOtpAndDeliver = async (assignmentId: string) => {
    const code = enteredOtp[assignmentId];
    if (!code || code.trim().length !== 4) {
      setOtpError({ id: assignmentId, msg: 'Please enter the valid 4-digit OTP provided by customer.' });
      return;
    }

    setActionLoading(assignmentId);
    setOtpError(null);

    try {
      const res = await completeDeliveryWithOtp(assignmentId, code);
      if (!res.success) {
        setOtpError({ id: assignmentId, msg: res.message });
      } else {
        // Success
        setEnteredOtp({ ...enteredOtp, [assignmentId]: '' });
      }
    } catch (e: any) {
      setOtpError({ id: assignmentId, msg: e.message || 'Verification failed.' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleRequestPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    setPayoutMsg(null);

    const balance = wallet ? wallet.currentBalance : 0;
    if (payoutAmount < settings.minPayoutAmount) {
      setPayoutMsg({
        type: 'error',
        text: `Minimum payout request is ₹${settings.minPayoutAmount}.`,
      });
      return;
    }
    if (payoutAmount > balance) {
      setPayoutMsg({
        type: 'error',
        text: `Insufficient balance! Available balance is ₹${balance}.`,
      });
      return;
    }
    if (!upiId.trim()) {
      setPayoutMsg({ type: 'error', text: 'Please provide your UPI ID for payout transfer.' });
      return;
    }

    try {
      await requestPayout({
        requesterId: partner.id,
        requesterName: partner.fullName,
        requesterRole: 'delivery_partner',
        amount: payoutAmount,
        upiId: upiId.trim(),
        bankDetails: partner.bankDetails,
      });

      setPayoutMsg({
        type: 'success',
        text: `Payout request of ₹${payoutAmount} submitted successfully! Admin will approve and transfer.`,
      });
    } catch (err: any) {
      setPayoutMsg({ type: 'error', text: err.message || 'Payout request failed.' });
    }
  };

  // Categorize assignments
  const availableAssignments = assignments.filter((a) => a.status === 'available');
  const activeAssignments = assignments.filter(
    (a) =>
      a.deliveryPartnerId === partner.id &&
      (a.status === 'assigned' || a.status === 'picked_up' || a.status === 'out_for_delivery')
  );
  const completedAssignments = assignments.filter(
    (a) => a.deliveryPartnerId === partner.id && a.status === 'delivered'
  );

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 py-4 space-y-5 pb-20">
      {/* Real-time Delivery Assignment Alert Bar */}
      <div className="bg-linear-to-r from-amber-950 via-slate-900 to-indigo-950 text-white rounded-2xl p-3 sm:p-4 border border-amber-800/40 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
            <Bell className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-black uppercase tracking-wider text-amber-400">
                Live Delivery Push Alerts
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                ⚡ Supabase Realtime Active
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mt-0.5">
              Instant dispatch sirens & native device notifications trigger whenever an order is assigned to you.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
          <button
            onClick={() => playTestSound('delivery')}
            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-xs font-bold text-slate-200 flex items-center gap-1.5 transition cursor-pointer"
            title="Listen to rider siren chime"
          >
            <Volume2 className="w-4 h-4 text-amber-400" />
            <span>Test Sound</span>
          </button>

          {notifPermission !== 'granted' ? (
            <button
              onClick={handleEnablePush}
              className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black shadow-md flex items-center gap-1.5 transition cursor-pointer"
            >
              <Bell className="w-4 h-4" />
              <span>Enable Device Push</span>
            </button>
          ) : (
            <span className="px-3 py-1.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-amber-400" />
              <span>Push Enabled</span>
            </span>
          )}
        </div>
      </div>

      {/* Top Hero Banner & Online Toggle */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            {partner.photoURL ? (
              <img
                src={partner.photoURL}
                alt={partner.fullName}
                className="w-14 h-14 rounded-full object-cover border-2 border-amber-500"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xl">
                {partner.fullName.charAt(0)}
              </div>
            )}
            <span
              className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white ${
                partner.isOnline ? 'bg-emerald-500' : 'bg-slate-400'
              }`}
            />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black text-slate-900">{partner.fullName}</h1>
              <span
                className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                  isApproved
                    ? 'bg-emerald-100 text-emerald-800'
                    : isPending
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {partner.status}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {partner.vehicleType} • {partner.vehicleNumber} • {partner.serviceArea}
            </p>
          </div>
        </div>

        {/* Online / Offline Switch */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={handleToggleOnline}
            disabled={!isApproved}
            className={`w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-xs touch-manipulation active:scale-95 ${
              partner.isOnline
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
            } disabled:opacity-50`}
          >
            <Power className="w-4 h-4" />
            <span>{partner.isOnline ? 'You Are ONLINE' : 'Go ONLINE'}</span>
          </button>
        </div>
      </div>

      {isPending && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 text-xs text-amber-900">
          <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block text-sm">Delivery Partner Application Pending</span>
            <span>
              Your profile is currently waiting for Admin Approval. Once verified, you will be able to go online and accept delivery orders.
            </span>
          </div>
        </div>
      )}

      {/* Sub Tabs */}
      <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold overflow-x-auto scrollbar-none gap-1">
        <button
          onClick={() => setTab('home')}
          className={`min-h-[38px] px-3.5 py-1.5 rounded-lg transition touch-manipulation active:scale-95 cursor-pointer whitespace-nowrap ${
            currentTab === 'home'
              ? 'bg-white text-amber-900 shadow-2xs font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Available Orders ({availableAssignments.length})
        </button>
        <button
          onClick={() => setTab('deliveries')}
          className={`min-h-[38px] px-3.5 py-1.5 rounded-lg transition touch-manipulation active:scale-95 cursor-pointer whitespace-nowrap ${
            currentTab === 'deliveries'
              ? 'bg-white text-amber-900 shadow-2xs font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Active Trips ({activeAssignments.length})
        </button>
        <button
          onClick={() => setTab('wallet')}
          className={`px-3.5 py-1.5 rounded-lg transition ${
            currentTab === 'wallet'
              ? 'bg-white text-amber-900 shadow-2xs font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Wallet & Payouts (₹{wallet?.currentBalance || 0})
        </button>
        <button
          onClick={() => setTab('completed')}
          className={`px-3.5 py-1.5 rounded-lg transition ${
            currentTab === 'completed'
              ? 'bg-white text-amber-900 shadow-2xs font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Completed ({completedAssignments.length})
        </button>
      </div>

      {/* Tab 1: Available Orders for Pickup */}
      {currentTab === 'home' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm sm:text-base font-bold text-slate-800">
              Orders Ready for Pickup
            </h2>
            <span className="text-xs text-slate-500 font-medium">
              Earning: ₹{settings.deliveryPartnerEarningPerOrder} per delivery
            </span>
          </div>

          {!partner.isOnline ? (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center text-xs text-amber-900">
              <Power className="w-8 h-8 text-amber-600 mx-auto mb-2" />
              <p className="font-bold text-sm">You are currently Offline</p>
              <p className="mt-1 text-slate-600">Switch to "Go ONLINE" above to view and accept delivery tasks.</p>
            </div>
          ) : availableAssignments.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-xs shadow-2xs">
              <Package className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="font-bold text-slate-700 text-sm">No Available Orders Right Now</p>
              <p className="text-slate-400 mt-1 max-w-sm mx-auto">
                Orders ready for pickup from local shops will appear here in real time. Keep the app open!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {availableAssignments.map((assign) => (
                <div
                  key={assign.id}
                  className="bg-white border-2 border-amber-200 rounded-xl p-4 shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-xs font-bold text-slate-800">Order #{assign.orderId}</span>
                    <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Earn ₹{assign.earningAmount}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    {/* Pickup Shop */}
                    <div className="flex items-start gap-2 text-slate-700">
                      <div className="p-1 rounded bg-blue-100 text-blue-700 mt-0.5">
                        <MapPin className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="font-bold block">Pickup: {assign.shopName}</span>
                        <span className="text-[11px] text-slate-500">{assign.shopAddress}</span>
                      </div>
                    </div>

                    {/* Delivery Target */}
                    <div className="flex items-start gap-2 text-slate-700">
                      <div className="p-1 rounded bg-emerald-100 text-emerald-700 mt-0.5">
                        <Navigation className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="font-bold block">Deliver to: {assign.customerName}</span>
                        <span className="text-[11px] text-slate-500">
                          {assign.deliveryAddress.streetAddress}, {assign.deliveryAddress.city}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleAccept(assign)}
                      disabled={actionLoading === assign.id}
                      className="w-full min-h-[44px] py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer touch-manipulation active:scale-95 disabled:opacity-50"
                    >
                      <Bike className="w-4 h-4" />
                      <span>{actionLoading === assign.id ? 'Accepting...' : 'Accept Delivery Task'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Active Trips (Pickup, Out for Delivery, OTP Completion) */}
      {currentTab === 'deliveries' && (
        <div className="space-y-4">
          <h2 className="text-sm sm:text-base font-bold text-slate-800">
            Active Trips in Progress ({activeAssignments.length})
          </h2>

          {activeAssignments.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-xs shadow-2xs">
              <Bike className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="font-bold text-slate-700 text-sm">No Active Trips</p>
              <p className="text-slate-400 mt-1">Accept an order from the Available tab to start a delivery trip.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeAssignments.map((task) => (
                <div
                  key={task.id}
                  className="bg-white rounded-2xl border-2 border-blue-400 shadow-md p-4 sm:p-5 space-y-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-900">Trip #{task.id}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 uppercase">
                          {task.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400">Order Ref: #{task.orderId}</div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs text-slate-500 font-medium">Delivery Payout</div>
                      <div className="text-base font-black text-emerald-700">₹{task.earningAmount}</div>
                    </div>
                  </div>

                  {/* Step 1: Shop Pickup */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-bold text-slate-800">
                        <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">
                          1
                        </span>
                        <span>Shop Pickup Location</span>
                      </div>

                      {task.status === 'assigned' && (
                        <button
                          onClick={() => handlePickedUp(task.id)}
                          disabled={actionLoading === task.id}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-2xs transition"
                        >
                          Mark Picked Up 📦
                        </button>
                      )}

                      {task.status !== 'assigned' && (
                        <span className="text-emerald-700 font-bold flex items-center gap-1">
                          <CheckCircle className="w-4 h-4" /> Picked Up
                        </span>
                      )}
                    </div>

                    <div className="pl-7 text-slate-600">
                      <p className="font-bold text-slate-800">{task.shopName}</p>
                      <p>{task.shopAddress}</p>
                      {task.shopPhone && <p className="text-slate-500">Phone: {task.shopPhone}</p>}
                    </div>
                  </div>

                  {/* Step 2: Customer Destination */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-bold text-slate-800">
                        <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">
                          2
                        </span>
                        <span>Customer Delivery Location</span>
                      </div>

                      {task.status === 'picked_up' && (
                        <button
                          onClick={() => handleOutForDelivery(task.id)}
                          disabled={actionLoading === task.id}
                          className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg shadow-2xs transition"
                        >
                          Mark Out for Delivery 🛵
                        </button>
                      )}

                      {task.status === 'out_for_delivery' && (
                        <span className="text-amber-700 font-bold flex items-center gap-1 animate-pulse">
                          ⚡ Out for Delivery
                        </span>
                      )}
                    </div>

                    <div className="pl-7 text-slate-600">
                      <p className="font-bold text-slate-800">{task.customerName}</p>
                      <p>
                        {task.deliveryAddress.streetAddress}, {task.deliveryAddress.city} -{' '}
                        {task.deliveryAddress.postalCode}
                      </p>
                      <p className="text-slate-500">Phone: {task.customerPhone}</p>
                    </div>
                  </div>

                  {/* Step 3: Secure Delivery OTP Verification */}
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs sm:text-sm">
                      <KeyRound className="w-5 h-5 text-emerald-700" />
                      <span>Step 3: Verify Customer OTP & Complete Delivery</span>
                    </div>

                    <p className="text-xs text-emerald-800">
                      Ask the customer for their 4-digit Delivery OTP shown in their BazaarX App.
                    </p>

                    {otpError?.id === task.id && (
                      <div className="p-2 bg-red-100 text-red-700 rounded text-xs flex items-center gap-1.5 font-bold">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{otpError.msg}</span>
                      </div>
                    )}

                    <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 max-w-sm">
                      <input
                        type="text"
                        maxLength={4}
                        placeholder="4-digit OTP"
                        value={enteredOtp[task.id] || ''}
                        onChange={(e) =>
                          setEnteredOtp({ ...enteredOtp, [task.id]: e.target.value.replace(/\D/g, '') })
                        }
                        className="w-full sm:w-36 min-h-[44px] p-2.5 bg-white border border-emerald-300 rounded-xl text-center font-black text-lg tracking-widest outline-none focus:ring-2 focus:ring-emerald-500"
                      />

                      <button
                        onClick={() => handleVerifyOtpAndDeliver(task.id)}
                        disabled={actionLoading === task.id}
                        className="w-full sm:flex-1 min-h-[44px] py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow transition flex items-center justify-center gap-1.5 cursor-pointer touch-manipulation active:scale-95 disabled:opacity-50"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>{actionLoading === task.id ? 'Verifying...' : 'Confirm Delivery'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Dedicated Delivery Wallet & UPI Payouts */}
      {currentTab === 'wallet' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-linear-to-br from-amber-600 to-orange-700 text-white p-5 rounded-2xl shadow-md">
              <div className="flex items-center justify-between text-xs text-amber-100 mb-2">
                <span>Wallet Balance</span>
                <WalletIcon className="w-5 h-5 text-yellow-200" />
              </div>
              <div className="text-2xl sm:text-3xl font-black">
                ₹{(wallet?.currentBalance || 0).toLocaleString('en-IN')}
              </div>
              <div className="text-[11px] text-amber-200 mt-2">Available for daily withdrawal</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                <span>Total Delivery Earnings</span>
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900">
                ₹{(wallet?.totalEarnings || 0).toLocaleString('en-IN')}
              </div>
              <div className="text-[11px] text-slate-400 mt-2">
                From {partner.totalDeliveries || completedAssignments.length} completed trips
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                <span>Total Payouts Settled</span>
                <CheckCircle className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900">
                ₹{(wallet?.totalPayouts || 0).toLocaleString('en-IN')}
              </div>
              <div className="text-[11px] text-slate-400 mt-2">Paid via UPI to your account</div>
            </div>
          </div>

          {/* Request Payout Form */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <WalletIcon className="w-4 h-4 text-amber-600" />
              <span>Withdraw Delivery Earnings</span>
            </h3>

            {payoutMsg && (
              <div
                className={`p-3 rounded-lg text-xs font-semibold flex items-center gap-2 ${
                  payoutMsg.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                {payoutMsg.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                <span>{payoutMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleRequestPayout} className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-slate-600 font-medium mb-1">
                  Amount (Min ₹{settings.minPayoutAmount})
                </label>
                <input
                  type="number"
                  required
                  min={settings.minPayoutAmount}
                  max={wallet?.currentBalance || 0}
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(Number(e.target.value))}
                  className="w-full p-2.5 border border-slate-300 rounded-lg outline-none font-bold text-slate-900 text-sm"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">UPI ID for Transfer</label>
                <input
                  type="text"
                  required
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="rider@upi"
                  className="w-full p-2.5 border border-slate-300 rounded-lg outline-none"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={(wallet?.currentBalance || 0) < settings.minPayoutAmount}
                  className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg shadow transition cursor-pointer disabled:opacity-50"
                >
                  Request Payout
                </button>
              </div>
            </form>
          </div>

          {/* Transactions */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2 text-xs">
            <h4 className="font-bold text-slate-800 uppercase tracking-wider mb-2">
              Trip Earnings & Payout History
            </h4>
            {transactions.length === 0 ? (
              <p className="text-slate-400 py-3 text-center">No transactions recorded yet.</p>
            ) : (
              <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
                {transactions.map((tx) => (
                  <div key={tx.id} className="py-2 flex items-center justify-between">
                    <div>
                      <span className="font-medium text-slate-800">{tx.description}</span>
                      <span className="text-[10px] text-slate-400 block">
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <span
                      className={`font-black ${
                        tx.type === 'credit' ? 'text-emerald-600' : 'text-slate-900'
                      }`}
                    >
                      {tx.type === 'credit' ? '+' : '-'}₹{tx.amount}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Completed Deliveries */}
      {currentTab === 'completed' && (
        <div className="space-y-3">
          <h2 className="text-sm sm:text-base font-bold text-slate-800">
            Completed Trips ({completedAssignments.length})
          </h2>

          {completedAssignments.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-xs shadow-2xs">
              <CheckCircle className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="font-bold text-slate-700 text-sm">No Completed Trips Yet</p>
              <p className="text-slate-400 mt-1">Trips completed with OTP will be archived here.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
              {completedAssignments.map((task) => (
                <div key={task.id} className="p-3.5 flex items-center justify-between text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">Trip #{task.id}</span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.2 rounded">
                        Delivered
                      </span>
                    </div>
                    <p className="text-slate-500 mt-0.5">
                      From {task.shopName} to {task.customerName}
                    </p>
                    <span className="text-[10px] text-slate-400">
                      Delivered at {new Date(task.updatedAt).toLocaleTimeString()}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-black text-emerald-700">+₹{task.earningAmount}</span>
                    <span className="text-[10px] text-slate-400 block">Credited to Wallet</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
