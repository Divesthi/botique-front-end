import apiClient from './api';
import type { Order, OrderFormData } from '../types';

const ORDERS_ENDPOINT = '/orders';

export const orderService = {
  // Get all orders
  getAllOrders: async (searchTerm?: string): Promise<Order[]> => {
    const params = searchTerm ? { search: searchTerm } : {};
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
