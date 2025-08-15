import React, { createContext, useContext, useCallback, useMemo, useState } from 'react';

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface Notification {
  id: string;
  type: NotificationType;
  title?: string;
  message: string;
  timeoutMs?: number; // auto-dismiss
}

interface NotificationsContextValue {
  notify: (n: Omit<Notification, 'id'>) => string;
  dismiss: (id: string) => void;
  clearAll: () => void;
  notifications: Notification[];
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

export const useNotifications = (): NotificationsContextValue => {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationsProvider');
  return ctx;
};

export const NotificationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const dismiss = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const notify: NotificationsContextValue['notify'] = useCallback((n) => {
    const id = `ntf_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const timeoutMs = n.timeoutMs ?? (n.type === 'error' ? undefined : 4000);
    const full: Notification = { id, ...n, timeoutMs };
    setNotifications((prev) => [full, ...prev]);

    if (timeoutMs) {
      setTimeout(() => dismiss(id), timeoutMs);
    }
    return id;
  }, [dismiss]);

  const clearAll = useCallback(() => setNotifications([]), []);

  const value = useMemo(() => ({ notify, dismiss, clearAll, notifications }), [notify, dismiss, clearAll, notifications]);

  return (
    <NotificationsContext.Provider value={value}>
      {children}
      <NotificationsToaster notifications={notifications} onDismiss={dismiss} />
    </NotificationsContext.Provider>
  );
};

export const NotificationsToaster: React.FC<{ notifications: Notification[]; onDismiss: (id: string) => void }> = ({ notifications, onDismiss }) => {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {notifications.map((n) => (
        <div
          key={n.id}
          className={`min-w-[260px] max-w-sm border rounded-lg shadow-md p-3 backdrop-blur bg-white/90 ${
            n.type === 'success' ? 'border-green-300' : n.type === 'error' ? 'border-red-300' : n.type === 'warning' ? 'border-yellow-300' : 'border-blue-300'
          }`}
        >
          <div className="flex items-start gap-2">
            <div className={`mt-0.5 w-2 h-2 rounded-full ${
              n.type === 'success' ? 'bg-green-500' : n.type === 'error' ? 'bg-red-500' : n.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
            }`} />
            <div className="flex-1">
              {n.title && <div className="text-sm font-medium text-gray-900">{n.title}</div>}
              <div className="text-xs text-gray-700 whitespace-pre-wrap">{n.message}</div>
            </div>
            <button
              aria-label="Dismiss notification"
              className="text-gray-500 hover:text-gray-800"
              onClick={() => onDismiss(n.id)}
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

