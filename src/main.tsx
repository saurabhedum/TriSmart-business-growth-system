import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import localforage from 'localforage';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import { DataProvider } from './contexts/DataContext.tsx';
import './index.css';
import './i18n';
import { initLogger } from './lib/logger';

initLogger();

// Initialize LocalForage for IndexedDB caching
localforage.config({
  name: 'RetailOS',
  storeName: 'api_cache'
});

// Create a custom storage interface for LocalForage that fits syncStoragePersister
const localForageStore = {
  getItem: (key: string) => localforage.getItem<string>(key),
  setItem: (key: string, value: string) => localforage.setItem(key, value),
  removeItem: (key: string) => localforage.removeItem(key),
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

const persister = createSyncStoragePersister({
  storage: window.localStorage, // Falling back to localStorage for synchronously required hydration, IndexedDB is asynchronous and better suited for asyncPersister, but we follow standard offline caching.
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <PersistQueryClientProvider 
        client={queryClient}
        persistOptions={{ persister }}
      >
        <BrowserRouter>
          <DataProvider>
            <App />
          </DataProvider>
        </BrowserRouter>
      </PersistQueryClientProvider>
    </ErrorBoundary>
  </StrictMode>,
);
