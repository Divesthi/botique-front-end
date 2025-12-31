import apiClient from './api';
import type { CustomerMeasurement, MeasurementFormData } from '../types';

const MEASUREMENTS_ENDPOINT = '/customers/measurements';

export const measurementService = {
  // Get all measurements
  getAllMeasurements: async (searchTerm?: string): Promise<CustomerMeasurement[]> => {
    const params = searchTerm ? { search: searchTerm } : {};
    const response = await apiClient.get<CustomerMeasurement[]>(MEASUREMENTS_ENDPOINT, { params });
    return response.data;
  },

  // Get measurements by customer mobile number
  getMeasurementsByMobile: async (mobileNo: string): Promise<CustomerMeasurement[]> => {
    const response = await apiClient.get<CustomerMeasurement[]>(`${MEASUREMENTS_ENDPOINT}/${mobileNo}`);
    return response.data;
  },

  // Create new measurement
  createMeasurement: async (measurement: MeasurementFormData): Promise<CustomerMeasurement> => {
    const response = await apiClient.post<CustomerMeasurement>(MEASUREMENTS_ENDPOINT, measurement);
    return response.data;
  },

  // Update measurement
  updateMeasurement: async (measurement: CustomerMeasurement): Promise<CustomerMeasurement> => {
    const response = await apiClient.put<CustomerMeasurement>(MEASUREMENTS_ENDPOINT, measurement);
    return response.data;
  },
};

export default measurementService;
