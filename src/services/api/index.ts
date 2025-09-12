// API service for local operations and future cloud integration
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ApiConfig {
  baseURL?: string;
  timeout?: number;
  headers?: Record<string, string>;
}

export class ApiService {
  private static config: ApiConfig = {
    baseURL: 'https://api.docsshelf.com', // Future cloud endpoint
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  // Configure API settings
  static configure(config: Partial<ApiConfig>): void {
    this.config = { ...this.config, ...config };
  }

  // Generic GET request
  static async get<T = unknown>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      // For now, return cached data from local storage if available
      const cacheKey = `api_cache_${endpoint}`;
      const cachedData = await AsyncStorage.getItem(cacheKey);

      if (cachedData) {
        return {
          success: true,
          data: JSON.parse(cachedData),
        };
      }

      // Future: Implement actual HTTP request
      return {
        success: false,
        error: 'Cloud API not implemented yet - using local storage only',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Generic POST request
  static async post<T = unknown>(
    endpoint: string,
    data?: unknown
  ): Promise<ApiResponse<T>> {
    try {
      // For now, store data locally
      const cacheKey = `api_cache_${endpoint}`;
      await AsyncStorage.setItem(cacheKey, JSON.stringify(data));

      return {
        success: true,
        data: data as T,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Generic PUT request
  static async put<T = unknown>(
    endpoint: string,
    data?: unknown
  ): Promise<ApiResponse<T>> {
    return this.post(endpoint, data); // Same implementation for now
  }

  // Generic DELETE request
  static async delete<T = unknown>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const cacheKey = `api_cache_${endpoint}`;
      await AsyncStorage.removeItem(cacheKey);

      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Clear all cached data
  static async clearCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter((key) => key.startsWith('api_cache_'));
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      console.error('Failed to clear API cache:', error);
    }
  }
}
