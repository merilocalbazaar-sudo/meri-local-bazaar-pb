import React from 'react';
import { Star, ShoppingCart, Zap, Check } from 'lucide-react';
import { Product } from '../../types';
import { useCart } from '../../context/CartContext';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
  onBuyNow?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onSelect, onBuyNow }) => {
  const { addToCart, items } = useCart();
  const inCart = items.some((it) => it.productId === product.id);

  const discountPercent = product.price > product.discountPrice
    ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
    : 0;

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-2xs hover:shadow-md transition duration-200 flex flex-col justify-between group">
      {/* Image container */}
      <div
        onClick={() => onSelect(product)}
        className="relative h-44 sm:h-52 bg-slate-50 flex items-center justify-center p-3 cursor-pointer overflow-hidden"
      >
        <img
          src={(product.images && product.images[0]) || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=80'}
          alt={product.name}
          className="max-h-full max-w-full object-contain group-hover:scale-105 transition duration-300"
          loading="lazy"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.onerror = null;
            target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=80';
          }}
        />

        {discountPercent > 0 && (
          <span className="absolute top-2 left-2 bg-emerald-600 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded shadow-xs">
            {discountPercent}% OFF
          </span>
        )}

        {product.stock <= 5 && product.stock > 0 && (
          <span className="absolute bottom-2 left-2 bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-xs">
            Only {product.stock} left!
          </span>
        )}

        {product.stock === 0 && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* Details container */}
      <div className="p-3 flex-1 flex flex-col justify-between">
        <div>
          {/* Shop name pill */}
          <div className="text-[10px] text-slate-500 font-medium truncate flex items-center gap-1 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            <span>{product.shopName}</span>
          </div>

          {/* Title */}
          <h3
            onClick={() => onSelect(product)}
            className="text-xs sm:text-sm font-semibold text-slate-900 line-clamp-2 hover:text-[#2874f0] cursor-pointer"
            title={product.name}
          >
            {product.name}
          </h3>

          {/* Rating */}
          <div className="flex items-center gap-1.5 mt-1.5">
            <span className="inline-flex items-center gap-0.5 bg-emerald-700 text-white text-[11px] font-bold px-1.5 py-0.2 rounded">
              <span>{product.rating || 4.5}</span>
              <Star className="w-2.5 h-2.5 fill-current" />
            </span>
            <span className="text-[10px] text-slate-400">
              ({product.reviewCount || 120})
            </span>
            <span className="text-[10px] font-semibold text-blue-600">
              Super Delivery Verified ⭐
            </span>
          </div>

          {/* Price Row */}
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-sm sm:text-base font-extrabold text-slate-900">
              ₹{product.discountPrice.toLocaleString('en-IN')}
            </span>
            {product.price > product.discountPrice && (
              <span className="text-xs text-slate-400 line-through">
                ₹{product.price.toLocaleString('en-IN')}
              </span>
            )}
          </div>

          <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">
            Free Delivery
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-3 pt-2 border-t border-slate-100 flex items-center gap-2">
          <button
            onClick={() => addToCart(product, 1)}
            disabled={product.stock === 0}
            className={`flex-1 min-h-[38px] py-2 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer touch-manipulation ${
              inCart
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                : 'bg-yellow-400 hover:bg-yellow-500 text-slate-900 shadow-2xs'
            } disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            {inCart ? (
              <>
                <Check className="w-4 h-4" />
                <span>Added</span>
              </>
            ) : (
              <>
                <ShoppingCart className="w-4 h-4" />
                <span>Add</span>
              </>
            )}
          </button>

          {onBuyNow && (
            <button
              onClick={() => onBuyNow(product)}
              disabled={product.stock === 0}
              className="flex-1 min-h-[38px] py-2 px-2.5 bg-[#fb641b] hover:bg-[#e85b17] text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer shadow-2xs touch-manipulation disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>Buy</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
