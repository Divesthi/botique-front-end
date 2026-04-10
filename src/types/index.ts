// Type definitions for BQOM Backend API

export type UserRole = 'PLATFORM_ADMIN' | 'TENANT_ADMIN' | 'TENANT_USER';

export interface AuthUser {
  id: number;
  supabaseUid: string;
  email: string;
  displayName: string;
  phoneNumber?: string;
  tenantCode: string;
  tenantName?: string;
  role: UserRole;
}

export type OrderStatus = 'fresh' | 'in_progress' | 'completed' | 'delivered';
export type BillStatus = 'fresh' | 'closed' | 'pending';

export interface Tenant {
  id?: number;
  name: string;
  code: string;
  address?: string;
  phoneNumber?: string;
  startedDate?: string;
  churnedDate?: string;
  active?: boolean;
}

export interface TenantFormData extends Omit<Tenant, 'id'> { }

export interface Customer {
  id?: number;
  name: string;
  mobileNo: string;
  address?: string;
  alternateContactNo?: string;
  tenantId?: string;
  tenantCode?: string;
  creationDate?: string;
  updatedDate?: string;
}

export interface CustomerMeasurement {
  id?: number;
  mobileNo: string;
  dressType: string;
  name: string;
  measurement: Record<string, any>; // Flexible JSON object
  remarks?: string;
  creationDate?: string;
  updatedDate?: string;
}

export interface OrderItemCost {
  id?: number;
  orderItemId?: number;
  cost: number;
  type: string;
  mobileNo?: string;
}

export interface OrderItem {
  id?: number;
  orderId?: number;
  measurementId: number;
  mobileNo: string;
  quantity: number;
  costPerQuantity: number;
  remarks?: string;
  status?: OrderStatus;
  itemsCost?: OrderItemCost[];
}

export interface Order {
  id?: number;
  mobileNo: string;
  receivedDate?: string;
  cuttingDate?: string;
  packagingDate?: string;
  deliveryDate?: string;
  totalItems: number;
  remarks?: string;
  status: OrderStatus;
  total: number;
  advance: number;
  balance: number;
  estimateAmount?: string; // JSON string
  orderItems?: OrderItem[];
  updatedDate?: string;
  deliveredDate?: string;
}

export interface Bill {
  id?: number;
  mobileNo: string;
  createdDate?: string;
  totalAmount: number;
  advancePaid: number;
  balanceAmount: number;
  status: BillStatus;
  discount?: string;
  remarks?: string;
  orders?: Order[];
  updatedDate?: string;
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

// Form types for create/edit operations
export interface CustomerFormData extends Omit<Customer, 'id' | 'creationDate'> { }
export interface MeasurementFormData extends Omit<CustomerMeasurement, 'id' | 'creationDate'> { }
export interface OrderFormData extends Omit<Order, 'id' | 'receivedDate'> { }
export interface BillFormData extends Omit<Bill, 'id' | 'createdDate'> { }

// Dashboard statistics
export interface DashboardStats {
  totalRevenue: number;
  activeOrders: number;
  pendingOrders: number;
  completedToday: number;
  recentOrders: Order[];
}
