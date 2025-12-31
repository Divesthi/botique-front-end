import apiClient from './api';
import type { Customer, CustomerFormData } from '../types';

const CUSTOMERS_ENDPOINT = '/customers';

export const customerService = {
  // Get all customers
  getAllCustomers: async (searchTerm?: string): Promise<Customer[]> => {
    const params = searchTerm ? { search: searchTerm } : {};
    const response = await apiClient.get<Customer[]>(CUSTOMERS_ENDPOINT, { params });
    return response.data;
  },

  // Get customer by mobile number
  getCustomerByMobile: async (mobileNo: string): Promise<Customer> => {
    const response = await apiClient.get<Customer[]>(`${CUSTOMERS_ENDPOINT}/${mobileNo}`);
    // Backend returns an array, so we need to get the first element
    return response.data[0];
  },

  // Create new customer
  createCustomer: async (customer: CustomerFormData): Promise<Customer> => {
    const response = await apiClient.post<Customer>(CUSTOMERS_ENDPOINT, customer);
    return response.data;
  },

  // Update customer
  updateCustomer: async (customer: Customer): Promise<Customer> => {
    const response = await apiClient.put<Customer>(CUSTOMERS_ENDPOINT, customer);
    return response.data;
  },
};

export default customerService;
