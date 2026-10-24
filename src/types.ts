export type NavTab = 'overview' | 'inventory' | 'sales' | 'customers' | 'domain' | 'privacy' | 'terms';

export interface InventoryItem {
  id: string;
  name: string;
  nameHi: string;
  category: 'Dairy' | 'Atta & Dal' | 'Edible Oil' | 'Spices & Salt' | 'Biscuits & Snacks' | 'Cleaning & Household';
  stock: number;
  unit: string;
  minThreshold: number;
  costPrice: number;
  sellingPrice: number;
  mrp: number;
  distributor: string;
  distributorPhone: string;
  distributorLeadDays: number;
  dailyAvgSales: number;
  status: 'out_of_stock' | 'low_stock' | 'in_stock';
}

export interface SaleItem {
  itemId: string;
  itemName: string;
  quantity: number;
  pricePerUnit: number;
  total: number;
}

export interface SaleRecord {
  id: string;
  invoiceNo: string;
  time: string;
  customerName?: string;
  items: SaleItem[];
  totalAmount: number;
  paymentMethod: 'cash' | 'upi' | 'khata';
}

export interface CustomerKhata {
  id: string;
  name: string;
  phone: string;
  address: string;
  balanceDue: number; // Positive = customer owes money (Udhaar)
  lastPaymentDate: string;
  creditLimit: number;
  status: 'active' | 'warning' | 'settled';
  transactions: {
    id: string;
    date: string;
    type: 'udhaar' | 'jama';
    amount: number;
    description: string;
  }[];
}

export interface RestockRecommendation {
  itemId: string;
  itemName: string;
  category: string;
  subtitle: string;
  currentStock: number;
  dailyAvgSales: number;
  leadTimeDays: number;
  bufferStock: number;
  recommendedOrder: number;
  confidence: 'high' | 'medium' | 'low';
  confidenceNote: string;
  mathExplanation: string;
}

export interface CustomDomainConfig {
  domain: string;
  status: 'connected' | 'verifying' | 'dns_pending';
  sslStatus: 'active' | 'issuing';
  aRecord: string;
  cnameRecord: string;
  lastChecked: string;
}
