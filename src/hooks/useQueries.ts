/**
 * =============================================
 * USE QUERIES - React Query Hooks for Data Fetching
 * =============================================
 * Tập trung toàn bộ useQuery hooks cho việc lấy dữ liệu.
 * Mỗi hook wrap 1 API call từ api.ts, trả về đúng kiểu dữ liệu.
 */

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "./queryKeys";
import * as api from "../services/api";

// ─── Auth & Users ────────────────────────────────────
export const useMe = () =>
  useQuery({
    queryKey: queryKeys.me,
    queryFn: async () => {
      const res = await api.getMe();
      return res.data.data;
    },
  });

export const useUsers = (params?: Record<string, unknown>) =>
  useQuery({
    queryKey: queryKeys.users.list(params),
    queryFn: async () => {
      const res = await api.getUsers(params);
      return res.data;
    },
  });

export const useUser = (id: string) =>
  useQuery({
    queryKey: queryKeys.users.detail(id),
    queryFn: async () => {
      const res = await api.getUser(id);
      return res.data.data;
    },
    enabled: !!id,
  });

export const useUserWorkHistory = (
  id: string,
  params?: Record<string, unknown>,
) =>
  useQuery({
    queryKey: queryKeys.users.workHistory(id, params),
    queryFn: async () => {
      const res = await api.getUserWorkHistory(id, params);
      return res.data;
    },
    enabled: !!id,
  });

export const useAdminSalarySummary = (params?: Record<string, unknown>) =>
  useQuery({
    queryKey: queryKeys.users.salarySummary(params),
    queryFn: async () => {
      const res = await api.getAdminSalarySummary(params);
      return res.data;
    },
  });

// ─── Vehicle Types ───────────────────────────────────
export const useVehicleTypes = (params?: Record<string, unknown>) =>
  useQuery({
    queryKey: queryKeys.vehicleTypes.list(params),
    queryFn: async () => {
      const res = await api.getVehicleTypes(params);
      return res.data;
    },
  });

export const useVehicleType = (id: string) =>
  useQuery({
    queryKey: queryKeys.vehicleTypes.detail(id),
    queryFn: async () => {
      const res = await api.getVehicleType(id);
      return res.data.data;
    },
    enabled: !!id,
  });

// ─── Production Orders ──────────────────────────────
export const useProductionOrders = (params?: Record<string, unknown>) =>
  useQuery({
    queryKey: queryKeys.productionOrders.list(params),
    queryFn: async () => {
      const res = await api.getProductionOrders(params);
      return res.data;
    },
  });

export const useProductionOrder = (id: string) =>
  useQuery({
    queryKey: queryKeys.productionOrders.detail(id),
    queryFn: async () => {
      const res = await api.getProductionOrder(id);
      return res.data.data;
    },
    enabled: !!id,
  });

export const useActiveProductionOrder = () =>
  useQuery({
    queryKey: queryKeys.productionOrders.active,
    queryFn: async () => {
      const res = await api.getActiveProductionOrder();
      return res.data.data;
    },
  });

export const useOrderProgress = (id: string) =>
  useQuery({
    queryKey: queryKeys.productionOrders.progress(id),
    queryFn: async () => {
      const res = await api.getOrderProgress(id);
      return res.data.data;
    },
    enabled: !!id,
  });

export const useOrderReport = (id: string) =>
  useQuery({
    queryKey: queryKeys.productionOrders.report(id),
    queryFn: async () => {
      const res = await api.getOrderReport(id);
      return res.data.data;
    },
    enabled: !!id,
  });

// ─── Production Standards ───────────────────────────
export const useProductionStandards = (params?: Record<string, unknown>) =>
  useQuery({
    queryKey: queryKeys.productionStandards.list(params),
    queryFn: async () => {
      const res = await api.getProductionStandards(params);
      return res.data;
    },
  });

// ─── Processes & Operations ─────────────────────────
export const useProcesses = (params?: Record<string, unknown>) =>
  useQuery({
    queryKey: queryKeys.processes.list(params),
    queryFn: async () => {
      const res = await api.getProcesses(params);
      return res.data.data;
    },
  });

export const useOperations = (params?: Record<string, unknown>) =>
  useQuery({
    queryKey: queryKeys.operations.list(params),
    queryFn: async () => {
      const res = await api.getOperations(params);
      return res.data.data;
    },
  });

// ─── Registrations ──────────────────────────────────
export const useTodayRegistrations = () =>
  useQuery({
    queryKey: queryKeys.registrations.today,
    queryFn: async () => {
      const res = await api.getTodayRegistrations();
      return res.data.data;
    },
  });

export const useCurrentOrder = () =>
  useQuery({
    queryKey: queryKeys.registrations.currentOrder,
    queryFn: async () => {
      const res = await api.getCurrentOrderWithOperations();
      return res.data.data;
    },
  });

export const useAllRegistrations = (params?: Record<string, unknown>) =>
  useQuery({
    queryKey: queryKeys.registrations.adminAll(params),
    queryFn: async () => {
      const res = await api.getAllRegistrations(params);
      return res.data.data;
    },
  });

// ─── Shifts ─────────────────────────────────────────
export const useCurrentShift = () =>
  useQuery({
    queryKey: queryKeys.shifts.current,
    queryFn: async () => {
      const res = await api.getCurrentShift();
      return res.data.data;
    },
  });

// ─── Factories ──────────────────────────────────────
export const useFactories = (enabled = true) =>
  useQuery({
    queryKey: queryKeys.factories.list,
    queryFn: async () => {
      const res = await api.getFactories();
      return res.data.data;
    },
    enabled,
  });

// ─── Settings ───────────────────────────────────────
export const useBonusRules = () =>
  useQuery({
    queryKey: queryKeys.settings.bonusRules,
    queryFn: async () => {
      const res = await api.getBonusRules();
      return res.data.data;
    },
  });

// ─── Reports ────────────────────────────────────────
export const useShiftSummary = () =>
  useQuery({
    queryKey: queryKeys.reports.shiftSummary,
    queryFn: async () => {
      const res = await api.getShiftSummary();
      return res.data.data;
    },
  });

// ─── QC ─────────────────────────────────────────────
export const useQCReport = (orderId: string) =>
  useQuery({
    queryKey: queryKeys.qc.report(orderId),
    queryFn: async () => {
      const res = await api.getQCReport(orderId);
      return res.data.data;
    },
    enabled: !!orderId,
  });
