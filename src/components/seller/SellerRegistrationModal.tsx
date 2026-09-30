import React, { useState } from 'react';
import { X, Store, Building2, CreditCard, ShieldCheck, MapPin, AlertCircle, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { registerShop } from '../../services/dbService';

interface SellerRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegistered: () => void;
}

export const SellerRegistrationModal: React.FC<SellerRegistrationModalProps> = ({
  isOpen,
  onClose,
  onRegistered,
}) => {
  const { user } = useAuth();

  const [shopName, setShopName] = useState('');
  const [ownerName, setOwnerName] = useState(user?.displayName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '+91 ');
  const [shopAddress, setShopAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [servicePinCode, setServicePinCode] = useState('');
  const [category, setCategory] = useState('Electronics & Mobiles');
  const [description, setDescription] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [panNumber, setPanNumber] = useState('');

  // Bank & UPI Details
  const [accountHolderName, setAccountHolderName] = useState(user?.displayName || '');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [upiId, setUpiId] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setErrorMsg('Please sign in first.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      await registerShop({
        ownerId: user.uid,
        shopName,
        ownerName,
        email,
        phoneNumber,
        shopAddress,
        city,
        state,
        postalCode,
        servicePinCode: (servicePinCode || postalCode).trim(),
        category,
        description,
        logoUrl: logoUrl || 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=300&q=80',
        panNumber,
        bankDetails: {
          accountHolderName,
          accountNumber,
          ifsc,
          upiId,
        },
      });

      onRegistered();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit shop registration.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-5 py-4 bg-emerald-700 text-white flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2.5">
            <Store className="w-6 h-6 text-yellow-300" />
            <div>
              <h2 className="text-base sm:text-lg font-bold">Register Your Shop / Business</h2>
              <p className="text-xs text-emerald-100">Sell on BazaarX and scale your retail business</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/20 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Section 1: Shop & Owner */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-emerald-700" />
              <span>Shop & Business Information</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-600 font-medium mb-1">Shop / Business Name *</label>
                <input
                  type="text"
                  required
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  placeholder="e.g. Nexus Tech & Electronics"
                  className="w-full p-2 border border-slate-300 rounded bg-white outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Owner Full Name *</label>
                <input
                  type="text"
                  required
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="Full legal name"
                  className="w-full p-2 border border-slate-300 rounded bg-white outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Business Mobile Number *</label>
                <input
                  type="tel"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full p-2 border border-slate-300 rounded bg-white outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Business Email *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="business@example.com"
                  className="w-full p-2 border border-slate-300 rounded bg-white outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Business Category *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded bg-white outline-none focus:border-emerald-600"
                >
                  <option value="Electronics & Mobiles">Electronics & Mobiles</option>
                  <option value="Fashion & Apparel">Fashion & Apparel</option>
                  <option value="Home & Kitchen">Home & Kitchen</option>
                  <option value="Grocery & Gourmet">Grocery & Gourmet</option>
                  <option value="Beauty, Health & Personal Care">Beauty & Health</option>
                  <option value="Books & Stationery">Books & Stationery</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">PAN Number (Optional)</label>
                <input
                  type="text"
                  value={panNumber}
                  onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                  placeholder="ABCDE1234F"
                  className="w-full p-2 border border-slate-300 rounded bg-white outline-none focus:border-emerald-600 uppercase"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-600 font-medium mb-1">Shop Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Briefly describe what your shop sells..."
                  className="w-full p-2 border border-slate-300 rounded bg-white outline-none focus:border-emerald-600"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Physical Pickup Address */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-emerald-700" />
              <span>Shop Pickup Address (For Delivery Partners)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="sm:col-span-2">
                <label className="block text-slate-600 font-medium mb-1">Shop Address & Street *</label>
                <input
                  type="text"
                  required
                  value={shopAddress}
                  onChange={(e) => setShopAddress(e.target.value)}
                  placeholder="Shop No., Market / Complex, Street Name"
                  className="w-full p-2 border border-slate-300 rounded bg-white outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">City *</label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Bengaluru"
                  className="w-full p-2 border border-slate-300 rounded bg-white outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">State *</label>
                <input
                  type="text"
                  required
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="e.g. Karnataka"
                  className="w-full p-2 border border-slate-300 rounded bg-white outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Shop Physical PIN Code *</label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={postalCode}
                  onChange={(e) => {
                    const val = e.target.value;
                    setPostalCode(val);
                    if (!servicePinCode || servicePinCode === postalCode) {
                      setServicePinCode(val);
                    }
                  }}
                  placeholder="e.g. 123456"
                  className="w-full p-2 border border-slate-300 rounded bg-white outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">
                  Registered Service PIN Code *
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={servicePinCode}
                  onChange={(e) => setServicePinCode(e.target.value)}
                  placeholder="e.g. 123456"
                  className="w-full p-2 border border-slate-300 rounded bg-white outline-none focus:border-emerald-600 font-bold text-emerald-800"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Only buyers located in this delivery PIN will be permitted to purchase your products.
                </p>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-600 font-medium mb-1">Shop Logo / Photo URL (Optional)</label>
                <input
                  type="url"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full p-2 border border-slate-300 rounded bg-white outline-none focus:border-emerald-600"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Bank & Payout UPI */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-emerald-700" />
              <span>Bank & Settlement Payout Details</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-600 font-medium mb-1">Account Holder Name *</label>
                <input
                  type="text"
                  required
                  value={accountHolderName}
                  onChange={(e) => setAccountHolderName(e.target.value)}
                  placeholder="Legal Name in Bank"
                  className="w-full p-2 border border-slate-300 rounded bg-white outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">UPI ID (For Fast Settlements) *</label>
                <input
                  type="text"
                  required
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="sellername@okhdfcbank"
                  className="w-full p-2 border border-slate-300 rounded bg-white outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Bank Account Number *</label>
                <input
                  type="text"
                  required
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="Account Number"
                  className="w-full p-2 border border-slate-300 rounded bg-white outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Bank IFSC Code *</label>
                <input
                  type="text"
                  required
                  value={ifsc}
                  onChange={(e) => setIfsc(e.target.value.toUpperCase())}
                  placeholder="HDFC0001234"
                  className="w-full p-2 border border-slate-300 rounded bg-white outline-none focus:border-emerald-600 uppercase"
                />
              </div>
            </div>
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <span>
              Your registration will be submitted for Admin Review. Once verified by our onboarding team, your shop status will change to Approved and you can begin publishing products and receiving customer orders.
            </span>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Submitting Application...' : 'Submit Shop Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
