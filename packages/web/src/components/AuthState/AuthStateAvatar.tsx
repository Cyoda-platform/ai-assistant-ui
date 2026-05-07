import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Settings, LogOut, Shield } from 'lucide-react';
import { useAuthStore, useIsCyodaEmployee, useSuperUserMode } from '@/stores/auth';
import SettingsDialog from '@/components/SettingsDialog/SettingsDialog';

const AuthStateAvatar: React.FC = () => {
  const authStore = useAuthStore();
  const isCyodaEmployee = useIsCyodaEmployee();
  const superUserMode = useSuperUserMode();
  const { t } = useTranslation();
  const { logout } = useAuth0();
  const navigate = useNavigate();
  const [visibleCard, setVisibleCard] = useState(false);
  const [settingsDialogVisible, setSettingsDialogVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Debug logging
  useEffect(() => {

  }, [isCyodaEmployee, superUserMode]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!visibleCard) return;
      if (cardRef.current && !cardRef.current.contains(event.target as Node)) {
        setVisibleCard(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [visibleCard]);

  const picture = authStore.picture;

  const initials = useMemo(() => {
    const { family_name = 'C', given_name = 'U' } = authStore;
    const familyInitial = family_name.charAt(0).toUpperCase();
    const givenInitial = given_name.charAt(0).toUpperCase();
    return `${givenInitial}${familyInitial}`;
  }, [authStore.family_name, authStore.given_name]);

  const email = authStore.email;

  const onClickSettings = () => {
    setVisibleCard(false);
    setSettingsDialogVisible(true);
  };

  const onClickLogout = () => {
    setVisibleCard(false);
    const isElectron = import.meta.env.VITE_IS_ELECTRON;

    if (isElectron) {
      authStore.logout();
      navigate('/');
    } else {
      authStore.logout(() => {
        logout({
          logoutParams: {
            returnTo: window.location.origin
          }
        });
      });
      navigate('/');
    }
  };

  const onToggleCard = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newVisibleState = !visibleCard;


    setVisibleCard(newVisibleState);
  };

  const onToggleSuperUserMode = () => {
    authStore.toggleSuperUserMode();
  };

  return (
    <div className="relative auth-dropdown">
      {picture ? (
        <img
          onClick={onToggleCard}
          className="w-8 h-8 rounded-full cursor-pointer hover:ring-2 hover:ring-teal-400 transition-all"
          src={picture}
          alt="User avatar"
        />
      ) : (
        <div
          onClick={onToggleCard}
          className="w-8 h-8 rounded-full cursor-pointer bg-teal-600 text-white text-sm font-medium flex items-center justify-center hover:ring-2 hover:ring-teal-400 transition-all"
        >
          {initials}
        </div>
      )}

      {visibleCard && (
        <div
          ref={cardRef}
          className="absolute right-0 top-10 min-w-72 z-[9999] bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden"
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
            <span className="text-slate-900 font-semibold text-sm">{email}</span>
          </div>

          {/* Content */}
          <div className="p-2">
            {/* Super User Mode Toggle - Only for Cyoda Employees */}
            {isCyodaEmployee && (
              <div className="mb-2">
                <button
                  onClick={onToggleSuperUserMode}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors ${
                    superUserMode
                      ? 'bg-teal-50 text-teal-700 hover:bg-teal-100'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Shield className="w-4 h-4" />
                    <span>Super User Mode</span>
                  </div>
                  <div className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    superUserMode ? 'bg-teal-500' : 'bg-slate-300'
                  }`}>
                    <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                      superUserMode ? 'translate-x-5' : 'translate-x-1'
                    }`} />
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="border-t border-slate-200 bg-slate-50">
            <button
              onClick={onClickLogout}
              className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4 text-red-600" />
              <span className="font-semibold text-sm text-red-600">Logout</span>
            </button>
          </div>
        </div>
      )}

      <SettingsDialog
        visible={settingsDialogVisible}
        onClose={() => setSettingsDialogVisible(false)}
      />
    </div>
  );
};

export default AuthStateAvatar;
