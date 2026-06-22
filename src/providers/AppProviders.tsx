import { type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SmoothScroll } from "./SmoothScroll.tsx";
import { AppStateProvider } from "../state/AppState.tsx";
import { ThemeProvider } from "./ThemeProvider.tsx";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Historical data is immutable, so cache aggressively.
      staleTime: 1000 * 60 * 60,
      gcTime: 1000 * 60 * 60 * 24,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

/** Compose theme, React Query, app state, and smooth-scroll providers for the app tree. */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AppStateProvider>
          <SmoothScroll>{children}</SmoothScroll>
        </AppStateProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
