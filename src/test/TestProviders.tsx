import React from 'react';
import { AppProvider } from '../state/context';
import { HistoryProvider } from '../state/history';
import { NotificationsProvider } from '../state/notifications';
import { AuthProvider } from '../state/authContext';
import { ExportProvider } from '../state/exportContext';

export function TestProviders({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider>
      <HistoryProvider>
        <AuthProvider>
          <ExportProvider>
            <NotificationsProvider>{children}</NotificationsProvider>
          </ExportProvider>
        </AuthProvider>
      </HistoryProvider>
    </AppProvider>
  );
}
