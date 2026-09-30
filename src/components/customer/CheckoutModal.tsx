import React, { useState, useEffect } from 'react';
import {
  X,
  MapPin,
  Plus,
  CheckCircle2,
  CreditCard,
  Smartphone,
  Banknote,
  ShieldCheck,
  Truck,
  ArrowLeft,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { Address, PlatformSettings, PaymentMethod, Order, VillageDeliveryRate } from '../../types';
import { createOrder, fetchVillageDeliveryRates } from '../../services/dbService';
import { doc, getDocs, collection, query, where, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { supabase } from '../../supabase';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderSuccess: (order: Order) => void;
  settings: PlatformSettings;
  singleBuyItem?: any;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  onOrderSuccess,
  settings,
  singleBuyItem,
}) => {
  const { user } = useAuth();
  const { items, subtotal: cartSubtotal, clearCart } = useCart();

  const checkoutItems = singleBuyItem
    ? [
        {
          productId: singleBuyItem.id,
          shopId: singleBuyItem.shopId,
          shopName: singleBuyItem.shopName,
          name: singleBuyItem.name,
          price: singleBuyItem.price,
          discountPrice: singleBuyItem.discountPrice || singleBuyItem.price,
          quantity: 1,
          image: singleBuyItem.images[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=80',
          stock: singleBuyItem.stock,
          sellerPinCode: singleBuyItem.sellerPinCode,
        },
      ]
    : items;

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [showNewAddressForm, setShowNewAddressForm] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('upi');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Village-based dynamic delivery charge state
  const [activePinCode, setActivePinCode] = useState<string>('');
  const [availableVillages, setAvailableVillages] = useState<VillageDeliveryRate[]>([]);
  const [selectedVillageName, setSelectedVillageName] = useState<string>('');
  const [dynamicDeliveryFee, setDynamicDeliveryFee] = useState<number>(settings.deliveryBaseCharge);
  const [loadingVillages, setLoadingVillages] = useState<boolean>(false);

  // New Address Form State
  const [newFullName, setNewFullName] = useState(user?.displayName || '');
  const [newPhone, setNewPhone] = useState(user?.phoneNumber || '+91 98765 43210');
  const [newStreet, setNewStreet] = useState('');
  const [newCity, setNewCity] = useState('Resubelpara');
  const [newState, setNewState] = useState('Meghalaya');
  const [newPostalCode, setNewPostalCode] = useState('794114');
  const [newVillage, setNewVillage] = useState('');
  const [newLandmark, setNewLandmark] = useState('');
  const [newType, setNewType] = useState<'home' | 'work' | 'other'>('home');

  // Subtotal & Dynamic totals
  const subtotal = singleBuyItem
    ? singleBuyItem.discountPrice || singleBuyItem.price
    : cartSubtotal;

  const deliveryFee = dynamicDeliveryFee;
  const platformFee = settings.platformFee;
  const totalAmount = subtotal + deliveryFee + platformFee;

  // Load customer addresses
  useEffect(() => {
    if (!user) return;
    const fetchAddresses = async () => {
      // 1. Try Supabase addresses
      try {
        const { data, error } = await supabase
          .from('addresses')
          .select('*')
          .eq('user_id', user.uid)
          .order('is_default', { ascending: false });
        if (!error && data && data.length > 0) {
          const list: Address[] = data.map((a: any) => ({
            id: a.id,
            userId: a.user_id,
            fullName: a.full_name,
            phoneNumber: a.phone_number,
            streetAddress: a.street_address,
            city: a.city,
            state: a.state,
            postalCode: a.postal_code,
            landmark: a.landmark || undefined,
            isDefault: Boolean(a.is_default),
            addressType: a.address_type || 'home',
          }));
          setAddresses(list);
          setSelectedAddressId(list[0].id);
          return;
        }
      } catch (err) {
        // Fallback
      }

      // 2. Fallback to Firestore
      try {
        const q = query(collection(db, 'addresses'), where('userId', '==', user.uid));
        const snap = await getDocs(q);
        const list: Address[] = [];
        snap.forEach((d) => list.push(d.data() as Address));

        if (list.length > 0) {
          setAddresses(list);
          setSelectedAddressId(list[0].id);
        } else {
          // Provide default initial address if none exists
          const defaultAddr: Address = {
            id: 'addr_' + Date.now(),
            userId: user.uid,
            fullName: user.displayName || 'Customer',
            phoneNumber: user.phoneNumber || '+91 98765 00000',
            streetAddress: 'Flat 402, Green Glen Layout, Bellandur',
            city: 'Bengaluru',
            state: 'Karnataka',
            postalCode: '123456',
            landmark: 'Near Central Mall',
            isDefault: true,
            addressType: 'home',
          };
          await setDoc(doc(db, 'addresses', defaultAddr.id), defaultAddr);
          try {
            await supabase.from('addresses').upsert({
              id: defaultAddr.id,
              user_id: defaultAddr.userId,
              full_name: defaultAddr.fullName,
              phone_number: defaultAddr.phoneNumber,
              street_address: defaultAddr.streetAddress,
              city: defaultAddr.city,
              state: defaultAddr.state,
              postal_code: defaultAddr.postalCode,
              landmark: defaultAddr.landmark || null,
              is_default: defaultAddr.isDefault,
              address_type: defaultAddr.addressType,
            });
          } catch {}
          setAddresses([defaultAddr]);
          setSelectedAddressId(defaultAddr.id);
        }
      } catch (e) {
        console.warn('Addresses fetch error:', e);
      }
    };
    fetchAddresses();
  }, [user]);

  // Fetch village rates dynamically whenever selected address PIN changes
  useEffect(() => {
    const chosenAddress = addresses.find((a) => a.id === selectedAddressId);
    const pin = (chosenAddress?.postalCode || '').trim();
    if (!pin) {
      setAvailableVillages([]);
      return;
    }

    setActivePinCode(pin);
    setLoadingVillages(true);

    fetchVillageDeliveryRates(pin)
      .then((rates) => {
        setAvailableVillages(rates);
        // If address already has a village that matches one of the rates, select it
        const existingVillage = chosenAddress?.village;
        const matched = rates.find(
          (r) => r.villageName.toLowerCase() === (existingVillage || '').toLowerCase()
        );
        if (matched) {
          setSelectedVillageName(matched.villageName);
          setDynamicDeliveryFee(matched.deliveryCharge);
        } else if (rates.length > 0) {
          // Select first village by default
          setSelectedVillageName(rates[0].villageName);
          setDynamicDeliveryFee(rates[0].deliveryCharge);
        } else {
          setSelectedVillageName('');
          setDynamicDeliveryFee(settings.deliveryBaseCharge);
        }
      })
      .catch((err) => {
        console.warn('Error fetching village rates:', err);
        setDynamicDeliveryFee(settings.deliveryBaseCharge);
      })
      .finally(() => {
        setLoadingVillages(false);
      });
  }, [selectedAddressId, addresses, settings.deliveryBaseCharge]);

  // Handler for changing village dropdown
  const handleSelectVillage = (villageName: string) => {
    setSelectedVillageName(villageName);
    const matched = availableVillages.find((v) => v.villageName === villageName);
    if (matched) {
      setDynamicDeliveryFee(matched.deliveryCharge);
    }
  };

  if (!isOpen) return null;

  const handleSaveNewAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const newAddr: Address = {
      id: 'addr_' + Date.now(),
      userId: user.uid,
      fullName: newFullName,
      phoneNumber: newPhone,
      streetAddress: newStreet,
      city: newCity,
      state: newState,
      postalCode: newPostalCode,
      village: newVillage || undefined,
      landmark: newLandmark,
      isDefault: addresses.length === 0,
      addressType: newType,
    };
    try {
      await supabase.from('addresses').insert({
        id: newAddr.id,
        user_id: newAddr.userId,
        full_name: newAddr.fullName,
        phone_number: newAddr.phoneNumber,
        street_address: newAddr.streetAddress,
        city: newAddr.city,
        state: newAddr.state,
        postal_code: newAddr.postalCode,
        landmark: newAddr.landmark || null,
        is_default: newAddr.isDefault,
        address_type: newAddr.addressType,
      });
    } catch {}
    try {
      await setDoc(doc(db, 'addresses', newAddr.id), newAddr);
      setAddresses([...addresses, newAddr]);
      setSelectedAddressId(newAddr.id);
      setShowNewAddressForm(false);
    } catch (e) {
      console.error('Error saving address:', e);
    }
  };

  const handlePlaceOrder = async () => {
    if (!user) {
      setErrorMsg('Please sign in to place an order.');
      return;
    }
    const chosenAddress = addresses.find((a) => a.id === selectedAddressId);
    if (!chosenAddress) {
      setErrorMsg('Please select or add a delivery address.');
      return;
    }
    if (checkoutItems.length === 0) {
      setErrorMsg('No items in checkout.');
      return;
    }

    if (settings.localPinCodeRestriction) {
      const buyerPin = (chosenAddress.postalCode || '').trim();
      const hasBlocked = checkoutItems.some((it) => {
        const sellerPin = (it.sellerPinCode || '').trim();
        return sellerPin && sellerPin !== buyerPin;
      });
      if (hasBlocked) {
        setErrorMsg('Sorry, this product is currently available only in your local area.');
        return;
      }
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const updatedAddress = {
        ...chosenAddress,
        village: selectedVillageName || chosenAddress.village,
      };

      const order = await createOrder(
        user.uid,
        user.displayName || 'Customer',
        user.email || 'customer@bazaarx.com',
        user.phoneNumber || chosenAddress.phoneNumber,
        updatedAddress,
        checkoutItems,
        paymentMethod,
        settings,
        dynamicDeliveryFee,
        selectedVillageName || undefined
      );

      if (!singleBuyItem) {
        clearCart();
      }

      onOrderSuccess(order);
      onClose();
    } catch (err: any) {
      console.error('Order creation error:', err);
      setErrorMsg(err.message || 'Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[95vh] flex flex-col animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-5 py-3.5 bg-[#2874f0] text-white flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-yellow-300" />
            <h2 className="text-base font-bold">Secure Checkout & Payment</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/20 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Section 1: Delivery Address */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-slate-800 font-bold text-xs sm:text-sm">
                <span className="w-5 h-5 rounded-full bg-[#2874f0] text-white flex items-center justify-center text-[10px]">
                  1
                </span>
                <span>Delivery Address</span>
              </div>
              {!showNewAddressForm && (
                <button
                  onClick={() => setShowNewAddressForm(true)}
                  className="text-xs font-semibold text-[#2874f0] hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add New</span>
                </button>
              )}
            </div>

            {showNewAddressForm ? (
              <form onSubmit={handleSaveNewAddress} className="space-y-3 bg-white p-4 rounded-lg border border-blue-200">
                <div className="text-xs font-bold text-slate-700 mb-2">New Address Details</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-500 font-medium mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={newFullName}
                      onChange={(e) => setNewFullName(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded outline-none focus:border-[#2874f0]"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-medium mb-1">Mobile Number</label>
                    <input
                      type="tel"
                      required
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded outline-none focus:border-[#2874f0]"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-slate-500 font-medium mb-1">Flat / House No. / Street</label>
                    <input
                      type="text"
                      required
                      value={newStreet}
                      onChange={(e) => setNewStreet(e.target.value)}
                      placeholder="e.g. #24, Green Glen Apartment"
                      className="w-full p-2 border border-slate-300 rounded outline-none focus:border-[#2874f0]"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-medium mb-1">City</label>
                    <input
                      type="text"
                      required
                      value={newCity}
                      onChange={(e) => setNewCity(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded outline-none focus:border-[#2874f0]"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-medium mb-1">State</label>
                    <input
                      type="text"
                      required
                      value={newState}
                      onChange={(e) => setNewState(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded outline-none focus:border-[#2874f0]"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-medium mb-1">PIN Code</label>
                    <input
                      type="text"
                      required
                      value={newPostalCode}
                      onChange={(e) => setNewPostalCode(e.target.value)}
                      placeholder="e.g. 794114"
                      className="w-full p-2 border border-slate-300 rounded outline-none focus:border-[#2874f0]"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-medium mb-1">Village / Locality</label>
                    <input
                      type="text"
                      value={newVillage}
                      onChange={(e) => setNewVillage(e.target.value)}
                      placeholder="e.g. Babukona Village"
                      className="w-full p-2 border border-slate-300 rounded outline-none focus:border-[#2874f0]"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-slate-500 font-medium mb-1">Landmark (Optional)</label>
                    <input
                      type="text"
                      value={newLandmark}
                      onChange={(e) => setNewLandmark(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded outline-none focus:border-[#2874f0]"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowNewAddressForm(false)}
                    className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-[#2874f0] text-white text-xs font-bold rounded shadow hover:bg-blue-700"
                  >
                    Save & Deliver Here
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-2">
                {addresses.map((addr) => (
                  <label
                    key={addr.id}
                    className={`block p-3 rounded-lg border cursor-pointer transition ${
                      selectedAddressId === addr.id
                        ? 'bg-blue-50/70 border-[#2874f0] ring-1 ring-[#2874f0]'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <input
                        type="radio"
                        name="delivery_address"
                        checked={selectedAddressId === addr.id}
                        onChange={() => setSelectedAddressId(addr.id)}
                        className="mt-1 accent-[#2874f0]"
                      />
                      <div className="flex-1 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{addr.fullName}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded uppercase font-bold bg-slate-200 text-slate-700">
                            {addr.addressType}
                          </span>
                          <span className="font-semibold text-slate-600">{addr.phoneNumber}</span>
                        </div>
                        <p className="text-slate-600 mt-0.5 leading-relaxed">
                          {addr.streetAddress}, {addr.city}, {addr.state} -{' '}
                          <span className="font-bold">{addr.postalCode}</span>
                          {addr.village && (
                            <span className="ml-1 text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                              Village: {addr.village}
                            </span>
                          )}
                          {addr.landmark && ` (Near ${addr.landmark})`}
                        </p>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}

            {/* Hyper-local Village Selection Dropdown (Dynamically listed villages under entered PIN code) */}
            {selectedAddress && (
              <div className="mt-3.5 pt-3.5 border-t border-slate-200/80 bg-white p-3.5 rounded-xl border border-blue-100 shadow-2xs">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#2874f0]" />
                    <span>Select Village / Locality in PIN {selectedAddress.postalCode || activePinCode}</span>
                  </label>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Delivery Fee: ₹{dynamicDeliveryFee}
                  </span>
                </div>

                <div className="relative">
                  <select
                    value={selectedVillageName}
                    onChange={(e) => handleSelectVillage(e.target.value)}
                    disabled={loadingVillages}
                    className="w-full p-2.5 bg-slate-50 hover:bg-white border border-slate-300 focus:border-[#2874f0] focus:ring-1 focus:ring-[#2874f0] rounded-xl text-xs font-medium text-slate-800 outline-none transition appearance-none cursor-pointer"
                  >
                    {availableVillages.map((v, idx) => (
                      <option key={v.id || idx} value={v.villageName}>
                        {idx + 1}. {v.villageName} — ₹{v.deliveryCharge} Delivery Charge
                      </option>
                    ))}
                    {availableVillages.length === 0 && (
                      <option value="">
                        {loadingVillages ? 'Loading villages...' : 'Default Village Area — ₹' + settings.deliveryBaseCharge}
                      </option>
                    )}
                  </select>
                  <div className="absolute right-3 top-2.5 pointer-events-none text-slate-400 text-xs font-bold">
                    ▼
                  </div>
                </div>

                <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                  <span>
                    Rates scale dynamically from <strong>₹10</strong> based on village distance.
                  </span>
                  <span className="font-semibold text-slate-700">
                    {availableVillages.length} Villages available
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Order Items Summary */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="flex items-center gap-2 text-slate-800 font-bold text-xs sm:text-sm mb-3">
              <span className="w-5 h-5 rounded-full bg-[#2874f0] text-white flex items-center justify-center text-[10px]">
                2
              </span>
              <span>Order Summary ({checkoutItems.length} items)</span>
            </div>

            <div className="divide-y divide-slate-200 max-h-40 overflow-y-auto">
              {checkoutItems.map((it) => (
                <div key={it.productId} className="py-2 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <img src={it.image} alt="" className="w-10 h-10 object-contain rounded bg-white p-1 shrink-0 border border-slate-200" />
                    <div className="truncate">
                      <div className="font-semibold text-slate-800 truncate">{it.name}</div>
                      <div className="text-[10px] text-slate-400">Qty: {it.quantity} • {it.shopName}</div>
                    </div>
                  </div>
                  <div className="font-bold text-slate-900 whitespace-nowrap">
                    ₹{(it.discountPrice * it.quantity).toLocaleString('en-IN')}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Payment Options */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="flex items-center gap-2 text-slate-800 font-bold text-xs sm:text-sm mb-3">
              <span className="w-5 h-5 rounded-full bg-[#2874f0] text-white flex items-center justify-center text-[10px]">
                3
              </span>
              <span>Payment Options</span>
            </div>

            <div className="space-y-2 text-xs">
              <label
                className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition ${
                  paymentMethod === 'upi'
                    ? 'bg-blue-50/80 border-[#2874f0] ring-1 ring-[#2874f0]'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="payment"
                    value="upi"
                    checked={paymentMethod === 'upi'}
                    onChange={() => setPaymentMethod('upi')}
                    className="accent-[#2874f0]"
                  />
                  <div className="p-1.5 rounded-full bg-blue-100 text-blue-700">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-800">UPI (Google Pay, PhonePe, Paytm, BHIM)</div>
                    <div className="text-[11px] text-slate-500">Fastest and 100% secure instant checkout</div>
                  </div>
                </div>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                  Recommended
                </span>
              </label>

              <label
                className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition ${
                  paymentMethod === 'card'
                    ? 'bg-blue-50/80 border-[#2874f0] ring-1 ring-[#2874f0]'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="payment"
                    value="card"
                    checked={paymentMethod === 'card'}
                    onChange={() => setPaymentMethod('card')}
                    className="accent-[#2874f0]"
                  />
                  <div className="p-1.5 rounded-full bg-emerald-100 text-emerald-700">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-800">Credit / Debit / ATM Card</div>
                    <div className="text-[11px] text-slate-500">Visa, MasterCard, RuPay, Diners Club</div>
                  </div>
                </div>
              </label>

              {settings.cashOnDeliveryEnabled && (
                <label
                  className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition ${
                    paymentMethod === 'cod'
                      ? 'bg-blue-50/80 border-[#2874f0] ring-1 ring-[#2874f0]'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="payment"
                      value="cod"
                      checked={paymentMethod === 'cod'}
                      onChange={() => setPaymentMethod('cod')}
                      className="accent-[#2874f0]"
                    />
                    <div className="p-1.5 rounded-full bg-amber-100 text-amber-700">
                      <Banknote className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-800">Cash on Delivery (COD)</div>
                      <div className="text-[11px] text-slate-500">Pay cash or UPI upon delivery at doorstep</div>
                    </div>
                  </div>
                </label>
              )}
            </div>
          </div>

          {/* Section 4: Total Bill Breakdown */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 text-xs space-y-1.5">
            <div className="flex justify-between text-slate-600">
              <span>Items Subtotal</span>
              <span>₹{subtotal.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Delivery Fee</span>
              <span>₹{deliveryFee}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Platform Fee</span>
              <span>₹{platformFee}</span>
            </div>
            <div className="border-t border-dashed border-slate-200 pt-2 flex justify-between font-black text-slate-900 text-sm">
              <span>Total Payable</span>
              <span className="text-base text-[#2874f0]">₹{totalAmount.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 pb-[max(0.875rem,env(safe-area-inset-bottom))]">
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Payable Amount</div>
            <div className="text-base sm:text-lg font-black text-slate-900">₹{totalAmount.toLocaleString('en-IN')}</div>
          </div>

          <button
            onClick={handlePlaceOrder}
            disabled={loading || !selectedAddressId}
            className="min-h-[46px] px-5 sm:px-6 py-2.5 bg-[#fb641b] hover:bg-[#e85b17] text-white font-bold rounded-xl text-xs sm:text-sm shadow-md transition cursor-pointer touch-manipulation active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span>Placing Order...</span>
            ) : (
              <>
                <span>Confirm Order</span>
                <Truck className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
