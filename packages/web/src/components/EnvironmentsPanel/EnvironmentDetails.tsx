import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Server, Copy, CheckCircle2, AlertCircle, RefreshCw, User, UserCog, Activity, Play, Loader2, Download, X, FileText, BarChart3, Package, ChevronUp, ChevronDown, Code2 } from 'lucide-react';
import { useAuthStore } from '@/stores/auth';
import axios, { AxiosError } from 'axios';
import privateClient from '@/clients/private';
import { message, Modal } from 'antd';
import dayjs from 'dayjs';
import FileSaver from 'file-saver';
import PromptCarousel from './PromptCarousel';

interface EnvironmentDetailsProps {
  environmentName: string;
  onBack: () => void;
  onClose?: () => void;
}

interface UIFunctionParameter {
  name: string;
  type: 'path' | 'query' | 'body' | 'form' | 'header';
  required: boolean;
  description?: string;
  default?: string;
  inputType?: 'text' | 'password' | 'checkbox' | 'textarea';
}

interface UIFunction {
  id: string;
  name: string;
  description: string;
  icon: any;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  category: string;
  response_format: 'json' | 'file';
  parameters?: UIFunctionParameter[];
}

interface UserApp {
  app_name: string;
  namespace: string;
  status: string;
  created_at?: string;
}

interface EnvironmentInfo {
  name: string;
  namespace: string;
  status: string;
  created_at?: string;
}

const EnvironmentDetails: React.FC<EnvironmentDetailsProps> = ({ environmentName, onBack, onClose }) => {
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [executingFunction, setExecutingFunction] = useState<string | null>(null);
  const [functionResponses, setFunctionResponses] = useState<Record<string, any>>({});
  const [parameterValues, setParameterValues] = useState<Record<string, Record<string, string>>>({});
  const [userApps, setUserApps] = useState<UserApp[]>([]);
  const [isLoadingApps, setIsLoadingApps] = useState(false);
  const [environmentInfo, setEnvironmentInfo] = useState<EnvironmentInfo | null>(null);
  const [isLoadingEnvInfo, setIsLoadingEnvInfo] = useState(false);
  const [isApiFunctionsExpanded, setIsApiFunctionsExpanded] = useState(false);
  const [refreshingAppStatus, setRefreshingAppStatus] = useState<string | null>(null);
  const [refreshingEnvStatus, setRefreshingEnvStatus] = useState(false);

  // Parse token to get org ID
  const orgId = useMemo(() => {
    if (!token) return '';
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const parsed = JSON.parse(jsonPayload);
      return (parsed.caas_org_id || '').toLowerCase();
    } catch (e) {
      return '';
    }
  }, [token]);

  // Build environment URL from namespace
  const environmentUrl = useMemo(() => {
    if (!environmentInfo?.namespace) return '';
    const host = import.meta.env.VITE_APP_CYODA_CLIENT_HOST || 'cyoda.cloud';
    return `https://${environmentInfo.namespace}.${host}`;
  }, [environmentInfo?.namespace]);

  const apiBaseUrl = useMemo(() => {
    return environmentUrl ? `${environmentUrl}/api` : '';
  }, [environmentUrl]);

  // Fetch environment details
  const fetchEnvironmentInfo = async () => {
    if (!token || !environmentName) return;

    try {
      setIsLoadingEnvInfo(true);
      const response = await privateClient({
        method: 'post',
        url: '/agent/environment/list_environments',
        data: {}
      });

      if (response.data && response.data.environments) {
        const envs = response.data.environments as EnvironmentInfo[];
        const env = envs.find(e => e.name === environmentName);
        if (env) {
          setEnvironmentInfo(env);
        }
      }
    } catch (error: any) {
      console.error('Failed to fetch environment info:', error);
    } finally {
      setIsLoadingEnvInfo(false);
    }
  };

  // Refresh environment status
  const refreshEnvironmentStatus = async () => {
    if (!token || !environmentName) return;

    try {
      setRefreshingEnvStatus(true);
      const response = await privateClient({
        method: 'post',
        url: '/agent/environment/list_environments',
        data: {}
      });

      if (response.data && response.data.environments) {
        const envs = response.data.environments as EnvironmentInfo[];
        const env = envs.find(e => e.name === environmentName);
        if (env) {
          setEnvironmentInfo(env);
        }
      }
    } catch (error: any) {
      console.error('Failed to refresh environment status:', error);
      message.error('Failed to refresh environment status');
    } finally {
      setRefreshingEnvStatus(false);
    }
  };

  // Fetch user applications for this environment
  const fetchUserApps = async () => {
    if (!token || !environmentName) return;

    try {
      setIsLoadingApps(true);
      const response = await privateClient({
        method: 'post',
        url: '/agent/environment/list_user_apps',
        data: { env_name: environmentName }
      });

      if (response.data && response.data.user_applications) {
        setUserApps(response.data.user_applications);
      } else {
        setUserApps([]);
      }
    } catch (error: any) {
      console.error('Failed to fetch user applications:', error);
      setUserApps([]);
    } finally {
      setIsLoadingApps(false);
    }
  };

  // Refresh status for a single app
  const refreshAppStatus = async (appName: string) => {
    if (!token || !environmentName) return;

    try {
      setRefreshingAppStatus(appName);
      const response = await privateClient({
        method: 'post',
        url: '/agent/environment/list_user_apps',
        data: { env_name: environmentName }
      });

      if (response.data && response.data.user_applications) {
        const updatedApps = response.data.user_applications;
        setUserApps(updatedApps);
      }
    } catch (error: any) {
      console.error('Failed to refresh app status:', error);
      message.error('Failed to refresh app status');
    } finally {
      setRefreshingAppStatus(null);
    }
  };

  // Fetch environment info and user apps on mount
  useEffect(() => {
    fetchEnvironmentInfo();
    fetchUserApps();
  }, [environmentName, token]);

  // UI Functions based on Cyoda API documentation
  const uiFunctions: UIFunction[] = [
    {
      id: 'issue_technical_user',
      name: 'Issue Technical User',
      description: 'Create a new technical user account',
      icon: UserCog,
      method: 'POST',
      path: '/api/clients',
      category: 'User Management',
      response_format: 'json',
      parameters: [
        {
          name: 'withAdminRole',
          type: 'query',
          required: false,
          description: 'Issue M2M user with ADMIN role',
          default: 'false',
          inputType: 'checkbox'
        }
      ]
    },
    {
      id: 'get_users',
      name: 'Get Users',
      description: 'Retrieve list of all users',
      icon: User,
      method: 'GET',
      path: '/api/clients',
      category: 'User Management',
      response_format: 'json'
    },
    {
      id: 'delete_user',
      name: 'Delete User',
      description: 'Delete a user account',
      icon: User,
      method: 'DELETE',
      path: '/api/clients/{userId}',
      category: 'User Management',
      response_format: 'json',
      parameters: [
        { name: 'userId', type: 'path', required: true, description: 'User ID' }
      ]
    },
    {
      id: 'get_machine_users',
      name: 'Get Machine Users',
      description: 'Retrieve list of machine users',
      icon: UserCog,
      method: 'GET',
      path: '/api/clients',
      category: 'Machine User Management',
      response_format: 'json'
    },
    {
      id: 'oauth_token',
      name: 'Obtain Access Token',
      description: 'Authenticates M2M client using client credentials and returns JWT access token',
      icon: Activity,
      method: 'POST',
      path: '/api/oauth/token',
      category: 'OAuth',
      response_format: 'json',
      parameters: [
        {
          name: 'client_id',
          type: 'header',
          required: true,
          description: 'M2M client ID (e.g., abc523BCD)',
          default: ''
        },
        {
          name: 'client_secret',
          type: 'header',
          required: true,
          description: 'M2M client secret',
          default: ''
        },
        {
          name: 'grant_type',
          type: 'form',
          required: true,
          description: 'OAuth 2.0 grant type for M2M authentication',
          default: 'client_credentials'
        }
      ]
    },
    {
      id: 'reset_client_secret',
      name: 'Reset Client Secret',
      description: 'Generate a new client secret for an existing M2M client',
      icon: UserCog,
      method: 'PUT',
      path: '/api/clients/{clientId}/secret',
      category: 'Client Management',
      response_format: 'json',
      parameters: [
        { name: 'clientId', type: 'path', required: true, description: 'Client ID to reset (e.g., abc523BCD)' }
      ]
    }
  ];

  // Copy to clipboard
  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    message.success(`${fieldName} copied to clipboard`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Execute UI function
  const executeFunction = async (func: UIFunction) => {
    if (!token) {
      message.error('Authentication required');
      return;
    }

    // Get parameter values for this function
    const funcParams = parameterValues[func.id] || {};

    // Check required parameters (use default if available)
    if (func.parameters) {
      const missingParams = func.parameters
        .filter(p => p.required && !funcParams[p.name] && !p.default)
        .map(p => p.name);

      if (missingParams.length > 0) {
        message.error(`Missing required parameters: ${missingParams.join(', ')}`);
        return;
      }
    }

    // Build the full URL with path parameters
    let fullPath = func.path;
    const queryParams: Record<string, string> = {};
    let bodyData: any = null;
    let contentType = 'application/json';
    const formParams: Record<string, string> = {};
    const headerParams: Record<string, string> = {};
    let clientId = '';
    let clientSecret = '';

    // Add query params from UI function object (if any)
    if ((func as any).query_params) {
      Object.assign(queryParams, (func as any).query_params);
    }

    if (func.parameters) {
      func.parameters.forEach(param => {
        // Use provided value or fall back to default
        const value = funcParams[param.name] || param.default;
        if (!value) return;

        if (param.type === 'path') {
          // Replace path parameters
          fullPath = fullPath.replace(`{${param.name}}`, value);
        } else if (param.type === 'query') {
          // Add query parameters
          queryParams[param.name] = value;
        } else if (param.type === 'body') {
          // Parse body parameter as JSON
          try {
            bodyData = JSON.parse(value);
          } catch (e) {
            message.error(`Invalid JSON in ${param.name}`);
            return;
          }
        } else if (param.type === 'form') {
          // Add form parameters
          formParams[param.name] = value;
          contentType = 'application/x-www-form-urlencoded';
        } else if (param.type === 'header') {
          // Collect header parameters for Basic Auth
          if (param.name === 'client_id') {
            clientId = value;
          } else if (param.name === 'client_secret') {
            clientSecret = value;
          } else {
            headerParams[param.name] = value;
          }
        }
      });
    }

    // If we have form parameters, build form data
    if (Object.keys(formParams).length > 0) {
      bodyData = new URLSearchParams(formParams).toString();
    }

    // Build query string
    const queryString = Object.keys(queryParams).length > 0
      ? '?' + new URLSearchParams(queryParams).toString()
      : '';

    const fullUrl = `${environmentUrl}${fullPath}${queryString}`;

    setExecutingFunction(func.id);

    try {
      const method = func.method.toLowerCase() as 'get' | 'post' | 'put' | 'delete' | 'patch';

      // Build headers
      const headers: Record<string, string> = {
        'Content-Type': contentType,
        'Authorization': `Bearer ${token}`,
        ...headerParams
      };

      // If we have client credentials, add HTTP Basic Authentication
      if (clientId && clientSecret) {
        const basicAuth = btoa(`${clientId}:${clientSecret}`);
        headers['Authorization'] = `Basic ${basicAuth}`;
      }

      // Create a direct axios client for the client environment
      // This bypasses the backend and calls the environment directly
      const environmentClient = axios.create({
        timeout: 30000,
        headers
      });

      // Add response interceptor to handle 401 and refresh token against Auth0
      environmentClient.interceptors.response.use(
        response => response,
        async (error: AxiosError) => {
          const originalRequest = error.config;

          if (error.response?.status === 401 && originalRequest && !(originalRequest as any)._retry) {
            // Mark this request as retried to avoid infinite loops
            (originalRequest as any)._retry = true;

            try {
              console.log('Token expired (401), attempting to refresh against Auth0...');
              const authStore = useAuthStore.getState();

              // Call the auth store's refreshAccessToken method which handles Auth0 refresh
              await authStore.refreshAccessToken();

              // Get the new token from the store
              const newToken = useAuthStore.getState().token;
              if (newToken) {
                console.log('Token refreshed successfully, retrying request with new token...');

                // Create new headers object with updated token
                const newHeaders = {
                  ...originalRequest.headers,
                  'Authorization': `Bearer ${newToken}`
                };

                // Create a fresh request config with new token
                const retryConfig = {
                  ...originalRequest,
                  headers: newHeaders
                };

                // Retry the request with new token using a new axios instance
                return axios(retryConfig);
              } else {
                throw new Error('No token available after refresh');
              }
            } catch (refreshError) {
              console.error('Token refresh failed:', refreshError);
              message.error('Session expired. Please log in again.');
              return Promise.reject(refreshError);
            }
          }
          return Promise.reject(error);
        }
      );

      const { data } = await environmentClient({
        method,
        url: fullUrl,
        ...(bodyData && { data: bodyData })
      });

      // Handle response based on format
      if (func.response_format === 'file') {
        const date = dayjs();
        const file = new File(
          [JSON.stringify(data, null, 2)],
          `${func.id}_${date.format('DD-MM-YYYY_HH-mm-ss')}.json`,
          { type: 'application/json' }
        );
        FileSaver.saveAs(file);
        message.success(`${func.name} executed - file downloaded`);
      } else {
        // Store response to show in UI
        setFunctionResponses(prev => ({ ...prev, [func.id]: data }));
        message.success(`${func.name} executed successfully`);
      }
    } catch (error: any) {
      console.error('Failed to execute UI function:', error);

      // Handle different error scenarios
      if (error?.response?.status === 401) {
        message.error('Authentication failed. Your session has expired. Please log in again.');
      } else if (error?.response?.status === 403) {
        message.error('Access denied. You do not have permission to perform this action.');
      } else if (error?.code === 'ECONNABORTED') {
        message.error('Request timeout. The environment is not responding.');
      } else {
        const errorMsg = error?.response?.data?.message || error?.message || 'Failed to execute request';
        setFunctionResponses(prev => ({ ...prev, [func.id]: { error: errorMsg } }));
        message.error(`Failed: ${errorMsg}`);
      }
    } finally {
      setExecutingFunction(null);
    }
  };

  // Show response modal
  const showResponseModal = (func: UIFunction) => {
    const response = functionResponses[func.id];
    if (!response) return;

    Modal.info({
      title: `${func.name} - Response`,
      width: 700,
      content: (
        <div className="mt-4">
          <pre className="bg-slate-50 border border-slate-200 text-slate-800 p-4 rounded-lg overflow-auto max-h-96 text-xs font-mono">
            {JSON.stringify(response, null, 2)}
          </pre>
        </div>
      ),
      okText: 'Close',
      centered: true,
    });
  };

  const redeployMessage = `Please, redeploy my cyoda environment: ${environmentUrl}`;

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={onBack}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              title="Back to environments"
            >
              <ArrowLeft size={16} />
            </button>
            <div className="h-6 w-px bg-slate-200"></div>
            <Server size={18} className="text-blue-600" />
            <h3 className="font-semibold text-slate-900 !mb-0 leading-none">{environmentName}</h3>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.open(`/logs?env_name=${encodeURIComponent(environmentName)}`, '_blank')}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
              title="View logs for this environment"
            >
              <Activity size={12} />
              <span>View Logs</span>
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                title="Close Cloud panel"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
        {/* Environment Details */}
        <section className="space-y-3">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Environment Details</h3>
            <button
              onClick={fetchEnvironmentInfo}
              disabled={isLoadingEnvInfo}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 hover:text-slate-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Refresh environment info"
            >
              <RefreshCw size={12} className={isLoadingEnvInfo ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
          </div>

          {isLoadingEnvInfo ? (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-center">
              <Loader2 size={16} className="animate-spin text-blue-500 mr-2" />
              <span className="text-sm text-slate-400">Loading environment details...</span>
            </div>
          ) : environmentInfo ? (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3.5">
              <div>
                <label className="text-xs text-slate-500 font-medium mb-1.5 block">Namespace</label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-sm text-blue-700 bg-slate-100 px-3 py-2.5 rounded-lg border border-slate-200 font-mono truncate min-w-0">
                    {environmentInfo.namespace}
                  </code>
                  <button
                    onClick={() => copyToClipboard(environmentInfo.namespace, 'Namespace')}
                    className="p-2 rounded-lg hover:bg-blue-50 border border-transparent hover:border-blue-200 transition-all duration-200 group"
                    title="Copy namespace"
                  >
                    {copiedField === 'Namespace' ? (
                      <CheckCircle2 size={16} className="text-green-400" />
                    ) : (
                      <Copy size={16} className="text-slate-400 group-hover:text-blue-600 transition-colors" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-500 font-medium mb-1.5 block">Status</label>
                <div className="flex items-center gap-2">
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
                    environmentInfo.status === 'Active' || environmentInfo.status === 'active'
                      ? 'bg-green-500/10 text-green-400 border-green-500/30'
                      : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30'
                  }`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      environmentInfo.status === 'Active' || environmentInfo.status === 'active'
                        ? 'bg-green-400 animate-pulse'
                        : 'bg-yellow-400 animate-pulse'
                    }`}></div>
                    <span className="text-xs font-semibold">{environmentInfo.status}</span>
                  </div>
                  <button
                    onClick={refreshEnvironmentStatus}
                    disabled={refreshingEnvStatus}
                    className="p-2 rounded-lg hover:bg-blue-50 border border-transparent hover:border-blue-200 transition-colors disabled:opacity-50 group"
                    title="Refresh status"
                  >
                    <RefreshCw
                      size={14}
                      className={refreshingEnvStatus ? 'animate-spin text-blue-600' : 'text-slate-400 group-hover:text-blue-600 transition-colors'}
                    />
                  </button>
                </div>
              </div>

              {environmentInfo.created_at && (
                <div>
                  <label className="text-xs text-slate-500 font-medium mb-1.5 block">Created</label>
                  <p className="text-sm text-slate-700">
                    {new Date(environmentInfo.created_at).toLocaleDateString()} {new Date(environmentInfo.created_at).toLocaleTimeString()}
                  </p>
                </div>
              )}

              <div>
                <label className="text-xs text-slate-500 font-medium mb-1.5 block">Client Environment URL</label>
                <div className="flex items-center gap-2 min-w-0">
                  <code className="flex-1 text-sm text-blue-700 bg-slate-100 px-3 py-2.5 rounded-lg border border-slate-200 font-mono truncate min-w-0">
                    {environmentUrl || 'Not available'}
                  </code>
                  <button
                    onClick={() => copyToClipboard(environmentUrl, 'Environment URL')}
                    className="p-2 rounded-lg hover:bg-blue-50 border border-transparent hover:border-blue-200 transition-all duration-200 group"
                    title="Copy URL"
                  >
                    {copiedField === 'Environment URL' ? (
                      <CheckCircle2 size={16} className="text-green-400" />
                    ) : (
                      <Copy size={16} className="text-slate-400 group-hover:text-blue-600 transition-colors" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-500 font-medium mb-1.5 block">Organization ID</label>
                <div className="flex items-center gap-2 min-w-0">
                  <code className="flex-1 text-sm text-blue-700 bg-slate-100 px-3 py-2.5 rounded-lg border border-slate-200 font-mono truncate min-w-0">
                    {orgId || 'Not available'}
                  </code>
                  <button
                    onClick={() => copyToClipboard(orgId, 'Organization ID')}
                    className="p-2 rounded-lg hover:bg-blue-50 border border-transparent hover:border-blue-200 transition-all duration-200 group"
                    title="Copy Org ID"
                  >
                    {copiedField === 'Organization ID' ? (
                      <CheckCircle2 size={16} className="text-green-400" />
                    ) : (
                      <Copy size={16} className="text-slate-400 group-hover:text-blue-600 transition-colors" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <p className="text-sm text-slate-400">Unable to load environment details</p>
            </div>
          )}
        </section>

        {/* User Applications */}
        <section className="space-y-3">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">User Applications</h3>
            <button
              onClick={fetchUserApps}
              disabled={isLoadingApps}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 hover:text-slate-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Refresh applications"
            >
              <RefreshCw size={12} className={isLoadingApps ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
          </div>

          {isLoadingApps ? (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-center">
              <Loader2 size={16} className="animate-spin text-blue-500 mr-2" />
              <span className="text-sm text-slate-400">Loading applications...</span>
            </div>
          ) : userApps.length === 0 ? (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center">
              <Package size={48} className="mx-auto mb-3 text-slate-600" />
              <p className="text-sm text-slate-400 mb-1">No user applications deployed</p>
              <p className="text-xs text-slate-500">Deploy an application to get started</p>
            </div>
          ) : (
            <div className="space-y-2">
              {userApps.map((app) => {
                const appUrl = `https://${app.namespace}.${import.meta.env.VITE_APP_CYODA_CLIENT_HOST || 'cyoda.cloud'}`;
                return (
                  <div key={app.app_name} className="bg-white border border-slate-200 rounded-lg p-3 hover:border-blue-300 hover:bg-slate-50 transition-all">
                    <div className="flex items-start gap-3">
                      <Package size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h5 className="text-sm font-medium text-slate-900 mb-0.5">{app.app_name}</h5>
                        <p className="text-xs text-slate-500 truncate mb-2">{app.namespace}</p>

                        {/* App URL with Copy Button */}
                        <div className="flex items-center gap-2 mb-2 min-w-0">
                          <code className="flex-1 text-xs text-blue-700 bg-slate-100 px-2 py-1 rounded-lg border border-slate-200 font-mono truncate min-w-0">
                            {appUrl}
                          </code>
                          <button
                            onClick={() => copyToClipboard(appUrl, `${app.app_name} URL`)}
                            className="p-1.5 rounded-lg hover:bg-blue-50 border border-transparent hover:border-blue-200 transition-all duration-200 group flex-shrink-0"
                            title="Copy URL"
                          >
                            {copiedField === `${app.app_name} URL` ? (
                              <CheckCircle2 size={14} className="text-green-500" />
                            ) : (
                              <Copy size={14} className="text-slate-400 group-hover:text-blue-600 transition-colors" />
                            )}
                          </button>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-0.5 rounded-lg border font-semibold ${
                            app.status === 'Active' || app.status === 'active'
                              ? 'bg-green-50 text-green-700 border-green-200'
                              : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                          }`}>
                            {app.status}
                          </span>
                          <button
                            onClick={() => refreshAppStatus(app.app_name)}
                            disabled={refreshingAppStatus === app.app_name}
                            className="p-1 rounded-lg hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-all duration-200 disabled:opacity-50 group"
                            title="Refresh status"
                          >
                            <RefreshCw
                              size={12}
                              className={refreshingAppStatus === app.app_name ? 'animate-spin text-blue-500' : 'text-slate-400 group-hover:text-blue-600 transition-colors'}
                            />
                          </button>
                          {app.created_at && (
                            <span className="text-xs text-slate-500">
                              Created: {new Date(app.created_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Quick Prompts Carousel */}
        <PromptCarousel environmentName={environmentName} />

        {/* Redeploy Environment */}
        <section className="space-y-3">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Redeploy</h3>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <p className="text-xs text-slate-400 mb-2.5">Copy this message to request environment redeployment:</p>
            <div className="flex items-start gap-2">
              <code className="flex-1 text-xs text-slate-700 bg-slate-100 px-3 py-2.5 rounded-lg border border-slate-200 font-mono break-all min-w-0">
                {redeployMessage}
              </code>
              <button
                onClick={() => copyToClipboard(redeployMessage, 'Redeploy Message')}
                className="p-2 rounded-lg hover:bg-blue-50 border border-transparent hover:border-blue-200 transition-all duration-200 group flex-shrink-0"
                title="Copy message"
              >
                {copiedField === 'Redeploy Message' ? (
                  <CheckCircle2 size={16} className="text-green-400" />
                ) : (
                  <Copy size={16} className="text-slate-400 group-hover:text-blue-600 transition-colors" />
                )}
              </button>
            </div>
          </div>
        </section>

        {/* Logs Access */}
        <section className="space-y-3">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Environment Logs</h3>

          <div
            onClick={() => window.open(`/logs?env_name=${encodeURIComponent(environmentName)}`, '_blank')}
            className="bg-slate-50 border border-slate-200 hover:border-blue-300 hover:bg-white rounded-xl p-5 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm group"
          >
            <div>
              {/* Icon and Title */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-50 rounded-lg group-hover:scale-110 transition-transform">
                    <FileText size={20} className="text-blue-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 mb-0.5">View System Logs</h4>
                    <p className="text-xs text-slate-500">Real-time log analysis & monitoring</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-blue-600 group-hover:translate-x-0.5 transition-transform">
                  <span className="text-xs font-medium">Open</span>
                  <ArrowLeft size={14} className="transform rotate-180" />
                </div>
              </div>

              {/* Features */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-1 h-1 rounded-full bg-teal-500"></div>
                  <span className="text-xs text-slate-600">Advanced Search</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-1 h-1 rounded-full bg-blue-500"></div>
                  <span className="text-xs text-slate-600">Query DSL</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-1 h-1 rounded-full bg-purple-500"></div>
                  <span className="text-xs text-slate-600">Level Filtering</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-1 h-1 rounded-full bg-pink-500"></div>
                  <span className="text-xs text-slate-600">Export JSON</span>
                </div>
              </div>

              {/* Description */}
              <p className="text-xs text-slate-500 leading-relaxed">
                Access comprehensive logging with Elasticsearch integration
              </p>
            </div>
          </div>
        </section>

        {/* Metrics & Monitoring */}
        <section className="space-y-3">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Metrics & Dashboards</h3>

          <div
            onClick={() => window.open(`/monitoring?env_name=${encodeURIComponent(environmentName)}`, '_blank')}
            className="bg-slate-50 border border-slate-200 hover:border-orange-300 hover:bg-white rounded-xl p-5 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm group"
          >
            <div>
              {/* Icon and Title */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-orange-50 rounded-lg group-hover:scale-110 transition-transform">
                    <BarChart3 size={20} className="text-orange-500" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 mb-0.5">Metrics & Dashboards</h4>
                    <p className="text-xs text-slate-500">Real-time performance monitoring</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-orange-600 group-hover:translate-x-0.5 transition-transform">
                  <span className="text-xs font-medium">Open</span>
                  <ArrowLeft size={14} className="transform rotate-180" />
                </div>
              </div>

              {/* Features - 2x2 grid */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-1 h-1 rounded-full bg-orange-400"></div>
                  <span className="text-xs text-slate-600">CPU & Memory</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-1 h-1 rounded-full bg-amber-400"></div>
                  <span className="text-xs text-slate-600">Network Traffic</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-1 h-1 rounded-full bg-yellow-400"></div>
                  <span className="text-xs text-slate-600">Pod Metrics</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-1 h-1 rounded-full bg-orange-300"></div>
                  <span className="text-xs text-slate-600">Custom Dashboards</span>
                </div>
              </div>

              {/* Description */}
              <p className="text-xs text-slate-500 leading-relaxed">
                Grafana dashboards with real-time Kubernetes metrics
              </p>
            </div>
          </div>
        </section>

        {/* API Functions */}
        <section className="space-y-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Code2 size={16} className="text-blue-600" />
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">API Functions</h3>
            </div>
            <button
              onClick={() => setIsApiFunctionsExpanded(!isApiFunctionsExpanded)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 hover:border-slate-300 transition-all duration-200 font-medium flex items-center gap-1.5 text-xs"
              title={isApiFunctionsExpanded ? 'Collapse API functions' : 'Expand API functions'}
            >
              {isApiFunctionsExpanded ? (
                <>
                  <ChevronUp size={12} />
                  <span>Collapse</span>
                </>
              ) : (
                <>
                  <ChevronDown size={12} />
                  <span>Expand</span>
                </>
              )}
            </button>
          </div>

          {isApiFunctionsExpanded && (
            <div className="space-y-2">
              {uiFunctions.map((func) => {
              const Icon = func.icon;
              const isExecuting = executingFunction === func.id;
              const hasResponse = !!functionResponses[func.id];

              return (
                <div key={func.id} className="bg-white border border-slate-200 rounded-lg p-3 hover:border-blue-300 hover:bg-slate-50 transition-all">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <Icon size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h5 className="text-sm font-medium text-slate-900 mb-1">{func.name}</h5>
                        <p className="text-xs text-slate-500 mb-2">{func.description}</p>
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <span className={`text-xs px-2 py-0.5 rounded-lg font-semibold ${
                            func.method === 'GET' ? 'bg-blue-50 text-blue-700' :
                            func.method === 'POST' ? 'bg-green-50 text-green-700' :
                            func.method === 'PUT' ? 'bg-yellow-50 text-yellow-700' :
                            func.method === 'DELETE' ? 'bg-red-50 text-red-700' :
                            'bg-purple-50 text-purple-700'
                          }`}>
                            {func.method}
                          </span>
                          <code className="text-xs text-slate-500 truncate">{func.path}</code>
                        </div>

                        {/* Parameters */}
                        {func.parameters && func.parameters.length > 0 && (
                          <div className="space-y-2 mt-3">
                            {func.parameters.map((param) => (
                              <div key={param.name} className="space-y-1.5">
                                <label className="text-xs text-slate-600 flex items-center gap-1">
                                  {param.name}
                                  {param.required && <span className="text-red-500">*</span>}
                                  {param.description && (
                                    <span className="text-slate-400">- {param.description}</span>
                                  )}
                                </label>
                                {param.inputType === 'checkbox' ? (
                                  <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={(parameterValues[func.id]?.[param.name] || param.default || 'false') === 'true'}
                                      onChange={(e) => setParameterValues(prev => ({
                                        ...prev,
                                        [func.id]: {
                                          ...prev[func.id],
                                          [param.name]: e.target.checked ? 'true' : 'false'
                                        }
                                      }))}
                                      className="w-4 h-4 border border-slate-300 rounded text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:ring-offset-0 cursor-pointer transition-colors"
                                    />
                                    <span className="text-xs text-slate-700">Admin Role</span>
                                  </label>
                                ) : param.inputType === 'textarea' || param.type === 'body' ? (
                                  <textarea
                                    value={parameterValues[func.id]?.[param.name] || param.default || ''}
                                    onChange={(e) => setParameterValues(prev => ({
                                      ...prev,
                                      [func.id]: {
                                        ...prev[func.id],
                                        [param.name]: e.target.value
                                      }
                                    }))}
                                    placeholder={param.default || '{"key": "value"}'}
                                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 font-mono transition-colors"
                                    rows={4}
                                  />
                                ) : (
                                  <input
                                    type={param.inputType === 'password' || param.name.includes('secret') || param.name.includes('password') ? 'password' : 'text'}
                                    value={parameterValues[func.id]?.[param.name] || param.default || ''}
                                    onChange={(e) => setParameterValues(prev => ({
                                      ...prev,
                                      [func.id]: {
                                        ...prev[func.id],
                                        [param.name]: e.target.value
                                      }
                                    }))}
                                    placeholder={param.default || `Enter ${param.name}`}
                                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors"
                                  />
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-1 flex-shrink-0">
                      <button
                        onClick={() => executeFunction(func)}
                        disabled={isExecuting}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 hover:border-blue-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                        title="Execute function"
                      >
                        {isExecuting ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Play size={14} />
                        )}
                        <span className="text-xs">Execute</span>
                      </button>

                      {hasResponse && (
                        <button
                          onClick={() => showResponseModal(func)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 hover:border-indigo-300 transition-all duration-200 font-medium"
                          title="View response"
                        >
                          <CheckCircle2 size={14} />
                          <span className="text-xs">Response</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default EnvironmentDetails;

