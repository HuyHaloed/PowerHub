import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@/styles/index.css";
import App from "./App.tsx";
import "react-toastify/dist/ReactToastify.css";
import "nprogress/nprogress.css";
import { BrowserRouter as Router } from "react-router-dom";
// import { ReactQueryClientProvider } from "./hooks/queryProvider.tsx";
// import { ThemeProvider } from "./components/theme-provider.tsx";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Create a client
const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      {/* <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme"> */}
        <Router>
          <App />
        </Router>
      {/* </ThemeProvider> */}
    </QueryClientProvider>
  </StrictMode>,
);
