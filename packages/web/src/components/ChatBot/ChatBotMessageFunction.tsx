import React, { useState, useMemo } from 'react';
import dayjs from 'dayjs';
import { Bot, Clock, Zap, CheckCircle, Info, Loader2, Download } from 'lucide-react';
import { useAuthStore } from '@/stores/auth';
import axios from 'axios';
import FileSaver from 'file-saver';

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
}

const ChatBotMessageFunction: React.FC<ChatBotMessageFunctionProps> = ({
  message,
  onApproveQuestion
}) => {
  const token = useAuthStore((state) => state.token);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingApprove, setIsLoadingApprove] = useState(false);
  const [serverResponse, setServerResponse] = useState<any>(null);

  // Parse token once
  const parsedToken = useMemo(() => {
    return token ? parseJwt(token) : null;
  }, [token]);

  // Parse the UI function data
  const functionData = useMemo<UIFunctionData | null>(() => {
    try {
      const text = typeof message.text === 'string' ? message.text : JSON.stringify(message.text);
      // Replace single quotes with double quotes for valid JSON
      const jsonText = text.replace(/'/g, '"');
      return JSON.parse(jsonText);
    } catch (error) {
      console.error('Failed to parse UI function data:', error);
      return null;
    }
  }, [message.text]);

  const date = useMemo(() => {
    if (!message.last_modified) return '';
    return dayjs(message.last_modified).format('HH:mm');
  }, [message.last_modified]);

  // Build the endpoint URL
  const endpointUrl = useMemo(() => {
    if (!functionData || !parsedToken) return '';
    const envPrefix = import.meta.env.VITE_APP_CYODA_CLIENT_ENV_PREFIX || '';
    const orgId = (parsedToken.caas_org_id || '').toLowerCase();
    const host = import.meta.env.VITE_APP_CYODA_CLIENT_HOST || '';
    // Remove trailing dash from envPrefix if it exists to avoid double dash
    const cleanPrefix = envPrefix.endsWith('-') ? envPrefix.slice(0, -1) : envPrefix;
    return `https://${cleanPrefix}-${orgId}.${host}${functionData.path}`;
  }, [functionData, parsedToken]);

  const handleExecute = async () => {
    if (!functionData || !token) return;

    try {
      setIsLoading(true);
      const method = functionData.method.toLowerCase() as 'get' | 'post' | 'put' | 'delete' | 'patch';

      console.log('=== UI Function Request Debug ===');
      console.log('Method:', method);
      console.log('Full URL:', endpointUrl);
      console.log('Function Data:', functionData);
      console.log('Env Prefix:', import.meta.env.VITE_APP_CYODA_CLIENT_ENV_PREFIX);
      console.log('Org ID:', parsedToken?.caas_org_id);
      console.log('Host:', import.meta.env.VITE_APP_CYODA_CLIENT_HOST);
      console.log('Parsed Token:', parsedToken);
      console.log('================================');

      // Create axios instance with bearer token for this specific request
      const { data } = await axios({
        method,
        url: endpointUrl,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
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
    } catch (error) {
      console.error('Failed to execute UI function:', error);
      setServerResponse({ error: 'Failed to execute request' });
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
    <div className="flex justify-start mb-6 animate-fade-in-up">
      <div className="flex items-start space-x-3 max-w-[85%]">
        {/* Bot Avatar */}
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-lg border-2 border-purple-400/30">
          <Zap size={20} className="text-white" />
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
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-600 rounded-xl p-4 shadow-lg">
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
                    <span>Try it out</span>
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
          </div>

          {/* Approve Button */}
          {message.approve && (
            <div className="mt-3 flex justify-start">
              <button
                onClick={handleApprove}
                disabled={isLoadingApprove}
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-2 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none border border-green-400/20 flex items-center space-x-2"
              >
                {isLoadingApprove ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Approving...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle size={16} />
                    <span>Approve</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatBotMessageFunction;
