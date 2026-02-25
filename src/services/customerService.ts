import apiClient from './api';
import type { Customer, CustomerFormData } from '../types';

export const customerService = {
  getAllCustomers: async (tenantCode: string, searchTerm?: string): Promise<Customer[]> => {
    const params: Record<string, string> = {};
    if (searchTerm) params.search = searchTerm;
    const response = await apiClient.get<Customer[]>(`/tenants/${tenantCode}/customers`, { params });
    return response.data;
  },

  getCustomerByMobile: async (tenantCode: string, mobileNo: string): Promise<Customer> => {
    const response = await apiClient.get<Customer[]>(`/tenants/${tenantCode}/customers/${mobileNo}`);
    return response.data[0];
  },

  createCustomer: async (tenantCode: string, customer: CustomerFormData): Promise<Customer> => {
    const response = await apiClient.post<Customer>(`/tenants/${tenantCode}/customers`, customer);
    return response.data;
  },

  updateCustomer: async (tenantCode: string, customer: Customer): Promise<Customer> => {
    const response = await apiClient.put<Customer>(`/tenants/${tenantCode}/customers`, customer);
    return response.data;
  },
};

export default customerService;
