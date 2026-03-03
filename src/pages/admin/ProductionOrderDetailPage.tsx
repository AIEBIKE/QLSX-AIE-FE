import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import dayjs from "dayjs";
import {
  CheckCircle,
  UserPlus,
  Clock,
  AlertCircle,
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
import * as api from "../../services/api";

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
  registered: { cls: "bg-cyan-100 text-cyan-700", label: "Đăng ký" },
  pending: { cls: "bg-slate-100 text-slate-600", label: "Chờ" },
  in_progress: { cls: "bg-blue-100 text-blue-700", label: "Đang thực hiện" },
  completed: { cls: "bg-emerald-100 text-emerald-700", label: "Hoàn thành" },
};

export default function ProductionOrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<any>(null);
  const [progress, setProgress] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignLoading, setAssignLoading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [operations, setOperations] = useState<any[]>([]);
  const [compCheck, setCompCheck] = useState<any>(null);
  const [forceOpen, setForceOpen] = useState(false);
  const [forceMsg, setForceMsg] = useState("");
  const [detailProcess, setDetailProcess] = useState<any>(null);
  const [assignForm, setAssignForm] = useState({
    userId: "",
    operationId: "",
    expectedQuantity: 1,
    replacementReason: "",
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [oRes, pRes] = await Promise.all([
        api.getProductionOrder(id),
        api.getOrderProgress(id),
      ]);
      setOrder(oRes.data.data);
      setProgress(pRes.data.data.progress);
      setSummary(pRes.data.data.summary);
    } catch (e: any) {
      toast.error("Lỗi tải dữ liệu: " + e.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const loadUsersOps = async () => {
    try {
      const [uR, oR] = await Promise.all([api.getUsers(), api.getOperations()]);
      setUsers(uR.data.data);
      setOperations(oR.data.data);
    } catch (e: any) {
      toast.error("Lỗi: " + e.message);
    }
  };

  const handleCheckCompletion = async () => {
    try {
      const res = await api.checkOrderCompletion(id);
      setCompCheck(res.data.data);
      res.data.data.canComplete
        ? toast.success("Có thể hoàn thành!")
        : toast.warning(
            `Còn ${res.data.data.incompleteProcesses.length} công đoạn chưa xong`,
          );
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleComplete = async () => {
    try {
      await api.completeOrder(id, { forceComplete: false });
      toast.success("Đã hoàn thành!");
      loadData();
    } catch (e: any) {
      if (e.response?.data?.error?.code === "INCOMPLETE_PROCESSES") {
        setForceMsg(e.response.data.error.message);
        setForceOpen(true);
      } else toast.error(e.response?.data?.error?.message || e.message);
    }
  };

  const handleForce = async () => {
    await api.completeOrder(id, { forceComplete: true });
    toast.success("Đã ép hoàn thành!");
    setForceOpen(false);
    loadData();
  };

  const handleAssign = async () => {
    try {
      setAssignLoading(true);
      await api.assignWorkerToOrder(id, {
        ...assignForm,
        expectedQuantity: Number(assignForm.expectedQuantity),
      });
      toast.success("Đã bổ sung!");
      setAssignOpen(false);
      setAssignForm({
        userId: "",
        operationId: "",
        expectedQuantity: 1,
        replacementReason: "",
      });
      loadData();
    } catch (e: any) {
      toast.error(e.response?.data?.error?.message || e.message);
    } finally {
      setAssignLoading(false);
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );

  const totalW = progress.reduce((s, p) => s + p.workers.length, 0);
  const done = progress.reduce((s, p) => s + p.completed, 0);
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
                <h2 className="text-lg sm:text-2xl font-bold">
                  Lệnh #{order?.orderCode}
                </h2>
                <Badge
                  variant="outline"
                  className={statusMap[order?.status]?.cls || ""}
                >
                  {statusMap[order?.status]?.label || order?.status}
                </Badge>
              </div>
              <p className="text-sm text-slate-500">
                {order?.vehicleTypeId?.name} • {order?.vehicleTypeId?.code}
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

      {/* Process Table */}
      <Card className="border-slate-200">
        <CardContent className="pt-6">
          <div className="flex justify-between items-center mb-5 flex-wrap gap-3">
            <h3 className="text-lg font-bold">Tiến độ công đoạn</h3>
            {order?.status === "in_progress" && (
              <Button
                onClick={() => {
                  loadUsersOps();
                  setAssignOpen(true);
                }}
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
          {/* Mobile: Card layout */}
          <div className="md:hidden space-y-3">
            {progress.map((r) => {
              const ic = getIconColor(r.processName);
              const st = statusMap[r.status] || { cls: "", label: r.status };
              return (
                <div
                  key={r.processId}
                  className="border border-slate-200 rounded-lg p-3 space-y-2.5"
                  onClick={() => setDetailProcess(r)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-9 h-9 rounded-lg ${ic.bg} ${ic.text} flex items-center justify-center shrink-0`}
                      >
                        {getProcessIcon(r.processName)}
                      </div>
                      <div>
                        <div className="font-semibold text-sm">
                          {r.processName}
                        </div>
                        <span className="text-xs text-slate-400">
                          Bước {r.order}
                        </span>
                      </div>
                    </div>
                    <Badge variant="outline" className={st.cls}>
                      {st.label}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${r.status === "completed" ? "bg-emerald-500" : "bg-[#0077c0]"}`}
                        style={{ width: `${Math.min(r.percentage, 100)}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold min-w-[45px] text-right">
                      {r.percentage}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>
                      {r.completed}/{r.required} SP
                    </span>
                    <div className="flex items-center gap-1.5">
                      {r.workers.length === 0 ? (
                        <span className="text-slate-400">Chưa phân công</span>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <Avatar className="h-5 w-5">
                            <AvatarFallback className="bg-[#0077c0] text-white text-[10px]">
                              {r.workers[0]?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <span>{r.workers[0]}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop: Table layout */}
          <div className="hidden md:block overflow-x-auto">
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
                {progress.map((r) => {
                  const ic = getIconColor(r.processName);
                  const st = statusMap[r.status] || {
                    cls: "",
                    label: r.status,
                  };
                  return (
                    <tr
                      key={r.processId}
                      className="border-b border-slate-100 hover:bg-slate-50"
                    >
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-lg ${ic.bg} ${ic.text} flex items-center justify-center`}
                          >
                            {getProcessIcon(r.processName)}
                          </div>
                          <div>
                            <div className="font-semibold">{r.processName}</div>
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
                          className="h-8 w-8"
                          onClick={() => setDetailProcess(r)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {order?.status === "in_progress" && (
            <div className="flex flex-wrap gap-3 mt-5 pt-5 border-t">
              <Button variant="outline" size="sm" onClick={loadData}>
                <RefreshCw className="w-4 h-4 mr-1" /> Làm mới
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCheckCompletion}
              >
                <AlertTriangle className="w-4 h-4 mr-1" /> Kiểm tra
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    size="sm"
                    className="bg-emerald-500 hover:bg-emerald-600"
                  >
                    <CheckCircle className="w-4 h-4 mr-1" /> Hoàn thành
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Xác nhận hoàn thành?</AlertDialogTitle>
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
            </div>
          )}
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
                onValueChange={(v) =>
                  setAssignForm({ ...assignForm, operationId: v })
                }
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
              <Label>Số lượng *</Label>
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
            </div>
            <div className="space-y-1.5">
              <Label>Lý do</Label>
              <textarea
                className="w-full border rounded-md p-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#0077c0]/20"
                rows={2}
                value={assignForm.replacementReason}
                onChange={(e) =>
                  setAssignForm({
                    ...assignForm,
                    replacementReason: e.target.value,
                  })
                }
                placeholder="VD: Nghỉ ốm..."
              />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setAssignOpen(false)}>
              Hủy
            </Button>
            <Button
              onClick={handleAssign}
              disabled={assignLoading}
              className="bg-[#0077c0] hover:bg-[#005fa3]"
            >
              {assignLoading && (
                <Loader2 className="w-4 h-4 animate-spin mr-1" />
              )}
              Bổ sung
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Process Detail Dialog */}
      <Dialog
        open={!!detailProcess}
        onOpenChange={(o) => {
          if (!o) setDetailProcess(null);
        }}
      >
        <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Chi tiết: {detailProcess?.processName}
              <Badge
                variant="outline"
                className={statusMap[detailProcess?.status]?.cls || ""}
              >
                {statusMap[detailProcess?.status]?.label ||
                  detailProcess?.status}
              </Badge>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div className="flex gap-4 text-sm text-slate-500">
              <span>
                Hoàn thành:{" "}
                <strong className="text-slate-800">
                  {detailProcess?.completed}/{detailProcess?.required}
                </strong>
              </span>
              <span>
                Đăng ký:{" "}
                <strong className="text-slate-800">
                  {detailProcess?.registrations}
                </strong>
              </span>
            </div>
            {detailProcess?.registrationDetails?.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                Chưa có đăng ký nào
              </div>
            ) : (
              <div className="space-y-2">
                {(detailProcess?.registrationDetails || []).map(
                  (reg: any, i: number) => (
                    <div
                      key={reg._id || i}
                      className="border border-slate-200 rounded-lg p-3 space-y-2"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium text-sm">
                            {reg.worker?.code} - {reg.worker?.name}
                          </div>
                          <div className="text-xs text-slate-400">
                            {reg.operation?.name}
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className={
                            statusMap[reg.status]?.cls ||
                            "bg-slate-100 text-slate-600"
                          }
                        >
                          {statusMap[reg.status]?.label || reg.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        <div>
                          <span className="text-slate-400">SL kỳ vọng</span>
                          <div className="font-semibold">
                            {reg.expectedQuantity}
                          </div>
                        </div>
                        <div>
                          <span className="text-slate-400">SL thực tế</span>
                          <div className="font-semibold">
                            {reg.actualQuantity ?? "-"}
                          </div>
                        </div>
                        <div>
                          <span className="text-slate-400">Chênh lệch</span>
                          <div
                            className={`font-semibold ${(reg.deviation || 0) > 0 ? "text-emerald-600" : (reg.deviation || 0) < 0 ? "text-red-500" : ""}`}
                          >
                            {reg.deviation != null
                              ? reg.deviation > 0
                                ? `+${reg.deviation}`
                                : reg.deviation
                              : "-"}
                          </div>
                        </div>
                        <div>
                          <span className="text-slate-400">Thời gian</span>
                          <div className="font-semibold flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {reg.workingMinutes > 0
                              ? `${reg.workingMinutes} phút`
                              : "-"}
                          </div>
                        </div>
                      </div>
                      {(reg.interruptionMinutes > 0 ||
                        reg.interruptionNote) && (
                        <div className="bg-amber-50 border border-amber-200 rounded-md p-2 flex items-start gap-2 text-xs">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                          <div>
                            <span className="font-medium text-amber-700">
                              Gián đoạn: {reg.interruptionMinutes} phút
                            </span>
                            {reg.interruptionNote && (
                              <p className="text-amber-600 mt-0.5">
                                Lý do: {reg.interruptionNote}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                      {(reg.bonusAmount > 0 || reg.penaltyAmount > 0) && (
                        <div className="flex gap-3 text-xs">
                          {reg.bonusAmount > 0 && (
                            <span className="text-emerald-600 font-medium">
                              +
                              {new Intl.NumberFormat("vi-VN").format(
                                reg.bonusAmount,
                              )}
                              đ thưởng
                            </span>
                          )}
                          {reg.penaltyAmount > 0 && (
                            <span className="text-red-500 font-medium">
                              -
                              {new Intl.NumberFormat("vi-VN").format(
                                reg.penaltyAmount,
                              )}
                              đ phạt
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ),
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
