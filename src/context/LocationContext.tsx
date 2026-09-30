import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { Product } from '../types';
import { supabase } from '../supabase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

interface LocationContextType {
  buyerPinCode: string;
  setBuyerPinCode: (pin: string) => Promise<void>;
  isPinModalOpen: boolean;
  setIsPinModalOpen: (open: boolean) => void;
  showOnlyLocalProducts: boolean;
  setShowOnlyLocalProducts: (val: boolean) => void;
  isProductAvailableInBuyerArea: (product: Product, checkPin?: string) => boolean;
  isSellerPinMatching: (sellerPin?: string, buyerPin?: string) => boolean;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

const LOCAL_STORAGE_PIN_KEY = 'bazaarx_buyer_pin_code';
const DEFAULT_BUYER_PIN = '794114';

export const LocationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [buyerPinCode, setBuyerPinCodeState] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_PIN_KEY);
      return saved ? saved.trim() : DEFAULT_BUYER_PIN;
    } catch {
      return DEFAULT_BUYER_PIN;
    }
  });

  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [showOnlyLocalProducts, setShowOnlyLocalProducts] = useState(false);

  // Sync with user's saved profile if available
  useEffect(() => {
    if (!user) return;
    const fetchUserPin = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists() && userDoc.data().deliveryPinCode) {
          const userPin = String(userDoc.data().deliveryPinCode).trim();
          setBuyerPinCodeState(userPin);
          localStorage.setItem(LOCAL_STORAGE_PIN_KEY, userPin);
        }
      } catch (err) {
        console.warn('Could not sync user profile PIN code:', err);
      }
    };
    fetchUserPin();
  }, [user]);

  const setBuyerPinCode = async (newPin: string) => {
    const cleanPin = newPin.trim();
    if (!cleanPin) return;

    setBuyerPinCodeState(cleanPin);
    localStorage.setItem(LOCAL_STORAGE_PIN_KEY, cleanPin);

    // Persist to user profile if logged in
    if (user) {
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          deliveryPinCode: cleanPin,
          updatedAt: new Date().toISOString(),
        });
      } catch (e) {
        // Fallback or ignore if offline
      }

      // Also sync to Supabase users table if accessible
      try {
        await supabase
          .from('users')
          .update({ phone_number: user.phoneNumber, updated_at: new Date().toISOString() })
          .eq('uid', user.uid);
      } catch (e) {
        // Ignore Supabase optional error
      }
    }
  };

  const isSellerPinMatching = (sellerPin?: string, customBuyerPin?: string): boolean => {
    const currentBuyerPin = (customBuyerPin || buyerPinCode || '').trim();
    const currentSellerPin = (sellerPin || '').trim();
    if (!currentBuyerPin || !currentSellerPin) return false;
    return currentBuyerPin === currentSellerPin;
  };

  const isProductAvailableInBuyerArea = (product: Product, checkPin?: string): boolean => {
    const effectiveBuyerPin = (checkPin || buyerPinCode || '').trim();
    const effectiveSellerPin = (product.sellerPinCode || product.shopPinCode || '').trim();
    if (!effectiveBuyerPin || !effectiveSellerPin) {
      return false;
    }
    return effectiveBuyerPin === effectiveSellerPin;
  };

  return (
    <LocationContext.Provider
      value={{
        buyerPinCode,
        setBuyerPinCode,
        isPinModalOpen,
        setIsPinModalOpen,
        showOnlyLocalProducts,
        setShowOnlyLocalProducts,
        isProductAvailableInBuyerArea,
        isSellerPinMatching,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

const defaultLocationContext: LocationContextType = {
  buyerPinCode: DEFAULT_BUYER_PIN,
  setBuyerPinCode: async () => {},
  isPinModalOpen: false,
  setIsPinModalOpen: () => {},
  showOnlyLocalProducts: false,
  setShowOnlyLocalProducts: () => {},
  isProductAvailableInBuyerArea: () => true,
  isSellerPinMatching: () => true,
};

export const useLocation = (): LocationContextType => {
  const ctx = useContext(LocationContext);
  if (!ctx) {
    return defaultLocationContext;
  }
  return ctx;
};
