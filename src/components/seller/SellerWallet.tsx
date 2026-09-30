import React, { useState } from 'react';
import {
  Wallet as WalletIcon,
  CreditCard,
  ArrowUpRight,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  Send,
  History,
} from 'lucide-react';
import { Wallet, WalletTransaction, PayoutRequest, Shop, PlatformSettings } from '../../types';
import { requestPayout } from '../../services/dbService';

interface SellerWalletProps {
  wallet: Wallet | null;
  transactions: WalletTransaction[];
  payouts: PayoutRequest[];
  shop: Shop;
  settings: PlatformSettings;
}

export const SellerWallet: React.FC<SellerWalletProps> = ({
  wallet,
  transactions,
  payouts,
  shop,
  settings,
}) => {
  const [payoutAmount, setPayoutAmount] = useState<number>(settings.minPayoutAmount);
  const [upiId, setUpiId] = useState<string>(shop.bankDetails.upiId || '');
  const [isRequesting, setIsRequesting] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const balance = wallet ? wallet.currentBalance : 0;
  const totalEarnings = wallet ? wallet.totalEarnings : 0;
  const totalPayouts = wallet ? wallet.totalPayouts : 0;

  const handleRequestPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);

    if (payoutAmount < settings.minPayoutAmount) {
      setMsg({
        type: 'error',
        text: `Minimum payout withdrawal is ₹${settings.minPayoutAmount}.`,
      });
      return;
    }

    if (payoutAmount > balance) {
      setMsg({
        type: 'error',
        text: `Requested amount exceeds your available balance of ₹${balance}.`,
      });
      return;
    }

    if (!upiId.trim()) {
      setMsg({ type: 'error', text: 'Please provide a valid UPI ID for settlement.' });
      return;
    }

    setIsRequesting(true);
    try {
      await requestPayout({
        requesterId: shop.ownerId,
        requesterName: shop.ownerName || shop.shopName,
        requesterRole: 'seller',
        shopId: shop.id,
        amount: payoutAmount,
        upiId: upiId.trim(),
        bankDetails: shop.bankDetails,
      });

      setMsg({
        type: 'success',
        text: `Payout request of ₹${payoutAmount} submitted successfully! Admin will process within 24 hours.`,
      });
    } catch (e: any) {
      setMsg({ type: 'error', text: e.message || 'Failed to submit payout request.' });
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base sm:text-lg font-black text-slate-900">
          Seller Settlement Wallet
        </h2>
        <p className="text-xs text-slate-500">
          Real-time balance, platform commissions, order earnings, and UPI payout requests
        </p>
      </div>

      {msg && (
        <div
          className={`p-3 rounded-lg text-xs font-semibold flex items-center gap-2 ${
            msg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {msg.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{msg.text}</span>
        </div>
      )}

      {/* Wallet Balance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-linear-to-br from-emerald-600 to-teal-800 text-white p-5 rounded-2xl shadow-md">
          <div className="flex items-center justify-between text-xs text-emerald-100 mb-2">
            <span>Available Balance</span>
            <WalletIcon className="w-5 h-5 text-yellow-300" />
          </div>
          <div className="text-2xl sm:text-3xl font-black">₹{balance.toLocaleString('en-IN')}</div>
          <div className="text-[11px] text-emerald-200 mt-2">
            Ready for instant bank or UPI withdrawal
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>Lifetime Sales Earnings</span>
            <ArrowUpRight className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">
            ₹{totalEarnings.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            After {settings.sellerCommissionPercent}% platform commission
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>Total Paid Out</span>
            <CheckCircle className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">
            ₹{totalPayouts.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            Processed via verified UPI & NEFT
          </div>
        </div>
      </div>

      {/* Request Payout Form */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-emerald-700" />
          <h3 className="text-sm sm:text-base font-bold text-slate-900">
            Request Payout Withdrawal
          </h3>
        </div>

        <form onSubmit={handleRequestPayout} className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block text-slate-600 font-medium mb-1">
              Withdrawal Amount (Min ₹{settings.minPayoutAmount})
            </label>
            <input
              type="number"
              required
              min={settings.minPayoutAmount}
              max={balance}
              value={payoutAmount}
              onChange={(e) => setPayoutAmount(Number(e.target.value))}
              className="w-full p-2.5 border border-slate-300 rounded-lg outline-none focus:border-emerald-600 font-bold text-slate-900 text-sm"
            />
          </div>

          <div>
            <label className="block text-slate-600 font-medium mb-1">Settlement UPI ID</label>
            <input
              type="text"
              required
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              placeholder="shopname@okhdfcbank"
              className="w-full p-2.5 border border-slate-300 rounded-lg outline-none focus:border-emerald-600"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={isRequesting || balance < settings.minPayoutAmount}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{isRequesting ? 'Submitting...' : 'Request Payout'}</span>
            </button>
          </div>
        </form>

        <p className="text-[11px] text-slate-400">
          Admin reviews and authorizes all vendor payouts. Funds are credited directly to your registered UPI ID or bank account.
        </p>
      </div>

      {/* Payout History & Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Payout Requests */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>Payout Requests ({payouts.length})</span>
            </h4>
          </div>

          {payouts.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">No payout requests yet.</p>
          ) : (
            <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
              {payouts.map((p) => (
                <div key={p.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-slate-900">₹{p.amount.toLocaleString('en-IN')}</div>
                    <div className="text-[10px] text-slate-400">UPI: {p.upiId}</div>
                    <div className="text-[10px] text-slate-400">
                      {new Date(p.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                      p.status === 'paid'
                        ? 'bg-emerald-100 text-emerald-800'
                        : p.status === 'rejected'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-amber-100 text-amber-800 animate-pulse'
                    }`}
                  >
                    {p.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Transactions Ledger */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <History className="w-4 h-4 text-emerald-600" />
              <span>Transaction History ({transactions.length})</span>
            </h4>
          </div>

          {transactions.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">No transactions recorded yet.</p>
          ) : (
            <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
              {transactions.map((tx) => (
                <div key={tx.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="pr-2">
                    <div className="font-semibold text-slate-800 leading-snug">{tx.description}</div>
                    <div className="text-[10px] text-slate-400">
                      {new Date(tx.createdAt).toLocaleDateString()} at{' '}
                      {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>

                  <div
                    className={`font-black whitespace-nowrap text-xs ${
                      tx.type === 'credit' ? 'text-emerald-600' : 'text-slate-900'
                    }`}
                  >
                    {tx.type === 'credit' ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
