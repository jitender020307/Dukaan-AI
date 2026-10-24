export type NavTab = 'dashboard' | 'orders' | 'inventory' | 'assistant' | 'khata' | 'system';

export interface InventoryProduct {
  id: string;
  name: string;
  nameHi: string;
  barcode: string;
  category: string;
  stock: number;
  unit: string;
  minThreshold: number;
  costPrice: number;
  sellingPrice: number;
  mrp: number;
  distributor: string;
  distributorPhone: string;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  pricePerUnit: number;
  total: number;
}

export interface Order {
  id: string;
  invoiceNo: string;
  customerName: string;
  customerPhone?: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  paymentMethod: 'cash' | 'upi' | 'khata';
  items: OrderItem[];
  subtotal: number;
  discount: number;
  tax: number;
  totalAmount: number;
  createdAt: string;
  rejectionReason?: string;
}

export interface KhataTransaction {
  id: string;
  date: string;
  type: 'udhaar' | 'jama';
  amount: number;
  description: string;
}

export interface CustomerRecord {
  id: string;
  name: string;
  phone: string;
  address: string;
  balanceDue: number;
  creditLimit: number;
  status: 'active' | 'warning' | 'settled';
  lastPaymentDate: string;
  transactions: KhataTransaction[];
}

export interface ActivityItem {
  id: string;
  timestamp: string;
  description: string;
  type: 'order' | 'inventory' | 'khata';
}

export interface DashboardData {
  todaySales: number;
  todayBillsCount: number;
  recentOrders: Order[];
  pendingOrdersCount: number;
  lowStockCount: number;
  totalProducts: number;
  pendingOrders: Order[];
  lowStockProducts: InventoryProduct[];
  recentActivity: ActivityItem[];
}

export interface ParsedItem {
  productId: string;
  productName: string;
  quantity: number;
  pricePerUnit: number;
  total: number;
  unit: string;
  stockAvailable: number;
}

export interface AssistantParseResult {
  customerMessage: string;
  parsedItems: ParsedItem[];
  clarificationsNeeded: string[];
  confirmedSummary: {
    itemsCount: number;
    subtotal: number;
    deliveryFee: number;
    total: number;
    canPlaceOrder: boolean;
  };
}

export interface SystemStatusData {
  status: string;
  service: string;
  uptimeSeconds: number;
  uptimeHuman: string;
  database: string;
  activeEndpoints: string[];
  itemsCount: number;
  ordersCount: number;
  customersCount: number;
  lastSync: string;
}
