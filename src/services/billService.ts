import apiClient from './api';
import type { Bill, BillFormData } from '../types';

const BILLS_ENDPOINT = '/bills';

export const billService = {
  // Get all bills
  getAllBills: async (searchTerm?: string): Promise<Bill[]> => {
    const params = searchTerm ? { search: searchTerm } : {};
    const response = await apiClient.get<Bill[]>(BILLS_ENDPOINT, { params });
    return response.data;
  },

  // Create new bill
  createBill: async (bill: BillFormData): Promise<Bill> => {
    const response = await apiClient.post<Bill>(BILLS_ENDPOINT, bill);
    return response.data;
  },

  // Update bill
  updateBill: async (bill: Bill): Promise<Bill> => {
    const response = await apiClient.put<Bill>(BILLS_ENDPOINT, bill);
    return response.data;
  },
};

export default billService;
