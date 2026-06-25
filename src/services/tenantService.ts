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

export interface InstagramConfig {
  connected: true;
  igUserId: string;
  igUsername: string | null;
  tokenExpiry: string;
  connectedAt: string;
  updatedAt: string;
}

export interface InstagramNotConnected {
  connected: false;
}

export type InstagramStatus = InstagramConfig | InstagramNotConnected;

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
        `${TENANTS_ENDPOINT}/${code}/telegram-config`
      );
      return response.data;
    } catch {
      return null;
    }
  },

  saveTelegramConfig: async (code: string, config: TelegramConfig): Promise<void> => {
    await apiClient.post(`${TENANTS_ENDPOINT}/${code}/telegram-config`, config);
  },

  getInstagramAuthUrl: async (code: string): Promise<{ authUrl: string }> => {
    console.log(apiClient.get<{ authUrl: string }>(
      `${TENANTS_ENDPOINT}/${code}/instagram/auth-url`
    ));
    const response = await apiClient.get<{ authUrl: string }>(
      `${TENANTS_ENDPOINT}/${code}/instagram/auth-url`
    );
    return response.data;
  },

  getInstagramConfig: async (code: string): Promise<InstagramStatus> => {
    const response = await apiClient.get<InstagramStatus>(
      `${TENANTS_ENDPOINT}/${code}/instagram/config`
    );
    return response.data;
  },

  disconnectInstagram: async (code: string): Promise<void> => {
    await apiClient.delete(`${TENANTS_ENDPOINT}/${code}/instagram/config`);
  },

  /**
   * Post a feed or carousel to Instagram on behalf of the tenant.
   * The backend responds with 202 Accepted — posting happens asynchronously.
   *
   * @param code      Tenant code
   * @param images    1–10 File objects (JPEG or PNG, max 10 MB each)
   * @param caption   Optional caption (max 2,200 characters)
   */
  postInstagramMedia: async (
    code: string,
    images: File[],
    caption?: string,
    onUploadProgress?: (percent: number) => void,
  ): Promise<void> => {
    const formData = new FormData();
    images.forEach((file) => formData.append('images', file));
    if (caption?.trim()) {
      formData.append('caption', caption.trim());
    }

    await apiClient.post(
      `${TENANTS_ENDPOINT}/${code}/instagram/posts`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (onUploadProgress && progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onUploadProgress(percent);
          }
        },
      },
    );
  },
};

export default tenantService;