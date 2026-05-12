import React, { useEffect } from 'react';

const Notification = ({ notification, onClose }) => {
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification, onClose]);

  if (!notification) return null;

  const getNotificationStyles = (type) => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-gradient-to-r from-emerald-500 to-teal-600',
          icon: '✓',
          iconBg: 'bg-emerald-100',
          iconColor: 'text-emerald-600',
          border: 'border-emerald-200'
        };
      case 'error':
        return {
          bg: 'bg-gradient-to-r from-red-500 to-rose-600',
          icon: '✕',
          iconBg: 'bg-red-100',
          iconColor: 'text-red-600',
          border: 'border-red-200'
        };
      case 'warning':
        return {
          bg: 'bg-gradient-to-r from-amber-500 to-orange-600',
          icon: '⚠',
          iconBg: 'bg-amber-100',
          iconColor: 'text-amber-600',
          border: 'border-amber-200'
        };
      default:
        return {
          bg: 'bg-gradient-to-r from-blue-500 to-indigo-600',
          icon: 'ℹ',
          iconBg: 'bg-blue-100',
          iconColor: 'text-blue-600',
          border: 'border-blue-200'
        };
    }
  };

  const styles = getNotificationStyles(notification.type);

  return (
    <div className="fixed top-4 right-4 z-50 animate-pulse">
      <div className={`${styles.bg} text-white p-1 rounded-2xl shadow-2xl backdrop-blur-sm border ${styles.border}`}>
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
          <div className="flex items-start space-x-3">
            <div className={`flex-shrink-0 ${styles.iconBg} rounded-full p-2`}>
              <span className={`${styles.iconColor} text-lg font-bold`}>{styles.icon}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium text-sm leading-5">
                {notification.message}
              </p>
              {notification.queueData && (
                <div className="mt-2 bg-white/20 backdrop-blur-sm rounded-lg p-3">
                  <div className="grid grid-cols-1 gap-2 text-xs">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-2 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path>
                      </svg>
                      <span className="text-white/90 font-semibold">Queue Position: #{notification.queueData.queue_position}</span>
                    </div>
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-2 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      <span className="text-white/90 font-semibold">Estimated Wait: {notification.queueData.estimated_wait_time} minutes</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="flex-shrink-0 bg-white/20 hover:bg-white/30 rounded-full p-1 transition-colors duration-200"
            >
              <svg className="w-4 h-4 text-white/80 hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notification;
