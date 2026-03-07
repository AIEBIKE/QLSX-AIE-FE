/**
 * =============================================
 * APP COMPONENT
 * =============================================
 * Root component với routing và providers
 */

import { ReactNode } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "./contexts/AuthContext";

// Layouts
import AdminLayout from "./components/layouts/AdminLayout";
import WorkerLayout from "./components/layouts/WorkerLayout";

// Auth Pages (shadcn/ui)
import {
  LoginPage,
  RegisterPage,
  ForgotPasswordPage,
  ResetPasswordPage,
} from "./pages/auth";

// Worker Pages
import WorkerDashboard from "./pages/worker/WorkerDashboard";
import CompleteRegistrationPage from "./pages/worker/CompleteRegistrationPage";
import SalaryPage from "./pages/worker/SalaryPage";
import SummaryPage from "./pages/SummaryPage";

// Admin Pages
// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import VehicleTypesPage from "./pages/admin/VehicleTypesPage";
import ProcessManagementPage from "./pages/admin/ProcessManagementPage";
import ProductionStandardsPage from "./pages/admin/ProductionStandardsPage";
import ProductionOrdersPage from "./pages/admin/ProductionOrdersPage";
import ProductionOrderDetailPage from "./pages/admin/ProductionOrderDetailPage";
import ProductionOrderReportPage from "./pages/admin/ProductionOrderReportPage";
import UsersManagementPage from "./pages/admin/UsersManagementPage";
import UserWorkHistoryPage from "./pages/admin/UserWorkHistoryPage";
import AdminSalarySummaryPage from "./pages/admin/AdminSalarySummaryPage";
import FactoryManagementPage from "./pages/admin/FactoryManagementPage";
import QCInspectionPage from "./pages/supervisor/QCInspectionPage";

// Shared Pages
import AccountPage from "./pages/shared/AccountPage";

// Loading component
const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50">
    <div className="text-lg text-slate-500">Đang tải...</div>
  </div>
);

interface RouteGuardProps {
  children: ReactNode;
}

// Route chỉ dành cho Admin/Supervisor
const AdminRoute = ({ children }: RouteGuardProps) => {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;

  const userRole = (user as any)?.roleCode || user.role;
  const adminRoles = [
    "admin",
    "ADMIN",
    "supervisor",
    "SUPERVISOR",
    "fac_manager",
    "FAC_MANAGER",
  ];

  if (!adminRoles.includes(userRole)) {
    return <Navigate to="/worker" replace />;
  }

  return <AdminLayout>{children}</AdminLayout>;
};

// Route dành cho tất cả user đã đăng nhập
const WorkerRoute = ({ children }: RouteGuardProps) => {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;

  return <WorkerLayout>{children}</WorkerLayout>;
};

// Điều hướng theo vai trò
const RoleBasedRedirect = () => {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;

  const userRole = (user as any)?.roleCode || user.role;

  if (["worker", "WORKER"].includes(userRole)) {
    return <Navigate to="/worker" replace />;
  }

  return <Navigate to="/admin" replace />;
};

// Guest route

const GuestRoute = ({ children }: RouteGuardProps) => {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (user) return <Navigate to="/" replace />;

  return <>{children}</>;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* ========== PUBLIC ROUTES ========== */}
          <Route
            path="/login"
            element={
              <GuestRoute>
                <LoginPage />
              </GuestRoute>
            }
          />
          <Route
            path="/register"
            element={
              <GuestRoute>
                <RegisterPage />
              </GuestRoute>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <GuestRoute>
                <ForgotPasswordPage />
              </GuestRoute>
            }
          />
          <Route
            path="/reset-password"
            element={
              <GuestRoute>
                <ResetPasswordPage />
              </GuestRoute>
            }
          />

          {/* Role-based redirect */}
          <Route path="/" element={<RoleBasedRedirect />} />

          {/* ========== WORKER ROUTES ========== */}
          <Route
            path="/worker"
            element={
              <WorkerRoute>
                <WorkerDashboard />
              </WorkerRoute>
            }
          />
          <Route
            path="/worker/complete/:id"
            element={
              <WorkerRoute>
                <CompleteRegistrationPage />
              </WorkerRoute>
            }
          />
          <Route
            path="/summary"
            element={
              <WorkerRoute>
                <SummaryPage />
              </WorkerRoute>
            }
          />
          <Route
            path="/worker/salary"
            element={
              <WorkerRoute>
                <SalaryPage />
              </WorkerRoute>
            }
          />
          <Route
            path="/worker/account"
            element={
              <WorkerRoute>
                <AccountPage />
              </WorkerRoute>
            }
          />

          {/* ========== ADMIN ROUTES ========== */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/vehicle-types"
            element={
              <AdminRoute>
                <VehicleTypesPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/processes"
            element={
              <AdminRoute>
                <ProcessManagementPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/standards"
            element={
              <AdminRoute>
                <ProductionStandardsPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/orders"
            element={
              <AdminRoute>
                <ProductionOrdersPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/production-orders/:id"
            element={
              <AdminRoute>
                <ProductionOrderDetailPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/production-orders/:id/report"
            element={
              <AdminRoute>
                <ProductionOrderReportPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <AdminRoute>
                <UsersManagementPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/users/:id/history"
            element={
              <AdminRoute>
                <UserWorkHistoryPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/salary-summary"
            element={
              <AdminRoute>
                <AdminSalarySummaryPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/account"
            element={
              <AdminRoute>
                <AccountPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/factories"
            element={
              <AdminRoute>
                <FactoryManagementPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/qc"
            element={
              <AdminRoute>
                <QCInspectionPage />
              </AdminRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster richColors position="top-right" />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
