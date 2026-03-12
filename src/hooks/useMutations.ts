/**
 * =============================================
 * USE MUTATIONS - React Query Hooks for Data Mutations
 * =============================================
 * Tập trung toàn bộ useMutation hooks cho việc thêm/sửa/xóa.
 * Mỗi hook tự động invalidate cache sau khi mutation thành công.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "./queryKeys";
import * as api from "../services/api";
import { loginApi, registerApi, LoginCredentials, RegisterData } from "../services/authService"; // [splinh-12/03-15:05]

// ─── Helper: Extract error message ──────────────────
const getErrMsg = (err: any, fallback = "Đã xảy ra lỗi"): string =>
  err?.response?.data?.error?.message || err?.message || fallback;

// ─── Production Orders ──────────────────────────────

export const useCreateProductionOrder = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.createProductionOrder(data),
    onSuccess: () => {
      toast.success("Tạo lệnh thành công");
      qc.invalidateQueries({ queryKey: queryKeys.productionOrders.all });
    },
    onError: (err: any) => toast.error(getErrMsg(err, "Lỗi tạo lệnh")),
  });
};

export const useUpdateProductionOrder = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      api.updateProductionOrder(id, data),
    onSuccess: (_res, { id }) => {
      toast.success("Cập nhật lệnh thành công");
      qc.invalidateQueries({ queryKey: queryKeys.productionOrders.all });
      qc.invalidateQueries({
        queryKey: queryKeys.productionOrders.detail(id),
      });
    },
    onError: (err: any) => toast.error(getErrMsg(err, "Lỗi cập nhật lệnh")),
  });
};

export const useDeleteProductionOrder = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteProductionOrder(id),
    onSuccess: () => {
      toast.success("Xóa thành công");
      qc.invalidateQueries({ queryKey: queryKeys.productionOrders.all });
    },
    onError: (err: any) => toast.error(getErrMsg(err, "Lỗi xóa lệnh")),
  });
};

export const useUpdateProductionOrderStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.updateProductionOrderStatus(id, status),
    onSuccess: (_res, { id }) => {
      toast.success("Cập nhật trạng thái thành công");
      qc.invalidateQueries({ queryKey: queryKeys.productionOrders.all });
      qc.invalidateQueries({
        queryKey: queryKeys.productionOrders.detail(id),
      });
    },
    onError: (err: any) =>
      toast.error(getErrMsg(err, "Lỗi cập nhật trạng thái")),
  });
};

export const useCompleteOrder = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data?: Record<string, unknown>;
    }) => api.completeOrder(id, data),
    onSuccess: (_res, { id }) => {
      toast.success("Đã hoàn thành!");
      qc.invalidateQueries({ queryKey: queryKeys.productionOrders.all });
      qc.invalidateQueries({
        queryKey: queryKeys.productionOrders.detail(id),
      });
      qc.invalidateQueries({
        queryKey: queryKeys.productionOrders.progress(id),
      });
    },
    // Note: onError is handled in the component for special INCOMPLETE_PROCESSES case
  });
};

export const useAssignWorker = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      api.assignWorkerToOrder(id, data),
    onSuccess: (_res, { id }) => {
      toast.success("Đã bổ sung công nhân!");
      qc.invalidateQueries({
        queryKey: queryKeys.productionOrders.progress(id),
      });
      qc.invalidateQueries({
        queryKey: queryKeys.productionOrders.detail(id),
      });
    },
    onError: (err: any) =>
      toast.error(getErrMsg(err, "Lỗi khi bổ sung công nhân")),
  });
};

// ─── Vehicle Types ───────────────────────────────────

export const useCreateVehicleType = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.createVehicleType(data),
    onSuccess: () => {
      toast.success("Tạo loại xe thành công");
      qc.invalidateQueries({ queryKey: queryKeys.vehicleTypes.all });
    },
    onError: (err: any) => toast.error(getErrMsg(err, "Lỗi tạo loại xe")),
  });
};

export const useUpdateVehicleType = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      api.updateVehicleType(id, data),
    onSuccess: () => {
      toast.success("Cập nhật loại xe thành công");
      qc.invalidateQueries({ queryKey: queryKeys.vehicleTypes.all });
    },
    onError: (err: any) =>
      toast.error(getErrMsg(err, "Lỗi cập nhật loại xe")),
  });
};

export const useDeleteVehicleType = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteVehicleType(id),
    onSuccess: () => {
      toast.success("Xóa loại xe thành công");
      qc.invalidateQueries({ queryKey: queryKeys.vehicleTypes.all });
    },
    onError: (err: any) => toast.error(getErrMsg(err, "Lỗi xóa loại xe")),
  });
};

// ─── Production Standards ───────────────────────────

export const useCreateProductionStandard = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.createProductionStandard(data),
    onSuccess: () => {
      toast.success("Tạo định mức thành công");
      qc.invalidateQueries({ queryKey: queryKeys.productionStandards.all });
    },
    onError: (err: any) => toast.error(getErrMsg(err, "Lỗi tạo định mức")),
  });
};

export const useUpdateProductionStandard = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      api.updateProductionStandard(id, data),
    onSuccess: () => {
      toast.success("Cập nhật định mức thành công");
      qc.invalidateQueries({ queryKey: queryKeys.productionStandards.all });
    },
    onError: (err: any) =>
      toast.error(getErrMsg(err, "Lỗi cập nhật định mức")),
  });
};

export const useDeleteProductionStandard = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteProductionStandard(id),
    onSuccess: () => {
      toast.success("Xóa định mức thành công");
      qc.invalidateQueries({ queryKey: queryKeys.productionStandards.all });
    },
    onError: (err: any) => toast.error(getErrMsg(err, "Lỗi xóa định mức")),
  });
};

export const useBatchUpsertStandardOverrides = () => { // [splinh-12/03-14:21]
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.batchUpsertStandardOverrides(data),
    onSuccess: () => {
      toast.success("Lưu thay đổi thành công");
      qc.invalidateQueries({ queryKey: queryKeys.productionStandards.all });
    },
    onError: (err: any) => toast.error(getErrMsg(err, "Lỗi lưu thay đổi")),
  });
};

// ─── Users ──────────────────────────────────────────

export const useCreateUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.createUser(data),
    onSuccess: () => {
      toast.success("Tạo tài khoản thành công");
      qc.invalidateQueries({ queryKey: queryKeys.users.all });
    },
    onError: (err: any) =>
      toast.error(getErrMsg(err, "Lỗi tạo tài khoản")),
  });
};

export const useUpdateUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      api.updateUser(id, data),
    onSuccess: (_res, { id }) => {
      toast.success("Cập nhật thành công");
      qc.invalidateQueries({ queryKey: queryKeys.users.all });
      qc.invalidateQueries({ queryKey: queryKeys.users.detail(id) });
    },
    onError: (err: any) => toast.error(getErrMsg(err, "Lỗi cập nhật")),
  });
};

export const useDeleteUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteUser(id),
    onSuccess: () => {
      toast.success("Xóa tài khoản thành công");
      qc.invalidateQueries({ queryKey: queryKeys.users.all });
    },
    onError: (err: any) =>
      toast.error(getErrMsg(err, "Lỗi xóa tài khoản")),
  });
};

export const useApproveUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.approveUser(id),
    onSuccess: () => {
      toast.success("Đã phê duyệt tài khoản");
      qc.invalidateQueries({ queryKey: queryKeys.users.all });
      qc.invalidateQueries({ queryKey: ["pendingUsers"] });
    },
    onError: (err: any) => toast.error(getErrMsg(err, "Lỗi phê duyệt")),
  });
};

export const useRejectUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.rejectUser(id),
    onSuccess: () => {
      toast.success("Đã từ chối tài khoản");
      qc.invalidateQueries({ queryKey: queryKeys.users.all });
      qc.invalidateQueries({ queryKey: ["pendingUsers"] });
    },
    onError: (err: any) => toast.error(getErrMsg(err, "Lỗi từ chối")),
  });
};

// ─── Factories ──────────────────────────────────────

export const useCreateFactory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.createFactory(data),
    onSuccess: () => {
      toast.success("Tạo nhà máy thành công");
      qc.invalidateQueries({ queryKey: queryKeys.factories.all });
    },
    onError: (err: any) => toast.error(getErrMsg(err, "Lỗi tạo nhà máy")),
  });
};

export const useUpdateFactory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      api.updateFactory(id, data),
    onSuccess: () => {
      toast.success("Cập nhật nhà máy thành công");
      qc.invalidateQueries({ queryKey: queryKeys.factories.all });
    },
    onError: (err: any) =>
      toast.error(getErrMsg(err, "Lỗi cập nhật nhà máy")),
  });
};

export const useDeleteFactory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteFactory(id),
    onSuccess: () => {
      toast.success("Xóa nhà máy thành công");
      qc.invalidateQueries({ queryKey: queryKeys.factories.all });
    },
    onError: (err: any) => toast.error(getErrMsg(err, "Lỗi xóa nhà máy")),
  });
};

// ─── Registrations ──────────────────────────────────

export const useRegisterOperation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (operationId: string) => api.registerOperation(operationId),
    onSuccess: () => {
      toast.success("Đăng ký thành công");
      qc.invalidateQueries({ queryKey: queryKeys.registrations.all });
      qc.invalidateQueries({ queryKey: ["workerDashboard"] });
    },
    onError: (err: any) => toast.error(getErrMsg(err, "Lỗi đăng ký")),
  });
};

export const useStartRegistration = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.startRegistration(id),
    onSuccess: () => {
      toast.success("Đã bắt đầu thao tác!");
      qc.invalidateQueries({ queryKey: queryKeys.registrations.all });
      qc.invalidateQueries({ queryKey: ["workerDashboard"] });
    },
    onError: (err: any) => toast.error(getErrMsg(err, "Lỗi bắt đầu")),
  });
};

export const useCancelRegistration = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.cancelRegistration(id),
    onSuccess: () => {
      toast.success("Đã hủy đăng ký");
      qc.invalidateQueries({ queryKey: queryKeys.registrations.all });
      qc.invalidateQueries({ queryKey: ["workerDashboard"] });
    },
    onError: (err: any) => toast.error(getErrMsg(err, "Lỗi hủy đăng ký")),
  });
};

export const useCompleteRegistration = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { actualQuantity: number; interruptionNote?: string; interruptionMinutes?: number };
    }) => api.completeRegistration(id, data),
    onSuccess: () => {
      toast.success("Hoàn thành thành công");
      qc.invalidateQueries({ queryKey: queryKeys.registrations.all });
    },
    onError: (err: any) => toast.error(getErrMsg(err, "Lỗi hoàn thành")),
  });
};

export const useReassignRegistration = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { newUserId: string; note?: string };
    }) => api.reassignRegistration(id, data),
    onSuccess: () => {
      toast.success("Đã thay thế công nhân!");
      qc.invalidateQueries({ queryKey: queryKeys.registrations.all });
      qc.invalidateQueries({ queryKey: queryKeys.productionOrders.all });
    },
    onError: (err: any) =>
      toast.error(getErrMsg(err, "Lỗi khi thay thế")),
  });
};

// ─── Shifts ─────────────────────────────────────────

export const useStartShift = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.startShift(),
    onSuccess: () => {
      toast.success("Đã bắt đầu ca");
      qc.invalidateQueries({ queryKey: queryKeys.shifts.current });
    },
    onError: (err: any) => toast.error(getErrMsg(err, "Lỗi bắt đầu ca")),
  });
};

export const useEndShift = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.endShift(),
    onSuccess: () => {
      toast.success("Đã kết thúc ca");
      qc.invalidateQueries({ queryKey: queryKeys.shifts.current });
    },
    onError: (err: any) => toast.error(getErrMsg(err, "Lỗi kết thúc ca")),
  });
};

// ─── QC ─────────────────────────────────────────────

export const useInspectVehicle = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.inspectVehicle(data),
    onSuccess: () => {
      toast.success("Kiểm tra thành công");
      qc.invalidateQueries({ queryKey: ["qc", "list"], exact: false }); // [splinh-12/03-14:21]
    },
    onError: (err: any) => toast.error(getErrMsg(err, "Lỗi kiểm tra")),
  });
};

export const useUpdateQC = () => { // [splinh-12/03-14:21]
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.updateQC(id, data),
    onSuccess: (_res, { id }) => {
      toast.success("Cập nhật thành công");
      qc.invalidateQueries({ queryKey: queryKeys.qc.list() });
      qc.invalidateQueries({ queryKey: queryKeys.qc.detail(id) });
    },
    onError: (err: any) => toast.error(getErrMsg(err, "Lỗi cập nhật")),
  });
};

export const useCompleteQC = () => { // [splinh-12/03-14:21]
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.completeQC(id),
    onSuccess: (_res, id) => {
      toast.success("Đã hoàn thành phiếu!");
      qc.invalidateQueries({ queryKey: ["qc", "list"], exact: false });
      qc.invalidateQueries({ queryKey: queryKeys.qc.detail(id) });
    },
    onError: (err: any) => toast.error(getErrMsg(err, "Lỗi hoàn thành")),
  });
};

export const useCompleteAllQC = () => { // [splinh-12/03-14:21]
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any | undefined) => api.completeAllQC(data), // [splinh-12/03-14:48]
    onSuccess: (res) => {
      const count = res.data?.data?.length || 0;
      toast.success(`Đã hoàn thành ${count} phiếu!`);
      qc.invalidateQueries({ queryKey: ["qc", "list"], exact: false });
    },
    onError: (err: any) => toast.error(getErrMsg(err, "Lỗi hoàn thành tất cả")),
  });
};

// ─── Processes ──────────────────────────────────────

export const useCreateProcess = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.createProcess(data),
    onSuccess: () => {
      toast.success("Tạo công đoạn thành công");
      qc.invalidateQueries({ queryKey: queryKeys.processes.all });
    },
    onError: (err: any) =>
      toast.error(getErrMsg(err, "Lỗi tạo công đoạn")),
  });
};

export const useUpdateProcess = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      api.updateProcess(id, data),
    onSuccess: () => {
      toast.success("Cập nhật công đoạn thành công");
      qc.invalidateQueries({ queryKey: queryKeys.processes.all });
    },
    onError: (err: any) =>
      toast.error(getErrMsg(err, "Lỗi cập nhật công đoạn")),
  });
};

export const useDeleteProcess = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteProcess(id),
    onSuccess: () => {
      toast.success("Xóa công đoạn thành công");
      qc.invalidateQueries({ queryKey: queryKeys.processes.all });
    },
    onError: (err: any) =>
      toast.error(getErrMsg(err, "Lỗi xóa công đoạn")),
  });
};

// ─── Operations ──────────────────────────────────────

export const useCreateOperation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.createOperation(data),
    onSuccess: () => {
      toast.success("Tạo thao tác thành công");
      qc.invalidateQueries({ queryKey: queryKeys.operations.all });
    },
    onError: (err: any) =>
      toast.error(getErrMsg(err, "Lỗi tạo thao tác")),
  });
};

export const useUpdateOperation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      api.updateOperation(id, data),
    onSuccess: () => {
      toast.success("Cập nhật thao tác thành công");
      qc.invalidateQueries({ queryKey: queryKeys.operations.all });
    },
    onError: (err: any) =>
      toast.error(getErrMsg(err, "Lỗi cập nhật thao tác")),
  });
};

export const useDeleteOperation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteOperation(id),
    onSuccess: () => {
      toast.success("Xóa thao tác thành công");
      qc.invalidateQueries({ queryKey: queryKeys.operations.all });
    },
    onError: (err: any) =>
      toast.error(getErrMsg(err, "Lỗi xóa thao tác")),
  });
};
export const useLogin = () => // [splinh-12/03-15:05]
  useMutation({
    mutationFn: (credentials: LoginCredentials) => loginApi(credentials),
  });

export const useRegister = () => // [splinh-12/03-15:05]
  useMutation({
    mutationFn: (data: RegisterData) => registerApi(data),
  });

export const useCheckOrderCompletion = () => // [splinh-12/03-15:15]
  useMutation({
    mutationFn: (id: string) => api.checkOrderCompletion(id),
  });
