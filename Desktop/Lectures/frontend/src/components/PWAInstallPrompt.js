import React, { useState, useEffect } from 'react';
import { Button } from 'antd';
import { DownloadOutlined, CloseOutlined } from '@ant-design/icons';

function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Показываем кнопку установки через 30 секунд
      setTimeout(() => {
        setShowPrompt(true);
      }, 30000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('Пользователь согласился установить приложение');
    }
    
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleClose = () => {
    setShowPrompt(false);
  };

  if (!showPrompt || !deferredPrompt) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: 20,
      left: '50%',
      transform: 'translateX(-50%)',
      backgroundColor: '#1890ff',
      color: 'white',
      padding: '12px 20px',
      borderRadius: '50px',
      boxShadow: '0 4px 12px rgba(24, 144, 255, 0.4)',
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      zIndex: 9999,
      maxWidth: 'calc(100% - 40px)',
      animation: 'slideUp 0.3s ease-out'
    }}>
      <DownloadOutlined style={{ fontSize: 18 }} />
      <span style={{ fontSize: 14, whiteSpace: 'nowrap' }}>
        Установить приложение
      </span>
      <Button
        type="primary"
        size="small"
        onClick={handleInstallClick}
        style={{
          backgroundColor: 'white',
          color: '#1890ff',
          border: 'none',
          borderRadius: '20px',
          padding: '4px 16px'
        }}
      >
        Да
      </Button>
      <Button
        type="text"
        size="small"
        onClick={handleClose}
        icon={<CloseOutlined />}
        style={{ color: 'white', fontSize: 16 }}
      />
    </div>
  );
}

export default PWAInstallPrompt;
