/**
 * API Service
 *
 * This module provides a centralized service for making API calls to the backend.
 * It handles common error handling and response formatting.
 */
import axios, { AxiosError, AxiosResponse } from 'axios';
import { Template, Component, TemplateWithComponents, CreateTemplateDto } from '../types';

// Base API URL - can be configured from environment variables
const API_BASE_URL = process.env.REACT_APP_API_URL ?? 'http://localhost:3001/api';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interface
interface ApiResponse<T> {
  data: T;
  error?: string;
  status: number;
}

/**
 * Interface for API error response
 */
interface ApiErrorResponse {
  error?: string;
  message?: string;
  details?: any;
}

/**
 * Custom API Error class
 */
class ApiError extends Error {
  status: number;
  details?: any;

  constructor(message: string, status: number = 500, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
    // This is needed to make instanceof work correctly in TypeScript
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

/**
 * Generic error handler for API requests
 */
const handleApiError = (error: AxiosError): never => {
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    console.error('API Error Response:', error.response.data);

    // Cast the response data to our expected error format
    const responseData = error.response.data as ApiErrorResponse;

    throw new ApiError(
      responseData.error ?? responseData.message ?? 'An error occurred',
      error.response.status,
      responseData.details ?? responseData
    );
  } else if (error.request) {
    // The request was made but no response was received
    console.error('API Error Request:', error.request);
    throw new ApiError(
      'No response from server. Please check your connection.',
      0
    );
  } else {
    // Something happened in setting up the request that triggered an Error
    console.error('API Error Setup:', error.message);
    throw new ApiError(
      error.message ?? 'An error occurred while setting up the request',
      0
    );
  }
};

/**
 * Template API Service
 */
export const templateApi = {
  /**
   * Get all templates
   * @returns {Promise<Template[]>} Array of templates
   */
  getAllTemplates: async (): Promise<Template[]> => {
    try {
      const response: AxiosResponse = await apiClient.get('/templates');
      return response.data;
    } catch (error) {
      return handleApiError(error as AxiosError);
    }
  },

  /**
   * Get template by ID
   * @param {string} id - Template ID
   * @returns {Promise<{template: Template, components: Component[]}>} Template with components
   */
  getTemplateById: async (id: string): Promise<{template: Template, components: Component[]}> => {
    try {
      const response: AxiosResponse = await apiClient.get(`/templates/${id}`);
      return response.data;
    } catch (error) {
      return handleApiError(error as AxiosError);
    }
  },

  /**
   * Create a new template
   * @param {CreateTemplateDto} templateData - Template data
   * @returns {Promise<{template: Template, components: Component[]}>} Created template with components
   */
  createTemplate: async (templateData: CreateTemplateDto): Promise<{template: Template, components: Component[]}> => {
    try {
      const response: AxiosResponse = await apiClient.post('/templates', templateData);
      return response.data;
    } catch (error) {
      return handleApiError(error as AxiosError);
    }
  },
};

/**
 * Upload API Service
 */
export const uploadApi = {
  /**
   * Upload an Excel file
   */
  uploadExcelFile: async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response: AxiosResponse = await apiClient.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error) {
      return handleApiError(error as AxiosError);
    }
  },
};

export default {
  templateApi,
  uploadApi,
};
