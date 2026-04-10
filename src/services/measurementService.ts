import apiClient from './api';
import type { CustomerMeasurement, MeasurementFormData } from '../types';

export const measurementService = {
  getAllMeasurements: async (tenantCode: string, searchTerm?: string): Promise<CustomerMeasurement[]> => {
    const params: Record<string, string> = {};
    if (searchTerm) params.search = searchTerm;
    const response = await apiClient.get<CustomerMeasurement[]>(
      `/tenants/${tenantCode}/customers/measurements`,
      { params }
    );
    return response.data;
  },

  getMeasurementsByMobile: async (tenantCode: string, mobileNo: string): Promise<CustomerMeasurement[]> => {
    const response = await apiClient.get<CustomerMeasurement[]>(
      `/tenants/${tenantCode}/customers/measurements/${mobileNo}`
    );
    return response.data;
  },

  createMeasurement: async (tenantCode: string, measurement: MeasurementFormData): Promise<CustomerMeasurement> => {
    const response = await apiClient.post<CustomerMeasurement>(
      `/tenants/${tenantCode}/customers/measurements`,
      measurement
    );
    return response.data;
  },

  updateMeasurement: async (tenantCode: string, measurement: CustomerMeasurement): Promise<CustomerMeasurement> => {
    const response = await apiClient.put<CustomerMeasurement>(
      `/tenants/${tenantCode}/customers/measurements`,
      measurement
    );
    return response.data;
  },

  deleteMeasurement: async (tenantCode: string, measurementId: number): Promise<void> => {
    await apiClient.delete(`/tenants/${tenantCode}/customers/measurements/${measurementId}`);
  },
};

export default measurementService;
