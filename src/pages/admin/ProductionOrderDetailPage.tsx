import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import dayjs from "dayjs";
import Cookies from "js-cookie";
import { useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle,
  UserPlus,
  FileText,
  RefreshCw,
  AlertTriangle,
  Users,
  Calendar,
  Package,
  Eye,
  Wrench,
  Paintbrush,
  Zap,
  Shield,
  Hammer,
  Loader2,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
// [splinh-12/03-15:10]
import { useProductionOrder, useOrderProgress, useUsers, useOperations } from "@/hooks/useQueries";
import { useCompleteOrder, useAssignWorker, useReassignRegistration, useUpdateProductionOrderStatus, useCheckOrderCompletion } from "@/hooks/useMutations"; // [splinh-12/03-15:15]
import { queryKeys } from "@/hooks/queryKeys";

const getProcessIcon = (processName = "") => {
  const n = processName.toLowerCase();
  if (n.includes("khung") || n.includes("chassis"))
    return <Hammer className="w-5 h-5" />;
  if (n.includes("sơn") || n.includes("paint"))
    return <Paintbrush className="w-5 h-5" />;
  if (n.includes("điện") || n.includes("electric"))
    return <Zap className="w-5 h-5" />;
  if (n.includes("kiểm") || n.includes("qc"))
    return <Shield className="w-5 h-5" />;
  return <Wrench className="w-5 h-5" />;
};

const getIconColor = (processName = "") => {
  const n = processName.toLowerCase();
  if (n.includes("khung") || n.includes("chassis"))
    return { bg: "bg-violet-100", text: "text-violet-600" };
  if (n.includes("sơn") || n.includes("paint"))
    return { bg: "bg-pink-100", text: "text-pink-600" };
  if (n.includes("điện") || n.includes("electric"))
    return { bg: "bg-emerald-100", text: "text-emerald-600" };
  if (n.includes("kiểm") || n.includes("qc"))
    return { bg: "bg-blue-100", text: "text-blue-600" };
  return { bg: "bg-amber-100", text: "text-amber-600" };
};

const statusMap: Record<string, { cls: string; label: string }> = {
  pending: { cls: "bg-slate-100 text-slate-600", label: "Chờ" },
  in_progress: { cls: "bg-blue-100 text-blue-700", label: "Đang thực hiện" },
  completed: { cls: "bg-emerald-100 text-emerald-700", label: "Hoàn thành" },
};

export default function ProductionOrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = JSON.parse(Cookies.get("user") || "{}");
  const roleCode = (user.roleCode || user.role || "").toUpperCase();
  const isAdmin = roleCode === "ADMIN";
  const isFacManager = roleCode === "FAC_MANAGER";
  const isSupervisor = roleCode === "SUPERVISOR";
  const canEdit = isFacManager; // Only Fac Manager can CRUD Production Orders

  const queryClient = useQueryClient();

  // ─── React Query: Fetch data ───────────────────────
  const { data: order, isLoading: orderLoading } = useProductionOrder(id!);
  const { data: progressData, isLoading: progressLoading } = useOrderProgress(id!);
  const { data: usersData } = useUsers();
  const { data: opsData } = useOperations();

  const progress = (progressData as any)?.progress || [];
  const registrations = (progressData as any)?.registrations || [];
  const summary = (progressData as any)?.summary || null;
  const users = usersData?.data || [];
  const operations = opsData || [];
  const loading = orderLoading || progressLoading;

  // ─── React Query: Mutations ────────────────────────
  const completeMutation = useCompleteOrder();
  const assignMutation = useAssignWorker();
  const reassignMutation = useReassignRegistration();
  const updateStatusMutation = useUpdateProductionOrderStatus();

  // ─── UI State ──────────────────────────────────────
  const [assignOpen, setAssignOpen] = useState(false);
  const [compCheck, setCompCheck] = useState<any>(null);
  const [forceOpen, setForceOpen] = useState(false);
  const [forceMsg, setForceMsg] = useState("");
  const [expandedOp, setExpandedOp] = useState<string | null>(null);
  const [expandedSubOp, setExpandedSubOp] = useState<string | null>(null);
  const [reassignOpen, setReassignOpen] = useState(false);
  const [selectedReg, setSelectedReg] = useState<any>(null);
  const [reassignUserId, setReassignUserId] = useState("");
  const [assignForm, setAssignForm] = useState({
    userId: "",
    operationId: "",
    expectedQuantity: 1,
    replacementReason: "",
  });

  // ─── Handlers ──────────────────────────────────────
  const refreshAll = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.productionOrders.detail(id!) });
    queryClient.invalidateQueries({ queryKey: queryKeys.productionOrders.progress(id!) });
  };

  const checkCompletionMut = useCheckOrderCompletion(); // [splinh-12/03-15:15]

  const handleCheckCompletion = async () => {
    if (!id) return;
    checkCompletionMut.mutate(id, {
      onSuccess: (res: any) => { // [splinh-12/03-15:18]
        const checkData = res.data.data as any;
        setCompCheck(checkData);
        checkData.canComplete
          ? toast.success("Có thể hoàn thành!")
          : toast.warning(
              `Còn ${checkData.incompleteProcesses.length} công đoạn chưa xong`,
            );
      },
      onError: (e: any) => {
        toast.error(e.message || "Lỗi khi kiểm tra hoàn thành");
      }
    });
  };

  const handleComplete = () => {
    if (!id) return;
    completeMutation.mutate(
      { id, data: { forceComplete: false } },
      {
        onError: (e: any) => {
          if (e.response?.data?.error?.code === "INCOMPLETE_PROCESSES") {
            setForceMsg(e.response.data.error.message);
            setForceOpen(true);
          } else toast.error(e.response?.data?.error?.message || e.message);
        },
      },
    );
  };

  const handleForce = () => {
    if (!id) return;
    completeMutation.mutate(
      { id, data: { forceComplete: true } },
      {
        onSuccess: () => {
          setForceOpen(false);
        },
      },
    );
  };

  const handleAssign = () => {
    if (!id) return;
    assignMutation.mutate(
      {
        id,
        data: {
          ...assignForm,
          expectedQuantity: Number(assignForm.expectedQuantity),
        },
      },
      {
        onSuccess: () => {
          setAssignOpen(false);
          setAssignForm({
            userId: "",
            operationId: "",
            expectedQuantity: 1,
            replacementReason: "",
          });
        },
      },
    );
  };

  const handleReassign = () => {
    if (!selectedReg || !reassignUserId) return;
    reassignMutation.mutate(
      {
        id: selectedReg._id,
        data: {
          newUserId: reassignUserId,
          note: "Thay thế do nghỉ đột xuất",
        },
      },
      {
        onSuccess: () => {
          setReassignOpen(false);
          setSelectedReg(null);
          setReassignUserId("");
          refreshAll();
        },
      },
    );
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );

  const totalW = progress.reduce((s: number, p: any) => s + p.workers.length, 0);
  const done = progress.reduce((s: number, p: any) => s + p.completed, 0);
  const pct = summary?.overallPercentage || 0;

  return (
    <div className="max-w-[1200px] mx-auto">
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink
              className="cursor-pointer"
              onClick={() => navigate("/admin/production-orders")}
            >
              Lệnh sản xuất
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{order?.orderCode}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header Card */}
      <Card className="mb-6 border-slate-200">
        <CardContent className="pt-6">
          <div className="flex justify-between items-start mb-6 flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold">Lệnh #{order?.orderCode}</h2>
                <Badge
                  variant="outline"
                  className={order?.status ? statusMap[order.status]?.cls || "" : ""}
                >
                  {order?.status ? statusMap[order.status]?.label || order.status : ""}
                </Badge>
              </div>
              <p className="text-sm text-slate-500">
                {typeof order?.vehicleTypeId === "object" ? order.vehicleTypeId.name : (order?.vehicleType as any)?.name} • {typeof order?.vehicleTypeId === "object" ? order.vehicleTypeId.code : (order?.vehicleType as any)?.code}
                {order?.factoryId && (
                  <span className="block text-[#0077c0] font-medium mt-1">
                    🏭 Nhà máy:{" "}
                    {typeof order.factoryId === "object"
                      ? order.factoryId.name
                      : order.factoryId}
                  </span>
                )}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate(`/admin/production-orders/${id}/report`)}
            >
              <FileText className="w-4 h-4 mr-1" /> Báo cáo
            </Button>
          </div>
          <div className="mb-6">
            <div className="flex justify-between mb-2">
              <span className="text-sm text-slate-500">Tiến độ tổng</span>
              <span className="text-lg font-bold text-[#0077c0]">{pct}%</span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#0077c0] rounded-full transition-all"
                style={{ width: `${Math.min(pct, 100)}%` }}
              />
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Dự kiến xong {dayjs(order?.expectedEndDate).format("DD/MM/YYYY")}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-xl p-4 text-center">
              <Users className="w-5 h-5 text-blue-600 mx-auto mb-1" />
              <div className="text-2xl font-bold">{totalW}</div>
              <div className="text-xs text-slate-500">Công nhân</div>
            </div>
            <div className="bg-emerald-50 rounded-xl p-4 text-center">
              <Calendar className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
              <div className="text-2xl font-bold">
                {dayjs(order?.expectedEndDate).format("DD/MM")}
              </div>
              <div className="text-xs text-slate-500">Hạn hoàn thành</div>
            </div>
            <div className="bg-orange-50 rounded-xl p-4 text-center">
              <Package className="w-5 h-5 text-orange-600 mx-auto mb-1" />
              <div className="text-2xl font-bold">
                {done}
                <span className="text-sm font-normal text-slate-400">
                  /{order?.quantity}
                </span>
              </div>
              <div className="text-xs text-slate-500">SP hoàn thành</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Details Card */}
      <Card className="mb-6 border-slate-200">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label className="text-slate-500 font-medium mb-1.5 block">
                Danh sách số khung ({order?.frameNumbers?.length || 0})
              </Label>
              <div className="max-h-[120px] overflow-y-auto font-mono text-xs bg-slate-50 p-3 rounded-lg border border-slate-100 leading-relaxed italic text-slate-600">
                {order?.frameNumbers?.join(", ") || "Chưa cập nhật"}
              </div>
            </div>
            <div>
              <Label className="text-slate-500 font-medium mb-1.5 block">
                Danh sách số máy ({order?.engineNumbers?.length || 0})
              </Label>
              <div className="max-h-[120px] overflow-y-auto font-mono text-xs bg-slate-50 p-3 rounded-lg border border-slate-100 leading-relaxed italic text-slate-600">
                {order?.engineNumbers?.join(", ") || "Chưa cập nhật"}
              </div>
            </div>
          </div>
          {order?.note && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <Label className="text-slate-500 font-medium mb-1.5 block">
                Ghi chú
              </Label>
              <div className="text-sm p-3 bg-slate-50 rounded-lg border border-slate-100 text-slate-700">
                {order.note}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Process Table */}
      <Card className="border-slate-200">
        <CardContent className="pt-6">
          <div className="flex justify-between items-center mb-5 flex-wrap gap-3">
            <h3 className="text-lg font-bold">Tiến độ công đoạn</h3>
            {canEdit && (order as any)?.status === "in_progress" && (
              <Button
                onClick={() => setAssignOpen(true)}
                className="bg-[#0077c0] hover:bg-[#005fa3]"
              >
                <UserPlus className="w-4 h-4 mr-1" /> Bổ sung CN
              </Button>
            )}
          </div>
          {compCheck && !compCheck.canComplete && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 flex items-start gap-2 text-sm">
              <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
              <span>
                {compCheck.incompleteProcesses
                  .map(
                    (p: any, i: number) =>
                      `${p.processName} (còn ${p.remaining})${i < compCheck.incompleteProcesses.length - 1 ? ", " : ""}`,
                  )
                  .join("")}
              </span>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-3 font-medium text-slate-500">CÔNG ĐOẠN</th>
                  <th className="py-3 font-medium text-slate-500 w-[200px]">
                    TIẾN ĐỘ
                  </th>
                  <th className="py-3 font-medium text-slate-500">PHỤ TRÁCH</th>
                  <th className="py-3 font-medium text-slate-500">
                    TRẠNG THÁI
                  </th>
                  <th className="py-3 w-14"></th>
                </tr>
              </thead>
              <tbody>
                {progress.map((r: any) => {
                  const ic = getIconColor(r.processName);
                  const st = statusMap[r.status] || {
                    cls: "",
                    label: r.status,
                  };
                  return (
                    <React.Fragment key={r.processId}>
                      <tr className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-3">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-10 h-10 rounded-lg ${ic.bg} ${ic.text} flex items-center justify-center`}
                            >
                              {getProcessIcon(r.processName)}
                            </div>
                            <div>
                              <div className="font-semibold">
                                {r.processName}
                              </div>
                              <span className="text-xs text-slate-400">
                                Bước {r.order}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-3 mb-1">
                            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${r.status === "completed" ? "bg-emerald-500" : "bg-[#0077c0]"}`}
                                style={{
                                  width: `${Math.min(r.percentage, 100)}%`,
                                }}
                              />
                            </div>
                            <span className="text-sm font-medium min-w-[40px] text-right">
                              {r.percentage}%
                            </span>
                          </div>
                          <span className="text-xs text-slate-400">
                            {r.completed}/{r.required}
                          </span>
                        </td>
                        <td className="py-3">
                          {r.workers.length === 0 ? (
                            <span className="text-xs text-slate-400">
                              Chưa phân công
                            </span>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Avatar className="h-7 w-7">
                                <AvatarFallback className="bg-[#0077c0] text-white text-xs">
                                  {r.workers[0]?.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm">{r.workers[0]}</span>
                            </div>
                          )}
                        </td>
                        <td className="py-3">
                          <Badge variant="outline" className={st.cls}>
                            {st.label}
                          </Badge>
                        </td>
                        <td className="py-3 text-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            className={`h-8 w-8 ${expandedOp === r.processId ? "bg-[#0077c0]/10 text-[#0077c0]" : ""}`}
                            onClick={() =>
                              setExpandedOp(
                                expandedOp === r.processId ? null : r.processId,
                              )
                            }
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                      {expandedOp === r.processId && (
                        <tr>
                          <td colSpan={5} className="bg-slate-50 px-6 py-3">
                            <div className="text-xs font-semibold text-slate-500 mb-2">
                              Chi tiết – {r.processName}
                            </div>
                            {(() => {
                              const opRegs = r.registrationDetails || [];
                              if (opRegs.length === 0) {
                                return (
                                  <p className="text-xs text-slate-400">
                                    Chưa có công nhân đăng ký
                                  </p>
                                );
                              }
                              // Group by operation code+name
                              const byOp: Record<
                                string,
                                { opId: string; regs: any[] }
                              > = {};
                              opRegs.forEach((reg: any) => {
                                const opKey =
                                  reg.operation?.code ||
                                  reg.operation?.name ||
                                  "Khác";
                                const opName =
                                  reg.operation?.name ||
                                  reg.operationId?.name ||
                                  "Khác";
                                if (!byOp[opKey])
                                  byOp[opKey] = { opId: "", regs: [] };
                                byOp[opKey].regs.push(reg);
                                // Try to capture the operationId for assign form
                                if (
                                  !byOp[opKey].opId &&
                                  (reg.operationId || reg.operation?._id)
                                ) {
                                  byOp[opKey].opId =
                                    typeof reg.operationId === "object"
                                      ? reg.operationId?._id
                                      : reg.operationId || "";
                                }
                              });

                              return Object.entries(byOp).map(
                                ([opKey, { opId: savedOpId, regs }]) => {
                                  const opName =
                                    regs[0]?.operation?.name ||
                                    regs[0]?.operationId?.name ||
                                    opKey;
                                  const isSubExpanded =
                                    expandedSubOp === `${r.processId}_${opKey}`;
                                  // Tổng completed
                                  const totalActual = regs
                                    .filter(
                                      (rg: any) => rg.status === "completed",
                                    )
                                    .reduce(
                                      (s: number, rg: any) =>
                                        s + (rg.actualQuantity || 0),
                                      0,
                                    );

                                  return (
                                    <div
                                      key={opKey}
                                      className="mb-2 border border-slate-200 rounded-md overflow-hidden"
                                    >
                                      {/* Operation header - clickable */}
                                      <div className="flex items-center justify-between px-3 py-2.5 bg-white hover:bg-slate-50 transition-colors">
                                        <button
                                          className="flex items-center gap-2 flex-1 text-left"
                                          onClick={() =>
                                            setExpandedSubOp(
                                              isSubExpanded
                                                ? null
                                                : `${r.processId}_${opKey}`,
                                            )
                                          }
                                        >
                                          {isSubExpanded ? (
                                            <ChevronDown className="w-4 h-4 text-[#0077c0]" />
                                          ) : (
                                            <ChevronRight className="w-4 h-4 text-slate-400" />
                                          )}
                                          <span className="text-sm font-bold text-[#0077c0]">
                                            {opName}
                                          </span>
                                          <span className="text-xs text-slate-400 ml-1">
                                            {regs.length} lượt · {totalActual}/
                                            {order?.quantity || 0} SP
                                          </span>
                                        </button>
                                      </div>

                                      {/* Expanded content */}
                                      {isSubExpanded &&
                                        (() => {
                                          // Group by date
                                          const byDate: Record<string, any[]> =
                                            {};
                                          regs.forEach((reg: any) => {
                                            const dateKey = reg.date
                                              ? dayjs(reg.date).format(
                                                  "DD/MM/YYYY",
                                                )
                                              : "Không rõ";
                                            if (!byDate[dateKey])
                                              byDate[dateKey] = [];
                                            byDate[dateKey].push(reg);
                                          });

                                          return (
                                            <div className="border-t border-slate-200 bg-slate-50/50 px-3 py-2">
                                              {Object.entries(byDate).map(
                                                ([dateStr, dateRegs]) => (
                                                  <div
                                                    key={dateStr}
                                                    className="mb-2.5 last:mb-0"
                                                  >
                                                    <div className="flex items-center justify-between mb-1">
                                                      <span className="text-xs font-semibold text-slate-600">
                                                        📅 {dateStr}
                                                      </span>
                                                      {(canEdit || isAdmin) &&
                                                        order?.status !==
                                                          "completed" && (
                                                          <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-6 px-2.5 text-[11px] text-[#0077c0] border-[#0077c0]/30 hover:bg-blue-50"
                                                            onClick={async (
                                                              e,
                                                            ) => {
                                                              e.stopPropagation();
                                                              const actualOpId =
                                                                regs[0]
                                                                  ?.operation
                                                                  ?._id ||
                                                                regs[0]
                                                                  ?.operationId ||
                                                                savedOpId ||
                                                                "";
                                                              const totalExp =
                                                                order?.quantity ||
                                                                0;
                                                              const totalDone =
                                                                regs.reduce(
                                                                  (
                                                                    s: number,
                                                                    rg: any,
                                                                  ) =>
                                                                    s +
                                                                    (rg.actualQuantity ||
                                                                      0),
                                                                  0,
                                                                );
                                                              const remaining =
                                                                Math.max(
                                                                  totalExp -
                                                                    totalDone,
                                                                  1,
                                                                );
                                                              setAssignForm({
                                                                userId: "",
                                                                operationId:
                                                                  actualOpId.toString(),
                                                                expectedQuantity:
                                                                  remaining,
                                                                replacementReason:
                                                                  "",
                                                              });
                                                              setAssignOpen(
                                                                true,
                                                              );
                                                            }}
                                                          >
                                                            + Bổ sung
                                                          </Button>
                                                        )}
                                                    </div>
                                                    <table className="w-full text-xs">
                                                      <thead>
                                                        <tr className="text-left text-slate-400">
                                                          <th className="py-1.5 font-medium">
                                                            Công nhân
                                                          </th>
                                                          <th className="py-1.5 font-medium text-center">
                                                            Tiêu chuẩn
                                                          </th>
                                                          <th className="py-1.5 font-medium text-center">
                                                            Thực tế
                                                          </th>
                                                          <th className="py-1.5 font-medium text-center">
                                                            Chênh lệch
                                                          </th>
                                                          <th className="py-1.5 font-medium text-center">
                                                            Phút
                                                          </th>
                                                          <th className="py-1.5 font-medium">
                                                            Trạng thái
                                                          </th>
                                                          <th className="py-1.5 font-medium">
                                                            Lý do
                                                          </th>
                                                        </tr>
                                                      </thead>
                                                      <tbody>
                                                        {dateRegs.map(
                                                          (reg: any) => {
                                                            const actual =
                                                              reg.actualQuantity ||
                                                              0;
                                                            const expected =
                                                              reg.expectedQuantity ||
                                                              0;
                                                            const deviation =
                                                              reg.deviation ??
                                                              actual - expected;
                                                            return (
                                                              <tr
                                                                key={reg._id}
                                                                className="border-b border-slate-100"
                                                              >
                                                                <td className="py-1.5 font-medium text-slate-700">
                                                                  {reg.worker
                                                                    ?.name ||
                                                                    reg.userId
                                                                      ?.name}{" "}
                                                                  <span className="text-slate-400">
                                                                    (
                                                                    {reg.worker
                                                                      ?.code ||
                                                                      reg.userId
                                                                        ?.code}
                                                                    )
                                                                  </span>
                                                                </td>
                                                                <td className="py-1.5 text-center">
                                                                  {expected}
                                                                </td>
                                                                <td className="py-1.5 text-center font-semibold">
                                                                  {reg.status ===
                                                                  "completed"
                                                                    ? actual
                                                                    : "—"}
                                                                </td>
                                                                <td
                                                                  className={`py-1.5 text-center font-semibold ${
                                                                    reg.status !==
                                                                    "completed"
                                                                      ? "text-slate-300"
                                                                      : deviation >
                                                                          0
                                                                        ? "text-emerald-600"
                                                                        : deviation <
                                                                            0
                                                                          ? "text-red-500"
                                                                          : "text-slate-500"
                                                                  }`}
                                                                >
                                                                  {reg.status ===
                                                                  "completed"
                                                                    ? deviation >
                                                                      0
                                                                      ? `+${deviation}`
                                                                      : deviation
                                                                    : "—"}
                                                                </td>
                                                                <td className="py-1.5 text-center text-slate-500">
                                                                  {reg.workingMinutes ||
                                                                    "—"}
                                                                </td>
                                                                <td className="py-1.5">
                                                                  {(() => {
                                                                    const isCompleted =
                                                                      reg.status ===
                                                                      "completed";
                                                                    const needMore =
                                                                      isCompleted &&
                                                                      actual <
                                                                        expected;
                                                                    const isDone =
                                                                      isCompleted &&
                                                                      actual >=
                                                                        expected;
                                                                    return (
                                                                      <Badge
                                                                        variant="outline"
                                                                        className={
                                                                          isDone
                                                                            ? "bg-emerald-100 text-emerald-700"
                                                                            : needMore
                                                                              ? "bg-orange-100 text-orange-700"
                                                                              : reg.status ===
                                                                                  "in_progress"
                                                                                ? "bg-amber-100 text-amber-700"
                                                                                : "bg-blue-100 text-blue-700"
                                                                        }
                                                                      >
                                                                        {isDone
                                                                          ? "Xong"
                                                                          : needMore
                                                                            ? "Cần bổ sung"
                                                                            : reg.status ===
                                                                                "in_progress"
                                                                              ? "Đang làm"
                                                                              : reg.status ===
                                                                                  "registered"
                                                                                ? "Đã ĐK"
                                                                                : reg.status}
                                                                      </Badge>
                                                                    );
                                                                  })()}
                                                                </td>
                                                                <td className="py-1.5 text-xs text-amber-600 max-w-[120px] truncate">
                                                                  {reg.earlyLeaveReason ||
                                                                    reg.replacementReason ||
                                                                    "—"}
                                                                </td>
                                                              </tr>
                                                            );
                                                          },
                                                        )}
                                                      </tbody>
                                                    </table>
                                                  </div>
                                                ),
                                              )}
                                            </div>
                                          );
                                        })()}
                                    </div>
                                  );
                                },
                              );
                            })()}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
          {canEdit && order?.status !== "completed" && (
            <div className="flex gap-3 mt-5 pt-5 border-t">
              <Button variant="outline" onClick={refreshAll}>
                <RefreshCw className="w-4 h-4 mr-1" /> Làm mới
              </Button>

              {/* Nút Bắt đầu - chuyển pending → in_progress */}
              {order?.status === "pending" && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button className="bg-[#0077c0] hover:bg-[#005fa3]">
                      <Zap className="w-4 h-4 mr-1" /> Bắt đầu
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Bắt đầu lệnh sản xuất?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        Lệnh sẽ chuyển sang trạng thái "Đang thực hiện". Công
                        nhân có thể đăng ký thao tác.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Hủy</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-[#0077c0]"
                        disabled={updateStatusMutation.isPending}
                        onClick={() => {
                          if (!id) return;
                          updateStatusMutation.mutate({ id, status: "in_progress" });
                        }}
                      >
                        {updateStatusMutation.isPending ? "Đang xử lý..." : "Bắt đầu"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}

              {/* Nút Hoàn thành - khi đang in_progress */}
              {order?.status === "in_progress" && (
                <>
                  <Button variant="outline" onClick={handleCheckCompletion}>
                    <AlertTriangle className="w-4 h-4 mr-1" /> Kiểm tra
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button className="bg-emerald-500 hover:bg-emerald-600">
                        <CheckCircle className="w-4 h-4 mr-1" /> Hoàn thành
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Xác nhận hoàn thành?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Lệnh sẽ được đánh dấu hoàn thành.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleComplete}
                          className="bg-emerald-500"
                        >
                          Hoàn thành
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Registrations Table */}
      <Card className="mt-6 border-slate-200">
        <CardContent className="pt-6">
          <h3 className="text-lg font-bold mb-5">
            Danh sách đăng ký & Thay thế
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-3 font-medium text-slate-500">CÔNG NHÂN</th>
                  <th className="py-3 font-medium text-slate-500">THAO TÁC</th>
                  <th className="py-3 font-medium text-slate-500">
                    SL ĐĂNG KÝ
                  </th>
                  <th className="py-3 font-medium text-slate-500">
                    TRẠNG THÁI
                  </th>
                  <th className="py-3 font-medium text-slate-500 text-right">
                    THAO TÁC
                  </th>
                </tr>
              </thead>
              <tbody>
                {registrations.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-400">
                      Chưa có lượt đăng ký nào
                    </td>
                  </tr>
                ) : (
                  registrations.map((reg: any) => (
                    <tr
                      key={reg._id}
                      className="border-b border-slate-100 hover:bg-slate-50"
                    >
                      <td className="py-3 font-medium">
                        {reg.userId?.name} ({reg.userId?.code})
                      </td>
                      <td className="py-3">{reg.operationId?.name}</td>
                      <td className="py-3">{reg.expectedQuantity}</td>
                      <td className="py-3">
                        <Badge
                          variant="outline"
                          className={
                            reg.status === "completed"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-blue-100 text-blue-700"
                          }
                        >
                          {reg.status === "completed"
                            ? "Xong"
                            : reg.status === "registered"
                              ? "Đang làm"
                              : reg.status}
                        </Badge>
                      </td>
                      <td className="py-3 text-right">
                        {reg.status === "registered" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-amber-600 border-amber-200 hover:bg-amber-50"
                            onClick={() => {
                              setSelectedReg(reg);
                              setReassignOpen(true);
                            }}
                          >
                            <RefreshCw className="w-3.5 h-3.5 mr-1" /> Thay thế
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Force Complete */}
      <AlertDialog open={forceOpen} onOpenChange={setForceOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ép hoàn thành?</AlertDialogTitle>
            <AlertDialogDescription>{forceMsg}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleForce}
              className="bg-amber-500 hover:bg-amber-600"
            >
              Ép hoàn thành
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Assign Modal */}
      <Dialog
        open={assignOpen}
        onOpenChange={(o) => {
          if (!o) setAssignOpen(false);
        }}
      >
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Bổ sung công nhân</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>Công nhân *</Label>
              <Select
                value={assignForm.userId}
                onValueChange={(v) =>
                  setAssignForm({ ...assignForm, userId: v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn..." />
                </SelectTrigger>
                <SelectContent>
                  {users
                    .filter((u) => u.role === "worker")
                    .map((u) => (
                      <SelectItem key={u._id} value={u._id}>
                        {u.code} - {u.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Thao tác *</Label>
              <Select
                value={assignForm.operationId}
                disabled={!!assignForm.operationId}
                onValueChange={(v) => {
                  // Tìm các registration đã hoàn thành của thao tác này
                  const opsRegs = registrations.filter((r: any) => {
                    const opId =
                      typeof r.operationId === "object"
                        ? r.operationId?._id?.toString()
                        : r.operationId?.toString();
                    return opId === v;
                  });
                  // SL kỳ vọng = số lượng lệnh SX (order.quantity)
                  const totalExpected = order?.quantity || 0;
                  // SL đã hoàn thành = tổng actualQuantity của các worker đã xong/đang làm
                  const totalActual = opsRegs.reduce(
                    (sum: number, r: any) => sum + (r.actualQuantity || 0),
                    0,
                  );
                  const remaining = Math.max(totalExpected - totalActual, 1);
                  setAssignForm({
                    ...assignForm,
                    operationId: v,
                    expectedQuantity: remaining,
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn..." />
                </SelectTrigger>
                <SelectContent>
                  {operations.map((op) => (
                    <SelectItem key={op._id} value={op._id}>
                      {op.code} - {op.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>
                Số lượng *{" "}
                <span className="text-xs text-slate-400 font-normal">
                  (còn lại)
                </span>
              </Label>
              <Input
                type="number"
                min={1}
                value={assignForm.expectedQuantity}
                onChange={(e) =>
                  setAssignForm({
                    ...assignForm,
                    expectedQuantity: parseInt(e.target.value) || 1,
                  })
                }
              />
              {assignForm.operationId &&
                (() => {
                  const opsRegs = registrations.filter((r: any) => {
                    const opId =
                      typeof r.operationId === "object"
                        ? r.operationId?._id?.toString()
                        : r.operationId?.toString();
                    return opId === assignForm.operationId;
                  });
                  const totalExp = order?.quantity || 0;
                  const totalAct = opsRegs.reduce(
                    (s: number, r: any) => s + (r.actualQuantity || 0),
                    0,
                  );
                  return (
                    <p className="text-xs text-slate-500 mt-1">
                      Kỳ vọng: <strong>{totalExp}</strong> – Đã làm:{" "}
                      <strong>{totalAct}</strong> = Còn lại:{" "}
                      <strong className="text-[#0077c0]">
                        {Math.max(totalExp - totalAct, 0)}
                      </strong>
                    </p>
                  );
                })()}
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setAssignOpen(false)}>
              Hủy
            </Button>
            <Button
              onClick={handleAssign}
              disabled={assignMutation.isPending}
              className="bg-[#0077c0] hover:bg-[#005fa3]"
            >
              {assignMutation.isPending && (
                <Loader2 className="w-4 h-4 animate-spin mr-1" />
              )}
              Bổ sung
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reassign Modal */}
      <Dialog
        open={reassignOpen}
        onOpenChange={(o) => {
          if (!o) {
            setReassignOpen(false);
            setSelectedReg(null);
            setReassignUserId("");
          }
        }}
      >
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Thay thế công nhân</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2 text-sm">
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
              <p>
                📌 <strong>Đang làm:</strong> {selectedReg?.userId?.name} (
                {selectedReg?.userId?.code})
              </p>
              <p>
                ⚙️ <strong>Thao tác:</strong> {selectedReg?.operationId?.name}
              </p>
              <p>
                📦 <strong>Sản lượng:</strong> {selectedReg?.expectedQuantity}
              </p>
            </div>
            <div className="space-y-1.5">
              <Label>Công nhân mới *</Label>
              <Select value={reassignUserId} onValueChange={setReassignUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn người thay thế..." />
                </SelectTrigger>
                <SelectContent>
                  {users
                    .filter(
                      (u) =>
                        u.role === "worker" &&
                        u._id !== selectedReg?.userId?._id,
                    )
                    .map((u) => (
                      <SelectItem key={u._id} value={u._id}>
                        {u.code} - {u.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-slate-500 italic">
              * Hệ thống sẽ tính toán sản lượng còn lại và gán cho công nhân
              mới. Công nhân cũ sẽ bị dừng thao tác này.
            </p>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setReassignOpen(false)}>
              Hủy
            </Button>
            <Button
              onClick={handleReassign}
              disabled={reassignMutation.isPending || !reassignUserId}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {reassignMutation.isPending && (
                <Loader2 className="w-4 h-4 animate-spin mr-1" />
              )}
              Xác nhận thay thế
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
