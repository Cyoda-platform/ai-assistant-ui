import React from 'react';
import { useAuthStore, useIsCyodaEmployee, useSuperUserMode } from '@/stores/auth';

/**
 * Debug component to display auth state
 * Add this temporarily to your app to see the current auth state
 * Usage: <DebugAuthState />
 */
const DebugAuthState: React.FC = () => {
  const authStore = useAuthStore();
  const isCyodaEmployee = useIsCyodaEmployee();
  const superUserMode = useSuperUserMode();

  return (
    <div className="fixed bottom-4 right-4 bg-slate-800 border border-teal-500 rounded-lg p-4 shadow-xl z-[10000] max-w-md">
      <h3 className="text-teal-400 font-bold mb-2">🔍 Auth Debug Info</h3>
      <div className="text-xs text-slate-300 space-y-1">
        <div>
          <span className="text-slate-400">Is Logged In:</span>{' '}
          <span className={authStore.token && authStore.tokenType === 'private' ? 'text-green-400' : 'text-red-400'}>
            {authStore.token && authStore.tokenType === 'private' ? 'Yes' : 'No'}
          </span>
        </div>
        <div>
          <span className="text-slate-400">Token Type:</span>{' '}
          <span className="text-white">{authStore.tokenType || 'none'}</span>
        </div>
        <div>
          <span className="text-slate-400">Email:</span>{' '}
          <span className="text-white">{authStore.email || 'none'}</span>
        </div>
        <div className="border-t border-slate-600 pt-2 mt-2">
          <span className="text-slate-400">Is Cyoda Employee:</span>{' '}
          <span className={isCyodaEmployee ? 'text-green-400 font-bold' : 'text-red-400'}>
            {isCyodaEmployee ? 'TRUE ✓' : 'FALSE ✗'}
          </span>
        </div>
        <div>
          <span className="text-slate-400">Super User Mode:</span>{' '}
          <span className={superUserMode ? 'text-teal-400 font-bold' : 'text-slate-400'}>
            {superUserMode ? 'ENABLED ✓' : 'DISABLED'}
          </span>
        </div>
        <div className="border-t border-slate-600 pt-2 mt-2">
          <span className="text-slate-400">Token Preview:</span>
          <div className="text-white font-mono text-[10px] break-all mt-1">
            {authStore.token ? authStore.token.substring(0, 50) + '...' : 'none'}
          </div>
        </div>
      </div>
      <button
        onClick={() => {
        }}
        className="mt-3 w-full bg-teal-500 hover:bg-teal-600 text-white text-xs py-1 px-2 rounded transition-colors"
      >
        Log Full State to Console
      </button>
    </div>
  );
};

export default DebugAuthState;

