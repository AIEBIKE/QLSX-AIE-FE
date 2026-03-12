// ==================== Core Types ====================

export type UserRole = "ADMIN" | "FAC_MANAGER" | "SUPERVISOR" | "WORKER" | "admin" | "supervisor" | "worker";

export interface Role {
  _id: string;
  name: string;
  code: UserRole;
  description?: string;
}

export interface User {
  _id: string;
  code: string;
  name: string;
  email?: string;
  role: string; // Backward compatibility
  roleId: string | Role; // New Role linkage
  roleCode?: UserRole; // Helper for frontend logic
  dateOfBirth?: string;
  citizenId?: string;
  address?: string;
  factoryId?: string; // Home factory
  factories_manage?: string; // Managed factory (for FAC_MANAGER)
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Factory {
  _id: string;
  name: string;
  code: string;
  location?: string;
  description?: string;
  active: boolean;
}

export interface QualityControl {
  _id: string;
  productionOrderId: string;
  frameNumber: string;
  engineNumber: string;
  inspectionDate: string;
  inspectorId: string;
  results: Array<{
    operationId: string;
    status: "pass" | "fail";
    note?: string;
  }>;
  status: "passed" | "failed";
}

export interface VehicleType {
  _id: string;
  name: string;
  code?: string;
  description?: string;
  framePrefix?: string;
  enginePrefix?: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Process {
  _id: string;
  name: string;
  code?: string;
  order: number;
  description?: string;
  active: boolean;
  vehicleType?: string | VehicleType;
  createdAt?: string;
  updatedAt?: string;
}

export interface Operation {
  _id: string;
  name: string;
  code?: string;
  process: string | Process;
  processId?: string | Process;
  description?: string;
  standardMinutes?: number;
  maxWorkers?: number;
  standardQuantity?: number;
  difficulty?: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type ProductionOrderStatus =
  | "draft"
  | "active"
  | "in_progress"
  | "pending"
  | "paused"
  | "completed"
  | "cancelled";

export interface ProductionOrder {
  _id: string;
  name: string;
  orderCode?: string;
  vehicleType?: string | VehicleType;
  vehicleTypeId?: string | VehicleType;
  factoryId?: string | Factory;
  quantity: number;
  status: ProductionOrderStatus;
  startDate?: string;
  endDate?: string;
  expectedEndDate?: string;
  actualEndDate?: string;
  completedQuantity?: number;
  frameNumbers?: string[];
  engineNumbers?: string[];
  note?: string;
  notes?: string;
  createdBy?: string | User;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductionOrderReport {
  order: ProductionOrder;
  dailyReport: Record<string, Registration[]>;
  workerSummary: Array<{
    userId: string;
    code: string;
    name: string;
    totalQuantity: number;
    totalMinutes: number;
    totalBonus: number;
    totalPenalty: number;
    operations: number;
  }>;
  statistics: {
    totalRegistrations: number;
    totalCompleted: number;
    totalQuantityProduced: number;
    totalWorkingMinutes: number;
    totalBonus: number;
    totalPenalty: number;
  };
}

export interface ProductionStandard {
  _id: string;
  vehicleTypeId: string | VehicleType;
  operationId: string | Operation;
  factoryId: string | Factory;
  expectedQuantity: number;
  bonusPerUnit?: number;
  penaltyPerUnit?: number;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type RegistrationStatus =
  | "registered"
  | "in_progress"
  | "completed"
  | "cancelled";

export interface Registration {
  _id: string;
  user?: string | User;
  worker?: string | User;
  productionOrder: string | ProductionOrder;
  process?: string | Process;
  operation: string | Operation;
  operationId?: string | Operation;
  factoryId: string | Factory;
  status: RegistrationStatus;
  startTime: string;
  endTime?: string;
  quantity?: number;
  expectedQuantity: number;
  duration?: number; // in minutes
  workingMinutes?: number;
  bonusAmount?: number;
  penaltyAmount?: number;
  actualQuantity?: number;
  interruptionNote?: string;
  interruptionMinutes?: number;
  adjustedExpectedQty?: number;
  isReplacement?: boolean;
  reassignedFrom?: string;
  deviation?: number;
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
  meta?: any;
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
