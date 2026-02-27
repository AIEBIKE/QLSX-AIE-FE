import axios, { AxiosResponse, InternalAxiosRequestConfig } from "axios";
import type {
  ApiResponse,
  User,
  VehicleType,
  Process,
  Operation,
  ProductionOrder,
  ProductionStandard,
  Registration,
  Shift,
  BonusRule,
  LoginResponse,
} from "../types";

const API_URL = "/api";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Thêm token vào mỗi request
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Xử lý lỗi response
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

// Auth
export const login = (
  code: string,
  password: string,
): Promise<AxiosResponse<ApiResponse<LoginResponse>>> =>
  api.post("/auth/login", { code, password });
export const getMe = (): Promise<AxiosResponse<ApiResponse<User>>> =>
  api.get("/auth/me");
export const logout = (): Promise<AxiosResponse<ApiResponse<null>>> =>
  api.post("/auth/logout");
export const updateProfile = (data: {
  name: string;
  email?: string;
  department?: string;
}): Promise<AxiosResponse<ApiResponse<User>>> => api.put("/auth/profile", data);
export const changePassword = (data: {
  currentPassword: string;
  newPassword: string;
}): Promise<AxiosResponse<ApiResponse<null>>> =>
  api.put("/auth/change-password", data);

// Vehicle Types
export const getVehicleTypes = (
  params?: Record<string, unknown>,
): Promise<AxiosResponse<ApiResponse<VehicleType[]>>> =>
  api.get("/vehicle-types", { params });
export const getVehicleType = (
  id: string,
): Promise<AxiosResponse<ApiResponse<VehicleType>>> =>
  api.get(`/vehicle-types/${id}`);
export const createVehicleType = (
  data: Partial<VehicleType>,
): Promise<AxiosResponse<ApiResponse<VehicleType>>> =>
  api.post("/vehicle-types", data);
export const updateVehicleType = (
  id: string,
  data: Partial<VehicleType>,
): Promise<AxiosResponse<ApiResponse<VehicleType>>> =>
  api.put(`/vehicle-types/${id}`, data);
export const deleteVehicleType = (
  id: string,
): Promise<AxiosResponse<ApiResponse<null>>> =>
  api.delete(`/vehicle-types/${id}`);

// Production Orders
export const getProductionOrders = (
  params?: Record<string, unknown>,
): Promise<AxiosResponse<ApiResponse<ProductionOrder[]>>> =>
  api.get("/production-orders", { params });
export const getActiveProductionOrder = (): Promise<
  AxiosResponse<ApiResponse<ProductionOrder | null>>
> => api.get("/production-orders/active");
export const getProductionOrder = (
  id: string,
): Promise<AxiosResponse<ApiResponse<ProductionOrder>>> =>
  api.get(`/production-orders/${id}`);
export const createProductionOrder = (
  data: Partial<ProductionOrder>,
): Promise<AxiosResponse<ApiResponse<ProductionOrder>>> =>
  api.post("/production-orders", data);
export const updateProductionOrder = (
  id: string,
  data: Partial<ProductionOrder>,
): Promise<AxiosResponse<ApiResponse<ProductionOrder>>> =>
  api.put(`/production-orders/${id}`, data);
export const updateProductionOrderStatus = (
  id: string,
  status: string,
): Promise<AxiosResponse<ApiResponse<ProductionOrder>>> =>
  api.put(`/production-orders/${id}/status`, { status });
export const deleteProductionOrder = (
  id: string,
): Promise<AxiosResponse<ApiResponse<null>>> =>
  api.delete(`/production-orders/${id}`);

// Production Standards
export const getProductionStandards = (
  params?: Record<string, unknown>,
): Promise<AxiosResponse<ApiResponse<ProductionStandard[]>>> =>
  api.get("/production-standards", { params });
export const getProductionStandard = (
  id: string,
): Promise<AxiosResponse<ApiResponse<ProductionStandard>>> =>
  api.get(`/production-standards/${id}`);
export const createProductionStandard = (
  data: Partial<ProductionStandard>,
): Promise<AxiosResponse<ApiResponse<ProductionStandard>>> =>
  api.post("/production-standards", data);
export const updateProductionStandard = (
  id: string,
  data: Partial<ProductionStandard>,
): Promise<AxiosResponse<ApiResponse<ProductionStandard>>> =>
  api.put(`/production-standards/${id}`, data);
export const deleteProductionStandard = (
  id: string,
): Promise<AxiosResponse<ApiResponse<null>>> =>
  api.delete(`/production-standards/${id}`);

// Processes
export const getProcesses = (
  params?: Record<string, unknown>,
): Promise<AxiosResponse<ApiResponse<Process[]>>> =>
  api.get("/processes", { params });
export const getProcess = (
  id: string,
): Promise<AxiosResponse<ApiResponse<Process>>> => api.get(`/processes/${id}`);
export const createProcess = (
  data: Partial<Process>,
): Promise<AxiosResponse<ApiResponse<Process>>> => api.post("/processes", data);
export const updateProcess = (
  id: string,
  data: Partial<Process>,
): Promise<AxiosResponse<ApiResponse<Process>>> =>
  api.put(`/processes/${id}`, data);
export const deleteProcess = (
  id: string,
): Promise<AxiosResponse<ApiResponse<null>>> => api.delete(`/processes/${id}`);

// Operations
export const getOperations = (
  params?: Record<string, unknown>,
): Promise<AxiosResponse<ApiResponse<Operation[]>>> =>
  api.get("/operations", { params });
export const getOperation = (
  id: string,
): Promise<AxiosResponse<ApiResponse<Operation>>> =>
  api.get(`/operations/${id}`);
export const createOperation = (
  data: Partial<Operation>,
): Promise<AxiosResponse<ApiResponse<Operation>>> =>
  api.post("/operations", data);
export const updateOperation = (
  id: string,
  data: Partial<Operation>,
): Promise<AxiosResponse<ApiResponse<Operation>>> =>
  api.put(`/operations/${id}`, data);
export const deleteOperation = (
  id: string,
): Promise<AxiosResponse<ApiResponse<null>>> => api.delete(`/operations/${id}`);

// Registrations (Worker)
export const getCurrentOrderWithOperations = (): Promise<
  AxiosResponse<ApiResponse<unknown>>
> => api.get("/registrations/current-order");
export const getTodayRegistrations = (): Promise<
  AxiosResponse<ApiResponse<Registration[]>>
> => api.get("/registrations/today");
export const registerOperation = (
  operationId: string,
): Promise<AxiosResponse<ApiResponse<Registration>>> =>
  api.post("/registrations", { operationId });
export const completeRegistration = (
  id: string,
  data: { quantity: number; notes?: string },
): Promise<AxiosResponse<ApiResponse<Registration>>> =>
  api.put(`/registrations/${id}/complete`, data);
export const cancelRegistration = (
  id: string,
): Promise<AxiosResponse<ApiResponse<null>>> =>
  api.delete(`/registrations/${id}`);

// Registrations (Admin)
export const getAllRegistrations = (
  params?: Record<string, unknown>,
): Promise<AxiosResponse<ApiResponse<Registration[]>>> =>
  api.get("/registrations/admin/all", { params });
export const adjustRegistration = (
  id: string,
  data: Partial<Registration>,
): Promise<AxiosResponse<ApiResponse<Registration>>> =>
  api.put(`/registrations/admin/${id}/adjust`, data);
export const reassignWorker = (data: {
  registrationId: string;
  newUserId: string;
}): Promise<AxiosResponse<ApiResponse<Registration>>> =>
  api.post("/registrations/admin/reassign", data);

// Production Order - Progress & Reports
export const getOrderProgress = (
  id: string,
): Promise<AxiosResponse<ApiResponse<unknown>>> =>
  api.get(`/production-orders/${id}/progress`);
export const getOrderReport = (
  id: string,
): Promise<AxiosResponse<ApiResponse<unknown>>> =>
  api.get(`/production-orders/${id}/report`);
export const checkOrderCompletion = (
  id: string,
): Promise<AxiosResponse<ApiResponse<unknown>>> =>
  api.get(`/production-orders/${id}/check-completion`);
export const completeOrder = (
  id: string,
  data?: Record<string, unknown>,
): Promise<AxiosResponse<ApiResponse<ProductionOrder>>> =>
  api.post(`/production-orders/${id}/complete`, data);
export const assignWorkerToOrder = (
  id: string,
  data: { userId: string },
): Promise<AxiosResponse<ApiResponse<unknown>>> =>
  api.post(`/production-orders/${id}/assign-worker`, data);

// Users Management
export const getUsers = (): Promise<AxiosResponse<ApiResponse<User[]>>> =>
  api.get("/auth/users");
export const getUser = (
  id: string,
): Promise<AxiosResponse<ApiResponse<User>>> => api.get(`/auth/users/${id}`);
export const createUser = (
  data: Partial<User> & { password: string },
): Promise<AxiosResponse<ApiResponse<User>>> => api.post("/auth/users", data);
export const updateUser = (
  id: string,
  data: Partial<User>,
): Promise<AxiosResponse<ApiResponse<User>>> =>
  api.put(`/auth/users/${id}`, data);
export const deleteUser = (
  id: string,
): Promise<AxiosResponse<ApiResponse<null>>> => api.delete(`/auth/users/${id}`);
export const getUserWorkHistory = (
  id: string,
  params?: Record<string, unknown>,
): Promise<AxiosResponse<ApiResponse<unknown>>> =>
  api.get(`/auth/users/${id}/work-history`, { params });

// Shifts
export const startShift = (): Promise<AxiosResponse<ApiResponse<Shift>>> =>
  api.post("/shifts/start");
export const endShift = (): Promise<AxiosResponse<ApiResponse<Shift>>> =>
  api.put("/shifts/end");
export const getCurrentShift = (): Promise<
  AxiosResponse<ApiResponse<Shift | null>>
> => api.get("/shifts/current");

// Reports
export const getShiftSummary = (): Promise<
  AxiosResponse<ApiResponse<unknown>>
> => api.get("/reports/shift-summary");

// Settings
export const getBonusRules = (): Promise<
  AxiosResponse<ApiResponse<BonusRule[]>>
> => api.get("/settings/bonus-rules");

// Worker Salary
export const getWorkerSalary = (
  params?: Record<string, unknown>,
): Promise<AxiosResponse<ApiResponse<unknown>>> =>
  api.get("/registrations/salary", { params });

export default api;
