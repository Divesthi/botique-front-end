import apiClient from './api';
import type { Bill, BillFormData } from '../types';

const BILLS_ENDPOINT = '/bills';

export const billService = {
  // Get all bills with optional filters
  getAllBills: async (searchTerm?: string, fromDate?: string, toDate?: string): Promise<Bill[]> => {
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
