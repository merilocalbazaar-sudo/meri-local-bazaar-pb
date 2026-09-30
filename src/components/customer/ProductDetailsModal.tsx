import React, { useState } from 'react';
import { X, Star, ShoppingCart, Zap, Check, ShieldCheck, Truck, RotateCcw, Award } from 'lucide-react';
import { Product } from '../../types';
import { useCart } from '../../context/CartContext';

interface ProductDetailsModalProps {
  product: Product | null;
  onClose: () => void;
  onBuyNow: (product: Product) => void;
}

export const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({
  product,
  onClose,
  onBuyNow,
}) => {
  const { addToCart, items } = useCart();
  const [selectedImgIndex, setSelectedImgIndex] = useState(0);

  if (!product) return null;

  const inCart = items.some((it) => it.productId === product.id);
  const discountPercent = product.price > product.discountPrice
    ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
    : 0;

  const images = product.images.length > 0 ? product.images : [
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80',
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="relative w-full max-w-3xl bg-white rounded-xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95">
        {/* Header with close button */}
        <div className="px-4 py-3 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
              {product.category}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Sold by <strong className="text-slate-700">{product.shopName}</strong>
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-slate-200 text-slate-600 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left: Images */}
          <div className="flex flex-col items-center">
            <div className="w-full h-64 sm:h-80 bg-slate-50 rounded-lg p-4 flex items-center justify-center border border-slate-200">
              <img
                src={images[selectedImgIndex]}
                alt={product.name}
                className="max-h-full max-w-full object-contain"
              />
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex items-center gap-2 mt-3 overflow-x-auto w-full py-1">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImgIndex(idx)}
                    className={`w-14 h-14 rounded border-2 p-1 bg-white shrink-0 cursor-pointer transition ${
                      selectedImgIndex === idx ? 'border-[#2874f0]' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-contain" />
                  </button>
                ))}
              </div>
            )}

            {/* Assured tags */}
            <div className="grid grid-cols-3 gap-2 w-full mt-4 text-center text-[11px] text-slate-600">
              <div className="p-2 rounded bg-slate-50 border border-slate-100 flex flex-col items-center">
                <Truck className="w-4 h-4 text-blue-600 mb-1" />
                <span className="font-semibold">Fast Delivery</span>
              </div>
              <div className="p-2 rounded bg-slate-50 border border-slate-100 flex flex-col items-center">
                <ShieldCheck className="w-4 h-4 text-emerald-600 mb-1" />
                <span className="font-semibold">100% Genuine</span>
              </div>
              <div className="p-2 rounded bg-slate-50 border border-slate-100 flex flex-col items-center">
                <RotateCcw className="w-4 h-4 text-amber-600 mb-1" />
                <span className="font-semibold">Easy Returns</span>
              </div>
            </div>
          </div>

          {/* Right: Details */}
          <div className="flex flex-col justify-between">
            <div>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                {product.name}
              </h1>

              {/* Rating */}
              <div className="flex items-center gap-2 mt-2">
                <span className="inline-flex items-center gap-1 bg-emerald-700 text-white text-xs font-bold px-2 py-0.5 rounded">
                  <span>{product.rating || 4.7}</span>
                  <Star className="w-3 h-3 fill-current" />
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  {product.reviewCount || 342} Ratings & Reviews
                </span>
                <span className="text-xs font-bold text-blue-600">
                  Super Delivery Verified ⭐
                </span>
              </div>

              {/* Price */}
              <div className="mt-4 p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                <div className="flex items-baseline gap-2.5">
                  <span className="text-2xl font-black text-slate-900">
                    ₹{product.discountPrice.toLocaleString('en-IN')}
                  </span>
                  {product.price > product.discountPrice && (
                    <>
                      <span className="text-sm text-slate-400 line-through">
                        ₹{product.price.toLocaleString('en-IN')}
                      </span>
                      <span className="text-sm font-bold text-emerald-600">
                        {discountPercent}% OFF
                      </span>
                    </>
                  )}
                </div>
                {product.price > product.discountPrice && (
                  <div className="text-xs font-semibold text-emerald-700 mt-1">
                    You save ₹{(product.price - product.discountPrice).toLocaleString('en-IN')} on this order
                  </div>
                )}
              </div>

              {/* Stock status */}
              <div className="mt-3 flex items-center gap-2">
                {product.stock > 0 ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    <Check className="w-3.5 h-3.5" />
                    In Stock ({product.stock} units available)
                  </span>
                ) : (
                  <span className="text-xs font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-full border border-red-200">
                    Currently Out of Stock
                  </span>
                )}
                {product.sku && (
                  <span className="text-[11px] text-slate-400">SKU: {product.sku}</span>
                )}
              </div>

              {/* Description */}
              <div className="mt-4">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                  Description
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {product.description}
                </p>
              </div>

              {/* Specifications */}
              {product.specifications && Object.keys(product.specifications).length > 0 && (
                <div className="mt-4">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                    Specifications
                  </h4>
                  <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
                    {Object.entries(product.specifications).map(([key, val], idx) => (
                      <div
                        key={key}
                        className={`flex py-1.5 px-3 ${
                          idx % 2 === 0 ? 'bg-slate-50' : 'bg-white'
                        }`}
                      >
                        <span className="w-1/3 text-slate-500 font-medium">{key}</span>
                        <span className="w-2/3 text-slate-800 font-semibold">{val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal bottom actions */}
        <div className="p-3.5 bg-white border-t border-slate-200 flex items-center gap-3 pb-[max(0.875rem,env(safe-area-inset-bottom))]">
          <button
            onClick={() => {
              addToCart(product, 1);
            }}
            disabled={product.stock === 0}
            className={`flex-1 min-h-[46px] py-3 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer touch-manipulation active:scale-95 ${
              inCart
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : 'bg-yellow-400 hover:bg-yellow-500 text-slate-900 shadow-xs'
            } disabled:opacity-50`}
          >
            {inCart ? (
              <>
                <Check className="w-4 h-4" />
                <span>Added to Cart</span>
              </>
            ) : (
              <>
                <ShoppingCart className="w-4 h-4" />
                <span>Add to Cart</span>
              </>
            )}
          </button>

          <button
            onClick={() => {
              onBuyNow(product);
            }}
            disabled={product.stock === 0}
            className="flex-1 min-h-[46px] py-3 px-3 bg-[#fb641b] hover:bg-[#e85b17] text-white rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition shadow-md cursor-pointer touch-manipulation active:scale-95 disabled:opacity-50"
          >
            <Zap className="w-4 h-4 fill-current" />
            <span>Buy Now</span>
          </button>
        </div>
      </div>
    </div>
  );
};
