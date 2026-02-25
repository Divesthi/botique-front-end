import apiClient from './api';
import type { Tenant, TenantFormData } from '../types';

const TENANTS_ENDPOINT = '/tenants';

export const tenantService = {
  getAllTenants: async (): Promise<Tenant[]> => {
    const response = await apiClient.get<Tenant[]>(TENANTS_ENDPOINT);
    return response.data;
  },

  getTenantByCode: async (code: string): Promise<Tenant> => {
    const response = await apiClient.get<Tenant>(`${TENANTS_ENDPOINT}/${code}`);
    return response.data;
  },

  createTenant: async (tenant: TenantFormData): Promise<Tenant> => {
    const response = await apiClient.post<Tenant>(TENANTS_ENDPOINT, tenant);
    return response.data;
  },

  updateTenant: async (tenant: Tenant): Promise<Tenant> => {
    const response = await apiClient.put<Tenant>(TENANTS_ENDPOINT, tenant);
    return response.data;
  },
};

export default tenantService;
