// Data Model sesuai PRD Section 5

export type Role = 'Manager' | 'Kasir' | 'Acaraki';

export interface User {
  id: string;
  name: string;
  username: string;
  password: string; // In MVP ini plain (future: hash)
  role: Role;
  createdAt: string;
}

export interface InventoryItem {
  id: string; // slug
  name: string;
  stock: number;
  unit: string; // kg, L, pcs, dll
  costPerUnit: number; // harga dasar untuk hitung HPP
  minStock?: number; // threshold alert (default 3)
}

export interface AddOn {
  name: string;
  price: number;
}

export interface Menu {
  id: string;
  name: string;
  category: string;
  price: number;
  image?: string;
  isBestSeller?: boolean;
  isAvailable?: boolean; // default true, false = nonaktif sementara
  ingredients: Record<string, number>; // { inventory_id: amount }
  availableAddons: AddOn[];
  description?: string;
  manualHpp?: number;
}

export type Temperature = 'Hangat' | 'Dingin';
export type SugarLevel = 'Normal' | 'Less' | 'None';
export type PaymentMethod = 'Cash' | 'QRIS' | 'Transfer';
export type KitchenStatus = 'Waiting' | 'Processing' | 'Done';
export type TxStatus = 'Selesai' | 'Cancel' | 'Demo';

export interface CartItem {
  lineId: string; // unique per line
  menuId: string;
  name: string;
  basePrice: number;
  quantity: number;
  temperature: Temperature;
  sugar: SugarLevel;
  addons: AddOn[];
  subtotal: number; // (basePrice + sum(addons)) * qty
}

export interface Transaction {
  id: string;
  queueNumber: number;
  date: string; // ISO
  items: CartItem[];
  subtotal: number;
  discount: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  cashReceived?: number;
  change?: number;
  kitchenStatus: KitchenStatus;
  txStatus: TxStatus;
  cashierId: string;
  cashierName: string;
  customerId?: string; // opsional (CRM)
  customerName?: string;
  hpp: number; // total cost of goods sold
}

// CRM (extension beyond PRD MVP)
export interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  notes?: string;
  totalSpent: number;
  visitCount: number;
  lastVisit?: string;
  createdAt: string;
}

export interface AppSettings {
  managerPin: string;
  storeName: string;
  storeLogo?: string; // base64 data URL
  address?: string;
  taxPercent?: number;
  categories: string[]; // daftar kategori menu
  // Printer settings
  printerEnabled: boolean;
  printerType: 'browser' | 'bluetooth'; // browser = window.print, bluetooth = Web Bluetooth API
  printerWidth: '58mm' | '80mm';
  autoPrintOnCheckout: boolean;
  // Super Admin & Demo
  superAdminPin: string; // PIN untuk akses Manajemen Data (hanya developer)
  demoMode: boolean; // true = tampilkan demo accounts di login
}

// Shift Management
export interface CashierShift {
  id: string;
  userId: string;
  userName: string;
  openedAt: string; // ISO
  closedAt?: string; // ISO
  openingCash: number; // modal awal
  closingCash?: number; // kas akhir di laci (input manual)
  expectedCash?: number; // kalkulasi sistem (opening + cash sales)
  cashDifference?: number; // closingCash - expectedCash
  totalSales: number;
  totalTransactions: number;
  status: 'open' | 'closed';
}


// Promo & Voucher
export type PromoType = 'percentage' | 'fixed'; // persentase atau nominal tetap
export type PromoScope = 'all' | 'category' | 'menu' | 'loyalty'; // berlaku untuk apa

export interface Promo {
  id: string;
  name: string;
  code?: string; // voucher code (opsional)
  type: PromoType;
  value: number; // persentase (0-100) atau nominal Rp
  scope: PromoScope;
  scopeTarget?: string; // category name atau menu id (jika scope bukan 'all')
  minPurchase?: number; // minimal belanja
  maxDiscount?: number; // maks potongan (untuk persentase)
  startDate: string; // ISO
  endDate: string; // ISO
  isActive: boolean;
  usageLimit?: number; // maks penggunaan
  usageCount: number; // sudah dipakai berapa kali
  loyaltyMinVisits?: number; // min kunjungan untuk promo loyalty
  createdAt: string;
}

// Loyalty
export interface LoyaltySettings {
  enabled: boolean;
  pointsPerTransaction: number; // poin per transaksi
  pointsPerRupiah: number; // poin per Rp (misal 1 poin per 10000)
  redeemPointsValue: number; // 1 poin = berapa Rp diskon
  tierBronzeMinVisits: number;
  tierSilverMinVisits: number;
  tierGoldMinVisits: number;
  tierBronzeDiscount: number; // % diskon
  tierSilverDiscount: number;
  tierGoldDiscount: number;
}

// Audit Log
export type AuditAction =
  | 'login' | 'logout'
  | 'create_transaction' | 'void_transaction' | 'delete_transaction'
  | 'create_menu' | 'update_menu' | 'delete_menu' | 'toggle_menu'
  | 'create_user' | 'update_user' | 'delete_user'
  | 'create_inventory' | 'update_inventory' | 'delete_inventory' | 'deduct_inventory'
  | 'open_shift' | 'close_shift'
  | 'update_settings' | 'create_promo' | 'update_promo' | 'delete_promo'
  | 'create_customer' | 'update_customer' | 'delete_customer';

export interface AuditLogEntry {
  id: string;
  userId: string;
  userName: string;
  userRole: Role;
  action: AuditAction;
  detail: string;
  timestamp: string; // ISO
  metadata?: Record<string, any>;
}
