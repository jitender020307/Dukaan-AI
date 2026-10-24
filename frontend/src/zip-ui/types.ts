export type NavTab = 'dashboard' | 'orders' | 'inventory' | 'assistant' | 'khata' | 'system' | 'addproduct';

export interface InventoryProduct {
  id: string;
  name: string;
  nameHi: string;
  barcode: string;
  category: string;
  stock: number;
  unit: string;
  minThreshold: number;
  leadDays?: number;
  costPrice: number;
  sellingPrice: number;
  mrp: number;
  distributor: string;
  distributorPhone: string;
  dailyAvgSales?: number;
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

/** Draft extracted from a natural-language "add product" message, before confirmation. */
export interface ChatProductDraft {
  name: string;
  nameHi: string;
  barcode: string;
  category: string;
  stock: number;
  unit: string;
  minStock: number;
  costPrice: number;
  sellingPrice: number;
  mrp: number;
  distributor: string;
  distributorPhone: string;
  leadDays: number;
  /** Fields the parser could not confidently extract from the message. */
  missingFields: string[];
  /** Human-readable note about how each field was interpreted. */
  fieldNotes: Record<string, string>;
}

export interface ChatProductResult {
  success: boolean;
  productId: string;
  name: string;
  stock: number;
  message: string;
}

/** Restock recommendation computed from recent sales history. */
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


