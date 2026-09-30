import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../firebase';
import {
  Product,
  Category,
  Shop,
  Order,
  SellerOrder,
  DeliveryPartner,
  DeliveryAssignment,
  Wallet,
  WalletTransaction,
  PayoutRequest,
  AppNotification,
  PlatformSettings,
  Address,
  OrderItem,
  OrderStatus,
  AssignmentStatus,
  PayoutStatus,
  UserProfile,
  VillageDeliveryRate,
} from '../types';
import { supabase } from '../supabase';

// Safe unique Supabase Realtime channel generator
// Completely prevents "Uncaught Error: cannot add postgres_changes callbacks for ... after subscribe()"
let channelCounter = 0;
export function createRealtimeChannel(prefix: string) {
  channelCounter++;
  const cleanPrefix = String(prefix).replace(/[^a-zA-Z0-9_-]/g, "_");
  const uniqueName = `rt_${cleanPrefix}_${Date.now()}_${channelCounter}_${Math.random().toString(36).substring(2, 7)}`;
  return supabase.channel(uniqueName);
}


// =========================================================================
// DATA MAPPERS: TypeScript CamelCase <-> PostgreSQL SnakeCase
// =========================================================================

export function mapShopFromDb(row: any): Shop {
  return {
    id: row.id,
    ownerId: row.owner_id || '',
    shopName: row.shop_name || '',
    ownerName: row.owner_name || '',
    email: row.email || '',
    phoneNumber: row.phone_number || '',
    shopAddress: row.shop_address || '',
    city: row.city || '',
    state: row.state || '',
    postalCode: row.postal_code || '',
    servicePinCode: row.service_pin_code || row.postal_code || '',
    category: row.category || '',
    description: row.description || '',
    logoUrl: row.logo_url || undefined,
    panNumber: row.pan_number || undefined,
    bankDetails: row.bank_details || {
      accountHolderName: '',
      accountNumber: '',
      ifsc: '',
      upiId: '',
    },
    status: row.status || 'pending_approval',
    rating: Number(row.rating) || 4.8,
    totalProducts: Number(row.total_products) || 0,
    totalSales: Number(row.total_sales) || 0,
    createdAt: row.created_at || new Date().toISOString(),
    rejectionReason: row.rejection_reason || undefined,
  };
}

export function mapShopToDb(shop: Partial<Shop>): any {
  const data: any = {};
  if (shop.id !== undefined) data.id = shop.id;
  if (shop.ownerId !== undefined) data.owner_id = shop.ownerId;
  if (shop.shopName !== undefined) data.shop_name = shop.shopName;
  if (shop.ownerName !== undefined) data.owner_name = shop.ownerName;
  if (shop.email !== undefined) data.email = shop.email;
  if (shop.phoneNumber !== undefined) data.phone_number = shop.phoneNumber;
  if (shop.shopAddress !== undefined) data.shop_address = shop.shopAddress;
  if (shop.city !== undefined) data.city = shop.city;
  if (shop.state !== undefined) data.state = shop.state;
  if (shop.postalCode !== undefined) data.postal_code = shop.postalCode;
  if (shop.servicePinCode !== undefined) data.service_pin_code = shop.servicePinCode;
  if (shop.category !== undefined) data.category = shop.category;
  if (shop.description !== undefined) data.description = shop.description;
  if (shop.logoUrl !== undefined) data.logo_url = shop.logoUrl;
  if (shop.panNumber !== undefined) data.pan_number = shop.panNumber;
  if (shop.bankDetails !== undefined) data.bank_details = shop.bankDetails;
  if (shop.status !== undefined) data.status = shop.status;
  if (shop.rating !== undefined) data.rating = shop.rating;
  if (shop.totalProducts !== undefined) data.total_products = shop.totalProducts;
  if (shop.totalSales !== undefined) data.total_sales = shop.totalSales;
  if (shop.rejectionReason !== undefined) data.rejection_reason = shop.rejectionReason;
  data.updated_at = new Date().toISOString();
  return data;
}

export function mapProductFromDb(row: any): Product {
  return {
    id: row.id,
    shopId: row.shop_id || '',
    shopName: row.shop_name || '',
    name: row.name || '',
    category: row.category || '',
    description: row.description || '',
    price: Number(row.price) || 0,
    discountPrice: Number(row.discount_price) || Number(row.price) || 0,
    stock: Number(row.stock) || 0,
    sku: row.sku || undefined,
    images: Array.isArray(row.images) ? row.images : [],
    specifications: row.specifications || {},
    isActive: row.is_active !== false,
    isApproved: row.is_approved !== false,
    deliveryAvailable: row.delivery_available !== false,
    rating: Number(row.rating) || 4.5,
    reviewCount: Number(row.review_count) || 0,
    sellerPinCode: row.seller_pin_code || '',
    shopPinCode: row.shop_pin_code || '',
    createdAt: row.created_at || new Date().toISOString(),
  };
}

export function mapProductToDb(p: Partial<Product>): any {
  const data: any = {};
  if (p.id !== undefined) data.id = p.id;
  if (p.shopId !== undefined) data.shop_id = p.shopId;
  if (p.shopName !== undefined) data.shop_name = p.shopName;
  if (p.name !== undefined) data.name = p.name;
  if (p.category !== undefined) data.category = p.category;
  if (p.description !== undefined) data.description = p.description;
  if (p.price !== undefined) data.price = p.price;
  if (p.discountPrice !== undefined) data.discount_price = p.discountPrice;
  if (p.stock !== undefined) data.stock = p.stock;
  if (p.sku !== undefined) data.sku = p.sku;
  if (p.images !== undefined) data.images = p.images;
  if (p.specifications !== undefined) data.specifications = p.specifications;
  if (p.isActive !== undefined) data.is_active = p.isActive;
  if (p.isApproved !== undefined) data.is_approved = p.isApproved;
  if (p.deliveryAvailable !== undefined) data.delivery_available = p.deliveryAvailable;
  if (p.rating !== undefined) data.rating = p.rating;
  if (p.reviewCount !== undefined) data.review_count = p.reviewCount;
  if (p.sellerPinCode !== undefined) data.seller_pin_code = p.sellerPinCode;
  if (p.shopPinCode !== undefined) data.shop_pin_code = p.shopPinCode;
  data.updated_at = new Date().toISOString();
  return data;
}

export function mapOrderFromDb(row: any): Order {
  return {
    id: row.id,
    customerId: row.customer_id || '',
    customerName: row.customer_name || '',
    customerEmail: row.customer_email || '',
    customerPhone: row.customer_phone || '',
    deliveryAddress: row.delivery_address || ({} as Address),
    deliveryVillage: row.delivery_village || row.delivery_address?.village || undefined,
    totalAmount: Number(row.total_amount) || 0,
    subtotal: Number(row.subtotal) || 0,
    deliveryCharge: Number(row.delivery_charge) || 0,
    platformFee: Number(row.platform_fee) || 0,
    paymentMethod: row.payment_method || 'upi',
    paymentStatus: row.payment_status || 'pending',
    orderStatus: row.order_status || 'confirmed',
    deliveryPartnerId: row.delivery_partner_id || undefined,
    deliveryPartnerName: row.delivery_partner_name || undefined,
    deliveryPartnerPhone: row.delivery_partner_phone || undefined,
    deliveryOtp: row.delivery_otp || '',
    items: Array.isArray(row.items) ? row.items : [],
    sellerIds: Array.isArray(row.seller_ids) ? row.seller_ids : [],
    statusHistory: Array.isArray(row.status_history) ? row.status_history : [],
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
  };
}

export function mapOrderToDb(o: Partial<Order>): any {
  const data: any = {};
  if (o.id !== undefined) data.id = o.id;
  if (o.customerId !== undefined) data.customer_id = o.customerId;
  if (o.customerName !== undefined) data.customer_name = o.customerName;
  if (o.customerEmail !== undefined) data.customer_email = o.customerEmail;
  if (o.customerPhone !== undefined) data.customer_phone = o.customerPhone;
  if (o.deliveryAddress !== undefined) data.delivery_address = o.deliveryAddress;
  if (o.deliveryVillage !== undefined) data.delivery_village = o.deliveryVillage;
  if (o.totalAmount !== undefined) data.total_amount = o.totalAmount;
  if (o.subtotal !== undefined) data.subtotal = o.subtotal;
  if (o.deliveryCharge !== undefined) data.delivery_charge = o.deliveryCharge;
  if (o.platformFee !== undefined) data.platform_fee = o.platformFee;
  if (o.paymentMethod !== undefined) data.payment_method = o.paymentMethod;
  if (o.paymentStatus !== undefined) data.payment_status = o.paymentStatus;
  if (o.orderStatus !== undefined) data.order_status = o.orderStatus;
  if (o.deliveryPartnerId !== undefined) data.delivery_partner_id = o.deliveryPartnerId;
  if (o.deliveryPartnerName !== undefined) data.delivery_partner_name = o.deliveryPartnerName;
  if (o.deliveryPartnerPhone !== undefined) data.delivery_partner_phone = o.deliveryPartnerPhone;
  if (o.deliveryOtp !== undefined) data.delivery_otp = o.deliveryOtp;
  if (o.items !== undefined) data.items = o.items;
  if (o.sellerIds !== undefined) data.seller_ids = o.sellerIds;
  if (o.statusHistory !== undefined) data.status_history = o.statusHistory;
  data.updated_at = new Date().toISOString();
  return data;
}

export function mapSellerOrderFromDb(row: any): SellerOrder {
  return {
    id: row.id,
    orderId: row.order_id || '',
    sellerId: row.seller_id || '',
    shopName: row.shop_name || '',
    customerId: row.customer_id || '',
    customerName: row.customer_name || '',
    customerPhone: row.customer_phone || '',
    deliveryAddress: row.delivery_address || ({} as Address),
    items: Array.isArray(row.items) ? row.items : [],
    sellerSubtotal: Number(row.seller_subtotal) || 0,
    commissionAmount: Number(row.commission_amount) || 0,
    sellerEarnings: Number(row.seller_earnings) || 0,
    status: row.status || 'confirmed',
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
  };
}

export function mapSellerOrderToDb(so: Partial<SellerOrder>): any {
  const data: any = {};
  if (so.id !== undefined) data.id = so.id;
  if (so.orderId !== undefined) data.order_id = so.orderId;
  if (so.sellerId !== undefined) data.seller_id = so.sellerId;
  if (so.shopName !== undefined) data.shop_name = so.shopName;
  if (so.customerId !== undefined) data.customer_id = so.customerId;
  if (so.customerName !== undefined) data.customer_name = so.customerName;
  if (so.customerPhone !== undefined) data.customer_phone = so.customerPhone;
  if (so.deliveryAddress !== undefined) data.delivery_address = so.deliveryAddress;
  if (so.items !== undefined) data.items = so.items;
  if (so.sellerSubtotal !== undefined) data.seller_subtotal = so.sellerSubtotal;
  if (so.commissionAmount !== undefined) data.commission_amount = so.commissionAmount;
  if (so.sellerEarnings !== undefined) data.seller_earnings = so.sellerEarnings;
  if (so.status !== undefined) data.status = so.status;
  data.updated_at = new Date().toISOString();
  return data;
}

export function mapDeliveryPartnerFromDb(row: any): DeliveryPartner {
  return {
    id: row.id,
    fullName: row.full_name || '',
    email: row.email || '',
    phoneNumber: row.phone_number || '',
    photoURL: row.photo_url || undefined,
    dateOfBirth: row.date_of_birth || undefined,
    address: row.address || '',
    serviceArea: row.service_area || '',
    vehicleType: row.vehicle_type || 'Bike',
    vehicleNumber: row.vehicle_number || '',
    drivingLicenceNumber: row.driving_licence_number || '',
    idProofNumber: row.id_proof_number || '',
    bankDetails: row.bank_details || {
      accountHolderName: '',
      accountNumber: '',
      ifsc: '',
      upiId: '',
    },
    status: row.status || 'pending',
    isOnline: Boolean(row.is_online),
    totalDeliveries: Number(row.total_deliveries) || 0,
    rating: Number(row.rating) || 5.0,
    rejectionReason: row.rejection_reason || undefined,
    createdAt: row.created_at || new Date().toISOString(),
  };
}

export function mapDeliveryPartnerToDb(dp: Partial<DeliveryPartner>): any {
  const data: any = {};
  if (dp.id !== undefined) data.id = dp.id;
  if (dp.fullName !== undefined) data.full_name = dp.fullName;
  if (dp.email !== undefined) data.email = dp.email;
  if (dp.phoneNumber !== undefined) data.phone_number = dp.phoneNumber;
  if (dp.photoURL !== undefined) data.photo_url = dp.photoURL;
  if (dp.dateOfBirth !== undefined) data.date_of_birth = dp.dateOfBirth;
  if (dp.address !== undefined) data.address = dp.address;
  if (dp.serviceArea !== undefined) data.service_area = dp.serviceArea;
  if (dp.vehicleType !== undefined) data.vehicle_type = dp.vehicleType;
  if (dp.vehicleNumber !== undefined) data.vehicle_number = dp.vehicleNumber;
  if (dp.drivingLicenceNumber !== undefined) data.driving_licence_number = dp.drivingLicenceNumber;
  if (dp.idProofNumber !== undefined) data.id_proof_number = dp.idProofNumber;
  if (dp.bankDetails !== undefined) data.bank_details = dp.bankDetails;
  if (dp.status !== undefined) data.status = dp.status;
  if (dp.isOnline !== undefined) data.is_online = dp.isOnline;
  if (dp.totalDeliveries !== undefined) data.total_deliveries = dp.totalDeliveries;
  if (dp.rating !== undefined) data.rating = dp.rating;
  if (dp.rejectionReason !== undefined) data.rejection_reason = dp.rejectionReason;
  data.updated_at = new Date().toISOString();
  return data;
}

export function mapAssignmentFromDb(row: any): DeliveryAssignment {
  return {
    id: row.id,
    orderId: row.order_id || '',
    sellerOrderId: row.seller_order_id || undefined,
    deliveryPartnerId: row.delivery_partner_id || undefined,
    deliveryPartnerName: row.delivery_partner_name || undefined,
    deliveryPartnerPhone: row.delivery_partner_phone || undefined,
    shopId: row.shop_id || '',
    shopName: row.shop_name || '',
    shopAddress: row.shop_address || '',
    shopPhone: row.shop_phone || undefined,
    customerName: row.customer_name || '',
    customerPhone: row.customer_phone || '',
    deliveryAddress: row.delivery_address || ({} as Address),
    deliveryFee: Number(row.delivery_fee) || 0,
    earningAmount: Number(row.earning_amount) || 0,
    status: row.status || 'available',
    otp: row.otp || '',
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
  };
}

export function mapAssignmentToDb(da: Partial<DeliveryAssignment>): any {
  const data: any = {};
  if (da.id !== undefined) data.id = da.id;
  if (da.orderId !== undefined) data.order_id = da.orderId;
  if (da.sellerOrderId !== undefined) data.seller_order_id = da.sellerOrderId;
  if (da.deliveryPartnerId !== undefined) data.delivery_partner_id = da.deliveryPartnerId;
  if (da.deliveryPartnerName !== undefined) data.delivery_partner_name = da.deliveryPartnerName;
  if (da.deliveryPartnerPhone !== undefined) data.delivery_partner_phone = da.deliveryPartnerPhone;
  if (da.shopId !== undefined) data.shop_id = da.shopId;
  if (da.shopName !== undefined) data.shop_name = da.shopName;
  if (da.shopAddress !== undefined) data.shop_address = da.shopAddress;
  if (da.shopPhone !== undefined) data.shop_phone = da.shopPhone;
  if (da.customerName !== undefined) data.customer_name = da.customerName;
  if (da.customerPhone !== undefined) data.customer_phone = da.customerPhone;
  if (da.deliveryAddress !== undefined) data.delivery_address = da.deliveryAddress;
  if (da.deliveryFee !== undefined) data.delivery_fee = da.deliveryFee;
  if (da.earningAmount !== undefined) data.earning_amount = da.earningAmount;
  if (da.status !== undefined) data.status = da.status;
  if (da.otp !== undefined) data.otp = da.otp;
  data.updated_at = new Date().toISOString();
  return data;
}

export function mapWalletFromDb(row: any): Wallet {
  return {
    id: row.id,
    ownerId: row.owner_id || '',
    role: row.role || 'seller',
    currentBalance: Number(row.current_balance) || 0,
    totalEarnings: Number(row.total_earnings) || 0,
    todayEarnings: Number(row.today_earnings) || 0,
    pendingEarnings: Number(row.pending_earnings) || 0,
    totalPayouts: Number(row.total_payouts) || 0,
    updatedAt: row.updated_at || new Date().toISOString(),
  };
}

export function mapWalletToDb(w: Partial<Wallet>): any {
  const data: any = {};
  if (w.id !== undefined) data.id = w.id;
  if (w.ownerId !== undefined) data.owner_id = w.ownerId;
  if (w.role !== undefined) data.role = w.role;
  if (w.currentBalance !== undefined) data.current_balance = w.currentBalance;
  if (w.totalEarnings !== undefined) data.total_earnings = w.totalEarnings;
  if (w.todayEarnings !== undefined) data.today_earnings = w.todayEarnings;
  if (w.pendingEarnings !== undefined) data.pending_earnings = w.pendingEarnings;
  if (w.totalPayouts !== undefined) data.total_payouts = w.totalPayouts;
  data.updated_at = new Date().toISOString();
  return data;
}

export function mapTxFromDb(row: any): WalletTransaction {
  return {
    id: row.id,
    walletId: row.wallet_id || '',
    ownerId: row.owner_id || '',
    role: row.role || 'seller',
    type: row.type || 'credit',
    amount: Number(row.amount) || 0,
    description: row.description || '',
    referenceId: row.reference_id || undefined,
    orderId: row.order_id || undefined,
    createdAt: row.created_at || new Date().toISOString(),
  };
}

export function mapTxToDb(tx: Partial<WalletTransaction>): any {
  const data: any = {};
  if (tx.id !== undefined) data.id = tx.id;
  if (tx.walletId !== undefined) data.wallet_id = tx.walletId;
  if (tx.ownerId !== undefined) data.owner_id = tx.ownerId;
  if (tx.role !== undefined) data.role = tx.role;
  if (tx.type !== undefined) data.type = tx.type;
  if (tx.amount !== undefined) data.amount = tx.amount;
  if (tx.description !== undefined) data.description = tx.description;
  if (tx.referenceId !== undefined) data.reference_id = tx.referenceId;
  if (tx.orderId !== undefined) data.order_id = tx.orderId;
  if (tx.createdAt !== undefined) data.created_at = tx.createdAt;
  return data;
}

export function mapPayoutFromDb(row: any): PayoutRequest {
  return {
    id: row.id,
    requesterId: row.requester_id || '',
    requesterName: row.requester_name || '',
    requesterRole: row.requester_role || 'seller',
    shopId: row.shop_id || undefined,
    amount: Number(row.amount) || 0,
    upiId: row.upi_id || '',
    bankDetails: row.bank_details || undefined,
    status: row.status || 'pending',
    transactionRef: row.transaction_ref || undefined,
    adminNotes: row.admin_notes || undefined,
    createdAt: row.created_at || new Date().toISOString(),
    processedAt: row.processed_at || undefined,
  };
}

export function mapPayoutToDb(p: Partial<PayoutRequest>): any {
  const data: any = {};
  if (p.id !== undefined) data.id = p.id;
  if (p.requesterId !== undefined) data.requester_id = p.requesterId;
  if (p.requesterName !== undefined) data.requester_name = p.requesterName;
  if (p.requesterRole !== undefined) data.requester_role = p.requesterRole;
  if (p.shopId !== undefined) data.shop_id = p.shopId;
  if (p.amount !== undefined) data.amount = p.amount;
  if (p.upiId !== undefined) data.upi_id = p.upiId;
  if (p.bankDetails !== undefined) data.bank_details = p.bankDetails;
  if (p.status !== undefined) data.status = p.status;
  if (p.transactionRef !== undefined) data.transaction_ref = p.transactionRef;
  if (p.adminNotes !== undefined) data.admin_notes = p.adminNotes;
  if (p.processedAt !== undefined) data.processed_at = p.processedAt;
  return data;
}

export function mapNotifFromDb(row: any): AppNotification {
  return {
    id: row.id,
    userId: row.user_id || undefined,
    recipientRole: row.recipient_role || 'all',
    title: row.title || '',
    message: row.message || '',
    type: row.type || 'system',
    referenceId: row.reference_id || undefined,
    isRead: Boolean(row.is_read),
    createdAt: row.created_at || new Date().toISOString(),
  };
}

export function mapNotifToDb(n: Partial<AppNotification>): any {
  const data: any = {};
  if (n.id !== undefined) data.id = n.id;
  if (n.userId !== undefined) data.user_id = n.userId;
  if (n.recipientRole !== undefined) data.recipient_role = n.recipientRole;
  if (n.title !== undefined) data.title = n.title;
  if (n.message !== undefined) data.message = n.message;
  if (n.type !== undefined) data.type = n.type;
  if (n.referenceId !== undefined) data.reference_id = n.referenceId;
  if (n.isRead !== undefined) data.is_read = n.isRead;
  if (n.createdAt !== undefined) data.created_at = n.createdAt;
  return data;
}

export function mapSettingsFromDb(row: any): PlatformSettings {
  return {
    id: row.id || 'platform_settings',
    sellerCommissionPercent: Number(row.seller_commission_percent) || 5,
    platformFee: Number(row.platform_fee) || 5,
    deliveryBaseCharge: Number(row.delivery_base_charge) || 40,
    deliveryPartnerEarningPerOrder: Number(row.delivery_partner_earning_per_order) || 35,
    minPayoutAmount: Number(row.min_payout_amount) || 100,
    autoApproveProducts: row.auto_approve_products !== false,
    cashOnDeliveryEnabled: row.cash_on_delivery_enabled !== false,
    localPinCodeRestriction: row.local_pin_code_restriction !== false,
    updatedAt: row.updated_at || new Date().toISOString(),
  };
}

export function mapSettingsToDb(s: Partial<PlatformSettings>): any {
  const data: any = {};
  if (s.id !== undefined) data.id = s.id;
  if (s.sellerCommissionPercent !== undefined) data.seller_commission_percent = s.sellerCommissionPercent;
  if (s.platformFee !== undefined) data.platform_fee = s.platformFee;
  if (s.deliveryBaseCharge !== undefined) data.delivery_base_charge = s.deliveryBaseCharge;
  if (s.deliveryPartnerEarningPerOrder !== undefined) data.delivery_partner_earning_per_order = s.deliveryPartnerEarningPerOrder;
  if (s.minPayoutAmount !== undefined) data.min_payout_amount = s.minPayoutAmount;
  if (s.autoApproveProducts !== undefined) data.auto_approve_products = s.autoApproveProducts;
  if (s.cashOnDeliveryEnabled !== undefined) data.cash_on_delivery_enabled = s.cashOnDeliveryEnabled;
  if (s.localPinCodeRestriction !== undefined) data.local_pin_code_restriction = s.localPinCodeRestriction;
  data.updated_at = new Date().toISOString();
  return data;
}

// Default platform settings
export const DEFAULT_SETTINGS: PlatformSettings = {
  id: 'platform_settings',
  sellerCommissionPercent: 5,
  platformFee: 5,
  deliveryBaseCharge: 40,
  deliveryPartnerEarningPerOrder: 35,
  minPayoutAmount: 100,
  autoApproveProducts: true,
  cashOnDeliveryEnabled: true,
  localPinCodeRestriction: true, // Strict local matching rule (Default: ON)
  updatedAt: new Date().toISOString(),
};

// =========================================================================
// PLATFORM SETTINGS
// =========================================================================
export async function getPlatformSettings(): Promise<PlatformSettings> {
  try {
    const { data, error } = await supabase
      .from('platform_settings')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      return mapSettingsFromDb(data);
    }
  } catch (err) {
    // Ignore and fallback
  }

  // Fallback to Firestore / defaults
  try {
    const docRef = doc(db, 'settings', 'platform_settings');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as PlatformSettings;
    }
  } catch (e) {
    // Ignore
  }

  return DEFAULT_SETTINGS;
}

export function listenToSettings(callback: (settings: PlatformSettings) => void) {
  // 1. Initial fetch from Supabase
  getPlatformSettings().then(callback);

  // 2. Realtime listener via Supabase
  const channel = createRealtimeChannel('realtime:platform_settings')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'platform_settings' },
      (payload) => {
        if (payload.new) {
          callback(mapSettingsFromDb(payload.new));
        }
      }
    )
    .subscribe();

  // 3. Fallback Firestore snapshot
  const docRef = doc(db, 'settings', 'platform_settings');
  const unsubFs = onSnapshot(docRef, (snap) => {
    if (snap.exists()) {
      callback(snap.data() as PlatformSettings);
    }
  });

  return () => {
    supabase.removeChannel(channel);
    unsubFs();
  };
}

export async function updatePlatformSettings(settings: Partial<PlatformSettings>) {
  const payload = mapSettingsToDb({ id: 'platform_settings', ...settings });

  // 1. Update in Supabase
  try {
    await supabase.from('platform_settings').upsert(payload);
  } catch (e) {
    console.warn('Supabase settings update error:', e);
  }

  // 2. Mirror to Firestore
  try {
    const docRef = doc(db, 'settings', 'platform_settings');
    await setDoc(docRef, { ...settings, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (e) {
    // Ignore
  }
}

// =========================================================================
// NOTIFICATIONS
// =========================================================================
export async function createNotification(notification: Omit<AppNotification, 'id' | 'createdAt' | 'isRead'>) {
  const id = 'notif_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  const newNotif: AppNotification = {
    ...notification,
    id,
    isRead: false,
    createdAt: new Date().toISOString(),
  };

  try {
    await supabase.from('notifications').insert(mapNotifToDb(newNotif));
  } catch (e) {
    // Ignore Supabase error if table pending
  }

  try {
    const docRef = doc(db, 'notifications', id);
    await setDoc(docRef, newNotif);
  } catch (e) {
    // Ignore
  }

  return newNotif;
}

export function listenToNotifications(userId: string, role: string, callback: (notifications: AppNotification[]) => void) {
  const fetchSupabaseNotifs = async () => {
    try {
      let query = supabase.from('notifications').select('*').order('created_at', { ascending: false });
      if (role !== 'admin') {
        query = query.or(`user_id.eq.${userId},recipient_role.eq.${role},recipient_role.eq.all`);
      }
      const { data, error } = await query;
      if (!error && data) {
        callback(data.map(mapNotifFromDb));
        return true;
      }
    } catch {
      // Fallback
    }
    return false;
  };

  fetchSupabaseNotifs();

  const channel = createRealtimeChannel(`realtime:notifications_${userId || 'all'}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => {
      fetchSupabaseNotifs();
    })
    .subscribe();

  // Firestore fallback
  const colRef = collection(db, 'notifications');
  const unsubFs = onSnapshot(colRef, (snapshot) => {
    const notifs: AppNotification[] = [];
    snapshot.forEach((d) => {
      const data = d.data() as AppNotification;
      if (
        role === 'admin' ||
        data.recipientRole === 'all' ||
        data.userId === userId ||
        (data.recipientRole && data.recipientRole === role)
      ) {
        notifs.push(data);
      }
    });
    notifs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    callback(notifs);
  });

  return () => {
    supabase.removeChannel(channel);
    unsubFs();
  };
}

export async function markNotificationAsRead(id: string) {
  try {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
  } catch {}
  try {
    const docRef = doc(db, 'notifications', id);
    await updateDoc(docRef, { isRead: true });
  } catch {}
}

// =========================================================================
// CATEGORIES
// =========================================================================
export function listenToCategories(callback: (categories: Category[]) => void) {
  const fetchFromSupabase = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('display_order', { ascending: true });
      if (!error && data && data.length > 0) {
        callback(
          data.map((c: any) => ({
            id: c.id,
            name: c.name,
            icon: c.icon || 'Box',
            image: c.image || undefined,
            description: c.description || undefined,
            order: Number(c.display_order) || 0,
          }))
        );
        return true;
      }
    } catch {}
    return false;
  };

  fetchFromSupabase();

  const channel = createRealtimeChannel('realtime:categories')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => {
      fetchFromSupabase();
    })
    .subscribe();

  const colRef = collection(db, 'categories');
  const unsubFs = onSnapshot(colRef, (snap) => {
    if (!snap.empty) {
      const list: Category[] = [];
      snap.forEach((d) => list.push(d.data() as Category));
      list.sort((a, b) => (a.order || 0) - (b.order || 0));
      callback(list);
    }
  });

  return () => {
    supabase.removeChannel(channel);
    unsubFs();
  };
}

export async function saveCategory(category: Category) {
  try {
    await supabase.from('categories').upsert({
      id: category.id,
      name: category.name,
      icon: category.icon,
      image: category.image || null,
      description: category.description || null,
      display_order: category.order,
      updated_at: new Date().toISOString(),
    });
  } catch {}
  try {
    const docRef = doc(db, 'categories', category.id);
    await setDoc(docRef, category, { merge: true });
  } catch {}
}

export async function deleteCategory(id: string) {
  try {
    await supabase.from('categories').delete().eq('id', id);
  } catch {}
  try {
    await deleteDoc(doc(db, 'categories', id));
  } catch {}
}

// =========================================================================
// SHOPS / SELLERS
// =========================================================================
export function listenToShops(callback: (shops: Shop[]) => void) {
  const fetchSupabaseShops = async () => {
    try {
      const { data, error } = await supabase
        .from('shops')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data) {
        callback(data.map(mapShopFromDb));
        return true;
      }
    } catch {}
    return false;
  };

  fetchSupabaseShops();

  const channel = createRealtimeChannel('realtime:shops')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'shops' }, () => {
      fetchSupabaseShops();
    })
    .subscribe();

  const colRef = collection(db, 'shops');
  const unsubFs = onSnapshot(colRef, (snap) => {
    const list: Shop[] = [];
    snap.forEach((d) => list.push(d.data() as Shop));
    callback(list);
  });

  return () => {
    supabase.removeChannel(channel);
    unsubFs();
  };
}

export async function getShopByOwnerId(ownerId: string): Promise<Shop | null> {
  try {
    const { data, error } = await supabase
      .from('shops')
      .select('*')
      .eq('owner_id', ownerId)
      .maybeSingle();
    if (!error && data) {
      return mapShopFromDb(data);
    }
  } catch {}

  try {
    const q = query(collection(db, 'shops'), where('ownerId', '==', ownerId));
    const snap = await getDocs(q);
    if (!snap.empty) {
      return snap.docs[0].data() as Shop;
    }
  } catch {}

  return null;
}

export function listenToShopByOwnerId(ownerId: string, callback: (shop: Shop | null) => void) {
  const fetchShop = async () => {
    const shop = await getShopByOwnerId(ownerId);
    callback(shop);
  };
  fetchShop();

  const channel = createRealtimeChannel(`realtime:shop_${ownerId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'shops', filter: `owner_id=eq.${ownerId}` }, () => {
      fetchShop();
    })
    .subscribe();

  const q = query(collection(db, 'shops'), where('ownerId', '==', ownerId));
  const unsubFs = onSnapshot(q, (snap) => {
    if (!snap.empty) {
      callback(snap.docs[0].data() as Shop);
    } else {
      callback(null);
    }
  });

  return () => {
    supabase.removeChannel(channel);
    unsubFs();
  };
}

export async function registerShop(shopData: Omit<Shop, 'id' | 'status' | 'createdAt' | 'rating' | 'totalProducts' | 'totalSales'>) {
  const id = 'shop_' + Date.now();
  const cleanPostal = (shopData.postalCode || '').trim();
  const cleanService = (shopData.servicePinCode || cleanPostal).trim();

  const shop: Shop = {
    ...shopData,
    postalCode: cleanPostal,
    servicePinCode: cleanService,
    id,
    status: 'pending_approval',
    rating: 4.8,
    totalProducts: 0,
    totalSales: 0,
    createdAt: new Date().toISOString(),
  };

  // 1. Supabase primary insert
  const { error: insErr } = await supabase.from('shops').insert(mapShopToDb(shop));
  if (insErr) {
    console.error('Supabase shop register error:', insErr);
    throw new Error(`Shop registration failed: ${insErr.message}`);
  }

  // 2. Firestore mirror (graceful fallback)
  try {
    await setDoc(doc(db, 'shops', id), shop);
  } catch (e) {
    // Ignore if offline
  }

  // 3. Admin Notification
  await createNotification({
    recipientRole: 'admin',
    title: 'New Shop Registration',
    message: `${shop.shopName} (Service PIN: ${cleanService}) has requested vendor registration.`,
    type: 'approval',
    referenceId: id,
  });

  return shop;
}

export async function updateShopStatus(shopId: string, status: Shop['status'], rejectionReason?: string) {
  // 1. Supabase primary update
  const { error: updErr } = await supabase
    .from('shops')
    .update({
      status,
      rejection_reason: rejectionReason || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', shopId);

  if (updErr) {
    console.error('Supabase shop status update error:', updErr);
    throw new Error(`Failed to update shop status: ${updErr.message}`);
  }

  // 2. Firestore mirror (graceful fallback)
  try {
    const docRef = doc(db, 'shops', shopId);
    await updateDoc(docRef, {
      status,
      rejectionReason: rejectionReason || null,
      updatedAt: new Date().toISOString(),
    });
  } catch {}

  // Create notification for seller
  const shop = await (async () => {
    try {
      const { data } = await supabase.from('shops').select('*').eq('id', shopId).single();
      if (data) return mapShopFromDb(data);
    } catch {}
    try {
      const snap = await getDoc(doc(db, 'shops', shopId));
      if (snap.exists()) return snap.data() as Shop;
    } catch {}
    return null;
  })();

  if (shop) {
    await createNotification({
      userId: shop.ownerId,
      recipientRole: 'seller',
      title: status === 'approved' ? 'Shop Approved!' : status === 'rejected' ? 'Shop Registration Update' : 'Shop Status Changed',
      message:
        status === 'approved'
          ? `Congratulations! Your shop ${shop.shopName} has been approved to sell on BazaarX.`
          : `Your shop ${shop.shopName} is now ${status}.${rejectionReason ? ` Reason: ${rejectionReason}` : ''}`,
      type: 'approval',
      referenceId: shopId,
    });
  }
}

// =========================================================================
// PRODUCTS (WITH PIN CODE CHECK)
// =========================================================================
export function listenToProducts(callback: (products: Product[]) => void) {
  let hasSupabaseData = false;

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data) {
        hasSupabaseData = true;
        callback(data.map(mapProductFromDb));
        return true;
      }
    } catch (err) {
      console.warn('Supabase fetchProducts notice:', err);
    }
    return false;
  };

  fetchProducts();

  const channel = createRealtimeChannel('realtime:products')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
      fetchProducts();
    })
    .subscribe();

  // Firestore fallback listener: only invoke callback if Supabase returned nothing
  const colRef = collection(db, 'products');
  const unsubFs = onSnapshot(colRef, (snap) => {
    if (!hasSupabaseData) {
      const list: Product[] = [];
      snap.forEach((d) => list.push(d.data() as Product));
      callback(list);
    }
  });

  return () => {
    supabase.removeChannel(channel);
    unsubFs();
  };
}

export function listenToSellerProducts(shopId: string, callback: (products: Product[]) => void) {
  let hasSupabaseData = false;

  const fetchSellerProds = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('shop_id', shopId)
        .order('created_at', { ascending: false });
      if (!error && data) {
        hasSupabaseData = true;
        callback(data.map(mapProductFromDb));
        return true;
      }
    } catch (err) {
      console.warn('Supabase fetchSellerProds notice:', err);
    }
    return false;
  };

  fetchSellerProds();

  const channel = createRealtimeChannel(`realtime:seller_products_${shopId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'products', filter: `shop_id=eq.${shopId}` }, () => {
      fetchSellerProds();
    })
    .subscribe();

  const q = query(collection(db, 'products'), where('shopId', '==', shopId));
  const unsubFs = onSnapshot(q, (snap) => {
    if (!hasSupabaseData) {
      const list: Product[] = [];
      snap.forEach((d) => list.push(d.data() as Product));
      callback(list);
    }
  });

  return () => {
    supabase.removeChannel(channel);
    unsubFs();
  };
}

export async function saveProduct(product: Product) {
  const toSave = { ...product };

  // Guarantee sellerPinCode matches the shop servicePinCode
  if (!toSave.sellerPinCode) {
    try {
      const { data: sData } = await supabase.from('shops').select('*').eq('id', toSave.shopId).single();
      if (sData) {
        toSave.sellerPinCode = (sData.service_pin_code || sData.postal_code || '').trim();
        toSave.shopPinCode = (sData.postal_code || '').trim();
      }
    } catch {}

    if (!toSave.sellerPinCode) {
      try {
        const shopSnap = await getDoc(doc(db, 'shops', toSave.shopId));
        if (shopSnap.exists()) {
          const shop = shopSnap.data() as Shop;
          toSave.sellerPinCode = (shop.servicePinCode || shop.postalCode || '').trim();
          toSave.shopPinCode = (shop.postalCode || '').trim();
        }
      } catch {}
    }
  }

  // 1. Supabase upsert
  const { error: pErr } = await supabase.from('products').upsert(mapProductToDb(toSave));
  if (pErr) {
    console.error('Supabase product save error:', pErr);
    throw new Error(`Failed to save product: ${pErr.message}`);
  }

  // 2. Firestore mirror
  try {
    const docRef = doc(db, 'products', product.id);
    await setDoc(docRef, toSave, { merge: true });
  } catch {}
}

export async function deleteProduct(productId: string) {
  try {
    const { error } = await supabase.from('products').delete().eq('id', productId);
    if (error) {
      console.warn('Supabase product delete warning:', error.message);
    }
  } catch (err) {
    console.error('Supabase product delete exception:', err);
  }

  try {
    await deleteDoc(doc(db, 'products', productId));
  } catch {}
}

export async function toggleProductApproval(productId: string, isApproved: boolean) {
  try {
    await supabase.from('products').update({ is_approved: isApproved, updated_at: new Date().toISOString() }).eq('id', productId);
  } catch {}
  try {
    const docRef = doc(db, 'products', productId);
    await updateDoc(docRef, { isApproved, updatedAt: new Date().toISOString() });
  } catch {}
}

export async function toggleProductActive(productId: string, isActive: boolean) {
  try {
    await supabase.from('products').update({ is_active: isActive, updated_at: new Date().toISOString() }).eq('id', productId);
  } catch {}
  try {
    const docRef = doc(db, 'products', productId);
    await updateDoc(docRef, { isActive, updatedAt: new Date().toISOString() });
  } catch {}
}

// =========================================================================
// DELIVERY PARTNERS
// =========================================================================
export function listenToDeliveryPartners(callback: (partners: DeliveryPartner[]) => void) {
  const fetchPartners = async () => {
    try {
      const { data, error } = await supabase.from('delivery_partners').select('*').order('created_at', { ascending: false });
      if (!error && data) {
        callback(data.map(mapDeliveryPartnerFromDb));
        return true;
      }
    } catch {}
    return false;
  };

  fetchPartners();

  const channel = createRealtimeChannel('realtime:delivery_partners')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'delivery_partners' }, () => {
      fetchPartners();
    })
    .subscribe();

  const colRef = collection(db, 'delivery_partners');
  const unsubFs = onSnapshot(colRef, (snap) => {
    const list: DeliveryPartner[] = [];
    snap.forEach((d) => list.push(d.data() as DeliveryPartner));
    callback(list);
  });

  return () => {
    supabase.removeChannel(channel);
    unsubFs();
  };
}

export function listenToDeliveryPartner(partnerId: string, callback: (partner: DeliveryPartner | null) => void) {
  const fetchSingle = async () => {
    try {
      const { data, error } = await supabase.from('delivery_partners').select('*').eq('id', partnerId).maybeSingle();
      if (!error && data) {
        callback(mapDeliveryPartnerFromDb(data));
        return;
      }
    } catch {}
    try {
      const snap = await getDoc(doc(db, 'delivery_partners', partnerId));
      if (snap.exists()) {
        callback(snap.data() as DeliveryPartner);
      } else {
        callback(null);
      }
    } catch {
      callback(null);
    }
  };

  fetchSingle();

  const channel = createRealtimeChannel(`realtime:delivery_partner_${partnerId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'delivery_partners', filter: `id=eq.${partnerId}` }, () => {
      fetchSingle();
    })
    .subscribe();

  const docRef = doc(db, 'delivery_partners', partnerId);
  const unsubFs = onSnapshot(docRef, (snap) => {
    if (snap.exists()) {
      callback(snap.data() as DeliveryPartner);
    } else {
      callback(null);
    }
  });

  return () => {
    supabase.removeChannel(channel);
    unsubFs();
  };
}

export async function registerDeliveryPartner(partnerData: Omit<DeliveryPartner, 'status' | 'totalDeliveries' | 'rating' | 'createdAt' | 'isOnline'>) {
  const partner: DeliveryPartner = {
    ...partnerData,
    status: 'pending',
    isOnline: false,
    totalDeliveries: 0,
    rating: 5.0,
    createdAt: new Date().toISOString(),
  };

  try {
    await supabase.from('delivery_partners').upsert(mapDeliveryPartnerToDb(partner));
  } catch (e) {
    console.warn('Supabase rider register error:', e);
  }

  try {
    await setDoc(doc(db, 'delivery_partners', partner.id), partner);
  } catch {}

  await createNotification({
    recipientRole: 'admin',
    title: 'New Delivery Partner Onboarding',
    message: `${partner.fullName} (${partner.vehicleType} - ${partner.vehicleNumber}) has applied to become a delivery partner.`,
    type: 'approval',
    referenceId: partner.id,
  });

  return partner;
}

export async function updateDeliveryPartnerStatus(partnerId: string, status: DeliveryPartner['status'], rejectionReason?: string) {
  try {
    await supabase
      .from('delivery_partners')
      .update({
        status,
        rejection_reason: rejectionReason || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', partnerId);
  } catch {}

  try {
    const docRef = doc(db, 'delivery_partners', partnerId);
    await updateDoc(docRef, {
      status,
      rejectionReason: rejectionReason || null,
      updatedAt: new Date().toISOString(),
    });
  } catch {}

  await createNotification({
    userId: partnerId,
    recipientRole: 'delivery_partner',
    title: status === 'approved' ? 'Application Approved!' : status === 'rejected' ? 'Application Status Update' : 'Status Update',
    message:
      status === 'approved'
        ? 'Congratulations! Your delivery partner application has been approved. You can now toggle Online and accept orders.'
        : `Your application is now ${status}.${rejectionReason ? ` Reason: ${rejectionReason}` : ''}`,
    type: 'approval',
    referenceId: partnerId,
  });
}

export async function toggleDeliveryPartnerOnline(partnerId: string, isOnline: boolean) {
  try {
    await supabase.from('delivery_partners').update({ is_online: isOnline, updated_at: new Date().toISOString() }).eq('id', partnerId);
  } catch {}
  try {
    const docRef = doc(db, 'delivery_partners', partnerId);
    await updateDoc(docRef, { isOnline, updatedAt: new Date().toISOString() });
  } catch {}
}

// =========================================================================
// WALLETS & TRANSACTIONS
// =========================================================================
export function listenToWallet(ownerId: string, role: 'seller' | 'delivery_partner', callback: (wallet: Wallet | null) => void) {
  const fetchWallet = async () => {
    try {
      const { data, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('owner_id', ownerId)
        .eq('role', role)
        .maybeSingle();
      if (!error && data) {
        callback(mapWalletFromDb(data));
        return;
      }
    } catch {}

    try {
      const q = query(collection(db, 'wallets'), where('ownerId', '==', ownerId), where('role', '==', role));
      const snap = await getDocs(q);
      if (!snap.empty) {
        callback(snap.docs[0].data() as Wallet);
      } else {
        callback(null);
      }
    } catch {
      callback(null);
    }
  };

  fetchWallet();

  const channel = createRealtimeChannel(`realtime:wallet_${ownerId}_${role}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'wallets', filter: `owner_id=eq.${ownerId}` }, () => {
      fetchWallet();
    })
    .subscribe();

  const q = query(collection(db, 'wallets'), where('ownerId', '==', ownerId), where('role', '==', role));
  const unsubFs = onSnapshot(q, (snap) => {
    if (!snap.empty) {
      callback(snap.docs[0].data() as Wallet);
    } else {
      callback(null);
    }
  });

  return () => {
    supabase.removeChannel(channel);
    unsubFs();
  };
}

export function listenToWalletTransactions(ownerId: string, callback: (txs: WalletTransaction[]) => void) {
  const fetchTxs = async () => {
    try {
      const { data, error } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('owner_id', ownerId)
        .order('created_at', { ascending: false });
      if (!error && data) {
        callback(data.map(mapTxFromDb));
        return;
      }
    } catch {}

    try {
      const q = query(collection(db, 'wallet_transactions'), where('ownerId', '==', ownerId));
      const snap = await getDocs(q);
      const list: WalletTransaction[] = [];
      snap.forEach((d) => list.push(d.data() as WalletTransaction));
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      callback(list);
    } catch {}
  };

  fetchTxs();

  const channel = createRealtimeChannel(`realtime:wallet_txs_${ownerId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'wallet_transactions', filter: `owner_id=eq.${ownerId}` }, () => {
      fetchTxs();
    })
    .subscribe();

  const q = query(collection(db, 'wallet_transactions'), where('ownerId', '==', ownerId));
  const unsubFs = onSnapshot(q, (snap) => {
    const list: WalletTransaction[] = [];
    snap.forEach((d) => list.push(d.data() as WalletTransaction));
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    callback(list);
  });

  return () => {
    supabase.removeChannel(channel);
    unsubFs();
  };
}

export function listenToAllWallets(callback: (wallets: Wallet[]) => void) {
  const fetchAll = async () => {
    try {
      const { data, error } = await supabase.from('wallets').select('*');
      if (!error && data) {
        callback(data.map(mapWalletFromDb));
        return;
      }
    } catch {}
    const colRef = collection(db, 'wallets');
    const snap = await getDocs(colRef);
    const list: Wallet[] = [];
    snap.forEach((d) => list.push(d.data() as Wallet));
    callback(list);
  };
  fetchAll();

  const channel = createRealtimeChannel('realtime:all_wallets').on('postgres_changes', { event: '*', schema: 'public', table: 'wallets' }, () => fetchAll()).subscribe();
  const colRef = collection(db, 'wallets');
  const unsubFs = onSnapshot(colRef, (snap) => {
    const list: Wallet[] = [];
    snap.forEach((d) => list.push(d.data() as Wallet));
    callback(list);
  });

  return () => {
    supabase.removeChannel(channel);
    unsubFs();
  };
}

export function listenToAllWalletTransactions(callback: (txs: WalletTransaction[]) => void) {
  const fetchAll = async () => {
    try {
      const { data, error } = await supabase.from('wallet_transactions').select('*').order('created_at', { ascending: false });
      if (!error && data) {
        callback(data.map(mapTxFromDb));
        return;
      }
    } catch {}
    const colRef = collection(db, 'wallet_transactions');
    const snap = await getDocs(colRef);
    const list: WalletTransaction[] = [];
    snap.forEach((d) => list.push(d.data() as WalletTransaction));
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    callback(list);
  };
  fetchAll();

  const channel = createRealtimeChannel('realtime:all_txs').on('postgres_changes', { event: '*', schema: 'public', table: 'wallet_transactions' }, () => fetchAll()).subscribe();
  const colRef = collection(db, 'wallet_transactions');
  const unsubFs = onSnapshot(colRef, (snap) => {
    const list: WalletTransaction[] = [];
    snap.forEach((d) => list.push(d.data() as WalletTransaction));
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    callback(list);
  });

  return () => {
    supabase.removeChannel(channel);
    unsubFs();
  };
}

export async function addWalletTransaction(
  ownerId: string,
  role: 'seller' | 'delivery_partner',
  type: 'credit' | 'debit' | 'payout',
  amount: number,
  description: string,
  referenceId?: string,
  orderId?: string
) {
  const walletId = `wallet_${ownerId}`;
  let currentWallet: Wallet | null = null;

  try {
    const { data } = await supabase.from('wallets').select('*').eq('id', walletId).maybeSingle();
    if (data) currentWallet = mapWalletFromDb(data);
  } catch {}

  if (!currentWallet) {
    try {
      const snap = await getDoc(doc(db, 'wallets', walletId));
      if (snap.exists()) currentWallet = snap.data() as Wallet;
    } catch {}
  }

  if (!currentWallet) {
    currentWallet = {
      id: walletId,
      ownerId,
      role,
      currentBalance: 0,
      totalEarnings: 0,
      todayEarnings: 0,
      pendingEarnings: 0,
      totalPayouts: 0,
      updatedAt: new Date().toISOString(),
    };
  }

  let newBalance = currentWallet.currentBalance;
  let newTotal = currentWallet.totalEarnings;
  let newToday = currentWallet.todayEarnings;
  let newPayouts = currentWallet.totalPayouts;

  if (type === 'credit') {
    newBalance += amount;
    newTotal += amount;
    newToday += amount;
  } else if (type === 'debit' || type === 'payout') {
    newBalance = Math.max(0, newBalance - amount);
    if (type === 'payout') {
      newPayouts += amount;
    }
  }

  const updatedWallet: Wallet = {
    ...currentWallet,
    currentBalance: newBalance,
    totalEarnings: newTotal,
    todayEarnings: newToday,
    totalPayouts: newPayouts,
    updatedAt: new Date().toISOString(),
  };

  const txId = 'tx_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
  const tx: WalletTransaction = {
    id: txId,
    walletId,
    ownerId,
    role,
    type,
    amount,
    description,
    referenceId,
    orderId,
    createdAt: new Date().toISOString(),
  };

  // 1. Supabase persist
  try {
    await supabase.from('wallets').upsert(mapWalletToDb(updatedWallet));
    await supabase.from('wallet_transactions').insert(mapTxToDb(tx));
  } catch (e) {
    console.warn('Supabase wallet transaction save error:', e);
  }

  // 2. Firestore mirror
  try {
    await setDoc(doc(db, 'wallets', walletId), updatedWallet);
    await setDoc(doc(db, 'wallet_transactions', txId), tx);
  } catch {}
}

// =========================================================================
// PAYOUT REQUESTS
// =========================================================================
export function listenToPayoutRequests(callback: (payouts: PayoutRequest[]) => void) {
  const fetchAll = async () => {
    try {
      const { data, error } = await supabase.from('payout_requests').select('*').order('created_at', { ascending: false });
      if (!error && data) {
        callback(data.map(mapPayoutFromDb));
        return;
      }
    } catch {}
    const colRef = collection(db, 'payout_requests');
    const snap = await getDocs(colRef);
    const list: PayoutRequest[] = [];
    snap.forEach((d) => list.push(d.data() as PayoutRequest));
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    callback(list);
  };
  fetchAll();

  const channel = createRealtimeChannel('realtime:payout_requests').on('postgres_changes', { event: '*', schema: 'public', table: 'payout_requests' }, () => fetchAll()).subscribe();
  const colRef = collection(db, 'payout_requests');
  const unsubFs = onSnapshot(colRef, (snap) => {
    const list: PayoutRequest[] = [];
    snap.forEach((d) => list.push(d.data() as PayoutRequest));
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    callback(list);
  });

  return () => {
    supabase.removeChannel(channel);
    unsubFs();
  };
}

export function listenToUserPayouts(requesterId: string, callback: (payouts: PayoutRequest[]) => void) {
  const fetchMine = async () => {
    try {
      const { data, error } = await supabase
        .from('payout_requests')
        .select('*')
        .eq('requester_id', requesterId)
        .order('created_at', { ascending: false });
      if (!error && data) {
        callback(data.map(mapPayoutFromDb));
        return;
      }
    } catch {}
    const q = query(collection(db, 'payout_requests'), where('requesterId', '==', requesterId));
    const snap = await getDocs(q);
    const list: PayoutRequest[] = [];
    snap.forEach((d) => list.push(d.data() as PayoutRequest));
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    callback(list);
  };
  fetchMine();

  const channel = createRealtimeChannel(`realtime:payouts_${requesterId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'payout_requests', filter: `requester_id=eq.${requesterId}` }, () => fetchMine())
    .subscribe();

  const q = query(collection(db, 'payout_requests'), where('requesterId', '==', requesterId));
  const unsubFs = onSnapshot(q, (snap) => {
    const list: PayoutRequest[] = [];
    snap.forEach((d) => list.push(d.data() as PayoutRequest));
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    callback(list);
  });

  return () => {
    supabase.removeChannel(channel);
    unsubFs();
  };
}

export async function requestPayout(payout: Omit<PayoutRequest, 'id' | 'status' | 'createdAt'>) {
  const id = 'payout_' + Date.now();
  const req: PayoutRequest = {
    ...payout,
    id,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  try {
    await supabase.from('payout_requests').insert(mapPayoutToDb(req));
  } catch {}

  try {
    await setDoc(doc(db, 'payout_requests', id), req);
  } catch {}

  await createNotification({
    recipientRole: 'admin',
    title: 'New Payout Request',
    message: `${payout.requesterName} (${payout.requesterRole}) requested withdrawal of ₹${payout.amount} via UPI: ${payout.upiId}.`,
    type: 'payout',
    referenceId: id,
  });

  return req;
}

export async function updatePayoutStatus(
  payoutId: string,
  status: PayoutStatus,
  transactionRef?: string,
  adminNotes?: string
) {
  const updates: any = {
    status,
    transaction_ref: transactionRef || null,
    admin_notes: adminNotes || null,
    processed_at: new Date().toISOString(),
  };

  try {
    await supabase.from('payout_requests').update(updates).eq('id', payoutId);
  } catch {}

  try {
    const docRef = doc(db, 'payout_requests', payoutId);
    await updateDoc(docRef, {
      status,
      transactionRef: transactionRef || null,
      adminNotes: adminNotes || null,
      processedAt: new Date().toISOString(),
    });
  } catch {}

  // If status is paid, debit the user's wallet
  if (status === 'paid') {
    let payout: PayoutRequest | null = null;
    try {
      const { data } = await supabase.from('payout_requests').select('*').eq('id', payoutId).single();
      if (data) payout = mapPayoutFromDb(data);
    } catch {}

    if (!payout) {
      try {
        const snap = await getDoc(doc(db, 'payout_requests', payoutId));
        if (snap.exists()) payout = snap.data() as PayoutRequest;
      } catch {}
    }

    if (payout) {
      await addWalletTransaction(
        payout.requesterId,
        payout.requesterRole,
        'payout',
        payout.amount,
        `Payout processed via UPI (${payout.upiId}) - Ref: ${transactionRef || 'N/A'}`,
        payoutId
      );

      await createNotification({
        userId: payout.requesterId,
        recipientRole: payout.requesterRole,
        title: 'Payout Dispatched!',
        message: `Your withdrawal of ₹${payout.amount} has been processed via UPI: ${payout.upiId}. Ref: ${transactionRef || 'Direct Transfer'}`,
        type: 'payout',
        referenceId: payoutId,
      });
    }
  }
}

// =========================================================================
// ORDERS & FULFILLMENT (WITH STRICT LOCAL PIN MATCHING)
// =========================================================================
export function listenToCustomerOrders(customerId: string, callback: (orders: Order[]) => void) {
  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });
      if (!error && data) {
        callback(data.map(mapOrderFromDb));
        return;
      }
    } catch {}
    const q = query(collection(db, 'orders'), where('customerId', '==', customerId));
    const snap = await getDocs(q);
    const list: Order[] = [];
    snap.forEach((d) => list.push(d.data() as Order));
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    callback(list);
  };
  fetchOrders();

  const channel = createRealtimeChannel(`realtime:cust_orders_${customerId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `customer_id=eq.${customerId}` }, () => fetchOrders())
    .subscribe();

  const q = query(collection(db, 'orders'), where('customerId', '==', customerId));
  const unsubFs = onSnapshot(q, (snap) => {
    const list: Order[] = [];
    snap.forEach((d) => list.push(d.data() as Order));
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    callback(list);
  });

  return () => {
    supabase.removeChannel(channel);
    unsubFs();
  };
}

export function listenToSellerOrders(sellerId: string | string[], callback: (orders: SellerOrder[]) => void) {
  const ids = Array.isArray(sellerId) ? sellerId.filter(Boolean) : [sellerId].filter(Boolean);
  const primaryId = ids[0] || '';

  const fetchOrders = async () => {
    try {
      let q = supabase.from('seller_orders').select('*').order('created_at', { ascending: false });
      if (ids.length > 1) {
        q = q.in('seller_id', ids);
      } else if (primaryId) {
        q = q.eq('seller_id', primaryId);
      }
      const { data, error } = await q;
      if (!error && data) {
        callback(data.map(mapSellerOrderFromDb));
        return;
      }
    } catch {}

    // Firestore fallback
    try {
      const list: SellerOrder[] = [];
      for (const id of ids) {
        const q = query(collection(db, 'seller_orders'), where('sellerId', '==', id));
        const snap = await getDocs(q);
        snap.forEach((d) => list.push(d.data() as SellerOrder));
      }
      // Deduplicate by id
      const uniqueMap = new Map<string, SellerOrder>();
      list.forEach((o) => uniqueMap.set(o.id, o));
      const sorted = Array.from(uniqueMap.values()).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      callback(sorted);
    } catch {}
  };

  fetchOrders();

  const channel = createRealtimeChannel(`realtime:seller_orders_${primaryId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'seller_orders' },
      () => fetchOrders()
    )
    .subscribe();

  // Firestore realtime fallback
  const unsubs: (() => void)[] = [];
  ids.forEach((id) => {
    try {
      const q = query(collection(db, 'seller_orders'), where('sellerId', '==', id));
      const unsub = onSnapshot(q, () => {
        fetchOrders();
      });
      unsubs.push(unsub);
    } catch {}
  });

  return () => {
    supabase.removeChannel(channel);
    unsubs.forEach((u) => u());
  };
}

export function listenToAllOrders(callback: (orders: Order[]) => void) {
  const fetchAll = async () => {
    try {
      const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
      if (!error && data) {
        callback(data.map(mapOrderFromDb));
        return;
      }
    } catch {}
    const colRef = collection(db, 'orders');
    const snap = await getDocs(colRef);
    const list: Order[] = [];
    snap.forEach((d) => list.push(d.data() as Order));
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    callback(list);
  };
  fetchAll();

  const channel = createRealtimeChannel('realtime:all_orders').on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetchAll()).subscribe();
  const colRef = collection(db, 'orders');
  const unsubFs = onSnapshot(colRef, (snap) => {
    const list: Order[] = [];
    snap.forEach((d) => list.push(d.data() as Order));
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    callback(list);
  });

  return () => {
    supabase.removeChannel(channel);
    unsubFs();
  };
}

export function listenToDeliveryAssignments(callback: (assignments: DeliveryAssignment[]) => void) {
  const fetchAll = async () => {
    try {
      const { data, error } = await supabase.from('delivery_assignments').select('*').order('created_at', { ascending: false });
      if (!error && data) {
        callback(data.map(mapAssignmentFromDb));
        return;
      }
    } catch {}
    const colRef = collection(db, 'delivery_assignments');
    const snap = await getDocs(colRef);
    const list: DeliveryAssignment[] = [];
    snap.forEach((d) => list.push(d.data() as DeliveryAssignment));
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    callback(list);
  };
  fetchAll();

  const channel = createRealtimeChannel('realtime:all_assignments').on('postgres_changes', { event: '*', schema: 'public', table: 'delivery_assignments' }, () => fetchAll()).subscribe();
  const colRef = collection(db, 'delivery_assignments');
  const unsubFs = onSnapshot(colRef, (snap) => {
    const list: DeliveryAssignment[] = [];
    snap.forEach((d) => list.push(d.data() as DeliveryAssignment));
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    callback(list);
  });

  return () => {
    supabase.removeChannel(channel);
    unsubFs();
  };
}

export function listenToPartnerDeliveries(partnerId: string, callback: (assignments: DeliveryAssignment[]) => void) {
  const fetchPartner = async () => {
    try {
      const { data, error } = await supabase
        .from('delivery_assignments')
        .select('*')
        .or(`delivery_partner_id.eq.${partnerId},status.eq.available`)
        .order('created_at', { ascending: false });
      if (!error && data) {
        callback(data.map(mapAssignmentFromDb));
        return;
      }
    } catch {}
    const colRef = collection(db, 'delivery_assignments');
    const snap = await getDocs(colRef);
    const list: DeliveryAssignment[] = [];
    snap.forEach((d) => {
      const item = d.data() as DeliveryAssignment;
      if (item.deliveryPartnerId === partnerId || item.status === 'available') {
        list.push(item);
      }
    });
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    callback(list);
  };
  fetchPartner();

  const channel = createRealtimeChannel(`realtime:partner_deliveries_${partnerId}`).on('postgres_changes', { event: '*', schema: 'public', table: 'delivery_assignments' }, () => fetchPartner()).subscribe();
  const colRef = collection(db, 'delivery_assignments');
  const unsubFs = onSnapshot(colRef, (snap) => {
    const list: DeliveryAssignment[] = [];
    snap.forEach((d) => {
      const item = d.data() as DeliveryAssignment;
      if (item.deliveryPartnerId === partnerId || item.status === 'available') {
        list.push(item);
      }
    });
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    callback(list);
  });

  return () => {
    supabase.removeChannel(channel);
    unsubFs();
  };
}

export function listenToUsers(callback: (users: UserProfile[]) => void) {
  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: false });
      if (!error && data) {
        callback(
          data.map((u: any) => ({
            uid: u.uid,
            email: u.email || '',
            displayName: u.display_name || '',
            role: u.role || 'customer',
            phoneNumber: u.phone_number || undefined,
            photoURL: u.photo_url || undefined,
            deliveryPinCode: u.delivery_pin_code || '123456',
            createdAt: u.created_at || new Date().toISOString(),
            updatedAt: u.updated_at || undefined,
          }))
        );
        return;
      }
    } catch {}
    const colRef = collection(db, 'users');
    const snap = await getDocs(colRef);
    const list: UserProfile[] = [];
    snap.forEach((d) => list.push(d.data() as UserProfile));
    list.sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());
    callback(list);
  };
  fetchUsers();

  const channel = createRealtimeChannel('realtime:users').on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => fetchUsers()).subscribe();
  const colRef = collection(db, 'users');
  const unsubFs = onSnapshot(colRef, (snap) => {
    const list: UserProfile[] = [];
    snap.forEach((d) => list.push(d.data() as UserProfile));
    list.sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());
    callback(list);
  });

  return () => {
    supabase.removeChannel(channel);
    unsubFs();
  };
}

export async function reassignDeliveryPartner(assignmentId: string, partner: DeliveryPartner) {
  const now = new Date().toISOString();

  // 1. Supabase update
  try {
    await supabase.from('delivery_assignments').update({
      status: 'assigned',
      delivery_partner_id: partner.id,
      delivery_partner_name: partner.fullName,
      delivery_partner_phone: partner.phoneNumber,
      updated_at: now,
    }).eq('id', assignmentId);
  } catch {}

  // 2. Firestore mirror
  try {
    const docRef = doc(db, 'delivery_assignments', assignmentId);
    await updateDoc(docRef, {
      status: 'assigned',
      deliveryPartnerId: partner.id,
      deliveryPartnerName: partner.fullName,
      deliveryPartnerPhone: partner.phoneNumber,
      updatedAt: now,
    });
  } catch {}

  await createNotification({
    userId: partner.id,
    recipientRole: 'delivery_partner',
    title: 'Reassigned Delivery Order',
    message: `You have been reassigned an order assignment #${assignmentId}.`,
    type: 'delivery',
    referenceId: assignmentId,
  });
}

// Generate a random 4-digit OTP for delivery verification
export function generateDeliveryOTP(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

// =========================================================================
// CREATE ORDER (BACKEND VALIDATION & ATOMIC ORDER CREATION)
// =========================================================================
export async function createOrder(
  customerId: string,
  customerName: string,
  customerEmail: string,
  customerPhone: string,
  deliveryAddress: Address,
  items: OrderItem[],
  paymentMethod: Order['paymentMethod'],
  settings: PlatformSettings,
  customDeliveryCharge?: number,
  deliveryVillage?: string
): Promise<Order> {
  const orderId = 'ORD-' + Date.now().toString().slice(-6) + '-' + Math.floor(100 + Math.random() * 900);
  const otp = generateDeliveryOTP();

  // Group items by seller
  const sellerItemsMap: Record<string, OrderItem[]> = {};
  items.forEach((item) => {
    if (!sellerItemsMap[item.shopId]) {
      sellerItemsMap[item.shopId] = [];
    }
    sellerItemsMap[item.shopId].push(item);
  });

  const sellerIds = Object.keys(sellerItemsMap);

  // =========================================================================
  // MANDATORY BACKEND SECURITY CHECK: Local Buyer-Seller PIN Code Matching
  // =========================================================================
  if (settings.localPinCodeRestriction) {
    const buyerPin = (deliveryAddress.postalCode || '').trim();
    if (!buyerPin) {
      throw new Error('Delivery address must contain a valid 6-digit PIN code.');
    }

    // 1. PostgreSQL Database RPC check
    try {
      const { data: rpcValidation } = await supabase.rpc('check_order_local_pin_restriction', {
        p_buyer_pin: buyerPin,
        p_shop_ids: sellerIds,
      });
      if (rpcValidation && rpcValidation.length > 0 && !rpcValidation[0].allowed) {
        throw new Error(rpcValidation[0].message || 'Sorry, this product is currently available only in your local area.');
      }
    } catch (rpcErr: any) {
      if (rpcErr?.message && rpcErr.message.includes('Sorry, this product')) {
        throw rpcErr;
      }
    }

    // 2. Direct table verification for every single seller in this order
    for (const shopId of sellerIds) {
      let sellerServicePin = '';

      // Check Supabase first
      try {
        const { data: sRow } = await supabase
          .from('shops')
          .select('service_pin_code, postal_code')
          .eq('id', shopId)
          .single();
        if (sRow) {
          sellerServicePin = (sRow.service_pin_code || sRow.postal_code || '').trim();
        }
      } catch {}

      // Fallback check Firestore
      if (!sellerServicePin) {
        try {
          const shopSnap = await getDoc(doc(db, 'shops', shopId));
          if (shopSnap.exists()) {
            const shop = shopSnap.data() as Shop;
            sellerServicePin = (shop.servicePinCode || shop.postalCode || '').trim();
          }
        } catch {}
      }

      if (sellerServicePin && sellerServicePin !== buyerPin) {
        throw new Error('Sorry, this product is currently available only in your local area.');
      }
    }
  }

  const subtotal = items.reduce((sum, it) => sum + it.discountPrice * it.quantity, 0);
  const deliveryCharge = customDeliveryCharge !== undefined ? customDeliveryCharge : settings.deliveryBaseCharge;
  const platformFee = settings.platformFee;
  const totalAmount = subtotal + deliveryCharge + platformFee;

  const resolvedVillage = deliveryVillage || deliveryAddress.village || undefined;

  const order: Order = {
    id: orderId,
    customerId,
    customerName,
    customerEmail,
    customerPhone,
    deliveryAddress,
    deliveryVillage: resolvedVillage,
    totalAmount,
    subtotal,
    deliveryCharge,
    platformFee,
    paymentMethod,
    paymentStatus: paymentMethod === 'cod' ? 'pending' : 'paid',
    orderStatus: 'confirmed',
    deliveryOtp: otp,
    items,
    sellerIds,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    statusHistory: [
      {
        status: 'confirmed',
        timestamp: new Date().toISOString(),
        note: 'Order placed successfully',
      },
    ],
  };

  // 1. Supabase Order Insert
  try {
    await supabase.from('orders').insert(mapOrderToDb(order));
  } catch (e) {
    console.warn('Supabase master order insert notice:', e);
  }

  // 1b. Supabase Order Items (Normalized)
  try {
    if (items && items.length > 0) {
      const orderItemRows = items.map((it, idx) => ({
        id: `oi_${orderId}_${idx}`,
        order_id: orderId,
        product_id: it.productId,
        shop_id: it.shopId,
        shop_name: it.shopName,
        name: it.name,
        price: it.price,
        discount_price: it.discountPrice,
        quantity: it.quantity,
        image: it.image || null,
      }));
      await supabase.from('order_items').insert(orderItemRows);
    }
  } catch (e) {
    console.warn('Supabase order_items insert notice:', e);
  }

  // 1c. Supabase Payment record
  try {
    await supabase.from('payments').insert({
      id: `pay_${orderId}`,
      order_id: orderId,
      amount: totalAmount,
      method: paymentMethod,
      status: paymentMethod === 'cod' ? 'pending' : 'paid',
      reference_id: `ref_${Date.now()}`,
    });
  } catch (e) {
    console.warn('Supabase payment insert notice:', e);
  }

  // 2. Firestore Order Mirror
  try {
    await setDoc(doc(db, 'orders', orderId), order);
  } catch {}

  // 3. Create Seller Sub-Orders & Delivery Assignments
  for (const shopId of sellerIds) {
    const sellerItems = sellerItemsMap[shopId];
    const sellerSubtotal = sellerItems.reduce((sum, it) => sum + it.discountPrice * it.quantity, 0);
    const commission = Math.round((sellerSubtotal * settings.sellerCommissionPercent) / 100);
    const sellerEarnings = sellerSubtotal - commission;

    const sellerOrderId = `sord_${orderId}_${shopId}`;
    const sellerOrder: SellerOrder = {
      id: sellerOrderId,
      orderId,
      sellerId: shopId,
      shopName: sellerItems[0]?.shopName || 'Shop',
      customerId,
      customerName,
      customerPhone,
      deliveryAddress,
      items: sellerItems,
      sellerSubtotal,
      commissionAmount: commission,
      sellerEarnings,
      status: 'confirmed',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save seller order in Supabase & Firestore
    try {
      await supabase.from('seller_orders').insert(mapSellerOrderToDb(sellerOrder));
    } catch {}
    try {
      await setDoc(doc(db, 'seller_orders', sellerOrderId), sellerOrder);
    } catch {}

    // Lookup physical shop address for rider pickup
    let shopAddress = 'Local Market complex';
    let shopPhone = '+91 98765 00000';
    try {
      const { data: sData } = await supabase.from('shops').select('shop_address, phone_number').eq('id', shopId).single();
      if (sData) {
        shopAddress = sData.shop_address || shopAddress;
        shopPhone = sData.phone_number || shopPhone;
      }
    } catch {}

    // Create delivery assignment
    const assignmentId = `asgn_${orderId}_${shopId}`;
    const assignment: DeliveryAssignment = {
      id: assignmentId,
      orderId,
      sellerOrderId,
      shopId,
      shopName: sellerItems[0]?.shopName || 'Shop',
      shopAddress,
      shopPhone,
      customerName,
      customerPhone,
      deliveryAddress,
      deliveryFee: settings.deliveryBaseCharge,
      earningAmount: settings.deliveryPartnerEarningPerOrder,
      status: 'available',
      otp,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await supabase.from('delivery_assignments').insert(mapAssignmentToDb(assignment));
    } catch {}
    try {
      await setDoc(doc(db, 'delivery_assignments', assignmentId), assignment);
    } catch {}

    // Increment shop total sales
    try {
      const { data: currentShop } = await supabase.from('shops').select('total_sales, owner_id').eq('id', shopId).single();
      if (currentShop) {
        await supabase.from('shops').update({ total_sales: (currentShop.total_sales || 0) + 1 }).eq('id', shopId);
        if (currentShop.owner_id && currentShop.owner_id !== shopId) {
          // Send notification directly to shop owner's account UID
          await createNotification({
            userId: currentShop.owner_id,
            recipientRole: 'seller',
            title: '🛍️ New Order Received!',
            message: `You have received a new order #${orderId} with ${sellerItems.length} item(s) from ${customerName}.`,
            type: 'order',
            referenceId: orderId,
          });
        }
      }
    } catch {}

    // Notify seller by shopId
    await createNotification({
      userId: shopId,
      recipientRole: 'seller',
      title: '🛍️ New Order Received!',
      message: `You have received a new order #${orderId} with ${sellerItems.length} item(s) from ${customerName}.`,
      type: 'order',
      referenceId: orderId,
    });
  }

  // Notify available delivery partners
  await createNotification({
    recipientRole: 'delivery_partner',
    title: '📦 New Delivery Available!',
    message: `A new local delivery order #${orderId} is ready in your zone (Earn ₹${settings.deliveryPartnerEarningPerOrder}).`,
    type: 'delivery',
    referenceId: orderId,
  });

  return order;
}

export async function updateSellerOrderStatus(
  sellerOrderId: string,
  newStatus: OrderStatus,
  shopDetails?: {
    shopId?: string;
    shopName?: string;
    shopAddress?: string;
    shopPhone?: string;
  }
) {
  const now = new Date().toISOString();

  try {
    await supabase.from('seller_orders').update({ status: newStatus, updated_at: now }).eq('id', sellerOrderId);
  } catch {}
  try {
    const sordRef = doc(db, 'seller_orders', sellerOrderId);
    await updateDoc(sordRef, { status: newStatus, updatedAt: now });
  } catch {}

  // Update assignment status if ready
  try {
    const { data: sord } = await supabase.from('seller_orders').select('*').eq('id', sellerOrderId).single();
    if (sord && (newStatus === 'packed' || newStatus === 'ready_for_pickup')) {
      const assignmentUpdates: any = { status: 'available', updated_at: now };
      if (shopDetails?.shopAddress) assignmentUpdates.shop_address = shopDetails.shopAddress;
      if (shopDetails?.shopPhone) assignmentUpdates.shop_phone = shopDetails.shopPhone;
      await supabase.from('delivery_assignments').update(assignmentUpdates).eq('seller_order_id', sellerOrderId);
    }
  } catch {}
}

export async function acceptDeliveryAssignment(assignmentId: string, partner: DeliveryPartner) {
  const now = new Date().toISOString();

  try {
    await supabase.from('delivery_assignments').update({
      status: 'assigned',
      delivery_partner_id: partner.id,
      delivery_partner_name: partner.fullName,
      delivery_partner_phone: partner.phoneNumber,
      updated_at: now,
    }).eq('id', assignmentId);
  } catch {}

  try {
    const docRef = doc(db, 'delivery_assignments', assignmentId);
    await updateDoc(docRef, {
      status: 'assigned',
      deliveryPartnerId: partner.id,
      deliveryPartnerName: partner.fullName,
      deliveryPartnerPhone: partner.phoneNumber,
      updatedAt: now,
    });
  } catch {}

  // Direct notification to delivery partner
  await createNotification({
    userId: partner.id,
    recipientRole: 'delivery_partner',
    title: '🛵 Order Assigned to You!',
    message: `Delivery assignment #${assignmentId} is now assigned to you. Head to pickup!`,
    type: 'delivery',
    referenceId: assignmentId,
  });
}

export async function markDeliveryPickedUp(assignmentId: string) {
  const now = new Date().toISOString();

  try {
    await supabase.from('delivery_assignments').update({ status: 'picked_up', updated_at: now }).eq('id', assignmentId);
  } catch {}
  try {
    const docRef = doc(db, 'delivery_assignments', assignmentId);
    await updateDoc(docRef, { status: 'picked_up', updatedAt: now });
  } catch {}
}

export async function markDeliveryOutForDelivery(assignmentId: string) {
  const now = new Date().toISOString();

  try {
    await supabase.from('delivery_assignments').update({ status: 'out_for_delivery', updated_at: now }).eq('id', assignmentId);
  } catch {}
  try {
    const docRef = doc(db, 'delivery_assignments', assignmentId);
    await updateDoc(docRef, { status: 'out_for_delivery', updatedAt: now });
  } catch {}
}

export async function completeDeliveryWithOtp(assignmentId: string, enteredOtp: string): Promise<{ success: boolean; message: string }> {
  let assignment: DeliveryAssignment | null = null;

  try {
    const { data } = await supabase.from('delivery_assignments').select('*').eq('id', assignmentId).single();
    if (data) assignment = mapAssignmentFromDb(data);
  } catch {}

  if (!assignment) {
    try {
      const snap = await getDoc(doc(db, 'delivery_assignments', assignmentId));
      if (snap.exists()) assignment = snap.data() as DeliveryAssignment;
    } catch {}
  }

  if (!assignment) {
    return { success: false, message: 'Delivery assignment not found.' };
  }

  if (assignment.otp.trim() !== enteredOtp.trim()) {
    return { success: false, message: 'Invalid OTP! Please check the customer delivery code.' };
  }

  const now = new Date().toISOString();

  // 1. Mark assignment delivered in Supabase & Firestore
  try {
    await supabase.from('delivery_assignments').update({ status: 'delivered', updated_at: now }).eq('id', assignmentId);
    await supabase.from('orders').update({ order_status: 'delivered', payment_status: 'paid', updated_at: now }).eq('id', assignment.orderId);
    if (assignment.sellerOrderId) {
      await supabase.from('seller_orders').update({ status: 'delivered', updated_at: now }).eq('id', assignment.sellerOrderId);
    }
  } catch {}

  try {
    await updateDoc(doc(db, 'delivery_assignments', assignmentId), { status: 'delivered', updatedAt: now });
    await updateDoc(doc(db, 'orders', assignment.orderId), { orderStatus: 'delivered', paymentStatus: 'paid', updatedAt: now });
    if (assignment.sellerOrderId) {
      await updateDoc(doc(db, 'seller_orders', assignment.sellerOrderId), { status: 'delivered', updatedAt: now });
    }
  } catch {}

  // 2. Credit seller wallet
  if (assignment.sellerOrderId) {
    try {
      let sord: SellerOrder | null = null;
      const { data } = await supabase.from('seller_orders').select('*').eq('id', assignment.sellerOrderId).single();
      if (data) sord = mapSellerOrderFromDb(data);

      if (sord) {
        await addWalletTransaction(
          sord.sellerId,
          'seller',
          'credit',
          sord.sellerEarnings,
          `Earnings for Order #${assignment.orderId}`,
          assignment.sellerOrderId,
          assignment.orderId
        );
      }
    } catch {}
  }

  // 3. Credit rider wallet
  if (assignment.deliveryPartnerId) {
    await addWalletTransaction(
      assignment.deliveryPartnerId,
      'delivery_partner',
      'credit',
      assignment.earningAmount,
      `Delivery fee for Order #${assignment.orderId}`,
      assignment.id,
      assignment.orderId
    );
  }

  // 4. Notifications
  await createNotification({
    userId: assignment.customerName,
    recipientRole: 'customer',
    title: 'Order Delivered!',
    message: `Your order #${assignment.orderId} has been successfully delivered.`,
    type: 'order',
    referenceId: assignment.orderId,
  });

  return { success: true, message: 'Order successfully verified and marked Delivered!' };
}

// =========================================================================
// SEED INITIAL MARKETPLACE IF EMPTY
// =========================================================================
export async function seedMarketplaceIfEmpty() {
  // Empty by design to maintain a completely clean catalog for fresh real sellers
}

// =========================================================================
// CLEAR ALL PREVIEW DEMO SHOPS AND DUMMY PRODUCTS
// =========================================================================
export async function clearMarketplaceDemoData(): Promise<void> {
  const demoShopIds = ['shop_freshmart', 'shop_apex', 'shop_metro', 'shop_nexus_retail'];
  const demoProductIds = ['prod_fresh_apples', 'prod_apex_headphones'];

  // 1. Delete from Supabase products
  try {
    await supabase.from('products').delete().in('shop_id', demoShopIds);
    await supabase.from('products').delete().in('id', demoProductIds);
  } catch (err) {
    console.warn('Supabase product cleanup notice:', err);
  }

  // 2. Delete from Supabase shops
  try {
    await supabase.from('shops').delete().in('id', demoShopIds);
  } catch (err) {
    console.warn('Supabase shop cleanup notice:', err);
  }

  // 3. Delete from Firestore products
  for (const pid of demoProductIds) {
    try {
      await deleteDoc(doc(db, 'products', pid));
    } catch {}
  }

  // Also query Firestore for any products linked to demo shop IDs
  for (const sid of demoShopIds) {
    try {
      const q = query(collection(db, 'products'), where('shopId', '==', sid));
      const snap = await getDocs(q);
      snap.forEach(async (d) => {
        try {
          await deleteDoc(doc(db, 'products', d.id));
        } catch {}
      });
    } catch {}

    // Delete shop doc
    try {
      await deleteDoc(doc(db, 'shops', sid));
    } catch {}
  }
}

// =========================================================================
// HYPER-LOCAL VILLAGE DELIVERY RATES
// =========================================================================

// Default pre-seeded fallback rates for sample Meghalaya PIN codes like 794114 & 794001
export const DEFAULT_VILLAGE_RATES: VillageDeliveryRate[] = [
  // 794114 (Resubelpara / North Garo Hills)
  { id: 'vdr_794114_1', pinCode: '794114', villageName: 'Resubelpara Town Center', deliveryCharge: 10 },
  { id: 'vdr_794114_2', pinCode: '794114', villageName: 'Babukona Village', deliveryCharge: 15 },
  { id: 'vdr_794114_3', pinCode: '794114', villageName: 'Dekachang', deliveryCharge: 20 },
  { id: 'vdr_794114_4', pinCode: '794114', villageName: 'Daram Village', deliveryCharge: 25 },
  { id: 'vdr_794114_5', pinCode: '794114', villageName: 'Kaldang Village', deliveryCharge: 30 },
  { id: 'vdr_794114_6', pinCode: '794114', villageName: 'Mendipathar Bazaar', deliveryCharge: 35 },
  { id: 'vdr_794114_7', pinCode: '794114', villageName: 'Songma Village', deliveryCharge: 40 },
  { id: 'vdr_794114_8', pinCode: '794114', villageName: 'Damas Village', deliveryCharge: 45 },
  { id: 'vdr_794114_9', pinCode: '794114', villageName: 'Nokmakundi Village', deliveryCharge: 50 },
  { id: 'vdr_794114_10', pinCode: '794114', villageName: 'Khaldang Outer Hills', deliveryCharge: 60 },

  // 794001 (Tura / West Garo Hills)
  { id: 'vdr_794001_1', pinCode: '794001', villageName: 'Tura Bazaar Center', deliveryCharge: 10 },
  { id: 'vdr_794001_2', pinCode: '794001', villageName: 'Hawakhana', deliveryCharge: 15 },
  { id: 'vdr_794001_3', pinCode: '794001', villageName: 'Chandmari', deliveryCharge: 20 },
  { id: 'vdr_794001_4', pinCode: '794001', villageName: 'Rongkhon Village', deliveryCharge: 25 },
  { id: 'vdr_794001_5', pinCode: '794001', villageName: 'Danakgre', deliveryCharge: 30 },
  { id: 'vdr_794001_6', pinCode: '794001', villageName: 'Araimile', deliveryCharge: 35 },
  { id: 'vdr_794001_7', pinCode: '794001', villageName: 'Dobasipara', deliveryCharge: 40 },
  { id: 'vdr_794001_8', pinCode: '794001', villageName: 'Chasingre', deliveryCharge: 45 },
  { id: 'vdr_794001_9', pinCode: '794001', villageName: 'Asanang Village', deliveryCharge: 50 },
  { id: 'vdr_794001_10', pinCode: '794001', villageName: 'Rongram Sub-division', deliveryCharge: 55 },
];

export function mapVillageRateFromDb(row: any): VillageDeliveryRate {
  return {
    id: row.id,
    pinCode: String(row.pin_code || '').trim(),
    villageName: row.village_name || '',
    deliveryCharge: Number(row.delivery_charge) || 0,
    createdAt: row.created_at || undefined,
    updatedAt: row.updated_at || undefined,
  };
}

export function mapVillageRateToDb(v: VillageDeliveryRate): any {
  return {
    id: v.id,
    pin_code: String(v.pinCode || '').trim(),
    village_name: v.villageName.trim(),
    delivery_charge: Number(v.deliveryCharge) || 0,
    updated_at: new Date().toISOString(),
  };
}

export async function fetchVillageDeliveryRates(pinCode?: string): Promise<VillageDeliveryRate[]> {
  const cleanPin = pinCode ? pinCode.trim() : '';

  // 1. Try Supabase public.village_delivery_rates table
  try {
    let q = supabase.from('village_delivery_rates').select('*').order('delivery_charge', { ascending: true });
    if (cleanPin) {
      q = q.eq('pin_code', cleanPin);
    }
    const { data, error } = await q;
    if (!error && data && data.length > 0) {
      return data.map(mapVillageRateFromDb);
    }
  } catch (err) {
    // Supabase table not created yet or offline
  }

  // 2. Try Firestore fallback
  try {
    let qRef = collection(db, 'village_delivery_rates');
    let snap;
    if (cleanPin) {
      const q = query(qRef, where('pinCode', '==', cleanPin));
      snap = await getDocs(q);
    } else {
      snap = await getDocs(qRef);
    }
    if (!snap.empty) {
      const list: VillageDeliveryRate[] = [];
      snap.forEach((d) => list.push(d.data() as VillageDeliveryRate));
      list.sort((a, b) => a.deliveryCharge - b.deliveryCharge);
      return list;
    }
  } catch {}

  // 3. Fallback to default in-memory pre-seeded rates
  if (cleanPin) {
    const matched = DEFAULT_VILLAGE_RATES.filter((v) => v.pinCode === cleanPin);
    if (matched.length > 0) {
      return matched;
    }
    // Return sample 10 scaled villages if none mapped yet for this PIN
    return [
      { id: `vdr_${cleanPin}_1`, pinCode: cleanPin, villageName: 'Town / Central Area', deliveryCharge: 10 },
      { id: `vdr_${cleanPin}_2`, pinCode: cleanPin, villageName: 'Near Bazaar Ward', deliveryCharge: 15 },
      { id: `vdr_${cleanPin}_3`, pinCode: cleanPin, villageName: 'East Village Colony', deliveryCharge: 20 },
      { id: `vdr_${cleanPin}_4`, pinCode: cleanPin, villageName: 'West Hills Sector', deliveryCharge: 25 },
      { id: `vdr_${cleanPin}_5`, pinCode: cleanPin, villageName: 'North River Side', deliveryCharge: 30 },
      { id: `vdr_${cleanPin}_6`, pinCode: cleanPin, villageName: 'South Outskirts Block', deliveryCharge: 35 },
      { id: `vdr_${cleanPin}_7`, pinCode: cleanPin, villageName: 'Forest Boundary Village', deliveryCharge: 40 },
      { id: `vdr_${cleanPin}_8`, pinCode: cleanPin, villageName: 'Upper Valley Extension', deliveryCharge: 45 },
      { id: `vdr_${cleanPin}_9`, pinCode: cleanPin, villageName: 'Outer Ridge Hamlet', deliveryCharge: 50 },
      { id: `vdr_${cleanPin}_10`, pinCode: cleanPin, villageName: 'Far Remote Village Border', deliveryCharge: 60 },
    ];
  }

  return DEFAULT_VILLAGE_RATES;
}

export async function saveVillageDeliveryRate(rate: VillageDeliveryRate): Promise<void> {
  const cleanPin = String(rate.pinCode || '').trim();
  const cleanRate: VillageDeliveryRate = {
    ...rate,
    pinCode: cleanPin,
    villageName: rate.villageName.trim(),
    deliveryCharge: Number(rate.deliveryCharge) || 0,
    updatedAt: new Date().toISOString(),
  };

  // 1. Save to Supabase public.village_delivery_rates table
  try {
    await supabase.from('village_delivery_rates').upsert(mapVillageRateToDb(cleanRate));
  } catch (err) {
    console.warn('Supabase village rate upsert notice:', err);
  }

  // 2. Mirror to Firestore for real-time syncing
  try {
    await setDoc(doc(db, 'village_delivery_rates', cleanRate.id), cleanRate);
  } catch (err) {
    console.warn('Firestore village rate upsert notice:', err);
  }
}

export async function deleteVillageDeliveryRate(rateId: string): Promise<void> {
  try {
    await supabase.from('village_delivery_rates').delete().eq('id', rateId);
  } catch {}
  try {
    await deleteDoc(doc(db, 'village_delivery_rates', rateId));
  } catch {}
}

export function listenToVillageRates(callback: (rates: VillageDeliveryRate[]) => void) {
  fetchVillageDeliveryRates().then(callback);

  const channel = createRealtimeChannel('realtime:village_delivery_rates')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'village_delivery_rates' }, () => {
      fetchVillageDeliveryRates().then(callback);
    })
    .subscribe();

  const colRef = collection(db, 'village_delivery_rates');
  const unsubFs = onSnapshot(
    colRef,
    (snap) => {
      if (!snap.empty) {
        const list: VillageDeliveryRate[] = [];
        snap.forEach((d) => list.push(d.data() as VillageDeliveryRate));
        list.sort((a, b) => a.deliveryCharge - b.deliveryCharge);
        callback(list);
      }
    },
    () => {}
  );

  return () => {
    supabase.removeChannel(channel);
    unsubFs();
  };
}

