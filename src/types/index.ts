export type UserRole = 'customer' | 'seller' | 'delivery_partner' | 'admin';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  phoneNumber?: string;
  photoURL?: string;
  deliveryPinCode?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Address {
  id: string;
  userId: string;
  fullName: string;
  phoneNumber: string;
  streetAddress: string;
  city: string;
  state: string;
  postalCode: string;
  village?: string;
  landmark?: string;
  isDefault: boolean;
  addressType: 'home' | 'work' | 'other';
}

export type ShopStatus = 'pending_approval' | 'approved' | 'rejected' | 'suspended';

export interface BankDetails {
  accountHolderName: string;
  accountNumber: string;
  ifsc: string;
  upiId?: string;
}

export interface Shop {
  id: string;
  ownerId: string;
  shopName: string;
  ownerName: string;
  email: string;
  phoneNumber: string;
  shopAddress: string;
  city: string;
  state: string;
  postalCode: string;
  servicePinCode: string;
  category: string;
  description: string;
  logoUrl?: string;
  panNumber?: string;
  bankDetails: BankDetails;
  status: ShopStatus;
  rating: number;
  totalProducts: number;
  totalSales: number;
  createdAt: string;
  rejectionReason?: string;
}

export interface ProductSpecification {
  key: string;
  value: string;
}

export interface Product {
  id: string;
  shopId: string;
  shopName: string;
  name: string;
  category: string;
  description: string;
  price: number;
  discountPrice: number;
  stock: number;
  sku?: string;
  images: string[];
  specifications: Record<string, string>;
  isActive: boolean;
  isApproved: boolean;
  deliveryAvailable: boolean;
  createdAt: string;
  rating?: number;
  reviewCount?: number;
  sellerPinCode?: string;
  shopPinCode?: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  image?: string;
  description?: string;
  order: number;
}

export interface CartItem {
  productId: string;
  shopId: string;
  shopName: string;
  name: string;
  price: number;
  discountPrice: number;
  quantity: number;
  image: string;
  stock: number;
  sellerPinCode?: string;
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'packed'
  | 'ready_for_pickup'
  | 'assigned_to_delivery_partner'
  | 'picked_up'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'returned';

export type PaymentMethod = 'upi' | 'card' | 'cod';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface OrderItem {
  productId: string;
  shopId: string;
  shopName: string;
  name: string;
  price: number;
  discountPrice: number;
  quantity: number;
  image: string;
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryAddress: Address;
  deliveryVillage?: string;
  totalAmount: number;
  subtotal: number;
  deliveryCharge: number;
  platformFee: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  deliveryPartnerId?: string;
  deliveryPartnerName?: string;
  deliveryPartnerPhone?: string;
  deliveryOtp: string;
  items: OrderItem[];
  sellerIds: string[];
  createdAt: string;
  updatedAt: string;
  statusHistory?: {
    status: OrderStatus;
    timestamp: string;
    note?: string;
  }[];
}

export interface SellerOrder {
  id: string;
  orderId: string;
  sellerId: string;
  shopName: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: Address;
  items: OrderItem[];
  sellerSubtotal: number;
  commissionAmount: number;
  sellerEarnings: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
}

export type DeliveryPartnerStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

export interface DeliveryPartner {
  id: string; // matches user uid
  fullName: string;
  email: string;
  phoneNumber: string;
  photoURL?: string;
  dateOfBirth?: string;
  address: string;
  serviceArea: string;
  vehicleType: 'Bike' | 'Scooter' | 'Bicycle' | 'Electric Vehicle' | 'Other';
  vehicleNumber: string;
  drivingLicenceNumber: string;
  idProofNumber: string;
  bankDetails: BankDetails;
  status: DeliveryPartnerStatus;
  isOnline: boolean;
  totalDeliveries: number;
  rating: number;
  createdAt: string;
  rejectionReason?: string;
}

export type AssignmentStatus =
  | 'available'
  | 'assigned'
  | 'picked_up'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'rejected';

export interface DeliveryAssignment {
  id: string;
  orderId: string;
  sellerOrderId?: string;
  deliveryPartnerId?: string;
  deliveryPartnerName?: string;
  deliveryPartnerPhone?: string;
  shopId: string;
  shopName: string;
  shopAddress: string;
  shopPhone?: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: Address;
  deliveryFee: number;
  earningAmount: number;
  status: AssignmentStatus;
  otp: string;
  createdAt: string;
  updatedAt: string;
}

export interface Wallet {
  id: string;
  ownerId: string;
  role: 'seller' | 'delivery_partner';
  currentBalance: number;
  totalEarnings: number;
  todayEarnings: number;
  pendingEarnings: number;
  totalPayouts: number;
  updatedAt: string;
}

export interface WalletTransaction {
  id: string;
  walletId: string;
  ownerId: string;
  role: 'seller' | 'delivery_partner';
  type: 'credit' | 'debit' | 'payout';
  amount: number;
  description: string;
  referenceId?: string;
  orderId?: string;
  createdAt: string;
}

export type PayoutStatus = 'pending' | 'approved' | 'processing' | 'paid' | 'rejected';

export interface PayoutRequest {
  id: string;
  requesterId: string;
  requesterName: string;
  requesterRole: 'seller' | 'delivery_partner';
  shopId?: string;
  amount: number;
  upiId: string;
  bankDetails?: BankDetails;
  status: PayoutStatus;
  transactionRef?: string;
  adminNotes?: string;
  createdAt: string;
  processedAt?: string;
}

export interface AppNotification {
  id: string;
  userId?: string;
  recipientRole?: UserRole | 'all';
  title: string;
  message: string;
  type: 'order' | 'delivery' | 'payout' | 'system' | 'approval';
  referenceId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface VillageDeliveryRate {
  id: string;
  pinCode: string;
  villageName: string;
  deliveryCharge: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface PlatformSettings {
  id: string;
  sellerCommissionPercent: number; // e.g. 5%
  platformFee: number; // e.g. ₹5
  deliveryBaseCharge: number; // e.g. ₹40
  deliveryPartnerEarningPerOrder: number; // e.g. ₹35
  minPayoutAmount: number; // e.g. ₹100
  autoApproveProducts: boolean;
  cashOnDeliveryEnabled: boolean;
  localPinCodeRestriction: boolean; // Strict local buyer-to-local-seller PIN matching (Default: true)
  updatedAt: string;
}
