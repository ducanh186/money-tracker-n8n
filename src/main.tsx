import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App.tsx';
import './index.css';

// ── TanStack Query global config ──────────────────────────────
// Default staleTime = 30s: data stays "fresh" for 30s after fetch.
// During this window, navigating between tabs reuses cached data
// without making a new API call.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,          // 30s before data is considered stale
      gcTime: 5 * 60_000,         // Keep unused cache for 5 min
      refetchOnWindowFocus: false, // Don't auto-refetch on tab switch (controlled per hook)
      refetchOnReconnect: true,    // Refetch when network reconnects
      retry: 2,                    // Retry failed requests twice
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
);
