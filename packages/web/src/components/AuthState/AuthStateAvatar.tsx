import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Card } from 'antd';
import { useAuth0 } from '@auth0/auth0-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/stores/auth';
import SettingsDialog from '@/components/SettingsDialog/SettingsDialog';
import SettingsIcon from '@/assets/images/icons/settings.svg';
import LogoutIcon from '@/assets/images/icons/logout.svg';

const AuthStateAvatar: React.FC = () => {
  const authStore = useAuthStore();
  const { t } = useTranslation();
  const { logout } = useAuth0();
  const navigate = useNavigate();
  const [visibleCard, setVisibleCard] = useState(false);
  const [settingsDialogVisible, setSettingsDialogVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

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
    setVisibleCard(!visibleCard);
  };

  return (
    <div className="auth_state_avatar">
      {picture ? (
        <img 
          onClick={onToggleCard} 
          className="auth_state_avatar__image auth_state_avatar__icon" 
          src={picture} 
          alt="User avatar"
        />
      ) : (
        <div 
          onClick={onToggleCard} 
          className="auth_state_avatar__initials auth_state_avatar__icon"
        >
          {initials}
        </div>
      )}

      {visibleCard && (
        <Card 
          ref={cardRef}
          className="auth_state_avatar__card"
          title={<span>{email}</span>}
          actions={[
            <a key="logout" onClick={onClickLogout} href="#" className="auth_state_avatar__link">
              <LogoutIcon className="logout-icon" />
              <span>{t('side_bar.logout')}</span>
            </a>
          ]}
        >
          <a onClick={onClickSettings} className="auth_state_avatar__link" href="#">
            <SettingsIcon className="main-icon" />
            {t('side_bar.links.settings')}
          </a>
        </Card>
      )}
      
      <SettingsDialog 
        visible={settingsDialogVisible}
        onClose={() => setSettingsDialogVisible(false)}
      />
    </div>
  );
};

export default AuthStateAvatar;
