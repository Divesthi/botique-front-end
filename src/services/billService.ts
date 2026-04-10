import apiClient from './api';
import type { Bill, BillFormData } from '../types';

export const billService = {
  getAllBills: async (
    tenantCode: string,
    searchTerm?: string,
    fromDate?: string,
    toDate?: string
  ): Promise<Bill[]> => {
    const params: Record<string, string> = {};
    if (searchTerm) params.search = searchTerm;
    if (fromDate) params.fromDate = fromDate;
    if (toDate) params.toDate = toDate;
    const response = await apiClient.get<Bill[]>(`/tenants/${tenantCode}/bills`, { params });
    return response.data;
  },

  createBill: async (tenantCode: string, bill: BillFormData): Promise<Bill> => {
    const response = await apiClient.post<Bill>(`/tenants/${tenantCode}/bills`, bill);
    return response.data;
  },

  updateBill: async (tenantCode: string, bill: Bill): Promise<Bill> => {
    const response = await apiClient.put<Bill>(`/tenants/${tenantCode}/bills`, bill);
    return response.data;
  },

  deleteBill: async (tenantCode: string, billId: number): Promise<void> => {
    await apiClient.delete(`/tenants/${tenantCode}/bills/${billId}`);
  },
};

export default billService;
