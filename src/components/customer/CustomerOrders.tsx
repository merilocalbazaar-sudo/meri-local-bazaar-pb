import React, { useState } from 'react';
import {
  Package,
  Clock,
  CheckCircle2,
  Bike,
  Store,
  MapPin,
  KeyRound,
  Phone,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { Order, OrderStatus } from '../../types';

interface CustomerOrdersProps {
  orders: Order[];
  onRefresh?: () => void;
}

const ORDER_STATUS_STEPS: { status: OrderStatus; label: string; icon: string }[] = [
  { status: 'confirmed', label: 'Confirmed', icon: '📝' },
  { status: 'processing', label: 'Processing', icon: '⚙️' },
  { status: 'packed', label: 'Packed', icon: '📦' },
  { status: 'ready_for_pickup', label: 'Ready for Pickup', icon: '🏪' },
  { status: 'assigned_to_delivery_partner', label: 'Rider Assigned', icon: '🛵' },
  { status: 'picked_up', label: 'Picked Up', icon: '🚚' },
  { status: 'out_for_delivery', label: 'Out for Delivery', icon: '⚡' },
  { status: 'delivered', label: 'Delivered', icon: '🎉' },
];

export const CustomerOrders: React.FC<CustomerOrdersProps> = ({ orders, onRefresh }) => {
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(
    orders.length > 0 ? orders[0].id : null
  );

  const getStatusIndex = (currentStatus: OrderStatus) => {
    if (currentStatus === 'cancelled') return -1;
    return ORDER_STATUS_STEPS.findIndex((s) => s.status === currentStatus);
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'delivered':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'out_for_delivery':
      case 'picked_up':
        return 'bg-amber-100 text-amber-800 border-amber-300 animate-pulse';
      case 'assigned_to_delivery_partner':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-2 sm:px-4 py-4 space-y-4 pb-16">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg sm:text-xl font-black text-slate-900">My Orders ({orders.length})</h1>
          <p className="text-xs text-slate-500">Track and monitor your live shipments in real time</p>
        </div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        )}
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-xl p-10 text-center border border-slate-200 shadow-2xs">
          <Package className="w-16 h-16 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-800 text-base">No Orders Placed Yet</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            You haven't placed any orders yet. Browse our marketplace and shop the best deals!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const isExpanded = expandedOrderId === order.id;
            const currentStepIdx = getStatusIndex(order.orderStatus);

            return (
              <div
                key={order.id}
                className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden transition"
              >
                {/* Header Summary */}
                <div
                  onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                  className="p-4 bg-slate-50 hover:bg-slate-100/70 cursor-pointer flex flex-wrap items-center justify-between gap-3 border-b border-slate-200"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm font-extrabold text-slate-900">
                        #{order.id}
                      </span>
                      <span
                        className={`text-[10px] sm:text-xs font-bold px-2.5 py-0.5 rounded-full border uppercase ${getStatusBadge(
                          order.orderStatus
                        )}`}
                      >
                        {order.orderStatus.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Placed on {new Date(order.createdAt).toLocaleDateString()} at{' '}
                      {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm sm:text-base font-black text-slate-900">
                        ₹{order.totalAmount.toLocaleString('en-IN')}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {order.items.length} {order.items.length === 1 ? 'item' : 'items'} •{' '}
                        {order.paymentMethod.toUpperCase()} ({order.paymentStatus})
                      </div>
                    </div>
                    <div className="text-slate-400">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Details & Live Tracker */}
                {isExpanded && (
                  <div className="p-4 sm:p-6 space-y-6">
                    {/* Delivery OTP Security Banner (Critical Feature) */}
                    {order.orderStatus !== 'delivered' && order.orderStatus !== 'cancelled' && (
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-amber-100 text-amber-800 rounded-full">
                            <KeyRound className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                              Secure Delivery OTP
                            </h4>
                            <p className="text-xs text-amber-700">
                              Share this 4-digit code with the delivery partner when they reach your doorstep.
                            </p>
                          </div>
                        </div>

                        <div className="bg-white px-4 py-2 rounded-lg border-2 border-dashed border-amber-400 text-center">
                          <span className="text-xs text-slate-400 block font-semibold">DELIVERY CODE</span>
                          <span className="text-xl sm:text-2xl font-black tracking-widest text-slate-900">
                            {order.deliveryOtp || '4092'}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Stepper Timeline Tracker */}
                    <div>
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4">
                        Live Order Journey
                      </h4>

                      {order.orderStatus === 'cancelled' ? (
                        <div className="p-3 bg-red-50 text-red-700 rounded-lg text-xs font-bold flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4" />
                          <span>This order was cancelled. Refund will reflect in 2-3 business days.</span>
                        </div>
                      ) : (
                        <div className="overflow-x-auto pb-2">
                          <div className="flex items-center min-w-[580px] justify-between relative">
                            {/* Background Line */}
                            <div className="absolute top-4 left-4 right-4 h-0.5 bg-slate-200 -z-0" />

                            {ORDER_STATUS_STEPS.map((step, idx) => {
                              const isCompleted = idx <= currentStepIdx;
                              const isCurrent = idx === currentStepIdx;

                              return (
                                <div
                                  key={step.status}
                                  className="flex flex-col items-center text-center relative z-10 w-20"
                                >
                                  <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition shadow-xs ${
                                      isCurrent
                                        ? 'bg-[#2874f0] text-white ring-4 ring-blue-100 scale-110'
                                        : isCompleted
                                        ? 'bg-emerald-600 text-white'
                                        : 'bg-white border-2 border-slate-300 text-slate-400'
                                    }`}
                                  >
                                    {isCompleted ? (
                                      isCurrent ? (
                                        step.icon
                                      ) : (
                                        <CheckCircle2 className="w-4 h-4" />
                                      )
                                    ) : (
                                      idx + 1
                                    )}
                                  </div>
                                  <span
                                    className={`text-[10px] mt-1.5 font-bold leading-tight ${
                                      isCurrent
                                        ? 'text-[#2874f0]'
                                        : isCompleted
                                        ? 'text-slate-800'
                                        : 'text-slate-400'
                                    }`}
                                  >
                                    {step.label}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Assigned Delivery Partner Info if assigned */}
                    {order.deliveryPartnerName && (
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-full bg-blue-100 text-blue-700">
                            <Bike className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">
                              Assigned Delivery Partner
                            </span>
                            <span className="font-bold text-slate-800 text-sm">{order.deliveryPartnerName}</span>
                            {order.deliveryPartnerPhone && (
                              <span className="text-slate-500 block">{order.deliveryPartnerPhone}</span>
                            )}
                          </div>
                        </div>
                        {order.deliveryPartnerPhone && (
                          <a
                            href={`tel:${order.deliveryPartnerPhone}`}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold flex items-center gap-1 shadow-xs"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            <span>Call</span>
                          </a>
                        )}
                      </div>
                    )}

                    {/* Order Items */}
                    <div>
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                        Items Purchased
                      </h4>
                      <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                        {order.items.map((it, i) => (
                          <div key={i} className="p-3 flex items-center justify-between gap-3 bg-white">
                            <div className="flex items-center gap-3">
                              <img
                                src={it.image}
                                alt={it.name}
                                className="w-12 h-12 object-contain bg-slate-50 rounded p-1 border border-slate-100"
                              />
                              <div>
                                <h5 className="text-xs font-semibold text-slate-800">{it.name}</h5>
                                <p className="text-[10px] text-slate-400">
                                  Sold by: {it.shopName} • Qty: {it.quantity}
                                </p>
                              </div>
                            </div>
                            <div className="text-right font-black text-xs text-slate-900">
                              ₹{(it.discountPrice * it.quantity).toLocaleString('en-IN')}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Delivery Address & Bill */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                        <div className="flex items-center gap-1.5 font-bold text-slate-800 mb-1">
                          <MapPin className="w-4 h-4 text-red-500" />
                          <span>Delivery Address</span>
                        </div>
                        <p className="text-slate-600 font-semibold">{order.deliveryAddress.fullName}</p>
                        <p className="text-slate-600">{order.deliveryAddress.phoneNumber}</p>
                        <p className="text-slate-500 mt-0.5">
                          {order.deliveryAddress.streetAddress}, {order.deliveryAddress.city},{' '}
                          {order.deliveryAddress.state} - {order.deliveryAddress.postalCode}
                        </p>
                      </div>

                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                        <div className="font-bold text-slate-800 mb-1">Payment Breakdown</div>
                        <div className="flex justify-between text-slate-600">
                          <span>Subtotal</span>
                          <span>₹{order.subtotal.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Delivery Charge</span>
                          <span>₹{order.deliveryCharge}</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Platform Fee</span>
                          <span>₹{order.platformFee}</span>
                        </div>
                        <div className="border-t border-slate-200 pt-1 flex justify-between font-bold text-slate-900">
                          <span>Total Paid</span>
                          <span className="text-blue-700 font-black">₹{order.totalAmount.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
