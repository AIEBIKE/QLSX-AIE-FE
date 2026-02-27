// ==================== Core Types ====================

export type UserRole = "admin" | "supervisor" | "worker";

export interface User {
  _id: string;
  code: string;
  name: string;
  email?: string;
  department?: string;
  role: UserRole;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface VehicleType {
  _id: string;
  name: string;
  description?: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Process {
  _id: string;
  name: string;
  order: number;
  description?: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Operation {
  _id: string;
  name: string;
  process: string | Process;
  description?: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type ProductionOrderStatus =
  | "draft"
  | "active"
  | "paused"
  | "completed"
  | "cancelled";

export interface ProductionOrder {
  _id: string;
  name: string;
  vehicleType: string | VehicleType;
  quantity: number;
  status: ProductionOrderStatus;
  startDate?: string;
  endDate?: string;
  completedQuantity?: number;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductionStandard {
  _id: string;
  vehicleType: string | VehicleType;
  operation: string | Operation;
  standardTime: number; // minutes per unit
  description?: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type RegistrationStatus = "in_progress" | "completed" | "cancelled";

export interface Registration {
  _id: string;
  user: string | User;
  productionOrder: string | ProductionOrder;
  operation: string | Operation;
  status: RegistrationStatus;
  startTime: string;
  endTime?: string;
  quantity?: number;
  duration?: number; // in minutes
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Shift {
  _id: string;
  user: string | User;
  startTime: string;
  endTime?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface BonusRule {
  _id: string;
  minPercentage: number;
  maxPercentage: number;
  bonusAmount: number;
  createdAt?: string;
  updatedAt?: string;
}

// ==================== API Response Types ====================

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface LoginResponse {
  token: string;
  user: User;
}

// ==================== Component Props Types ====================

export interface ChildrenProps {
  children: React.ReactNode;
}

// ==================== Form Types ====================

export interface LoginFormValues {
  code: string;
  password: string;
}

export interface UserFormValues {
  code: string;
  name: string;
  password?: string;
  role: UserRole;
  active: boolean;
}

export interface VehicleTypeFormValues {
  name: string;
  description?: string;
  active: boolean;
}

export interface ProcessFormValues {
  name: string;
  order: number;
  description?: string;
  active: boolean;
}

export interface OperationFormValues {
  name: string;
  process: string;
  description?: string;
  active: boolean;
}

export interface ProductionOrderFormValues {
  name: string;
  vehicleType: string;
  quantity: number;
  startDate?: string;
  notes?: string;
}

export interface ProductionStandardFormValues {
  vehicleType: string;
  operation: string;
  standardTime: number;
  description?: string;
  active: boolean;
}

export interface CompleteRegistrationFormValues {
  quantity: number;
  notes?: string;
}
