import React, { useState } from 'react';
import {
  Package,
  Clock,
  CheckCircle,
  Truck,
  MapPin,
  Phone,
  AlertCircle,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { SellerOrder, OrderStatus, Shop } from '../../types';
import { updateSellerOrderStatus } from '../../services/dbService';

interface SellerOrdersProps {
  orders: SellerOrder[];
  shop: Shop;
}

export const SellerOrders: React.FC<SellerOrdersProps> = ({ orders, shop }) => {
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    setUpdatingId(orderId);
    try {
      await updateSellerOrderStatus(orderId, newStatus, {
        shopId: shop.id,
        shopName: shop.shopName,
        shopAddress: shop.shopAddress,
        shopPhone: shop.phoneNumber,
      });
    } catch (e) {
      console.error('Error updating status:', e);
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'delivered':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'ready_for_pickup':
        return 'bg-purple-100 text-purple-800 border-purple-300 animate-pulse';
      case 'packed':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'processing':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'picked_up':
      case 'out_for_delivery':
        return 'bg-indigo-100 text-indigo-800 border-indigo-300';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base sm:text-lg font-black text-slate-900">
          Order Fulfillment Center ({orders.length})
        </h2>
        <p className="text-xs text-slate-500">
          Fulfill incoming customer orders, pack items, and dispatch to delivery fleet
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center shadow-2xs">
          <Package className="w-12 h-12 text-slate-300 mx-auto mb-2" />
          <h3 className="font-bold text-slate-800 text-sm">No Orders to Fulfill Yet</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
            When customers purchase products from your shop, their orders appear here for fulfillment.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-xl border border-slate-200 shadow-2xs p-4 space-y-3 transition"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-slate-900">#{order.id}</span>
                  <span className="text-[10px] text-slate-400">
                    Master Order: #{order.orderId}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${getStatusBadge(
                      order.status
                    )}`}
                  >
                    {order.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="text-xs text-slate-400">
                  {new Date(order.createdAt).toLocaleDateString()} at{' '}
                  {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>

              {/* Items in order */}
              <div className="divide-y divide-slate-100">
                {order.items.map((it, idx) => (
                  <div key={idx} className="py-2 flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <img
                        src={it.image}
                        alt=""
                        className="w-10 h-10 object-contain rounded bg-slate-50 p-1 border border-slate-100 shrink-0"
                      />
                      <div>
                        <h5 className="font-bold text-slate-800">{it.name}</h5>
                        <p className="text-[10px] text-slate-400">
                          Qty: {it.quantity} × ₹{it.discountPrice.toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>
                    <div className="font-bold text-slate-900">
                      ₹{(it.discountPrice * it.quantity).toLocaleString('en-IN')}
                    </div>
                  </div>
                ))}
              </div>

              {/* Customer & Address details */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Deliver To</span>
                  <span className="font-bold text-slate-800">{order.customerName}</span>
                  <p className="text-slate-600 mt-0.5">
                    {order.deliveryAddress.streetAddress}, {order.deliveryAddress.city} -{' '}
                    {order.deliveryAddress.postalCode}
                  </p>
                  <p className="text-slate-500">{order.customerPhone}</p>
                </div>

                <div className="space-y-1 sm:text-right">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Earnings Breakdown</span>
                  <div className="flex justify-between sm:justify-end sm:gap-4 text-slate-600">
                    <span>Gross Sales:</span>
                    <span className="font-semibold">₹{order.sellerSubtotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between sm:justify-end sm:gap-4 text-slate-500">
                    <span>Platform Commission:</span>
                    <span>-₹{order.commissionAmount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between sm:justify-end sm:gap-4 text-emerald-700 font-bold border-t border-slate-200 pt-1">
                    <span>Your Net Earning:</span>
                    <span className="text-sm font-black">₹{order.sellerEarnings.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Workflow Actions */}
              <div className="pt-1 flex flex-wrap items-center justify-between gap-2">
                <div className="text-[11px] text-slate-500 font-medium">
                  {order.status === 'confirmed' && 'Action Required: Accept order to begin packing.'}
                  {order.status === 'processing' && 'Packing in progress. Mark packed when items are boxed.'}
                  {order.status === 'packed' && 'Ready to dispatch. Notify delivery partner fleet.'}
                  {order.status === 'ready_for_pickup' && '🛵 Waiting for delivery partner pickup at your shop.'}
                  {order.status === 'picked_up' && '🚚 Order picked up by rider and in transit.'}
                  {order.status === 'delivered' && '🎉 Order successfully delivered to customer!'}
                </div>

                <div className="flex items-center gap-2">
                  {order.status === 'confirmed' && (
                    <button
                      onClick={() => handleStatusChange(order.id, 'processing')}
                      disabled={updatingId === order.id}
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-2xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <span>Accept & Process</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {order.status === 'processing' && (
                    <button
                      onClick={() => handleStatusChange(order.id, 'packed')}
                      disabled={updatingId === order.id}
                      className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg shadow-2xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <span>Mark Packed 📦</span>
                    </button>
                  )}

                  {order.status === 'packed' && (
                    <button
                      onClick={() => handleStatusChange(order.id, 'ready_for_pickup')}
                      disabled={updatingId === order.id}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-md transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <span>Dispatch (Ready for Pickup) 🛵</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
