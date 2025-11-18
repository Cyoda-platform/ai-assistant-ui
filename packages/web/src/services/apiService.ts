/**
 * Real API Service - Makes actual HTTP requests
 * In development: Intercepted by MSW (Mock Service Worker)
 * In production: Calls real backend API
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

interface ApiError {
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

class ApiService {
  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    console.log(`🌐 [API] ${options?.method || 'GET'} ${url}`);

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        console.error(`❌ [API] Error:`, data);
        throw data as ApiError;
      }

      console.log(`✅ [API] Success:`, data);
      return data as T;
    } catch (error) {
      console.error(`❌ [API] Request failed:`, error);
      throw error;
    }
  }

  // ==================== CREATE FROM CHAT ====================
  async createFromChat(
    chatId: string,
    type: 'app' | 'entity' | 'workflow' | 'environment',
    appId?: string
  ): Promise<{ id: string; type: string; data: any }> {
    return this.request(`/chat/${chatId}/create`, {
      method: 'POST',
      body: JSON.stringify({ type, app_id: appId }),
    });
  }

  // ==================== GET ENDPOINTS ====================
  async getAppConfig(appId: string): Promise<any> {
    return this.request(`/apps/${appId}/config`);
  }

  async getEntityDetail(appId: string, entityId: string): Promise<any> {
    return this.request(`/apps/${appId}/entities/${entityId}`);
  }

  async getWorkflowDetail(appId: string, workflowId: string): Promise<any> {
    return this.request(`/apps/${appId}/workflows/${workflowId}`);
  }

  async getEnvironmentDetail(appId: string, environmentId: string): Promise<any> {
    return this.request(`/apps/${appId}/environments/${environmentId}`);
  }

  // NOTE: Requirements are now loaded from /analyze endpoint via githubAppDataService
  // No separate getRequirementDetail endpoint needed

  // ==================== SAVE ENDPOINTS ====================
  async saveAppConfig(appId: string, data: any): Promise<any> {
    return this.request(`/apps/${appId}/config`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async saveEntityDetail(appId: string, entityId: string, data: any): Promise<any> {
    return this.request(`/apps/${appId}/entities/${entityId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async saveWorkflowDetail(appId: string, workflowId: string, data: any): Promise<any> {
    return this.request(`/apps/${appId}/workflows/${workflowId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async saveEnvironmentDetail(appId: string, environmentId: string, data: any): Promise<any> {
    return this.request(`/apps/${appId}/environments/${environmentId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // NOTE: Requirements come from GitHub and are read-only
  // No saveRequirementDetail endpoint needed
}

// Export singleton instance
export const apiService = new ApiService();
export default apiService;

