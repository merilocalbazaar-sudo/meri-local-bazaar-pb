import React from 'react';
import { X, Trash2, Plus, Minus, ShoppingBag, ShieldCheck, ArrowRight } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { PlatformSettings } from '../../types';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckout: () => void;
  settings: PlatformSettings;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  onCheckout,
  settings,
}) => {
  const { items, updateQuantity, removeFromCart, subtotal, itemCount } = useCart();

  if (!isOpen) return null;

  const originalTotal = items.reduce((sum, it) => sum + it.price * it.quantity, 0);
  const totalSavings = originalTotal - subtotal;
  const deliveryFee = settings.deliveryBaseCharge;
  const platformFee = settings.platformFee;
  const finalPayable = subtotal > 0 ? subtotal + deliveryFee + platformFee : 0;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
      />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-6">
        <div className="w-screen max-w-md bg-slate-50 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="px-4 py-3 bg-[#2874f0] text-white flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-yellow-300" />
              <h2 className="text-base font-bold">My Shopping Cart ({itemCount})</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-white/20 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Content */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {items.length === 0 ? (
              <div className="h-96 flex flex-col items-center justify-center text-center p-6 bg-white rounded-xl shadow-2xs">
                <ShoppingBag className="w-16 h-16 stroke-1 text-slate-300 mb-3" />
                <h3 className="font-bold text-slate-700 text-base">Your Cart is Empty</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-xs">
                  Explore our top electronics, trending fashion, and deals of the day!
                </p>
                <button
                  onClick={onClose}
                  className="mt-4 px-5 py-2 bg-[#2874f0] text-white font-bold text-xs rounded shadow hover:bg-blue-700 transition"
                >
                  Start Shopping
                </button>
              </div>
            ) : (
              <>
                {/* Items List */}
                <div className="space-y-2">
                  {items.map((item) => (
                    <div
                      key={item.productId}
                      className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs flex gap-3"
                    >
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-16 h-16 object-contain rounded bg-slate-50 shrink-0 border border-slate-100"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] text-slate-400 truncate">
                          Seller: {item.shopName}
                        </div>
                        <h4 className="text-xs font-semibold text-slate-900 truncate">
                          {item.name}
                        </h4>
                        <div className="flex items-baseline gap-2 mt-1">
                          <span className="text-xs font-black text-slate-900">
                            ₹{(item.discountPrice * item.quantity).toLocaleString('en-IN')}
                          </span>
                          {item.price > item.discountPrice && (
                            <span className="text-[11px] text-slate-400 line-through">
                              ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                            </span>
                          )}
                        </div>

                        {/* Controls */}
                        <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-100">
                          <div className="flex items-center border border-slate-300 rounded bg-slate-50">
                            <button
                              onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                              className="p-1 text-slate-600 hover:text-black hover:bg-slate-200 rounded-l transition"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="px-2 text-xs font-bold text-slate-800">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                              disabled={item.quantity >= item.stock}
                              className="p-1 text-slate-600 hover:text-black hover:bg-slate-200 rounded-r transition disabled:opacity-30"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          <button
                            onClick={() => removeFromCart(item.productId)}
                            className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remove</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Price Details Card */}
                <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs text-xs space-y-2">
                  <h3 className="font-bold text-slate-500 uppercase tracking-wider text-[11px] border-b border-slate-100 pb-2">
                    Price Details ({itemCount} {itemCount === 1 ? 'Item' : 'Items'})
                  </h3>

                  <div className="flex justify-between text-slate-600">
                    <span>Price (Original MRP)</span>
                    <span>₹{originalTotal.toLocaleString('en-IN')}</span>
                  </div>

                  {totalSavings > 0 && (
                    <div className="flex justify-between text-emerald-600 font-medium">
                      <span>Discount</span>
                      <span>-₹{totalSavings.toLocaleString('en-IN')}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-slate-600">
                    <span>Delivery Charges</span>
                    <span className="text-slate-800 font-medium">₹{deliveryFee}</span>
                  </div>

                  <div className="flex justify-between text-slate-600">
                    <span>Secured Packaging & Platform Fee</span>
                    <span className="text-slate-800 font-medium">₹{platformFee}</span>
                  </div>

                  <div className="border-t border-dashed border-slate-200 pt-2 flex justify-between text-sm font-black text-slate-900">
                    <span>Total Amount</span>
                    <span className="text-base text-blue-700">₹{finalPayable.toLocaleString('en-IN')}</span>
                  </div>

                  {totalSavings > 0 && (
                    <div className="bg-emerald-50 text-emerald-700 p-2 rounded text-[11px] font-bold text-center border border-emerald-100">
                      🎉 You will save ₹{totalSavings.toLocaleString('en-IN')} on this order!
                    </div>
                  )}
                </div>

                {/* Assurance */}
                <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 py-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Safe and Secure Payments • 100% Authentic Products</span>
                </div>
              </>
            )}
          </div>

          {/* Footer Checkout Bar */}
          {items.length > 0 && (
            <div className="p-3.5 bg-white border-t border-slate-200 flex items-center justify-between gap-3 shadow-lg pb-[max(0.875rem,env(safe-area-inset-bottom))]">
              <div className="shrink-0">
                <div className="text-[10px] text-slate-400">Total Payable</div>
                <div className="text-base font-black text-slate-900">
                  ₹{finalPayable.toLocaleString('en-IN')}
                </div>
              </div>

              <button
                onClick={onCheckout}
                className="flex-1 min-h-[46px] py-2.5 px-4 bg-[#fb641b] hover:bg-[#e85b17] text-white font-bold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-1.5 transition shadow-md cursor-pointer touch-manipulation active:scale-95"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
