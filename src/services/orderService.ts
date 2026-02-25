import apiClient from './api';
import type { Order, OrderFormData } from '../types';

export const orderService = {
  getAllOrders: async (
    tenantCode: string,
    searchTerm?: string,
    fromDate?: string,
    toDate?: string
  ): Promise<Order[]> => {
    const params: Record<string, string> = {};
    if (searchTerm) params.search = searchTerm;
    if (fromDate) params.fromDate = fromDate;
    if (toDate) params.toDate = toDate;
    const response = await apiClient.get<Order[]>(`/tenants/${tenantCode}/orders`, { params });
    return response.data;
  },

  createOrder: async (tenantCode: string, order: OrderFormData): Promise<Order> => {
    const response = await apiClient.post<Order>(`/tenants/${tenantCode}/orders`, order);
    return response.data;
  },

  updateOrder: async (tenantCode: string, order: Order): Promise<Order> => {
    const response = await apiClient.put<Order>(`/tenants/${tenantCode}/orders`, order);
    return response.data;
  },
};

export default orderService;
