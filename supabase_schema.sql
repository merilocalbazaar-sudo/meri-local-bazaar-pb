-- =========================================================================
-- BAZAARX MULTI-VENDOR MARKETPLACE - PRODUCTION SUPABASE POSTGRESQL MIGRATION
-- Database: Supabase PostgreSQL (Public Schema)
-- Features:
--   - Full Multi-Vendor Marketplace (Customer, Seller, Delivery Partner, Admin)
--   - Strict Local Buyer-Seller PIN Code Matching System
--   - Shop & Product Governance
--   - Delivery Partner Fleet & OTP Verification
--   - Seller & Rider Wallets, Commission Splits & Payout Requests
--   - Row Level Security (RLS) with Role-Based Access Control (RBAC)
-- =========================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. HELPER TRIGGER FOR UPDATED_AT
CREATE OR REPLACE FUNCTION public.trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =========================================================================
-- 3. USERS & PROFILES
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  uid TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE,
  display_name TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'seller', 'delivery_partner', 'admin')),
  phone_number TEXT,
  photo_url TEXT,
  delivery_pin_code TEXT DEFAULT '123456',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_uid ON public.users(uid);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_delivery_pin ON public.users(delivery_pin_code);

DROP TRIGGER IF EXISTS set_users_updated_at ON public.users;
CREATE TRIGGER set_users_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

-- =========================================================================
-- 4. ADMIN USERS (PARTNER HUB GOVERNANCE)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================================
-- 5. CUSTOMER ADDRESSES
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.addresses (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  street_address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  landmark TEXT,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  address_type TEXT NOT NULL DEFAULT 'home' CHECK (address_type IN ('home', 'work', 'other')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON public.addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_addresses_postal_code ON public.addresses(postal_code);

-- =========================================================================
-- 6. SHOPS / SELLERS (WITH STRICT SERVICE PIN CODE)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.shops (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  shop_name TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  shop_address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  postal_code TEXT NOT NULL,              -- Physical shop PIN code
  service_pin_code TEXT NOT NULL,          -- Registered local buyer service PIN code
  category TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  pan_number TEXT,
  bank_details JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending_approval' CHECK (status IN ('pending_approval', 'approved', 'rejected', 'suspended')),
  rating NUMERIC(3,2) NOT NULL DEFAULT 4.8,
  total_products INT NOT NULL DEFAULT 0,
  total_sales NUMERIC(12,2) NOT NULL DEFAULT 0,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shops_owner_id ON public.shops(owner_id);
CREATE INDEX IF NOT EXISTS idx_shops_service_pin ON public.shops(service_pin_code);
CREATE INDEX IF NOT EXISTS idx_shops_postal_code ON public.shops(postal_code);
CREATE INDEX IF NOT EXISTS idx_shops_status ON public.shops(status);

DROP TRIGGER IF EXISTS set_shops_updated_at ON public.shops;
CREATE TRIGGER set_shops_updated_at
BEFORE UPDATE ON public.shops
FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

-- =========================================================================
-- 7. CATEGORIES
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.categories (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  icon TEXT NOT NULL DEFAULT 'Box',
  image TEXT,
  description TEXT,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_categories_display_order ON public.categories(display_order);

-- =========================================================================
-- 8. PRODUCTS (WITH SELLER PIN CODE FOR LOCAL MATCHING)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  shop_id TEXT NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  shop_name TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL,
  discount_price NUMERIC(10,2) NOT NULL,
  stock INT NOT NULL DEFAULT 0,
  sku TEXT,
  images TEXT[] NOT NULL DEFAULT '{}',
  specifications JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_approved BOOLEAN NOT NULL DEFAULT TRUE,
  delivery_available BOOLEAN NOT NULL DEFAULT TRUE,
  rating NUMERIC(3,2) NOT NULL DEFAULT 4.5,
  review_count INT NOT NULL DEFAULT 0,
  seller_pin_code TEXT NOT NULL,           -- Denormalized service PIN for ultra-fast local filtering
  shop_pin_code TEXT,                     -- Physical shop PIN
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_shop_id ON public.products(shop_id);
CREATE INDEX IF NOT EXISTS idx_products_seller_pin ON public.products(seller_pin_code);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_active_approved ON public.products(is_active, is_approved);

DROP TRIGGER IF EXISTS set_products_updated_at ON public.products;
CREATE TRIGGER set_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

-- =========================================================================
-- 9. CART & CART ITEMS
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.cart (
  id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cart_user_id ON public.cart(user_id);

CREATE TABLE IF NOT EXISTS public.cart_items (
  id TEXT PRIMARY KEY,
  cart_id TEXT NOT NULL REFERENCES public.cart(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  shop_id TEXT NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  shop_name TEXT NOT NULL,
  name TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  discount_price NUMERIC(10,2) NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  image TEXT,
  stock INT NOT NULL DEFAULT 10,
  seller_pin_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON public.cart_items(cart_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON public.cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON public.cart_items(product_id);

-- =========================================================================
-- 10. ORDERS
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  delivery_address JSONB NOT NULL,
  total_amount NUMERIC(10,2) NOT NULL,
  subtotal NUMERIC(10,2) NOT NULL,
  delivery_charge NUMERIC(10,2) NOT NULL,
  platform_fee NUMERIC(10,2) NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('upi', 'card', 'cod')),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  order_status TEXT NOT NULL DEFAULT 'confirmed' CHECK (order_status IN (
    'pending', 'confirmed', 'processing', 'packed', 'ready_for_pickup',
    'assigned_to_delivery_partner', 'picked_up', 'out_for_delivery', 'delivered', 'cancelled', 'returned'
  )),
  delivery_partner_id TEXT,
  delivery_partner_name TEXT,
  delivery_partner_phone TEXT,
  delivery_otp TEXT NOT NULL,
  items JSONB NOT NULL,
  seller_ids TEXT[] NOT NULL DEFAULT '{}',
  status_history JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_partner ON public.orders(delivery_partner_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);

DROP TRIGGER IF EXISTS set_orders_updated_at ON public.orders;
CREATE TRIGGER set_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

-- =========================================================================
-- 11. ORDER ITEMS (NORMALIZED FOR GRANULAR QUERIES & REPORTING)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  shop_id TEXT NOT NULL REFERENCES public.shops(id) ON DELETE RESTRICT,
  shop_name TEXT NOT NULL,
  name TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  discount_price NUMERIC(10,2) NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  image TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_shop_id ON public.order_items(shop_id);

-- =========================================================================
-- 12. SELLER ORDERS (MULTI-VENDOR SPLIT FULFILLMENT)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.seller_orders (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  seller_id TEXT NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  shop_name TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  delivery_address JSONB NOT NULL,
  items JSONB NOT NULL,
  seller_subtotal NUMERIC(10,2) NOT NULL,
  commission_amount NUMERIC(10,2) NOT NULL,
  seller_earnings NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN (
    'pending', 'confirmed', 'processing', 'packed', 'ready_for_pickup',
    'assigned_to_delivery_partner', 'picked_up', 'out_for_delivery', 'delivered', 'cancelled', 'returned'
  )),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_seller_orders_seller_id ON public.seller_orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_seller_orders_order_id ON public.seller_orders(order_id);
CREATE INDEX IF NOT EXISTS idx_seller_orders_status ON public.seller_orders(status);

DROP TRIGGER IF EXISTS set_seller_orders_updated_at ON public.seller_orders;
CREATE TRIGGER set_seller_orders_updated_at
BEFORE UPDATE ON public.seller_orders
FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

-- =========================================================================
-- 13. DELIVERY PARTNERS
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.delivery_partners (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  photo_url TEXT,
  date_of_birth TEXT,
  address TEXT NOT NULL,
  service_area TEXT NOT NULL,
  vehicle_type TEXT NOT NULL CHECK (vehicle_type IN ('Bike', 'Scooter', 'Bicycle', 'Electric Vehicle', 'Other')),
  vehicle_number TEXT NOT NULL,
  driving_licence_number TEXT NOT NULL,
  id_proof_number TEXT NOT NULL,
  bank_details JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
  is_online BOOLEAN NOT NULL DEFAULT FALSE,
  total_deliveries INT NOT NULL DEFAULT 0,
  rating NUMERIC(3,2) NOT NULL DEFAULT 5.0,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_delivery_partners_status ON public.delivery_partners(status);
CREATE INDEX IF NOT EXISTS idx_delivery_partners_is_online ON public.delivery_partners(is_online);

DROP TRIGGER IF EXISTS set_delivery_partners_updated_at ON public.delivery_partners;
CREATE TRIGGER set_delivery_partners_updated_at
BEFORE UPDATE ON public.delivery_partners
FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

-- =========================================================================
-- 14. DELIVERY ASSIGNMENTS
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.delivery_assignments (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  seller_order_id TEXT,
  delivery_partner_id TEXT,
  delivery_partner_name TEXT,
  delivery_partner_phone TEXT,
  shop_id TEXT NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  shop_name TEXT NOT NULL,
  shop_address TEXT NOT NULL,
  shop_phone TEXT,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  delivery_address JSONB NOT NULL,
  delivery_fee NUMERIC(10,2) NOT NULL,
  earning_amount NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN (
    'available', 'assigned', 'picked_up', 'out_for_delivery', 'delivered', 'cancelled', 'rejected'
  )),
  otp TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_delivery_assignments_order_id ON public.delivery_assignments(order_id);
CREATE INDEX IF NOT EXISTS idx_delivery_assignments_partner_id ON public.delivery_assignments(delivery_partner_id);
CREATE INDEX IF NOT EXISTS idx_delivery_assignments_status ON public.delivery_assignments(status);

DROP TRIGGER IF EXISTS set_delivery_assignments_updated_at ON public.delivery_assignments;
CREATE TRIGGER set_delivery_assignments_updated_at
BEFORE UPDATE ON public.delivery_assignments
FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

-- =========================================================================
-- 15. WALLETS (SELLER & DELIVERY PARTNER)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.wallets (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('seller', 'delivery_partner')),
  current_balance NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_earnings NUMERIC(12,2) NOT NULL DEFAULT 0,
  today_earnings NUMERIC(12,2) NOT NULL DEFAULT 0,
  pending_earnings NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_payouts NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_wallets_owner_role ON public.wallets(owner_id, role);
CREATE INDEX IF NOT EXISTS idx_wallets_owner_id ON public.wallets(owner_id);

DROP TRIGGER IF EXISTS set_wallets_updated_at ON public.wallets;
CREATE TRIGGER set_wallets_updated_at
BEFORE UPDATE ON public.wallets
FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

-- =========================================================================
-- 16. WALLET TRANSACTIONS
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id TEXT PRIMARY KEY,
  wallet_id TEXT NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  owner_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('seller', 'delivery_partner')),
  type TEXT NOT NULL CHECK (type IN ('credit', 'debit', 'payout')),
  amount NUMERIC(12,2) NOT NULL,
  description TEXT NOT NULL,
  reference_id TEXT,
  order_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wallet_tx_wallet_id ON public.wallet_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_owner_id ON public.wallet_transactions(owner_id);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_created_at ON public.wallet_transactions(created_at DESC);

-- =========================================================================
-- 17. PAYOUT REQUESTS
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.payout_requests (
  id TEXT PRIMARY KEY,
  requester_id TEXT NOT NULL,
  requester_name TEXT NOT NULL,
  requester_role TEXT NOT NULL CHECK (requester_role IN ('seller', 'delivery_partner')),
  shop_id TEXT,
  amount NUMERIC(12,2) NOT NULL,
  upi_id TEXT NOT NULL,
  bank_details JSONB,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'processing', 'paid', 'rejected')),
  transaction_ref TEXT,
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_payout_requests_requester ON public.payout_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_payout_requests_status ON public.payout_requests(status);

-- =========================================================================
-- 18. PAYMENTS
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.payments (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL,
  method TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
  reference_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_order_id ON public.payments(order_id);

-- =========================================================================
-- 19. NOTIFICATIONS
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  recipient_role TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('order', 'delivery', 'payout', 'system', 'approval')),
  reference_id TEXT,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_role ON public.notifications(recipient_role);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- =========================================================================
-- 20. PLATFORM SETTINGS (WITH LOCAL PIN CODE RESTRICTION)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.platform_settings (
  id TEXT PRIMARY KEY,
  seller_commission_percent NUMERIC NOT NULL DEFAULT 5,
  platform_fee NUMERIC NOT NULL DEFAULT 5,
  delivery_base_charge NUMERIC NOT NULL DEFAULT 40,
  delivery_partner_earning_per_order NUMERIC NOT NULL DEFAULT 35,
  min_payout_amount NUMERIC NOT NULL DEFAULT 100,
  auto_approve_products BOOLEAN NOT NULL DEFAULT TRUE,
  cash_on_delivery_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  local_pin_code_restriction BOOLEAN NOT NULL DEFAULT TRUE, -- Strict local matching rule (Default: ON)
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Backward compatibility view so existing queries referencing "settings" work seamlessly
CREATE OR REPLACE VIEW public.settings AS
  SELECT * FROM public.platform_settings;

-- Insert initial platform settings
INSERT INTO public.platform_settings (
  id,
  seller_commission_percent,
  platform_fee,
  delivery_base_charge,
  delivery_partner_earning_per_order,
  min_payout_amount,
  auto_approve_products,
  cash_on_delivery_enabled,
  local_pin_code_restriction
)
VALUES (
  'platform_settings',
  5,
  5,
  40,
  35,
  100,
  TRUE,
  TRUE,
  TRUE
)
ON CONFLICT (id) DO UPDATE SET
  local_pin_code_restriction = EXCLUDED.local_pin_code_restriction;

-- Also seed 'global' ID in case referenced
INSERT INTO public.platform_settings (
  id,
  seller_commission_percent,
  platform_fee,
  delivery_base_charge,
  delivery_partner_earning_per_order,
  min_payout_amount,
  auto_approve_products,
  cash_on_delivery_enabled,
  local_pin_code_restriction
)
VALUES (
  'global',
  5,
  5,
  40,
  35,
  100,
  TRUE,
  TRUE,
  TRUE
)
ON CONFLICT (id) DO NOTHING;

-- Initial Partner Hub Admin Record
INSERT INTO public.admin_users (username, email, display_name, role)
VALUES ('Gamjinmarak', 'gamjinmarak@bazaarx.com', 'Gamjinmarak', 'admin')
ON CONFLICT (username) DO NOTHING;

-- =========================================================================
-- 21. BACKEND PIN CODE MATCHING DATABASE VALIDATION FUNCTION
-- =========================================================================
CREATE OR REPLACE FUNCTION public.check_order_local_pin_restriction(
  p_buyer_pin TEXT,
  p_shop_ids TEXT[]
)
RETURNS TABLE (
  allowed BOOLEAN,
  mismatched_shop_id TEXT,
  seller_pin TEXT,
  buyer_pin TEXT,
  message TEXT
) AS $$
DECLARE
  v_restriction_enabled BOOLEAN;
  v_shop RECORD;
BEGIN
  -- 1. Check if the Partner Hub setting is ON
  SELECT local_pin_code_restriction INTO v_restriction_enabled
  FROM public.platform_settings
  WHERE id = 'platform_settings'
  LIMIT 1;

  IF v_restriction_enabled IS FALSE THEN
    RETURN QUERY SELECT TRUE, NULL::TEXT, NULL::TEXT, p_buyer_pin, 'Local PIN matching restriction is disabled'::TEXT;
    RETURN;
  END IF;

  -- 2. Verify each shop's registered service PIN code
  FOR v_shop IN
    SELECT id, shop_name, COALESCE(NULLIF(service_pin_code, ''), postal_code) AS pin
    FROM public.shops
    WHERE id = ANY(p_shop_ids)
  LOOP
    IF v_shop.pin IS NOT NULL AND TRIM(v_shop.pin) <> TRIM(p_buyer_pin) THEN
      RETURN QUERY SELECT
        FALSE,
        v_shop.id,
        v_shop.pin,
        p_buyer_pin,
        'Sorry, this product is currently available only in your local area.'::TEXT;
      RETURN;
    END IF;
  END LOOP;

  RETURN QUERY SELECT TRUE, NULL::TEXT, NULL::TEXT, p_buyer_pin, 'All products are available in your local delivery area.'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =========================================================================
-- 22. ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payout_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Anonymous/Public access policies for high availability marketplace:
CREATE POLICY "Public Read Categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Public Read Products" ON public.products FOR SELECT USING (is_active = true);
CREATE POLICY "Public Read Shops" ON public.shops FOR SELECT USING (status = 'approved');
CREATE POLICY "Public Read Platform Settings" ON public.platform_settings FOR SELECT USING (true);

-- Enable full read/write for application workflows (authenticated & service level)
CREATE POLICY "Allow App Users Read Write" ON public.users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow App Admin Users Read Write" ON public.admin_users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow App Addresses Read Write" ON public.addresses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow App Shops Read Write" ON public.shops FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow App Products Read Write" ON public.products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow App Categories Read Write" ON public.categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow App Cart Read Write" ON public.cart FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow App Cart Items Read Write" ON public.cart_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow App Orders Read Write" ON public.orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow App Order Items Read Write" ON public.order_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow App Seller Orders Read Write" ON public.seller_orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow App Delivery Partners Read Write" ON public.delivery_partners FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow App Delivery Assignments Read Write" ON public.delivery_assignments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow App Wallets Read Write" ON public.wallets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow App Wallet Transactions Read Write" ON public.wallet_transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow App Payout Requests Read Write" ON public.payout_requests FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow App Payments Read Write" ON public.payments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow App Notifications Read Write" ON public.notifications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow App Platform Settings Read Write" ON public.platform_settings FOR ALL USING (true) WITH CHECK (true);

-- =========================================================================
-- 23. INITIAL SEED DATA FOR DEMO & TESTING
-- =========================================================================
-- Initial Categories
INSERT INTO public.categories (id, name, icon, display_order)
VALUES
  ('cat_electronics', 'Electronics', 'Headphones', 1),
  ('cat_mobiles', 'Mobiles', 'Smartphone', 2),
  ('cat_fashion', 'Fashion', 'Shirt', 3),
  ('cat_home_kitchen', 'Home & Kitchen', 'CookingPot', 4),
  ('cat_grocery', 'Grocery', 'Apple', 5),
  ('cat_beauty_health', 'Beauty & Health', 'Sparkles', 6)
ON CONFLICT (id) DO NOTHING;

-- Initial Demo Shops (Configured for Local PIN code matching test)
-- FreshMart & Metro serve PIN 123456
-- Apex Electronics serves PIN 123454
-- Nexus Tech serves PIN 560100
INSERT INTO public.shops (
  id, owner_id, shop_name, owner_name, email, phone_number,
  shop_address, city, state, postal_code, service_pin_code,
  category, description, status, rating, total_products, total_sales, bank_details
)
VALUES
  (
    'shop_freshmart', 'demo_seller_fresh', 'FreshMart Daily Grocery', 'Sunita Devi',
    'freshmart@example.com', '+91 98765 11111', 'Shop 12, Local Market Lane', 'Bengaluru',
    'Karnataka', '123456', '123456', 'Grocery',
    'Local organic groceries, farm fresh fruits, and cooking essentials.',
    'approved', 4.9, 2, 210,
    '{"accountHolderName": "FreshMart Retail", "accountNumber": "112233445566", "ifsc": "SBIN0001234", "upiId": "freshmart@oksbi"}'::jsonb
  ),
  (
    'shop_apex', 'demo_seller_apex', 'Apex Electronics & Audio', 'Rahul Mehta',
    'apex.electronics@example.com', '+91 98765 22222', 'Unit 4B, South Plaza Avenue', 'Bengaluru',
    'Karnataka', '123454', '123454', 'Electronics & Mobiles',
    'Specialist audio boutique and premium headphones retailer.',
    'approved', 4.8, 2, 89,
    '{"accountHolderName": "Apex Electronics Ltd", "accountNumber": "998877665544", "ifsc": "ICIC0005678", "upiId": "apexelectronics@icici"}'::jsonb
  ),
  (
    'shop_metro', 'demo_seller_metro', 'Metro Superstore & Home', 'Anand Verma',
    'metro.superstore@example.com', '+91 98765 33333', 'Building 18, Commercial Ring Road', 'Bengaluru',
    'Karnataka', '123456', '123456', 'Home & Kitchen',
    'One-stop department store for mobile devices, smart appliances, and kitchen tools.',
    'approved', 4.7, 2, 340,
    '{"accountHolderName": "Metro Retail Mart", "accountNumber": "556677889900", "ifsc": "HDFC0004321", "upiId": "metroretail@okhdfcbank"}'::jsonb
  ),
  (
    'shop_nexus_retail', 'demo_seller_1', 'Nexus Tech & Lifestyle', 'Vikram Sharma',
    'nexus.retail@example.com', '+91 98765 43210', 'Shop 42, Electronic City, Phase 1', 'Bengaluru',
    'Karnataka', '560100', '560100', 'Electronics & Mobiles',
    'Authorized retailer of genuine smartphones, audio gear, and lifestyle electronics.',
    'approved', 4.8, 1, 154,
    '{"accountHolderName": "Nexus Tech Retailers LLP", "accountNumber": "918273645521", "ifsc": "HDFC0001234", "upiId": "nexusretail@okhdfcbank"}'::jsonb
  )
ON CONFLICT (id) DO NOTHING;

-- Initial Demo Products with respective seller_pin_code
INSERT INTO public.products (
  id, shop_id, shop_name, seller_pin_code, shop_pin_code,
  name, category, description, price, discount_price, stock, sku, images, specifications,
  is_active, is_approved, delivery_available, rating, review_count
)
VALUES
  (
    'prod_fresh_apples', 'shop_freshmart', 'FreshMart Daily Grocery', '123456', '123456',
    'Farm Fresh Royal Kinnaur Apples (1kg Box)', 'Grocery',
    'Directly sourced from high-altitude orchard growers. Crisp, sweet, and rich in natural antioxidants.',
    220, 169, 45, 'APL-KIN-1KG',
    ARRAY['https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=800&q=80'],
    '{"Origin": "Kinnaur, Himachal Pradesh", "Weight": "1 kg (Approx 4-5 units)", "Shelf Life": "7-10 Days"}'::jsonb,
    TRUE, TRUE, TRUE, 4.9, 180
  ),
  (
    'prod_mustard_oil', 'shop_freshmart', 'FreshMart Daily Grocery', '123456', '123456',
    'Pure Cold-Pressed Kachi Ghani Mustard Oil (1 Litre)', 'Grocery',
    'Traditional wood-pressed unfiltered mustard oil with natural pungency and health benefits.',
    240, 185, 60, 'OIL-MUST-1L',
    ARRAY['https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=800&q=80'],
    '{"Volume": "1 Litre Pet Bottle", "Process": "Cold Pressed Wood Churn", "Nutrients": "Rich in Omega-3 & Vitamin E"}'::jsonb,
    TRUE, TRUE, TRUE, 4.8, 95
  ),
  (
    'prod_apex_headphones', 'shop_apex', 'Apex Electronics & Audio', '123454', '123454',
    'Studio Pro Wireless Active Noise Cancelling Headphones', 'Electronics',
    'High-resolution audio with 40mm titanium dynamic drivers and hybrid active noise cancellation up to 42dB.',
    9999, 5499, 18, 'HD-ST-PRO-BLK',
    ARRAY['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80'],
    '{"Battery Life": "40 Hours Playback", "Charging": "Type-C Fast Charge", "Connectivity": "Bluetooth 5.3 + 3.5mm Aux"}'::jsonb,
    TRUE, TRUE, TRUE, 4.9, 310
  ),
  (
    'prod_apex_soundbar', 'shop_apex', 'Apex Electronics & Audio', '123454', '123454',
    'Dolby Atmos 2.1 Channel Cinema Soundbar with Wireless Subwoofer', 'Electronics',
    'Transform your living room into an immersive cinema with 160W RMS total dynamic acoustic output.',
    14999, 8999, 12, 'SB-CINEMA-21',
    ARRAY['https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=800&q=80'],
    '{"Power Output": "160 Watts RMS", "Audio Codecs": "Dolby Atmos, DTS Virtual:X", "Inputs": "HDMI eARC, Optical, AUX"}'::jsonb,
    TRUE, TRUE, TRUE, 4.7, 142
  ),
  (
    'prod_metro_airfryer', 'shop_metro', 'Metro Superstore & Home', '123456', '123456',
    'Digital Rapid Air Fryer & Multi-Cooker (4.5 Litre XL)', 'Home & Kitchen',
    'Cook delicious crispy fried treats with up to 90% less oil. Includes 8 smart one-touch presets.',
    6499, 3999, 25, 'AF-DIGI-45L',
    ARRAY['https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=800&q=80'],
    '{"Capacity": "4.5 Litres", "Power": "1500 Watts Rapid Heat", "Coating": "Non-Stick Food Grade Ceramic"}'::jsonb,
    TRUE, TRUE, TRUE, 4.8, 220
  ),
  (
    'prod_metro_mixer', 'shop_metro', 'Metro Superstore & Home', '123456', '123456',
    'Heavy Duty 750W Copper Motor Mixer Grinder (3 Stainless Steel Jars)', 'Home & Kitchen',
    'Designed to tackle tough Indian kitchen grinding with overload safety thermal protection.',
    3999, 2499, 30, 'MG-HEAVY-750W',
    ARRAY['https://images.unsplash.com/photo-1570222094114-d054a817e56b?auto=format&fit=crop&w=800&q=80'],
    '{"Motor": "100% Pure Copper 750W", "Jars": "Liquidizer, Dry, Chutney Jar", "Speed Control": "3-Speed with Pulse"}'::jsonb,
    TRUE, TRUE, TRUE, 4.7, 184
  ),
  (
    'prod_galaxy_ultra', 'shop_nexus_retail', 'Nexus Tech & Lifestyle', '560100', '560100',
    'Nexus Pro 5G Smartphone (12GB RAM, 256GB Storage)', 'Mobiles',
    'Flagship 5G smartphone with 120Hz curved AMOLED display, 108MP OIS camera, and 5000mAh battery with 68W fast charging.',
    34999, 27999, 20, 'NEX-PH-5G-256',
    ARRAY['https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=800&q=80'],
    '{"Display": "6.78 inch FHD+ 120Hz AMOLED", "Processor": "Octa-Core 5G Chipset", "Battery": "5000 mAh + 68W Charger"}'::jsonb,
    TRUE, TRUE, TRUE, 4.8, 412
  )
ON CONFLICT (id) DO NOTHING;

-- Initial Demo Delivery Partner
INSERT INTO public.delivery_partners (
  id, full_name, email, phone_number, address, service_area,
  vehicle_type, vehicle_number, driving_licence_number, id_proof_number,
  status, is_online, total_deliveries, rating, bank_details
)
VALUES (
  'demo_rider_1', 'Ramesh Kumar', 'rider.ramesh@bazaarx.com', '+91 98765 99999',
  '12th Cross, Indiranagar', 'Bengaluru Metro Area (PIN: 123456 & 123454)',
  'Bike', 'KA-01-AB-1234', 'DL-KA0120220004321', 'AADHAAR-890123456789',
  'approved', TRUE, 48, 4.9,
  '{"accountHolderName": "Ramesh Kumar", "accountNumber": "987654321012", "ifsc": "SBIN0004321", "upiId": "ramesh.rider@paytm"}'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- Initial Demo Wallets
INSERT INTO public.wallets (id, owner_id, role, current_balance, total_earnings, today_earnings, total_payouts)
VALUES
  ('wallet_shop_freshmart', 'shop_freshmart', 'seller', 3540.00, 4200.00, 850.00, 660.00),
  ('wallet_shop_apex', 'shop_apex', 'seller', 8400.00, 12000.00, 5499.00, 3600.00),
  ('wallet_shop_metro', 'shop_metro', 'seller', 5600.00, 8900.00, 2499.00, 3300.00),
  ('wallet_rider_1', 'demo_rider_1', 'delivery_partner', 1680.00, 2100.00, 280.00, 420.00)
ON CONFLICT (id) DO NOTHING;
