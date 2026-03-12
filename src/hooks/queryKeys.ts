/**
 * =============================================
 * QUERY KEYS - Centralized React Query Keys
 * =============================================
 * Tập trung toàn bộ query keys để đảm bảo
 * tính nhất quán khi invalidate cache.
 */

export const queryKeys = {
  // Auth & Users
  me: ["me"] as const,
  users: {
    all: ["users"] as const,
    list: (params?: Record<string, unknown>) => ["users", "list", params] as const,
    detail: (id: string) => ["users", "detail", id] as const,
    pending: ["users", "pending"] as const,
    workHistory: (id: string, params?: Record<string, unknown>) =>
      ["users", "work-history", id, params] as const,
    salarySummary: (params?: Record<string, unknown>) =>
      ["users", "salary-summary", params] as const,
  },

  // Vehicle Types
  vehicleTypes: {
    all: ["vehicleTypes"] as const,
    list: (params?: Record<string, unknown>) => ["vehicleTypes", "list", params] as const,
    detail: (id: string) => ["vehicleTypes", "detail", id] as const,
  },

  // Production Orders
  productionOrders: {
    all: ["productionOrders"] as const,
    list: (params?: Record<string, unknown>) =>
      ["productionOrders", "list", params] as const,
    detail: (id: string) => ["productionOrders", "detail", id] as const,
    active: ["productionOrders", "active"] as const,
    progress: (id: string) => ["productionOrders", "progress", id] as const,
    report: (id: string) => ["productionOrders", "report", id] as const,
    checkCompletion: (id: string) =>
      ["productionOrders", "check-completion", id] as const,
  },

  // Production Standards
  productionStandards: {
    all: ["productionStandards"] as const,
    list: (params?: Record<string, unknown>) =>
      ["productionStandards", "list", params] as const,
    detail: (id: string) => ["productionStandards", "detail", id] as const,
  },

  // Processes & Operations
  processes: {
    all: ["processes"] as const,
    list: (params?: Record<string, unknown>) => ["processes", "list", params] as const,
    detail: (id: string) => ["processes", "detail", id] as const,
  },
  operations: {
    all: ["operations"] as const,
    list: (params?: Record<string, unknown>) => ["operations", "list", params] as const,
    detail: (id: string) => ["operations", "detail", id] as const,
  },

  // Registrations
  registrations: {
    all: ["registrations"] as const,
    today: ["registrations", "today"] as const,
    currentOrder: ["registrations", "current-order"] as const,
    adminAll: (params?: Record<string, unknown>) =>
      ["registrations", "admin", "all", params] as const,
    salary: (params?: Record<string, unknown>) =>
      ["registrations", "salary", params] as const,
  },

  // Shifts
  shifts: {
    current: ["shifts", "current"] as const,
    history: ["shifts", "history"] as const,
  },

  // Reports
  reports: {
    shiftSummary: ["reports", "shift-summary"] as const,
  },

  // Factories
  factories: {
    all: ["factories"] as const,
    list: ["factories", "list"] as const,
  },

  // Settings
  settings: {
    bonusRules: ["settings", "bonus-rules"] as const,
  },

  // QC
  qc: {
    report: (orderId: string) => ["qc", "report", orderId] as const,
    vehicle: (frameNumber: string) => ["qc", "vehicle", frameNumber] as const,
  },
} as const;
