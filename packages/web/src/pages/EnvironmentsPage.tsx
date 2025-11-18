import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '@/components/Header/Header';
import EnvironmentsPanel from '@/components/EnvironmentsPanel/EnvironmentsPanel';

const EnvironmentsPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleExitFullscreen = () => {
    // Restore the previous width from localStorage
    const savedWidth = localStorage.getItem('environments-width-before-fullscreen');
    if (savedWidth) {
      localStorage.setItem('home-environments-width', savedWidth);
      localStorage.setItem('environments-width', savedWidth);
      localStorage.removeItem('environments-width-before-fullscreen');
    }

    // Navigate back to the previous page (or home if no state)
    const from = (location.state as any)?.from || '/';
    navigate(from);
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800">
      {/* Header */}
      <Header
        showActions={false}
        onToggleEnvironments={handleExitFullscreen}
        environmentsVisible={true}
      />

      {/* Fullscreen Environments Panel */}
      <div className="flex-1 overflow-hidden">
        <EnvironmentsPanel
          onResizeMouseDown={() => {}} // No resize in fullscreen
          isResizing={false}
          onClose={handleExitFullscreen}
          isFullscreen={true}
          onToggleFullscreen={handleExitFullscreen}
        />
      </div>
    </div>
  );
};

export default EnvironmentsPage;

