import React, { useState, useMemo } from 'react';
import { ArrowLeft, Server, Copy, CheckCircle2, AlertCircle, RefreshCw, User, UserCog, Activity, Play, Loader2, Download, X, FileText, BarChart3 } from 'lucide-react';
import { useAuthStore } from '@/stores/auth';
import axios from 'axios';
import privateClient from '@/clients/private';
import { message, Modal } from 'antd';
import dayjs from 'dayjs';
import FileSaver from 'file-saver';

interface EnvironmentDetailsProps {
  environmentName: string;
  onBack: () => void;
  onClose?: () => void;
}

interface UIFunctionParameter {
  name: string;
  type: 'path' | 'query' | 'body';
  required: boolean;
  description?: string;
  default?: string;
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

const EnvironmentDetails: React.FC<EnvironmentDetailsProps> = ({ environmentName, onBack, onClose }) => {
  const token = useAuthStore((state) => state.token);
  const [envStatus, setEnvStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [executingFunction, setExecutingFunction] = useState<string | null>(null);
  const [functionResponses, setFunctionResponses] = useState<Record<string, any>>({});
  const [parameterValues, setParameterValues] = useState<Record<string, Record<string, string>>>({});

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

  // Build environment URL
  const environmentUrl = useMemo(() => {
    if (!orgId) return '';
    const envPrefix = import.meta.env.VITE_APP_CYODA_CLIENT_ENV_PREFIX || '';
    const host = import.meta.env.VITE_APP_CYODA_CLIENT_HOST || '';
    const cleanPrefix = envPrefix.endsWith('-') ? envPrefix.slice(0, -1) : envPrefix;
    return `https://${cleanPrefix}-${orgId}.${host}`;
  }, [orgId]);

  const apiBaseUrl = `${environmentUrl}/api`;

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
      response_format: 'json'
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
      id: 'get_user_by_id',
      name: 'Get User by ID',
      description: 'Retrieve specific user details',
      icon: User,
      method: 'GET',
      path: '/api/clients/{userId}',
      category: 'User Management',
      response_format: 'json',
      parameters: [
        { name: 'userId', type: 'path', required: true, description: 'User ID' }
      ]
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
    }
  ];

  // Check environment status
  const checkEnvironmentStatus = async () => {
    if (!token || !apiBaseUrl) return;

    setIsCheckingStatus(true);
    try {
      // Use privateClient to benefit from refresh token interceptor
      const response = await privateClient({
        method: 'get',
        url: `${apiBaseUrl}/`,
        timeout: 10000
      });

      if (response.status === 200) {
        setEnvStatus('online');
        message.success('Environment is online and accessible');
      }
    } catch (error: any) {
      console.error('Environment status check failed:', error);
      setEnvStatus('offline');

      // Handle different error scenarios
      if (error?.response?.status === 401) {
        message.error('Authentication failed. Please check your credentials.');
      } else if (error?.response?.status) {
        message.error(`Environment returned status ${error.response.status}`);
      } else if (error?.code === 'ECONNABORTED') {
        message.error('Request timeout. Environment may be slow to respond.');
      } else {
        message.error('Environment is offline or unreachable');
      }
    } finally {
      setIsCheckingStatus(false);
    }
  };

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

    // Check required parameters
    if (func.parameters) {
      const missingParams = func.parameters
        .filter(p => p.required && !funcParams[p.name])
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

    if (func.parameters) {
      func.parameters.forEach(param => {
        const value = funcParams[param.name];
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
        }
      });
    }

    // Build query string
    const queryString = Object.keys(queryParams).length > 0
      ? '?' + new URLSearchParams(queryParams).toString()
      : '';

    const fullUrl = `${environmentUrl}${fullPath}${queryString}`;

    setExecutingFunction(func.id);

    try {
      const method = func.method.toLowerCase() as 'get' | 'post' | 'put' | 'delete' | 'patch';

      // Use privateClient to benefit from refresh token interceptor
      const { data } = await privateClient({
        method,
        url: fullUrl,
        headers: {
          'Content-Type': 'application/json',
        },
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
      const errorMsg = error?.response?.data?.message || error?.message || 'Failed to execute request';
      setFunctionResponses(prev => ({ ...prev, [func.id]: { error: errorMsg } }));
      message.error(`Failed: ${errorMsg}`);
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
          <pre className="bg-slate-900 text-slate-300 p-4 rounded-lg overflow-auto max-h-96 text-xs">
            {JSON.stringify(response, null, 2)}
          </pre>
        </div>
      ),
      okText: 'Close',
      centered: true,
    });
  };

  const redeployMessage = `Please, deploy my cyoda environment: ${environmentUrl}`;

  return (
    <div className="h-full flex flex-col bg-slate-800/95">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="p-1.5 rounded hover:bg-slate-700 transition-colors"
            title="Back to environments"
          >
            <ArrowLeft size={18} className="text-slate-400" />
          </button>
          <Server size={18} className="text-teal-400" />
          <h3 className="font-semibold text-white">{environmentName} Environment</h3>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-slate-700 transition-colors"
            title="Close Cloud panel"
          >
            <X size={18} className="text-slate-400" />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Environment URL */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Environment Details</h4>

          <div className="bg-slate-700/50 rounded-lg p-4 space-y-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Client Environment URL</label>
              <div className="flex items-center space-x-2">
                <code className="flex-1 text-sm text-teal-400 bg-slate-900/50 px-3 py-2 rounded border border-slate-600">
                  {environmentUrl || 'Not available'}
                </code>
                <button
                  onClick={() => copyToClipboard(environmentUrl, 'Environment URL')}
                  className="p-2 rounded hover:bg-slate-600 transition-colors"
                  title="Copy URL"
                >
                  {copiedField === 'Environment URL' ? (
                    <CheckCircle2 size={16} className="text-green-400" />
                  ) : (
                    <Copy size={16} className="text-slate-400" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">API Base URL</label>
              <div className="flex items-center space-x-2">
                <code className="flex-1 text-sm text-teal-400 bg-slate-900/50 px-3 py-2 rounded border border-slate-600">
                  {apiBaseUrl || 'Not available'}
                </code>
                <button
                  onClick={() => copyToClipboard(apiBaseUrl, 'API Base URL')}
                  className="p-2 rounded hover:bg-slate-600 transition-colors"
                  title="Copy API URL"
                >
                  {copiedField === 'API Base URL' ? (
                    <CheckCircle2 size={16} className="text-green-400" />
                  ) : (
                    <Copy size={16} className="text-slate-400" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">Organization ID</label>
              <div className="flex items-center space-x-2">
                <code className="flex-1 text-sm text-teal-400 bg-slate-900/50 px-3 py-2 rounded border border-slate-600">
                  {orgId || 'Not available'}
                </code>
                <button
                  onClick={() => copyToClipboard(orgId, 'Organization ID')}
                  className="p-2 rounded hover:bg-slate-600 transition-colors"
                  title="Copy Org ID"
                >
                  {copiedField === 'Organization ID' ? (
                    <CheckCircle2 size={16} className="text-green-400" />
                  ) : (
                    <Copy size={16} className="text-slate-400" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Environment Status */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Status</h4>

          <div className="bg-slate-700/50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Activity size={18} className={envStatus === 'online' ? 'text-green-400' : envStatus === 'offline' ? 'text-red-400' : 'text-yellow-400'} />
                <span className="text-sm text-white">
                  {envStatus === 'checking' ? 'Status Unknown' : envStatus === 'online' ? 'Online' : 'Offline'}
                </span>
              </div>
              <button
                onClick={checkEnvironmentStatus}
                disabled={isCheckingStatus}
                className="flex items-center space-x-2 px-3 py-1.5 rounded bg-teal-500/20 text-teal-400 hover:bg-teal-500/30 transition-colors disabled:opacity-50"
              >
                <RefreshCw size={14} className={isCheckingStatus ? 'animate-spin' : ''} />
                <span className="text-xs font-medium">Check Status</span>
              </button>
            </div>
          </div>
        </div>

        {/* Redeploy Environment */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Redeploy</h4>

          <div className="bg-slate-700/50 rounded-lg p-4">
            <p className="text-xs text-slate-400 mb-3">Copy this message to request environment redeployment:</p>
            <div className="flex items-start space-x-2">
              <code className="flex-1 text-sm text-slate-300 bg-slate-900/50 px-3 py-2 rounded border border-slate-600 whitespace-pre-wrap">
                {redeployMessage}
              </code>
              <button
                onClick={() => copyToClipboard(redeployMessage, 'Redeploy Message')}
                className="p-2 rounded hover:bg-slate-600 transition-colors flex-shrink-0"
                title="Copy message"
              >
                {copiedField === 'Redeploy Message' ? (
                  <CheckCircle2 size={16} className="text-green-400" />
                ) : (
                  <Copy size={16} className="text-slate-400" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Logs Access */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Environment Logs</h4>

          <div
            onClick={() => window.open('/logs', '_blank')}
            className="relative bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-teal-500/10 border border-purple-500/30 rounded-xl p-6 cursor-pointer transition-all duration-300 hover:border-purple-400/50 hover:shadow-lg hover:shadow-purple-500/20 hover:-translate-y-1 group overflow-hidden"
          >
            {/* Animated Background Glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 via-blue-500/0 to-teal-500/0 group-hover:from-purple-500/10 group-hover:via-blue-500/10 group-hover:to-teal-500/10 transition-all duration-500"></div>

            <div className="relative space-y-4">
              {/* Icon and Title */}
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-lg group-hover:scale-110 transition-transform">
                    <FileText size={24} className="text-purple-400" />
                  </div>
                  <div>
                    <h5 className="text-base font-semibold text-white">View System Logs</h5>
                    <p className="text-xs text-slate-400">Real-time log analysis & monitoring</p>
                  </div>
                </div>
                <div className="flex items-center space-x-1 text-purple-400 group-hover:translate-x-1 transition-transform">
                  <span className="text-xs font-medium">Open</span>
                  <ArrowLeft size={14} className="transform rotate-180" />
                </div>
              </div>

              {/* Features */}
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-teal-400"></div>
                  <span className="text-xs text-slate-300">Advanced Search</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                  <span className="text-xs text-slate-300">Query DSL</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-400"></div>
                  <span className="text-xs text-slate-300">Level Filtering</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-pink-400"></div>
                  <span className="text-xs text-slate-300">Export JSON</span>
                </div>
              </div>

              {/* Description */}
              <p className="text-xs text-slate-400 leading-relaxed">
                Access comprehensive logging with Elasticsearch integration. Search across all fields, use custom queries, and export data.
              </p>
            </div>
          </div>
        </div>

        {/* Metrics & Monitoring */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Metrics & Monitoring</h4>

          <div
            onClick={() => window.open('/monitoring', '_blank')}
            className="relative bg-gradient-to-br from-orange-500/10 via-amber-500/10 to-yellow-500/10 border border-orange-500/30 rounded-xl p-6 cursor-pointer transition-all duration-300 hover:border-orange-400/50 hover:shadow-lg hover:shadow-orange-500/20 hover:-translate-y-1 group overflow-hidden"
          >
            {/* Animated Background Glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/0 via-amber-500/0 to-yellow-500/0 group-hover:from-orange-500/10 group-hover:via-amber-500/10 group-hover:to-yellow-500/10 transition-all duration-500"></div>

            <div className="relative space-y-4">
              {/* Icon and Title */}
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-gradient-to-br from-orange-500/20 to-amber-500/20 rounded-lg group-hover:scale-110 transition-transform">
                    <BarChart3 size={24} className="text-orange-400" />
                  </div>
                  <div>
                    <h5 className="text-base font-semibold text-white">View Metrics & Dashboards</h5>
                    <p className="text-xs text-slate-400">Real-time performance monitoring</p>
                  </div>
                </div>
                <div className="flex items-center space-x-1 text-orange-400 group-hover:translate-x-1 transition-transform">
                  <span className="text-xs font-medium">Open</span>
                  <ArrowLeft size={14} className="transform rotate-180" />
                </div>
              </div>

              {/* Features - 2x2 grid */}
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-orange-400"></div>
                  <span className="text-xs text-slate-300">CPU & Memory</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400"></div>
                  <span className="text-xs text-slate-300">Network Traffic</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-yellow-400"></div>
                  <span className="text-xs text-slate-300">Pod Metrics</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-orange-300"></div>
                  <span className="text-xs text-slate-300">Custom Dashboards</span>
                </div>
              </div>

              {/* Description */}
              <p className="text-xs text-slate-400 leading-relaxed">
                Access comprehensive performance metrics and Grafana dashboards with real-time monitoring of CPU, memory, network, and pod statistics. Metrics are automatically filtered to your Kubernetes namespace.
              </p>
            </div>
          </div>
        </div>

        {/* UI Functions */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">API Functions</h4>

          <div className="space-y-2">
            {uiFunctions.map((func) => {
              const Icon = func.icon;
              const isExecuting = executingFunction === func.id;
              const hasResponse = !!functionResponses[func.id];

              return (
                <div key={func.id} className="bg-slate-700/50 rounded-lg p-3 hover:bg-slate-700/70 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start space-x-3 flex-1 min-w-0">
                      <Icon size={16} className="text-teal-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h5 className="text-sm font-medium text-white mb-0.5">{func.name}</h5>
                        <p className="text-xs text-slate-400 mb-2">{func.description}</p>
                        <div className="flex items-center space-x-2 flex-wrap gap-1 mb-2">
                          <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                            func.method === 'GET' ? 'bg-blue-500/20 text-blue-400' :
                            func.method === 'POST' ? 'bg-green-500/20 text-green-400' :
                            func.method === 'PUT' ? 'bg-yellow-500/20 text-yellow-400' :
                            func.method === 'DELETE' ? 'bg-red-500/20 text-red-400' :
                            'bg-purple-500/20 text-purple-400'
                          }`}>
                            {func.method}
                          </span>
                          <code className="text-xs text-slate-500 truncate">{func.path}</code>
                        </div>

                        {/* Parameters */}
                        {func.parameters && func.parameters.length > 0 && (
                          <div className="space-y-2 mt-3">
                            {func.parameters.map((param) => (
                              <div key={param.name} className="space-y-1">
                                <label className="text-xs text-slate-400 flex items-center gap-1">
                                  {param.name}
                                  {param.required && <span className="text-red-400">*</span>}
                                  {param.description && (
                                    <span className="text-slate-500">- {param.description}</span>
                                  )}
                                </label>
                                {param.type === 'body' ? (
                                  <textarea
                                    value={parameterValues[func.id]?.[param.name] || ''}
                                    onChange={(e) => setParameterValues(prev => ({
                                      ...prev,
                                      [func.id]: {
                                        ...prev[func.id],
                                        [param.name]: e.target.value
                                      }
                                    }))}
                                    placeholder={param.type === 'body' ? '{"key": "value"}' : `Enter ${param.name}`}
                                    className="w-full px-2 py-1.5 text-xs bg-slate-900/50 border border-slate-600 rounded text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 font-mono"
                                    rows={3}
                                  />
                                ) : (
                                  <input
                                    type="text"
                                    value={parameterValues[func.id]?.[param.name] || ''}
                                    onChange={(e) => setParameterValues(prev => ({
                                      ...prev,
                                      [func.id]: {
                                        ...prev[func.id],
                                        [param.name]: e.target.value
                                      }
                                    }))}
                                    placeholder={`Enter ${param.name}`}
                                    className="w-full px-2 py-1.5 text-xs bg-slate-900/50 border border-slate-600 rounded text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
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
                        className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-teal-500/20 text-teal-400 hover:bg-teal-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Execute function"
                      >
                        {isExecuting ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Play size={14} />
                        )}
                        <span className="text-xs font-medium">Execute</span>
                      </button>

                      {hasResponse && (
                        <button
                          onClick={() => showResponseModal(func)}
                          className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
                          title="View response"
                        >
                          <CheckCircle2 size={14} />
                          <span className="text-xs font-medium">Response</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnvironmentDetails;

