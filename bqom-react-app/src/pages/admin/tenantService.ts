import apiClient from './api';
import type { Tenant, TenantFormData } from '../types';

export interface WhatsAppConfig {
  phoneNumberId: string;
  wabaId: string;
  accessToken: string;
  businessPhoneNumber: string;
  isActive: boolean;
}

export interface TelegramConfig {
  botToken: string;
  chatId: string;
  isActive: boolean;
}

export type NotificationChannel = 'whatsapp' | 'telegram';

export interface NotificationPreferences {
  channel: NotificationChannel | null;
}

export interface TenantPreferences {
  notifications?: NotificationPreferences;
}

const TENANTS_ENDPOINT = '/tenants';

export const tenantService = {
  getAllTenants: async (): Promise<Tenant[]> => {
    const response = await apiClient.get<Tenant[]>(TENANTS_ENDPOINT);
    return response.data;
  },

  getTenantByCode: async (code: string): Promise<Tenant & { preferences?: TenantPreferences }> => {
    const response = await apiClient.get<Tenant & { preferences?: TenantPreferences }>(
      `${TENANTS_ENDPOINT}/${code}`
    );
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

  updatePreferences: async (code: string, preferences: TenantPreferences): Promise<void> => {
    await apiClient.patch(`${TENANTS_ENDPOINT}/${code}/preferences`, preferences);
  },

  getWhatsAppConfig: async (code: string): Promise<WhatsAppConfig | null> => {
    try {
      const response = await apiClient.get<WhatsAppConfig>(
        `${TENANTS_ENDPOINT}/${code}/whatsapp-config`
      );
      return response.data;
    } catch {
      return null;
    }
  },

  saveWhatsAppConfig: async (code: string, config: WhatsAppConfig): Promise<void> => {
    await apiClient.post(`${TENANTS_ENDPOINT}/${code}/whatsapp-config`, config);
  },

  getTelegramConfig: async (code: string): Promise<TelegramConfig | null> => {
    try {
      const response = await apiClient.get<TelegramConfig>(
        `${TENANTS_ENDPOINT}/${code}/telegram/config`
      );
      return response.data;
    } catch {
      return null;
    }
  },

  saveTelegramConfig: async (code: string, config: TelegramConfig): Promise<void> => {
    await apiClient.post(`${TENANTS_ENDPOINT}/${code}/telegram/config`, config);
  },
};

export default tenantService;
