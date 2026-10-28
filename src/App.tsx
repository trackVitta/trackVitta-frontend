import type { ReactNode } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";
import LoginPage from "./pages/loginPage";
import RegisterPage from "./pages/registerPage";
import DashboardPage from "./pages/dashboardPage";
import BusinessPage from "./pages/businessPage";
import { getSession } from "./services/session";

function ProtectedRoute({ children }: { children: ReactNode }) {
  return getSession() ? children : <Navigate to="/login" replace />;
}

function HomeRedirect() {
  return <Navigate to={getSession() ? "/app" : "/login"} replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/app"
          element={(
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/app/business/:businessId"
          element={(
            <ProtectedRoute>
              <BusinessPage />
            </ProtectedRoute>
          )}
        />
        <Route path="*" element={<HomeRedirect />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
