import React from 'react';
import { AppProvider } from '../state/context';
import { HistoryProvider } from '../state/history';
import { NotificationsProvider } from '../state/notifications';

export function TestProviders({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider>
      <HistoryProvider>
        <NotificationsProvider>{children}</NotificationsProvider>
      </HistoryProvider>
    </AppProvider>
  );
}
