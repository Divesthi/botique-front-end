import apiClient from './api';
import type { Order, OrderFormData } from '../types';

const ORDERS_ENDPOINT = '/orders';

export const orderService = {
  // Get all orders with optional filters
  getAllOrders: async (searchTerm?: string, fromDate?: string, toDate?: string): Promise<Order[]> => {
    const params: Record<string, string> = {};
    if (searchTerm) {
      params.search = searchTerm;
    }
    if (fromDate) {
      params.fromDate = fromDate;
    }
    if (toDate) {
      params.toDate = toDate;
    }
    const response = await apiClient.get<Order[]>(ORDERS_ENDPOINT, { params });
    return response.data;
  },

  // Create new order
  createOrder: async (order: OrderFormData): Promise<Order> => {
    const response = await apiClient.post<Order>(ORDERS_ENDPOINT, order);
    return response.data;
  },

  // Update order
  updateOrder: async (order: Order): Promise<Order> => {
    const response = await apiClient.put<Order>(ORDERS_ENDPOINT, order);
    return response.data;
  },
};

export default orderService;
