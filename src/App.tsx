import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider, useCart } from './context/CartContext';
import { LocationProvider } from './context/LocationContext';
import { Navbar } from './components/common/Navbar';
import { BottomNav } from './components/common/BottomNav';
import { NotificationDrawer } from './components/common/NotificationDrawer';
import { PushNotificationBanner } from './components/common/PushNotificationBanner';
import { PinCodeModal } from './components/common/PinCodeModal';
import { AuthModal } from './components/auth/AuthModal';
import { CustomerHome } from './components/customer/CustomerHome';
import { ProductDetailsModal } from './components/customer/ProductDetailsModal';
import { CartDrawer } from './components/customer/CartDrawer';
import { CheckoutModal } from './components/customer/CheckoutModal';
import { CustomerOrders } from './components/customer/CustomerOrders';
import { CustomerProfile } from './components/customer/CustomerProfile';
import { SellerDashboard } from './components/seller/SellerDashboard';
import { SellerRegistrationModal } from './components/seller/SellerRegistrationModal';
import { DeliveryDashboard } from './components/delivery/DeliveryDashboard';
import { DeliveryRegistrationModal } from './components/delivery/DeliveryRegistrationModal';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { PartnerHubLogin } from './components/admin/PartnerHubLogin';
import {
  Product,
  Category,
  Order,
  AppNotification,
  PlatformSettings,
  UserRole,
} from './types';
import {
  DEFAULT_SETTINGS,
  listenToProducts,
  listenToCategories,
  listenToSettings,
  listenToNotifications,
  listenToCustomerOrders,
  seedMarketplaceIfEmpty,
  clearMarketplaceDemoData,
} from './services/dbService';

function MarketplaceMain() {
  const { user, role, switchRole } = useAuth();
  const { clearCart } = useCart();

  // Firestore Real-Time State
  const [products, setProducts] = useState<Product[]>([]);
  const [isProductsLoading, setIsProductsLoading] = useState<boolean>(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [settings, setSettings] = useState<PlatformSettings>(DEFAULT_SETTINGS);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);

  // Navigation State
  const [activeTab, setActiveTab] = useState<string>('home');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Modals
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
  const [isSellerRegOpen, setIsSellerRegOpen] = useState<boolean>(false);
  const [isDeliveryRegOpen, setIsDeliveryRegOpen] = useState<boolean>(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [singleBuyProduct, setSingleBuyProduct] = useState<Product | null>(null);

  // Partner Hub Secure Authorization State (Never assume authenticated from client storage)
  const [isPartnerHubAuthenticated, setIsPartnerHubAuthenticated] = useState<boolean>(false);
  const [partnerHubAdmin, setPartnerHubAdmin] = useState<any>(null);
  const [isVerifyingSession, setIsVerifyingSession] = useState<boolean>(false);

  // Verify Partner Hub session with server
  useEffect(() => {
    if (role === 'admin') {
      const token = sessionStorage.getItem('partner_hub_token');
      if (!token) {
        setIsPartnerHubAuthenticated(false);
        setPartnerHubAdmin(null);
        return;
      }
      setIsVerifyingSession(true);
      fetch('/api/partner-hub/verify', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.authenticated && data.user?.role === 'admin' && data.user?.username === 'Gamjinmarak') {
            setIsPartnerHubAuthenticated(true);
            setPartnerHubAdmin(data.user);
          } else {
            sessionStorage.removeItem('partner_hub_token');
            sessionStorage.removeItem('partner_hub_admin');
            setIsPartnerHubAuthenticated(false);
            setPartnerHubAdmin(null);
          }
        })
        .catch(() => {
          sessionStorage.removeItem('partner_hub_token');
          sessionStorage.removeItem('partner_hub_admin');
          setIsPartnerHubAuthenticated(false);
          setPartnerHubAdmin(null);
        })
        .finally(() => {
          setIsVerifyingSession(false);
        });
    } else {
      setIsPartnerHubAuthenticated(false);
    }
  }, [role]);

  const handlePartnerHubLoginSuccess = (sessionData: any) => {
    setIsPartnerHubAuthenticated(true);
    setPartnerHubAdmin(sessionData.user);
    setActiveTab('dashboard');
  };

  const handlePartnerHubLogout = async () => {
    const token = sessionStorage.getItem('partner_hub_token');
    if (token) {
      fetch('/api/partner-hub/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
    sessionStorage.removeItem('partner_hub_token');
    sessionStorage.removeItem('partner_hub_admin');
    setIsPartnerHubAuthenticated(false);
    switchRole('customer');
    setActiveTab('home');
  };

  // Clear demo data on mount and keep catalog clean for real sellers
  useEffect(() => {
    seedMarketplaceIfEmpty();
    clearMarketplaceDemoData();
  }, []);

  // Listen to Products, Categories, Settings
  useEffect(() => {
    const unsubProducts = listenToProducts((list) => {
      setProducts(list);
      setIsProductsLoading(false);
    });
    const unsubCategories = listenToCategories((list) => setCategories(list));
    const unsubSettings = listenToSettings((s) => setSettings(s));

    return () => {
      unsubProducts();
      unsubCategories();
      unsubSettings();
    };
  }, []);

  // Listen to Notifications
  useEffect(() => {
    const unsubNotifs = listenToNotifications(user?.uid || '', role, (notifs) => {
      setNotifications(notifs);
    });
    return () => unsubNotifs();
  }, [user?.uid, role]);

  // Listen to Customer Orders
  useEffect(() => {
    if (!user) {
      setCustomerOrders([]);
      return;
    }
    const unsubOrders = listenToCustomerOrders(user.uid, (orders) => {
      setCustomerOrders(orders);
    });
    return () => unsubOrders();
  }, [user?.uid]);

  // Handle role tab synchronization
  useEffect(() => {
    if (role === 'customer') {
      setActiveTab('home');
    } else if (role === 'seller') {
      setActiveTab('dashboard');
    } else if (role === 'delivery_partner') {
      setActiveTab('home');
    } else if (role === 'admin') {
      setActiveTab('dashboard');
    }
  }, [role]);

  const unreadNotifsCount = notifications.filter((n) => !n.isRead).length;

  const handleBuyNow = (product: Product) => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    setSingleBuyProduct(product);
    setIsCheckoutOpen(true);
  };

  const handleProceedCheckoutFromCart = () => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    setSingleBuyProduct(null);
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  const handleOrderPlaced = (order: Order) => {
    setActiveTab('orders');
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#f1f3f6] text-slate-900 flex flex-col font-sans antialiased">
      {/* Top Navbar */}
      <Navbar
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenCart={() => setIsCartOpen(true)}
        unreadNotifsCount={unreadNotifsCount}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
      />

      {/* Push Notification & Sound Banner + Real-time Alert Toasts */}
      <PushNotificationBanner
        role={role}
        onNavigateToTab={(tab) => {
          if (role === 'seller') {
            setActiveTab('orders');
          } else if (role === 'delivery_partner') {
            setActiveTab('deliveries');
          } else {
            setActiveTab(tab);
          }
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-2 sm:p-4">
        {/* ================= 1. CUSTOMER ROLE ================= */}
        {role === 'customer' && (
          <div>
            {activeTab === 'home' && (
              <CustomerHome
                products={products}
                categories={categories}
                searchQuery={searchQuery}
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
                onSelectProduct={(p) => setSelectedProduct(p)}
                onBuyNow={handleBuyNow}
                loading={isProductsLoading}
              />
            )}

            {activeTab === 'categories' && (
              <div className="space-y-4 max-w-5xl mx-auto py-3">
                <h1 className="text-lg font-black text-slate-900">Explore All Categories</h1>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {categories.map((cat) => (
                    <div
                      key={cat.id}
                      onClick={() => {
                        setSelectedCategory(cat.name);
                        setActiveTab('home');
                      }}
                      className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-[#2874f0] cursor-pointer transition text-center space-y-2 group"
                    >
                      <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center text-3xl mx-auto group-hover:scale-110 transition">
                        📦
                      </div>
                      <h3 className="font-bold text-slate-800 text-sm group-hover:text-[#2874f0]">
                        {cat.name}
                      </h3>
                      <p className="text-[11px] text-slate-400">{cat.description || 'Browse items'}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'cart' && (
              <div className="max-w-2xl mx-auto py-4">
                <CartDrawer
                  isOpen={true}
                  onClose={() => setActiveTab('home')}
                  onCheckout={handleProceedCheckoutFromCart}
                  settings={settings}
                />
              </div>
            )}

            {activeTab === 'orders' && (
              <CustomerOrders
                orders={customerOrders}
                onRefresh={() => {}}
              />
            )}

            {activeTab === 'profile' && (
              <CustomerProfile
                onOpenSellerRegistration={() => setIsSellerRegOpen(true)}
                onOpenDeliveryRegistration={() => setIsDeliveryRegOpen(true)}
              />
            )}
          </div>
        )}

        {/* ================= 2. SELLER ROLE ================= */}
        {role === 'seller' && (
          <SellerDashboard
            onOpenRegistration={() => setIsSellerRegOpen(true)}
            settings={settings}
            activeSubTab={activeTab}
            onSelectSubTab={setActiveTab}
          />
        )}

        {/* ================= 3. DELIVERY PARTNER ROLE ================= */}
        {role === 'delivery_partner' && (
          <DeliveryDashboard
            onOpenRegistration={() => setIsDeliveryRegOpen(true)}
            settings={settings}
            activeSubTab={activeTab}
            onSelectSubTab={setActiveTab}
          />
        )}

        {/* ================= 4. PARTNER HUB (ADMIN ROLE) ================= */}
        {role === 'admin' && (
          isVerifyingSession ? (
            <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-500 font-medium">Verifying Partner Hub Authorization...</p>
            </div>
          ) : isPartnerHubAuthenticated ? (
            <AdminDashboard
              settings={settings}
              activeSubTab={activeTab}
              onSelectSubTab={setActiveTab}
              onLogout={handlePartnerHubLogout}
              adminUser={partnerHubAdmin}
            />
          ) : (
            <PartnerHubLogin
              onLoginSuccess={handlePartnerHubLoginSuccess}
              onCancel={() => {
                switchRole('customer');
                setActiveTab('home');
              }}
            />
          )
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNav activeTab={activeTab} onSelectTab={setActiveTab} />

      {/* Global Modals & Drawers */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        defaultRole={role}
      />

      <NotificationDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
      />

      {role === 'customer' && (
        <CartDrawer
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          onCheckout={handleProceedCheckoutFromCart}
          settings={settings}
        />
      )}

      <ProductDetailsModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onBuyNow={(p) => {
          setSelectedProduct(null);
          handleBuyNow(p);
        }}
      />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => {
          setIsCheckoutOpen(false);
          setSingleBuyProduct(null);
        }}
        onOrderSuccess={handleOrderPlaced}
        settings={settings}
        singleBuyItem={singleBuyProduct}
      />

      <SellerRegistrationModal
        isOpen={isSellerRegOpen}
        onClose={() => setIsSellerRegOpen(false)}
        onRegistered={() => {
          switchRole('seller');
          setActiveTab('dashboard');
        }}
      />

      <DeliveryRegistrationModal
        isOpen={isDeliveryRegOpen}
        onClose={() => setIsDeliveryRegOpen(false)}
        onRegistered={() => {
          switchRole('delivery_partner');
          setActiveTab('home');
        }}
      />

      <PinCodeModal />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <LocationProvider>
        <CartProvider>
          <MarketplaceMain />
        </CartProvider>
      </LocationProvider>
    </AuthProvider>
  );
}
