import { useState, useEffect } from "react";
import { toast } from "sonner";
import Cookies from "js-cookie";
import {
  Plus,
  Trash2,
  RefreshCw,
  Save,
  Trophy,
  Zap,
  Percent,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "../../services/api";
import { Pagination } from "@/components/shared/Pagination";
import {
  useCreateProductionStandard,
  useUpdateProductionStandard,
  useDeleteProductionStandard,
} from "@/hooks/useMutations";

export default function ProductionStandardsPage() {
  const [selectedVehicleType, setSelectedVehicleType] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editedStandards, setEditedStandards] = useState<Record<string, any>>(
    {},
  );
  const user = JSON.parse(
    localStorage.getItem("user") || Cookies.get("user") || "{}",
  );
  const roleCode = user.roleCode || user.role;
  const isAdmin = roleCode === "ADMIN" || roleCode === "admin";
  const isFacManager = roleCode === "FAC_MANAGER" || roleCode === "fac_manager";
  const isSupervisor = roleCode === "SUPERVISOR" || roleCode === "supervisor";
  const canEdit = isFacManager || isAdmin;

  // [splinh] Factory dropdown cho thưởng/phạt override
  const [selectedFactory, setSelectedFactory] = useState<string>(
    user.factoryId || ""
  );

  // Form state
  const [formData, setFormData] = useState({
    operationId: "",
    expectedQuantity: 1,
    bonusPerUnit: 0,
    penaltyPerUnit: 0,
  });

  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
    meta: { maxBonus: 0, maxPenalty: 0 },
  });

  const queryClient = useQueryClient();

  const { data: initData, isLoading: loadingInit } = useQuery({
    queryKey: ["standards_init", isAdmin],
    queryFn: async () => {
      const [vtRes, fRes] = await Promise.all([
        api.getVehicleTypes({ active: true, limit: 100 }),
        isAdmin
          ? api.getFactories()
          : Promise.resolve({ data: { data: [] } }),
      ]);
      return {
        vehicleTypes: (vtRes as any).data.data || [],
        factories: isAdmin ? (fRes as any).data.data || [] : [],
      };
    },
  });

  const vehicleTypes = initData?.vehicleTypes || [];
  const factories = initData?.factories || [];

  // Auto-select first vehicle type
  useEffect(() => {
    if (vehicleTypes.length > 0 && !selectedVehicleType) {
      setSelectedVehicleType(vehicleTypes[0]);
    }
  }, [vehicleTypes]);

  const { data: standardsData, isLoading: loadingStandards } = useQuery({
    queryKey: [
      "standards",
      selectedVehicleType?._id,
      selectedFactory,
      pagination.page,
      pagination.limit,
      searchTerm,
    ],
    queryFn: async () => {
      const query: any = {
        vehicleTypeId: selectedVehicleType._id,
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm || undefined,
        factoryId: selectedFactory || undefined,
      };
      const res = await api.getProductionStandards(query);
      return res.data;
    },
    enabled: !!selectedVehicleType,
  });

  const standards = standardsData?.data || [];
  useEffect(() => {
    if (standardsData?.pagination) {
      setPagination((prev) => ({
        ...prev,
        total: standardsData.pagination.total,
        totalPages: standardsData.pagination.totalPages,
        meta: standardsData.meta || { maxBonus: 0, maxPenalty: 0 },
      }));
    }
    setEditedStandards({});
    setHasChanges(false);
  }, [standardsData]);

  const { data: operations = [] } = useQuery({
    queryKey: ["standards_operations", selectedVehicleType?._id],
    queryFn: async () => {
      const processRes = await api.getProcesses({
        vehicleTypeId: selectedVehicleType._id,
        limit: 100,
      });
      const processes = (processRes as any).data.data || [];
      let allOperations: any[] = [];
      for (const process of processes) {
        const opRes = await api.getOperations({
          processId: process._id,
          limit: 100,
        });
        const ops = ((opRes as any).data.data || []).map((op: any) => ({
          ...op,
          processName: process.name,
        }));
        allOperations = [...allOperations, ...ops];
      }
      return allOperations;
    },
    enabled: !!selectedVehicleType,
  });

  const loading = loadingInit || loadingStandards;

  const createMutation = useCreateProductionStandard();
  const updateMutation = useUpdateProductionStandard();
  const deleteMutation = useDeleteProductionStandard();

  const handleSubmit = () => {
    const data = {
      ...formData,
      vehicleTypeId: selectedVehicleType._id,
      expectedQuantity: Number(formData.expectedQuantity),
      bonusPerUnit: Number(formData.bonusPerUnit) || 0,
      penaltyPerUnit: Number(formData.penaltyPerUnit) || 0,
    };
    createMutation.mutate(data as any, {
      onSuccess: () => {
        setModalOpen(false);
        setFormData({
          operationId: "",
          expectedQuantity: 1,
          bonusPerUnit: 0,
          penaltyPerUnit: 0,
        });
        queryClient.invalidateQueries({ queryKey: ["standards"] });
      },
    });
  };

  const handleInlineEdit = (standardId: string, field: string, value: any) => {
    setEditedStandards((prev) => ({
      ...prev,
      [standardId]: { ...prev[standardId], [field]: value },
    }));
    setHasChanges(true);
  };

  const handleSaveChanges = async () => {
    try {
      // Separate override changes (bonus/penalty) from standard changes (expectedQuantity)
      const overrideEntries: Array<{ standardId: string; bonusPerUnit: number; penaltyPerUnit: number }> = [];
      const standardUpdates: Array<{ id: string; data: any }> = [];

      for (const [id, changes] of Object.entries(editedStandards)) {
        const { bonusPerUnit, penaltyPerUnit, ...stdChanges } = changes as any;
        // bonus/penalty edits go to factory overrides
        if (bonusPerUnit !== undefined || penaltyPerUnit !== undefined) {
          const std = standards.find((s: any) => s._id === id);
          overrideEntries.push({
            standardId: id,
            bonusPerUnit: bonusPerUnit ?? std?.bonusPerUnit ?? 0,
            penaltyPerUnit: penaltyPerUnit ?? std?.penaltyPerUnit ?? 0,
          });
        }
        // Other changes (expectedQuantity) go to standard update
        if (Object.keys(stdChanges).length > 0) {
          standardUpdates.push({ id, data: stdChanges });
        }
      }

      const promises: Promise<any>[] = [];

      if (overrideEntries.length > 0) {
        promises.push(
          api.batchUpsertStandardOverrides({
            overrides: overrideEntries,
            factoryId: selectedFactory || undefined,
          })
        );
      }

      for (const { id, data } of standardUpdates) {
        promises.push(updateMutation.mutateAsync({ id, data }));
      }

      await Promise.all(promises);
      toast.success("Lưu thành công!");
      queryClient.invalidateQueries({ queryKey: ["standards"] });
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || "Có lỗi xảy ra");
    }
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["standards"] });
      },
    });
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("vi-VN").format(value);

  const getProcessTag = (processName: string) => {
    const name = (processName || "").toLowerCase();
    if (name.includes("lắp") || name.includes("assembly"))
      return { bg: "bg-blue-100", color: "text-blue-700", text: "LẮP RÁP" };
    if (name.includes("hàn") || name.includes("weld"))
      return { bg: "bg-amber-100", color: "text-amber-700", text: "HÀN" };
    if (name.includes("sơn") || name.includes("paint"))
      return { bg: "bg-pink-100", color: "text-pink-700", text: "SƠN" };
    if (name.includes("điện") || name.includes("electric"))
      return { bg: "bg-emerald-100", color: "text-emerald-700", text: "ĐIỆN" };
    if (name.includes("kiểm") || name.includes("qc"))
      return {
        bg: "bg-violet-100",
        color: "text-violet-700",
        text: "CHẤT LƯỢNG",
      };
    return { bg: "bg-slate-100", color: "text-slate-600", text: "KHÁC" };
  };

  const maxBonusValues = pagination.meta?.maxBonus || 0;
  const maxPenaltyValues = pagination.meta?.maxPenalty || 0;
  const avgEfficiency = 94.5;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[300px]">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto">
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink>Sản xuất</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink>Cấu hình</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Định mức & Khấu trừ</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Định mức sản xuất</h2>
        <p className="text-sm text-slate-500 mt-1">
          Cấu hình mục tiêu sản lượng và cơ cấu thưởng/phạt cho từng loại xe.
        </p>
      </div>

      {/* Controls */}
      <Card className="mb-6 border-slate-200">
        <CardContent className="pt-5">
          <div className="flex gap-4 items-end flex-wrap">
            <div>
              <Label className="text-[11px] uppercase text-slate-500 mb-1 block">
                Nhà máy (thưởng/phạt)
              </Label>
              {isAdmin ? (
                <Select
                  value={selectedFactory}
                  onValueChange={setSelectedFactory}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Chọn nhà máy" />
                  </SelectTrigger>
                  <SelectContent>
                    {factories.map((f: any) => (
                      <SelectItem key={f._id} value={f._id}>
                        {f.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="h-9 px-3 flex items-center rounded-md border border-slate-200 bg-slate-50 text-sm text-slate-600 w-[200px]">
                  {user.factoryName || "Nhà máy của bạn"}
                </div>
              )}
            </div>
            <div>
              <Label className="text-[11px] uppercase text-slate-500 mb-1 block">
                Loại xe
              </Label>
              <Select
                value={selectedVehicleType?._id || ""}
                onValueChange={(v) =>
                  setSelectedVehicleType(
                    vehicleTypes.find((vt: any) => vt._id === v),
                  )
                }
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {vehicleTypes.map((vt: any) => (
                    <SelectItem key={vt._id} value={vt._id}>
                      {vt.name} ({vt.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[11px] uppercase text-slate-500 mb-1 block">
                Tìm thao tác
              </Label>
              <Input
                placeholder="VD: Pin, Khung, Sơn..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-[250px]"
              />
            </div>
            <div className="ml-auto flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setEditedStandards({});
                  setHasChanges(false);
                }}
              >
                <RefreshCw className="w-4 h-4 mr-1" /> Đặt lại
              </Button>
              <Button
                disabled={!hasChanges || !canEdit}
                onClick={handleSaveChanges}
                className="bg-[#0077c0] hover:bg-[#005fa3]"
              >
                <Save className="w-4 h-4 mr-1" /> Lưu thay đổi
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Standards Table */}
      {selectedVehicleType && (
        <Card className="border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left">
                  <th className="px-4 py-3 font-medium text-slate-500">
                    CHI TIẾT THAO TÁC
                  </th>
                  <th className="px-4 py-3 font-medium text-center text-[#0077c0]">
                    TIÊU CHUẨN
                  </th>
                  <th className="px-4 py-3 font-medium text-center text-slate-500">
                    PHÚT / SP
                  </th>
                  <th className="px-4 py-3 font-medium text-center text-emerald-600">
                    THƯỞNG{" "}
                    <span className="text-[10px] font-normal">
                      (mỗi sp vượt)
                    </span>
                  </th>
                  <th className="px-4 py-3 font-medium text-center text-red-500">
                    PHẠT{" "}
                    <span className="text-[10px] font-normal">
                      (mỗi sp thiếu)
                    </span>
                  </th>
                  <th className="px-4 py-3 w-12"></th>
                </tr>
              </thead>
              <tbody>
                {standards.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="text-center py-10 text-slate-400"
                    >
                      Chưa có định mức.{" "}
                      {canEdit && (
                        <button
                          className="text-[#0077c0] hover:underline"
                          onClick={() => {
                            setFormData({
                              operationId: "",
                              expectedQuantity: 1,
                              bonusPerUnit: 0,
                              penaltyPerUnit: 0,
                            });
                            setModalOpen(true);
                          }}
                        >
                          <Plus className="w-3 h-3 inline mr-0.5" /> Thêm mới
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  standards.map((std: any) => {
                    const tag = getProcessTag(
                      typeof std.operationId === "object"
                        ? (std.operationId as any).processId?.name
                        : "",
                    );
                    const currentValues = editedStandards[std._id] || {};
                    return (
                      <tr
                        key={std._id}
                        className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="font-medium">
                            {typeof std.operationId === "object"
                              ? std.operationId.name
                              : std.operationId}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-slate-400">
                              ID:{" "}
                              {typeof std.operationId === "object"
                                ? std.operationId.code
                                : ""}
                            </span>
                            <span
                              className={`${tag.bg} ${tag.color} px-2 py-0.5 rounded text-[10px] font-semibold`}
                            >
                              {tag.text}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="font-semibold text-[#0077c0] text-base">
                            {(typeof std.operationId === "object"
                              ? std.operationId.standardQuantity
                              : 0) ||
                              std.expectedQuantity ||
                              "—"}
                          </div>
                          <span className="text-[11px] text-slate-400">
                            sp / ca
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-sm">
                          {(typeof std.operationId === "object"
                            ? std.operationId.standardMinutes
                            : 0)?.toFixed(1) || "—"}
                          p
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center">
                            <span className="text-emerald-500 mr-1">+</span>
                            <Input
                              type="number"
                              min={0}
                              disabled={!canEdit}
                              className="w-[100px] text-center border-emerald-200 bg-emerald-50/50"
                              value={
                                currentValues.bonusPerUnit ??
                                std.bonusPerUnit ??
                                0
                              }
                              onChange={(e) =>
                                handleInlineEdit(
                                  std._id,
                                  "bonusPerUnit",
                                  Number(e.target.value),
                                )
                              }
                            />
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center">
                            <span className="text-red-500 mr-1">-</span>
                            <Input
                              type="number"
                              min={0}
                              disabled={!canEdit}
                              className="w-[100px] text-center border-red-200 bg-red-50/50"
                              value={
                                currentValues.penaltyPerUnit ??
                                std.penaltyPerUnit ??
                                0
                              }
                              onChange={(e) =>
                                handleInlineEdit(
                                  std._id,
                                  "penaltyPerUnit",
                                  Number(e.target.value),
                                )
                              }
                            />
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {canEdit && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-red-500 opacity-50 hover:opacity-100"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Xóa định mức này?
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Hành động không thể hoàn tác.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Hủy</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(std._id)}
                                    className="bg-red-500 hover:bg-red-600"
                                  >
                                    Xóa
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-3 border-t border-slate-200 text-sm text-slate-500">
            Hiển thị {standards.length} / {pagination.total} thao tác của{" "}
            {selectedVehicleType?.name}
          </div>

          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            limit={pagination.limit}
            total={pagination.total}
            onPageChange={(p: number) =>
              setPagination((prev) => ({ ...prev, page: p }))
            }
            onLimitChange={(l: number) =>
              setPagination((prev) => ({ ...prev, limit: l, page: 1 }))
            }
          />
        </Card>
      )}

      {/* Bottom Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
        <Card className="border-slate-200">
          <CardContent className="pt-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
              <Trophy className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">
                {formatCurrency(maxBonusValues)}
              </div>
              <div className="text-xs text-slate-500">đ/ca</div>
              <div className="text-xs text-slate-500">Thưởng tối đa</div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="pt-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
              <Zap className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">
                {formatCurrency(maxPenaltyValues)}
              </div>
              <div className="text-xs text-slate-500">đ/ca</div>
              <div className="text-xs text-slate-500">Phạt tối đa</div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="pt-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <Percent className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{avgEfficiency}%</div>
              <div className="text-xs text-slate-500">
                Hiệu suất mục tiêu TB
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Modal */}
      <Dialog
        open={modalOpen}
        onOpenChange={(open) => {
          if (!open) setModalOpen(false);
        }}
      >
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Thêm định mức sản xuất</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>Thao tác *</Label>
              <Select
                value={formData.operationId}
                onValueChange={(v) =>
                  setFormData({ ...formData, operationId: v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn thao tác..." />
                </SelectTrigger>
                <SelectContent>
                  {operations.map((op) => (
                    <SelectItem key={op._id} value={op._id}>
                      [{op.processName}] {op.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Số lượng dự kiến/ngày *</Label>
              <Input
                type="number"
                min={1}
                value={formData.expectedQuantity}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    expectedQuantity: parseInt(e.target.value) || 1,
                  })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Thưởng/sp (đ)</Label>
                <Input
                  type="number"
                  min={0}
                  value={formData.bonusPerUnit}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      bonusPerUnit: parseInt(e.target.value) || 0,
                    })
                  }
                  placeholder="0"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Phạt/sp (đ)</Label>
                <Input
                  type="number"
                  min={0}
                  value={formData.penaltyPerUnit}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      penaltyPerUnit: parseInt(e.target.value) || 0,
                    })
                  }
                  placeholder="0"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Hủy
            </Button>
            <Button
              onClick={handleSubmit}
              className="bg-[#0077c0] hover:bg-[#005fa3]"
            >
              Tạo mới
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
