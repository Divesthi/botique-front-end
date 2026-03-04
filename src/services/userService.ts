import apiClient from './api';
import type { AuthUser } from '../types';

export const userService = {
    getAllUsers: async (tenantCode?: string): Promise<AuthUser[]> => {
        const params = tenantCode ? { tenantCode } : {};
        const response = await apiClient.get('/auth/users', { params });
        return response.data;
    },

    createUser: async (payload: { email: string; displayName: string; role: string; tenantCode: string }): Promise<AuthUser> => {
        const response = await apiClient.post('/auth/register', payload);
        return response.data;
    },

    updateUserRole: async (userId: number, role: string): Promise<AuthUser> => {
        const response = await apiClient.put(`/auth/users/${userId}/role`, { role });
        return response.data;
    },

    updateUserStatus: async (userId: number, active: boolean): Promise<AuthUser> => {
        const response = await apiClient.put(`/auth/users/${userId}/status`, { active });
        return response.data;
    },
};
