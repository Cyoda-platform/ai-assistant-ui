import React, { useState, useMemo } from 'react';
import dayjs from 'dayjs';
import { Bot, Clock, Zap, CheckCircle, Info, Loader2, Download } from 'lucide-react';
import { useAuthStore } from '@/stores/auth';
import privateClient from '@/clients/private';
import FileSaver from 'file-saver';
import LogoSmall from '@/assets/images/logo-small.svg';

// Parse JWT token
function parseJwt(token: string): Record<string, any> | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

interface Message {
  text: string | object;
  last_modified?: string;
  raw?: any;
  approve?: boolean;
}

interface ChatBotMessageFunctionProps {
  message: Message;
  onApproveQuestion: (data: any) => void;
}

interface UIFunctionData {
  type: string;
  function: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  response_format: 'file' | 'json';
  env_url?: string; // Environment URL for targeted API calls (e.g., "client-user123-dev.cyoda.cloud")
  query_params?: Record<string, string>; // Query parameters to append to the URL
}

const ChatBotMessageFunction: React.FC<ChatBotMessageFunctionProps> = ({
  message,
  onApproveQuestion
}) => {
  const token = useAuthStore((state) => state.token);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingApprove, setIsLoadingApprove] = useState(false);
  const [serverResponse, setServerResponse] = useState<any>(null);
  const [withAdminRole, setWithAdminRole] = useState(false); // Admin role checkbox state

  // Parse token once
  const parsedToken = useMemo(() => {
    return token ? parseJwt(token) : null;
  }, [token]);

  // Parse the UI function data
  const functionData = useMemo<UIFunctionData | null>(() => {
    try {
      let parsedData: any = null;

      // First, check if data is in message.raw.ui_function (from loaded chat history)
      if (message.raw?.ui_function) {
        parsedData = message.raw.ui_function;
      }
      // If message.text is already an object, use it directly
      else if (typeof message.text === 'object' && message.text !== null) {
        parsedData = message.text;
      }
      // If it's a string, try to parse it as JSON
      else if (typeof message.text === 'string') {
        // Handle empty strings
        if (!message.text.trim()) {
          console.error('UI function data is empty string');
          return null;
        }

        // Replace single quotes with double quotes for valid JSON
        const jsonText = message.text.replace(/'/g, '"');
        parsedData = JSON.parse(jsonText);
      } else {
        console.error('UI function data is neither object nor string:', typeof message.text);
        return null;
      }

      // Flatten the structure: if env_url is in data.env_url, move it to top level
      if (parsedData?.data?.env_url && !parsedData.env_url) {
        parsedData.env_url = parsedData.data.env_url;
      }

      return parsedData as UIFunctionData;
    } catch (error) {
      console.error('Failed to parse UI function data:', error, 'Raw data:', message.text);
      return null;
    }
  }, [message.text, message.raw?.ui_function]);

  const date = useMemo(() => {
    if (!message.last_modified) return '';
    return dayjs(message.last_modified).format('HH:mm');
  }, [message.last_modified]);

  // Initialize withAdminRole from query_params if agent already set it
  React.useEffect(() => {
    // Check both camelCase and snake_case formats
    if (functionData?.query_params?.withAdminRole === 'true' ||
        functionData?.query_params?.with_admin_role === 'true') {
      setWithAdminRole(true);
    }
  }, [functionData]);

  // Build the endpoint URL
  const endpointUrl = useMemo(() => {
    if (!functionData) return '';

    let baseUrl = '';

    // If env_url is provided, use it directly (for multi-environment support)
    if (functionData.env_url) {
      baseUrl = `https://${functionData.env_url}${functionData.path}`;
    } else {
      // Fallback to legacy behavior using JWT token
      if (!parsedToken) return '';
      const envPrefix = import.meta.env.VITE_APP_CYODA_CLIENT_ENV_PREFIX || '';
      const orgId = (parsedToken.caas_org_id || '').toLowerCase();
      const host = import.meta.env.VITE_APP_CYODA_CLIENT_HOST || '';
      // Remove trailing dash from envPrefix if it exists to avoid double dash
      const cleanPrefix = envPrefix.endsWith('-') ? envPrefix.slice(0, -1) : envPrefix;
      baseUrl = `https://${cleanPrefix}-${orgId}.${host}${functionData.path}`;
    }

    // Build query parameters
    let queryParams = { ...functionData.query_params };

    // For issue_technical_user, override withAdminRole with checkbox state
    if (functionData.function === 'issue_technical_user') {
      // Remove old snake_case parameter if it exists
      delete queryParams.with_admin_role;
      // Add new camelCase parameter
      queryParams.withAdminRole = withAdminRole ? 'true' : 'false';
    }

    // Append query parameters if present
    if (queryParams && Object.keys(queryParams).length > 0) {
      const queryString = new URLSearchParams(queryParams).toString();
      baseUrl += `?${queryString}`;
    }

    return baseUrl;
  }, [functionData, parsedToken, withAdminRole]);

  const handleExecute = async () => {
    if (!functionData || !token) return;

    try {
      setIsLoading(true);
      setServerResponse(null); // Clear previous response

      // Preemptively refresh the token to avoid 401 errors during execution
      // This prevents triggering the global logout behavior in the interceptor
      try {
        await useAuthStore.getState().refreshAccessToken();
      } catch (refreshError) {
        console.warn('Token refresh failed, will attempt request anyway:', refreshError);
        // Continue with the request - the interceptor will handle it if needed
      }

      const method = functionData.method.toLowerCase() as 'get' | 'post' | 'put' | 'delete' | 'patch';

      // Use privateClient to benefit from refresh token interceptor
      // The URL is absolute, so it will override the baseURL
      const { data } = await privateClient({
        method,
        url: endpointUrl,
        headers: {
          'Content-Type': 'application/json',
        },
        // @ts-ignore - Custom flag to prevent global logout on auth failure
        __skipLogoutOnAuthFailure: true,
      });

      // Handle response based on format
      if (functionData.response_format === 'file') {
        const date = dayjs();
        const file = new File(
          [JSON.stringify(data, null, 2)],
          `response_${date.format('DD-MM-YYYY_HH-mm-ss')}.json`,
          { type: 'application/json' }
        );
        FileSaver.saveAs(file);
      } else {
        setServerResponse(data);
      }
    } catch (error: any) {
      console.error('Failed to execute UI function:', error);

      // Handle 401 errors more gracefully
      if (error?.response?.status === 401) {
        setServerResponse({
          error: 'Authentication failed. Your session may have expired. Please try again or refresh the page to re-authenticate.'
        });
      } else {
        setServerResponse({
          error: error?.response?.data?.message || error?.message || 'Failed to execute request'
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = () => {
    setIsLoadingApprove(true);
    onApproveQuestion(message.raw);
    setTimeout(() => {
      setIsLoadingApprove(false);
    }, 2000);
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'bg-blue-500';
      case 'POST': return 'bg-green-500';
      case 'PUT': return 'bg-yellow-500';
      case 'DELETE': return 'bg-red-500';
      case 'PATCH': return 'bg-purple-500';
      default: return 'bg-slate-500';
    }
  };

  if (!functionData) {
    return (
      <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
        <p className="text-red-400">Failed to parse UI function data</p>
      </div>
    );
  }

  return (
    <div className="flex justify-start mb-6 animate-fade-in-up px-4 md:px-6 lg:px-8">
      <div className="flex items-start space-x-3 max-w-6xl w-full">
        {/* Bot Avatar */}
        <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg overflow-hidden">
          <img src={LogoSmall} alt="CYODA" className="w-12 h-12" />
        </div>

        <div className="flex-1">
          {/* Function Badge */}
          <div className="flex items-center space-x-2 mb-2">
            <div className="flex items-center space-x-1.5 bg-purple-500/20 backdrop-blur-sm px-3 py-1 rounded-full border border-purple-500/30">
              <Zap size={12} className="text-purple-400" />
              <span className="text-xs font-medium text-purple-300">UI FUNCTION</span>
            </div>
            {date && (
              <div className="flex items-center space-x-1 text-xs text-slate-500">
                <Clock size={12} />
                <span>{date}</span>
              </div>
            )}
          </div>

          {/* Action Block */}
          <div className={`bg-slate-800/50 backdrop-blur-sm border border-slate-600 rounded-3xl shadow-lg relative group px-4 py-3 ${message.approve ? 'pb-12' : ''}`}>
            {/* Method and Path */}
            <div className="flex items-center space-x-3 mb-3">
              <span className={`${getMethodColor(functionData.method)} text-white text-xs font-bold px-3 py-1 rounded-md min-w-[70px] text-center`}>
                {functionData.method}
              </span>
              <span className="text-white font-mono text-sm flex-1 truncate" title={functionData.path}>
                {functionData.path}
              </span>
            </div>

            {/* Function Name */}
            <div className="text-slate-400 text-sm mb-3 font-mono">
              {functionData.function}
            </div>

            {/* Admin Role Checkbox - Only for issue_technical_user */}
            {functionData.function === 'issue_technical_user' && (
              <div className="mb-3 p-3 bg-slate-700/30 rounded-lg border border-slate-600/50">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={withAdminRole}
                    onChange={(e) => setWithAdminRole(e.target.checked)}
                    className="w-4 h-4 bg-slate-900/60 border border-slate-600/50 rounded text-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:ring-offset-0 cursor-pointer transition-colors"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-slate-200 group-hover:text-white transition-colors">
                      Issue with ADMIN role
                    </span>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Grant M2M and ADMIN privileges to this technical user
                    </p>
                  </div>
                  {withAdminRole && (
                    <span className="text-xs font-semibold text-amber-400 bg-amber-400/10 px-2 py-1 rounded border border-amber-400/30">
                      ADMIN
                    </span>
                  )}
                </label>
              </div>
            )}

            {/* Query Parameters (for non-issue_technical_user functions) */}
            {functionData.function !== 'issue_technical_user' && functionData.query_params && Object.keys(functionData.query_params).length > 0 && (
              <div className="mb-3 p-2 bg-slate-700/30 rounded-lg">
                <div className="text-slate-500 text-xs font-semibold mb-1">Query Parameters:</div>
                <div className="space-y-1">
                  {Object.entries(functionData.query_params).map(([key, value]) => (
                    <div key={key} className="flex items-center space-x-2 text-xs">
                      <span className="text-slate-400 font-mono">{key}:</span>
                      <span className="text-teal-300 font-mono">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Response Format and Execute Button */}
            <div className="flex items-center justify-between">
              <div className="text-slate-400 text-sm">
                <span className="text-slate-500 font-semibold">Response format:</span>{' '}
                <span className="text-slate-300">{functionData.response_format}</span>
              </div>
              <button
                onClick={handleExecute}
                disabled={isLoading}
                className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-all duration-200 shadow-lg hover:shadow-purple-500/25 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Executing...</span>
                  </>
                ) : (
                  <>
                    <Zap size={16} />
                    <span>Run it</span>
                  </>
                )}
              </button>
            </div>

            {/* Info Message */}
            <div className="mt-3 flex items-start space-x-2 text-xs text-slate-500 bg-slate-700/30 p-2 rounded-md">
              <Info size={14} className="flex-shrink-0 mt-0.5" />
              <span>The response might contain sensitive user environment information and will not be persisted.</span>
            </div>

            {/* Server Response */}
            {serverResponse && (
              <div className="mt-4 pt-4 border-t border-slate-600">
                <h4 className="text-white font-semibold mb-2 flex items-center space-x-2">
                  <Download size={16} />
                  <span>Response:</span>
                </h4>
                <pre className="bg-slate-900/50 p-3 rounded-lg text-slate-300 text-xs overflow-x-auto max-h-60 overflow-y-auto">
                  {JSON.stringify(serverResponse, null, 2)}
                </pre>
              </div>
            )}

            {/* Approve Button - Bottom Right Corner */}
            {message.approve && (
              <button
                onClick={handleApprove}
                disabled={isLoadingApprove}
                className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-green-500 hover:bg-green-600 text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl flex items-center justify-center"
                title="Approve this response"
              >
                {isLoadingApprove ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <CheckCircle size={16} />
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatBotMessageFunction;
