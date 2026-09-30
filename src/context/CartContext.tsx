import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { supabase } from '../supabase';
import { useAuth } from './AuthContext';
import { CartItem, Product, PlatformSettings } from '../types';
import { DEFAULT_SETTINGS } from '../services/dbService';

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  addToCart: (product: Product, quantity?: number, overrideBuyerPin?: string) => { success: boolean; message?: string };
  updateQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  lastCartError: string | null;
  clearCartError: () => void;
  removeIneligibleItems: (buyerPin: string) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [lastCartError, setLastCartError] = useState<string | null>(null);
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings>(DEFAULT_SETTINGS);

  // Load platform settings for local PIN restriction status
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const snap = await getDoc(doc(db, 'settings', 'platform_settings'));
        if (snap.exists()) {
          setPlatformSettings(snap.data() as PlatformSettings);
        }
      } catch (e) {
        // Use default
      }
    };
    fetchSettings();
  }, []);

  // Load cart from Firestore when user changes, or local storage
  useEffect(() => {
    if (!user) {
      const saved = localStorage.getItem('bazaarx_cart');
      if (saved) {
        try {
          setItems(JSON.parse(saved));
        } catch (e) {
          setItems([]);
        }
      }
      return;
    }

    const loadRemoteCart = async () => {
      // 1. Try Supabase cart
      try {
        const { data, error } = await supabase
          .from('cart_items')
          .select('*')
          .eq('user_id', user.uid);
        if (!error && data && data.length > 0) {
          const loadedItems: CartItem[] = data.map((it: any) => ({
            productId: it.product_id,
            shopId: it.shop_id,
            shopName: it.shop_name,
            name: it.name,
            price: Number(it.price) || 0,
            discountPrice: Number(it.discount_price) || Number(it.price) || 0,
            quantity: Number(it.quantity) || 1,
            image: it.image || '',
            stock: Number(it.stock) || 10,
            sellerPinCode: it.seller_pin_code || undefined,
          }));
          setItems(loadedItems);
          return;
        }
      } catch (err) {
        // Fallback
      }

      // 2. Fallback to Firestore
      try {
        const cartRef = doc(db, 'cart', user.uid);
        const snap = await getDoc(cartRef);
        if (snap.exists() && snap.data().items) {
          setItems(snap.data().items as CartItem[]);
        }
      } catch (e) {
        console.warn('Error loading remote cart:', e);
      }
    };
    loadRemoteCart();
  }, [user?.uid]);

  // Sync cart changes to Supabase and Firestore
  const persistCart = async (newItems: CartItem[]) => {
    setItems(newItems);
    localStorage.setItem('bazaarx_cart', JSON.stringify(newItems));
    if (user) {
      // 1. Supabase persist
      try {
        const cartId = `cart_${user.uid}`;
        await supabase.from('cart').upsert({ id: cartId, user_id: user.uid, updated_at: new Date().toISOString() });
        await supabase.from('cart_items').delete().eq('user_id', user.uid);
        if (newItems.length > 0) {
          const rows = newItems.map((it, idx) => ({
            id: `ci_${cartId}_${it.productId}_${idx}`,
            cart_id: cartId,
            user_id: user.uid,
            product_id: it.productId,
            shop_id: it.shopId,
            shop_name: it.shopName,
            name: it.name,
            price: it.price,
            discount_price: it.discountPrice,
            quantity: it.quantity,
            image: it.image,
            stock: it.stock,
            seller_pin_code: it.sellerPinCode || null,
          }));
          await supabase.from('cart_items').insert(rows);
        }
      } catch (e) {
        console.warn('Supabase cart persist notice:', e);
      }

      // 2. Firestore mirror
      try {
        const cartRef = doc(db, 'cart', user.uid);
        await setDoc(cartRef, { userId: user.uid, items: newItems, updatedAt: new Date().toISOString() });
      } catch (e) {
        console.warn('Error persisting cart:', e);
      }
    }
  };

  const addToCart = (product: Product, quantity = 1, overrideBuyerPin?: string): { success: boolean; message?: string } => {
    // 1. Mandatory Cart Validation: buyer_pin_code == seller_pin_code
    if (platformSettings.localPinCodeRestriction) {
      const activeBuyerPin = (
        overrideBuyerPin ||
        localStorage.getItem('bazaarx_buyer_pin_code') ||
        '123456'
      ).trim();

      const sellerPin = (product.sellerPinCode || product.shopPinCode || '').trim();

      if (sellerPin && sellerPin !== activeBuyerPin) {
        const errMsg = 'Sorry, this product is currently available only in your local area.';
        setLastCartError(errMsg);
        return { success: false, message: errMsg };
      }
    }

    setLastCartError(null);
    const existingIndex = items.findIndex((it) => it.productId === product.id);
    let updated: CartItem[];

    const effectiveSellerPin = (product.sellerPinCode || product.shopPinCode || '').trim();

    if (existingIndex > -1) {
      const newQty = Math.min(items[existingIndex].quantity + quantity, product.stock);
      updated = [...items];
      updated[existingIndex] = {
        ...updated[existingIndex],
        quantity: newQty,
        sellerPinCode: effectiveSellerPin || updated[existingIndex].sellerPinCode,
      };
    } else {
      const newItem: CartItem = {
        productId: product.id,
        shopId: product.shopId,
        shopName: product.shopName,
        name: product.name,
        price: product.price,
        discountPrice: product.discountPrice || product.price,
        quantity: Math.min(quantity, product.stock),
        image: product.images[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=80',
        stock: product.stock,
        sellerPinCode: effectiveSellerPin,
      };
      updated = [...items, newItem];
    }
    persistCart(updated);
    return { success: true };
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    const updated = items.map((it) => {
      if (it.productId === productId) {
        return { ...it, quantity: Math.min(quantity, it.stock) };
      }
      return it;
    });
    persistCart(updated);
  };

  const removeFromCart = (productId: string) => {
    const updated = items.filter((it) => it.productId !== productId);
    persistCart(updated);
  };

  const clearCart = () => {
    persistCart([]);
  };

  const removeIneligibleItems = (buyerPin: string) => {
    const cleanPin = (buyerPin || '').trim();
    if (!cleanPin) return;
    const updated = items.filter((it) => !it.sellerPinCode || it.sellerPinCode === cleanPin);
    persistCart(updated);
  };

  const clearCartError = () => {
    setLastCartError(null);
  };

  const itemCount = items.reduce((sum, it) => sum + it.quantity, 0);
  const subtotal = items.reduce((sum, it) => sum + it.discountPrice * it.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        subtotal,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        lastCartError,
        clearCartError,
        removeIneligibleItems,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
