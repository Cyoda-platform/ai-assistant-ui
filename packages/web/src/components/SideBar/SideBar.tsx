import React, { useState, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/stores/app';
import LoadingText from '@/components/LoadingText/LoadingText.tsx';
import AuthState from '@/components/AuthState/AuthState.tsx';

// Import Ant Design icons as temporary replacement
import {
  HomeOutlined,
  HistoryOutlined,
  SettingOutlined,
  InfoCircleOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DownOutlined,
  CloseOutlined
} from '@ant-design/icons';
import LogoSmallUrl from '@/assets/images/logo-small.svg?url';
import LogoUrl from '@/assets/images/logo.svg?url';

const SideBar: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const appStore = useAppStore();
  const rootRef = useRef<HTMLDivElement>(null);

  const [isHistoryMenuVisible, setIsHistoryMenuVisible] = useState(false);
  const [isHistoryMenuReady, setIsHistoryMenuReady] = useState(false);
  const [isHistoryMenuActive, setIsHistoryMenuActive] = useState(false);

  const isSidebarHidden = appStore.isSidebarHidden;
  const isDrawer = false; // This would be determined by screen size/context

  const isActiveMenu = (path: string) => {
    return location.pathname === path;
  };

  const onClickToggleSidebar = () => {
    appStore.toggleSidebar();
  };

  const onToggleDrawer = () => {
    // Handle drawer toggle
    appStore.toggleSidebar();
  };

  const onClickToggleHistory = () => {
    setIsHistoryMenuVisible(!isHistoryMenuVisible);
  };

  const onHistoryMenuReady = () => {
    setIsHistoryMenuReady(true);
  };

  const onHistoryMenuActive = (active: boolean) => {
    setIsHistoryMenuActive(active);
  };

  const onClickSettings = () => {
    // Handle settings click - could open settings dialog
    console.log('Settings clicked');
  };

  const onClickAbout = () => {
    // Handle about click - could open about dialog
    console.log('About clicked');
  };

  return (
    <div ref={rootRef} className={`side-bar ${isSidebarHidden ? 'side-bar--hidden' : ''}`}>
      <div className="side-bar__wrapper-logo">
        {isSidebarHidden ? (
          <img alt="logo" className="side-bar__logo" src={LogoSmallUrl} />
        ) : (
          <>
            <img alt="logo" className="side-bar__logo" src={LogoUrl} />
            {/* <VersionApp small={true} /> */}
            {isDrawer ? (
              <CloseOutlined onClick={onToggleDrawer} className="side-bar__toggle-close" />
            ) : (
              <MenuFoldOutlined onClick={onClickToggleSidebar} className="side-bar__toggle-close" />
            )}
          </>
        )}
      </div>

      <ul className="side-bar__nav">
        {isSidebarHidden && (
          <li className="side-bar__li">
            <a onClick={onClickToggleSidebar} className="side-bar__link" href="#">
              <MenuUnfoldOutlined className="side-bar__toggle-close main-icon" />
            </a>
          </li>
        )}

        <li className={`side-bar__li ${isActiveMenu('/home') ? 'active' : ''}`}>
          <Link className="side-bar__link" to="/home">
            <HomeOutlined className="main-icon" />
            {!isSidebarHidden && <span>{t('side_bar.links.home')}</span>}
          </Link>
        </li>

        {!isSidebarHidden && (
          <li className={`side-bar__li ${isHistoryMenuActive ? 'active' : ''}`}>
            <a onClick={onClickToggleHistory} className="side-bar__link" href="#">
              <HistoryOutlined className="main-icon" />
              <span>
                {t('side_bar.links.history')}
                {!isHistoryMenuReady && (
                  <>
                    {' '}(<LoadingText />)
                  </>
                )}
              </span>
              <DownOutlined
                className={`arrow-down-icon ${isHistoryMenuVisible ? 'open' : ''}`}
              />
            </a>
            {/* <MenuChatList
              onReady={onHistoryMenuReady}
              onActive={onHistoryMenuActive}
              style={{ display: isHistoryMenuVisible ? 'block' : 'none' }}
            /> */}
          </li>
        )}

        <li className="side-bar__li side-bar__li-border">
          <a onClick={onClickSettings} className="side-bar__link" href="#">
            <SettingOutlined className="main-icon" />
            {!isSidebarHidden && <span>{t('side_bar.links.settings')}</span>}
          </a>
        </li>

        <li className="side-bar__li">
          <a onClick={onClickAbout} className="side-bar__link" href="#">
            <InfoCircleOutlined className="main-icon" />
            {!isSidebarHidden && <span>{t('side_bar.links.about')}</span>}
          </a>
        </li>
      </ul>

      <div className="side-bar__footer">
        <AuthState />
      </div>
    </div>
  );
};

export default SideBar;
