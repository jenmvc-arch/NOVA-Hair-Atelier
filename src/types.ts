export interface CatalogItem {
  id: string;
  name: string;
  price: number;
  category: 'Services' | 'Retail';
  displayCategory?: string; // For shorter text, e.g. "Deep Cond."
  sku?: string;
  image?: string;
}

export interface DailyOperatingHour {
  day: string;
  isOpen: boolean;
  openTime?: string;
  closeTime?: string;
}

export interface CompanyInfo {
  name: string;
  address: string;
  operatingHours: string;
  ssmNumber: string;
  contactInfo: string;
  logo?: string;
  dailyHours?: DailyOperatingHour[];
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  stylist: string;
  category: 'Services' | 'Retail';
  sku?: string;
}

export interface Appointment {
  id: string;
  clientName: string;
  clientPhone: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  serviceName: string;
  stylist: string;
  price: number;
  checkedOut: boolean;
}

export interface Stylist {
  id: string;
  name: string;
  role: string;
  utilization: number; // e.g. 92 for 92%
}

export interface Employee {
  id: string;
  name: string;
  gender: string;
  position: string;
  employmentType: string;
}

export interface Transaction {
  id: string; // #TX-9021 or similar
  date: string; // YYYY-MM-DD
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  clientName: string;
  clientPhone: string;
}

export interface PaymentMethodItem {
  id: string;
  name: string;
  type: 'QR' | 'Bank Transfer' | 'Card' | 'Digital Wallet' | 'Cash' | 'Other';
  details?: string;
  isEnabled: boolean;
}

export interface PaymentConfig {
  bankName: string;
  accountName: string;
  accountNo: string;
  duitNowQR: string;
  tngQR: string;
  customMethods?: PaymentMethodItem[];
}

export interface ClientRecord {
  name: string;
  phone: string;
  visits: number;
  spend: number;
  lastStylist: string;
  points: number;
  birthday?: string; // e.g. "1994-07-12"
  registeredAt?: string; // e.g. "2024-01-15"
  customerCategory?: 'New' | 'Existing';
  acquisitionSource?: 'Facebook' | 'Google' | 'Instagram' | 'XiaoHongShu' | 'Friend Referral' | 'Walk-In' | 'Others';
  acquisitionSourceOther?: string;
  stylistNotes?: string;
  hairProfileNotes?: string;
}
