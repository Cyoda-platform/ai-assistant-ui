import React, { useState, useEffect } from 'react';
import { Modal, Button } from 'antd';
import { useAuth0 } from '@auth0/auth0-react';
import { X } from 'lucide-react';
import eventBus from '@/plugins/eventBus';
import { SHOW_LOGIN_POPUP } from '@/helpers/HelperConstants';
import HelperStorage from '@/helpers/HelperStorage';
import { LOGIN_REDIRECT_URL } from '@/helpers/HelperConstants';

interface LoginPopUpData {
  isGuestUser?: boolean;
  onProceedWithoutLogin?: () => void;
}

const LoginPopUp: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [popupData, setPopupData] = useState<LoginPopUpData>({});
  const { loginWithRedirect } = useAuth0();
  const helperStorage = new HelperStorage();

  useEffect(() => {
    const handleShowLoginPopup = (data?: LoginPopUpData) => {
      setPopupData(data || {});
      setVisible(true);
    };

    eventBus.$on(SHOW_LOGIN_POPUP, handleShowLoginPopup);

    return () => {
      eventBus.$off(SHOW_LOGIN_POPUP, handleShowLoginPopup);
    };
  }, []);

  const handleLogin = () => {
    // Store current URL for redirect after login
    helperStorage.set(LOGIN_REDIRECT_URL, window.location.pathname);
    setVisible(false);
    loginWithRedirect({
      authorizationParams: { prompt: 'login' }
    });
  };

  const handleProceedWithoutLogin = () => {
    setVisible(false);
    if (popupData.onProceedWithoutLogin) {
      popupData.onProceedWithoutLogin();
    }
  };

  const handleCancel = () => {
    setVisible(false);
    setPopupData({});
  };

  // Render different content based on whether it's a guest user
  const isGuestUser = popupData.isGuestUser;

  return (
    <Modal
      title={null}
      open={visible}
      onCancel={handleCancel}
      className="fashionable-login-modal"
      centered
      width={520}
      footer={null}
      closeIcon={
        <X className="w-5 h-5 text-slate-900 hover:text-slate-400 transition-colors" />
      }
    >
      {isGuestUser ? (
        <div className="relative">
          {/* Icon and Title */}
          <div className="text-center mb-6 pt-2">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-teal-600 mb-4 shadow-md">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Unlock Full Experience
            </h2>
            <p className="text-slate-300 text-sm">
              Get the most out of your AI assistant
            </p>
          </div>

          {/* Benefits List */}
          <div className="space-y-3 mb-8 px-2">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-teal-900/40 flex items-center justify-center mt-0.5">
                <svg className="w-3 h-3 text-teal-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-200">Save your conversation history</p>
                <p className="text-xs text-slate-400">Access your chats anytime, anywhere</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-teal-900/40 flex items-center justify-center mt-0.5">
                <svg className="w-3 h-3 text-teal-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-200">Personalized AI responses</p>
                <p className="text-xs text-slate-400">Tailored to your preferences and needs</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-teal-900/40 flex items-center justify-center mt-0.5">
                <svg className="w-3 h-3 text-teal-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-200">Enhanced security & privacy</p>
                <p className="text-xs text-slate-400">Your data is protected and encrypted</p>
              </div>
            </div>
          </div>

          {/* Primary CTA Button */}
          <button
            onClick={handleLogin}
            className="w-full bg-cyan-900 hover:bg-cyan-700 text-white font-normal py-3 px-6 rounded-md transition-colors duration-200 mb-4"
          >
            <span className="flex items-center justify-center space-x-2">
              <span className="text-sm">Continue with Login</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </span>
          </button>

          {/* Spacer for 10% gap */}
          <div className="h-[10%] min-h-4"></div>

          {/* Secondary subtle link */}
          <div className="text-center">
            <button
              onClick={handleProceedWithoutLogin}
              className="text-xs text-slate-500 hover:text-slate-400 transition-colors underline decoration-dotted underline-offset-2"
            >
              Continue as guest
            </button>
          </div>
        </div>
      ) : (
        <div className="py-6">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 mb-4 shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
              Login Required
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              Please log in to continue
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleLogin}
              className="w-full bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg transition-all duration-200"
            >
              Log in
            </button>
            <button
              onClick={handleCancel}
              className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium py-3 px-6 rounded-xl transition-all duration-200"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default LoginPopUp;
