import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Callback from "./pages/Callback";
import Dashboard from "./pages/Dashboard";
import Report from "./pages/Report";
import { ThemeProvider } from "./components/theme-provider";
import { ThemeToggle } from "./components/ThemeToggle";
import { GithubIcon } from "lucide-react";
import { Button } from "./components/ui/button";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Check if user has a token in cookie
    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("session="));
    setIsAuthenticated(!!token);
    setIsLoading(false);
  }, []);

  // Protected route component
  const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    if (isLoading) {
      return <div>Loading...</div>;
    }

    if (!isAuthenticated) {
      return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
  };

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <div className="fixed top-2 right-2 z-50">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            window.open("https://github.com/BingyanStudio/github-analyzer", "_blank");
          }}
        >
          <GithubIcon className="h-5 w-5" />
        </Button>
        <ThemeToggle />
      </div>
      <BrowserRouter>
        <Routes>
          <Route
            path="/login"
            element={
              isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />
            }
          />
          <Route
            path="/callback"
            element={<Callback setIsAuthenticated={setIsAuthenticated} />}
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/report"
            element={
              <ProtectedRoute>
                <Report />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
