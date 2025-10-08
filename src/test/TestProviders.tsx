import React from 'react';
import { AppProvider } from '../state/context';
import { HistoryProvider } from '../state/history';
import { NotificationsProvider } from '../state/notifications';
import { ExportProvider } from '../state/exportContext';
import { UploadManagerProvider } from '../state/uploadManager';

export function TestProviders({ children }: { children: React.ReactNode }) {
  return (
<AppProvider>
      <HistoryProvider>
        <UploadManagerProvider>
          <ExportProvider>
            <NotificationsProvider>{children}</NotificationsProvider>
          </ExportProvider>
        </UploadManagerProvider>
      </HistoryProvider>
    </AppProvider>
  );
}
