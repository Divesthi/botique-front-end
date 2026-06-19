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

  /**
   * Share measurement details to the boutique owner via WhatsApp.
   * @param tenantCode   The tenant's unique code (e.g. "BOUTIQUE_A")
   * @param measurementId  The measurement record ID
   * @param toPhoneNumber  E.164 formatted phone number (e.g. "+919448488874")
   */
  shareMeasurement: async (
    tenantCode: string,
    measurementId: number,
    toPhoneNumber: string
  ): Promise<void> => {
    await apiClient.post(
      `/tenants/${tenantCode}/customers/measurements/${measurementId}/share`,
      { toPhoneNumber }
    );
  },
};

export default measurementService;
