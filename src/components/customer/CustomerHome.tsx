import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Zap,
  TrendingUp,
  Tag,
  Clock,
  ChevronRight,
  ShieldCheck,
  Flame,
  Award,
  Filter,
} from 'lucide-react';
import { Product, Category } from '../../types';
import { ProductCard } from './ProductCard';
import { ProductCardSkeleton } from '../common/SkeletonLoader';

interface CustomerHomeProps {
  products: Product[];
  categories: Category[];
  searchQuery: string;
  selectedCategory: string | null;
  onSelectCategory: (catName: string | null) => void;
  onSelectProduct: (product: Product) => void;
  onBuyNow: (product: Product) => void;
  loading?: boolean;
}

export const CustomerHome: React.FC<CustomerHomeProps> = ({
  products,
  categories,
  searchQuery,
  selectedCategory,
  onSelectCategory,
  onSelectProduct,
  onBuyNow,
  loading = false,
}) => {
  // Hero Carousel banners
  const banners = [
    {
      id: 1,
      title: 'Mega Electronics Festival',
      subtitle: 'Up to 70% OFF on Flagship Smartphones & Audio',
      bgGradient: 'from-blue-700 via-indigo-800 to-blue-900',
      tag: '🔥 MEGA SAVINGS',
      image: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 2,
      title: 'Smart Home & Kitchen Appliances',
      subtitle: 'Airfryers, Blenders, Microwaves & More at Best Prices',
      bgGradient: 'from-emerald-700 via-teal-800 to-slate-900',
      tag: '⭐ BEST DEALS',
      image: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 3,
      title: 'Premium Smartwatches & Audio',
      subtitle: 'Noise Cancelling, Titanium GPS & AMOLED Displays',
      bgGradient: 'from-purple-800 via-slate-900 to-indigo-950',
      tag: '⚡ FLASH SALE',
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80',
    },
  ];

  const [activeBanner, setActiveBanner] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveBanner((prev) => (prev + 1) % banners.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [banners.length]);

  // Deduplicate products by id to prevent duplicate keys or rendering loops
  const uniqueProducts = Array.from(new Map(products.map((p) => [p.id, p])).values());

  // Filter products by search, category, and active status
  const filteredProducts = uniqueProducts.filter((p) => {
    if (!p.isActive) return false;
    const matchesSearch =
      !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.shopName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      !selectedCategory || p.category.toLowerCase() === selectedCategory.toLowerCase();

    return matchesSearch && matchesCategory;
  });

  // Unique Deals of the day: select active products with highest discounts or first items (max 4)
  const dealsOfTheDay = filteredProducts
    .filter((p) => p.price > p.discountPrice || filteredProducts.length <= 4)
    .slice(0, 4);

  // Trending & Popular products: when not searching/filtering, show remaining unique products or all unique products if small catalog
  const dealsIds = new Set(dealsOfTheDay.map((d) => d.id));
  const trendingProducts = !searchQuery && !selectedCategory && filteredProducts.length > dealsOfTheDay.length
    ? filteredProducts.filter((p) => !dealsIds.has(p.id))
    : filteredProducts;

  return (
    <div className="space-y-4 pb-12">
      {/* Category Horizontal Navigation Circles */}
      <div className="bg-white py-3 px-2 sm:px-4 shadow-2xs border-b border-slate-200 overflow-x-auto scrollbar-none">
        <div className="flex items-center justify-start sm:justify-center gap-4 sm:gap-8 min-w-max px-2">
          <button
            onClick={() => onSelectCategory(null)}
            className={`flex flex-col items-center gap-1 group cursor-pointer transition ${
              selectedCategory === null ? 'text-[#2874f0]' : 'text-slate-600 hover:text-[#2874f0]'
            }`}
          >
            <div
              className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-xl sm:text-2xl transition shadow-2xs ${
                selectedCategory === null
                  ? 'bg-blue-100 ring-2 ring-[#2874f0]'
                  : 'bg-slate-100 group-hover:bg-blue-50'
              }`}
            >
              🛍️
            </div>
            <span className="text-[11px] font-bold tracking-tight">All Stores</span>
          </button>

          {categories.map((cat) => {
            const isSelected = selectedCategory?.toLowerCase() === cat.name.toLowerCase();
            const emojiMap: Record<string, string> = {
              Electronics: '🎧',
              Mobiles: '📱',
              Fashion: '👕',
              'Home & Kitchen': '🍳',
              Grocery: '🥑',
              'Beauty & Health': '✨',
            };
            const emoji = emojiMap[cat.name] || '📦';

            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.name)}
                className={`flex flex-col items-center gap-1 group cursor-pointer transition ${
                  isSelected ? 'text-[#2874f0]' : 'text-slate-600 hover:text-[#2874f0]'
                }`}
              >
                <div
                  className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-xl sm:text-2xl transition shadow-2xs ${
                    isSelected
                      ? 'bg-blue-100 ring-2 ring-[#2874f0]'
                      : 'bg-slate-100 group-hover:bg-blue-50'
                  }`}
                >
                  {emoji}
                </div>
                <span className="text-[11px] font-semibold tracking-tight whitespace-nowrap">
                  {cat.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Promotional Banner Carousel */}
      {!searchQuery && !selectedCategory && (
        <div className="max-w-7xl mx-auto px-2 sm:px-4">
          <div className="relative rounded-2xl overflow-hidden shadow-lg h-44 sm:h-64 bg-slate-900">
            {banners.map((b, idx) => (
              <div
                key={b.id}
                className={`absolute inset-0 bg-linear-to-r ${b.bgGradient} text-white p-4 sm:p-8 flex items-center justify-between transition-opacity duration-700 ${
                  activeBanner === idx ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                }`}
              >
                <div className="max-w-xs sm:max-w-md space-y-1.5 sm:space-y-3">
                  <span className="inline-block bg-yellow-400 text-blue-950 font-black text-[10px] sm:text-xs px-2 sm:px-2.5 py-0.5 rounded-full tracking-wider shadow">
                    {b.tag}
                  </span>
                  <h2 className="text-base sm:text-2xl md:text-3xl font-black leading-tight">
                    {b.title}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-200 line-clamp-2">
                    {b.subtitle}
                  </p>
                  <button
                    onClick={() => onSelectCategory('Electronics')}
                    className="mt-1 sm:mt-2 px-3.5 sm:px-5 py-1.5 sm:py-2 bg-white text-blue-900 font-extrabold text-xs sm:text-sm rounded shadow hover:bg-yellow-300 transition inline-flex items-center gap-1"
                  >
                    <span>Shop Offers</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="w-36 sm:w-56 h-36 sm:h-52 shrink-0 flex items-center justify-center pr-2 sm:pr-6">
                  <img
                    src={b.image}
                    alt={b.title}
                    className="max-h-full max-w-full object-contain drop-shadow-2xl rounded-lg"
                  />
                </div>
              </div>
            ))}

            {/* Carousel Dots */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
              {banners.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveBanner(i)}
                  className={`h-1.5 rounded-full transition-all ${
                    activeBanner === i ? 'w-5 bg-yellow-400' : 'w-1.5 bg-white/50'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Feature Highlights Ribbon */}
      <div className="max-w-7xl mx-auto px-2 sm:px-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-800 text-xs font-semibold bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-full bg-blue-100 text-blue-700">⭐</span>
            <span>Super Delivery</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-full bg-emerald-100 text-emerald-700">🛵</span>
            <span>Live Express Delivery</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-full bg-amber-100 text-amber-700">🔒</span>
            <span>OTP Order Verification</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-full bg-purple-100 text-purple-700">🏪</span>
            <span>Verified Local Sellers</span>
          </div>
        </div>
      </div>

      {/* Deals of the Day (Countdown Timer) */}
      {!searchQuery && !selectedCategory && dealsOfTheDay.length > 0 && (
        <div className="max-w-7xl mx-auto px-2 sm:px-4">
          <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded bg-red-500 text-white">
                  <Flame className="w-4 h-4 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                    Deals of the Day
                  </h3>
                  <div className="text-[10px] text-slate-500 flex items-center gap-1 font-medium">
                    <Clock className="w-3 h-3 text-red-500" />
                    <span>Ends in 06h 42m 18s</span>
                  </div>
                </div>
              </div>
              <span className="text-xs font-bold text-[#2874f0] hover:underline cursor-pointer">
                View All
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {dealsOfTheDay.map((prod) => (
                <ProductCard
                  key={prod.id}
                  product={prod}
                  onSelect={onSelectProduct}
                  onBuyNow={onBuyNow}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Products Grid / Search Results */}
      <div className="max-w-7xl mx-auto px-2 sm:px-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900">
              {selectedCategory ? `${selectedCategory} Products` : searchQuery ? `Results for "${searchQuery}"` : 'Trending & Popular Products'}
            </h2>
            <p className="text-xs text-slate-500">
              Showing {trendingProducts.length} verified products available for fast delivery
            </p>
          </div>

          {(selectedCategory || searchQuery) && (
            <button
              onClick={() => {
                onSelectCategory(null);
              }}
              className="text-xs font-bold text-[#2874f0] hover:underline cursor-pointer"
            >
              Clear Filter
            </button>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <ProductCardSkeleton key={n} />
            ))}
          </div>
        ) : trendingProducts.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center border border-slate-200">
            <p className="text-base font-bold text-slate-700">No products found</p>
            <p className="text-xs text-slate-400 mt-1">
              Try searching with another keyword or browsing all categories.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {trendingProducts.map((prod) => (
              <ProductCard
                key={prod.id}
                product={prod}
                onSelect={onSelectProduct}
                onBuyNow={onBuyNow}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
