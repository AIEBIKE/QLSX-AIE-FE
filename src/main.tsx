/**
 * =============================================
 * MAIN ENTRY POINT
 * =============================================
 * Mount ứng dụng React với Redux Provider
 */

import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { store } from "./store";
import App from "./App";
import { Toaster } from "./components/ui/sonner";
import "./index.css";

// Tạo React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {/* Redux Provider */}
    <Provider store={store}>
      {/* React Query Provider */}
      <QueryClientProvider client={queryClient}>
        <App />
        {/* Toast notifications */}
        <Toaster />
      </QueryClientProvider>
    </Provider>
  </React.StrictMode>,
);
