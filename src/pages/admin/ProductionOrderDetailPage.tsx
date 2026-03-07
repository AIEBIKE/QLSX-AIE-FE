import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import dayjs from "dayjs";
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
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignLoading, setAssignLoading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [operations, setOperations] = useState<any[]>([]);
  const [compCheck, setCompCheck] = useState<any>(null);
  const [forceOpen, setForceOpen] = useState(false);
  const [forceMsg, setForceMsg] = useState("");
  const [reassignOpen, setReassignOpen] = useState(false);
  const [selectedReg, setSelectedReg] = useState<any>(null);
  const [reassignUserId, setReassignUserId] = useState("");
  const [reassignLoading, setReassignLoading] = useState(false);
  const [assignForm, setAssignForm] = useState({
    userId: "",
    operationId: "",
    expectedQuantity: 1,
    replacementReason: "",
  });

  const loadData = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [oRes, pRes] = await Promise.all([
        api.getProductionOrder(id),
        api.getOrderProgress(id),
      ]);
      setOrder(oRes.data.data);
      const progressData = pRes.data.data as any;
      setProgress(progressData.progress);
      setRegistrations(progressData.registrations || []);
      setSummary(progressData.summary);
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
    if (!id) return;
    try {
      const res = await api.checkOrderCompletion(id);
      const checkData = res.data.data as any;
      setCompCheck(checkData);
      checkData.canComplete
        ? toast.success("Có thể hoàn thành!")
        : toast.warning(
            `Còn ${checkData.incompleteProcesses.length} công đoạn chưa xong`,
          );
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleComplete = async () => {
    if (!id) return;
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
    if (!id) return;
    await api.completeOrder(id, { forceComplete: true });
    toast.success("Đã ép hoàn thành!");
    setForceOpen(false);
    loadData();
  };

  const handleAssign = async () => {
    if (!id) return;
    try {
      setAssignLoading(true);
      await api.assignWorkerToOrder(id, {
        ...(assignForm as any),
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

  const handleReassign = async () => {
    if (!selectedReg || !reassignUserId) return;
    try {
      setReassignLoading(true);
      await api.reassignRegistration(selectedReg._id, {
        newUserId: reassignUserId,
        note: "Thay thế do nghỉ đột xuất",
      });
      toast.success("Đã thay thế công nhân!");
      setReassignOpen(false);
      setSelectedReg(null);
      setReassignUserId("");
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || "Lỗi khi thay thế");
    } finally {
      setReassignLoading(false);
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
                <h2 className="text-2xl font-bold">Lệnh #{order?.orderCode}</h2>
                <Badge
                  variant="outline"
                  className={statusMap[order?.status]?.cls || ""}
                >
                  {statusMap[order?.status]?.label || order?.status}
                </Badge>
              </div>
              <p className="text-sm text-slate-500">
                {order?.vehicleTypeId?.name} • {order?.vehicleTypeId?.code}
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
                        <Button variant="ghost" size="icon" className="h-8 w-8">
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
            <div className="flex gap-3 mt-5 pt-5 border-t">
              <Button variant="outline" onClick={loadData}>
                <RefreshCw className="w-4 h-4 mr-1" /> Làm mới
              </Button>
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
                  registrations.map((reg) => (
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
                              loadUsersOps();
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
              disabled={reassignLoading || !reassignUserId}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {reassignLoading && (
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
