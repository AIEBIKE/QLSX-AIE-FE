import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ClipboardList,
  Plus,
  Calendar,
  Edit2,
  Loader2,
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  Filter,
  RefreshCw,
  CheckCheck,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
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
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as api from "../../services/api";
import dayjs from "dayjs";
import QCCreateForm from "./QCCreateForm";

export default function QCListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [filterDate, setFilterDate] = useState("");
  const [filterOrderId, setFilterOrderId] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [page, setPage] = useState(1);

  const queryParams: Record<string, unknown> = { page, limit: 20 };
  if (filterDate) queryParams.date = filterDate;
  if (filterOrderId !== "all") queryParams.productionOrderId = filterOrderId;
  if (filterStatus !== "all") queryParams.status = filterStatus;

  const { data: qcData, isLoading, refetch } = useQuery({
    queryKey: ["qcList", queryParams],
    queryFn: async () => {
      const res = await api.getQCList(queryParams);
      return res.data;
    },
  });

  const { data: ordersData } = useQuery({
    queryKey: ["productionOrdersForQCFilter"],
    queryFn: async () => {
      const res = await api.getProductionOrders({ limit: 200 });
      return res.data.data;
    },
  });

  // Per-ticket complete
  const completeMutation = useMutation({
    mutationFn: (id: string) => api.completeQC(id),
    onSuccess: () => {
      toast.success("Đã hoàn thành phiếu kiểm duyệt!");
      queryClient.invalidateQueries({ queryKey: ["qcList"] });
    },
    onError: () => toast.error("Lỗi khi hoàn thành phiếu"),
  });

  // Complete all pending
  const completeAllMutation = useMutation({
    mutationFn: () => api.completeAllQC(),
    onSuccess: (res) => {
      const count = res.data?.data?.length || 0;
      toast.success(`Đã hoàn thành ${count} phiếu kiểm duyệt!`);
      queryClient.invalidateQueries({ queryKey: ["qcList"] });
    },
    onError: () => toast.error("Lỗi khi hoàn thành tất cả phiếu"),
  });

  const qcList: any[] = qcData?.data || [];
  const pagination = qcData?.pagination;
  const orders: any[] = ordersData || [];
  const pendingCount = qcList.filter((q) => q.status === "pending").length;

  const handleReset = () => {
    setFilterDate("");
    setFilterOrderId("all");
    setFilterStatus("all");
    setPage(1);
  };

  const getStatusBadge = (status: string) => {
    if (status === "passed") {
      return (
        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 gap-1">
          <CheckCircle className="w-3 h-3" />
          Đạt
        </Badge>
      );
    }
    if (status === "failed") {
      return (
        <Badge className="bg-red-100 text-red-700 border-red-200 gap-1">
          <XCircle className="w-3 h-3" />
          Có lỗi
        </Badge>
      );
    }
    return (
      <Badge className="bg-amber-100 text-amber-700 border-amber-200 gap-1">
        <Clock className="w-3 h-3" />
        Chờ kiểm duyệt
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-[#0077c0]" />
            Phiếu kiểm duyệt QC
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Quản lý và theo dõi phiếu QC của từng xe
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Complete all button */}
          {pendingCount > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  className="gap-2 border-amber-300 text-amber-700 hover:bg-amber-50"
                  disabled={completeAllMutation.isPending}
                >
                  {completeAllMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCheck className="w-4 h-4" />
                  )}
                  Hoàn thành tất cả
                  <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs ml-1">
                    {pendingCount}
                  </Badge>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Hoàn thành tất cả phiếu chờ?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Có <strong>{pendingCount}</strong> phiếu đang chờ kiểm duyệt. Hệ thống sẽ tự
                    động xác nhận kết quả <strong>Đạt / Có lỗi</strong> dựa trên nội dung đã ghi.
                    Thao tác này không thể hoàn tác.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Hủy</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => completeAllMutation.mutate()}
                    className="bg-[#0077c0] hover:bg-[#005f9e]"
                  >
                    Xác nhận hoàn thành tất cả
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <Button
            className="bg-[#0077c0] hover:bg-[#005f9e] gap-2"
            onClick={() => setSheetOpen(true)}
          >
            <Plus className="w-4 h-4" />
            Tạo phiếu mới
          </Button>
        </div>
      </div>

      {/* Filter Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Bộ lọc
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1">
              <Label className="text-xs text-slate-500">Ngày kiểm duyệt</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  type="date"
                  value={filterDate}
                  onChange={(e) => { setFilterDate(e.target.value); setPage(1); }}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-slate-500">Lệnh sản xuất</Label>
              <Select value={filterOrderId} onValueChange={(v) => { setFilterOrderId(v); setPage(1); }}>
                <SelectTrigger><SelectValue placeholder="Tất cả lệnh SX" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả lệnh SX</SelectItem>
                  {orders.map((o: any) => (
                    <SelectItem key={o._id} value={o._id}>{o.orderCode || o.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-slate-500">Trạng thái</Label>
              <Select value={filterStatus} onValueChange={(v) => { setFilterStatus(v); setPage(1); }}>
                <SelectTrigger><SelectValue placeholder="Tất cả" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="pending">⏳ Chờ kiểm duyệt</SelectItem>
                  <SelectItem value="passed">✅ Đạt</SelectItem>
                  <SelectItem value="failed">❌ Có lỗi</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button variant="outline" className="w-full gap-2" onClick={handleReset}>
                <RefreshCw className="w-4 h-4" />
                Đặt lại
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              Danh sách phiếu
              {pagination?.total !== undefined && (
                <span className="ml-2 text-sm font-normal text-slate-500">
                  ({pagination.total} phiếu)
                </span>
              )}
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="animate-spin w-6 h-6 text-slate-400" />
            </div>
          ) : qcList.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Shield className="w-10 h-10 mx-auto mb-3 text-slate-200" />
              <p>Chưa có phiếu kiểm duyệt nào</p>
              <Button variant="outline" className="mt-4" onClick={() => setSheetOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Tạo phiếu đầu tiên
              </Button>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="w-10 text-center">#</TableHead>
                    <TableHead>Số khung</TableHead>
                    <TableHead>Số động cơ</TableHead>
                    <TableHead>Màu xe</TableHead>
                    <TableHead>Lệnh SX</TableHead>
                    <TableHead>Ngày kiểm</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Người kiểm</TableHead>
                    <TableHead className="text-center">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {qcList.map((qc: any, idx: number) => {
                    const order = typeof qc.productionOrderId === "object" ? qc.productionOrderId : null;
                    const inspector = typeof qc.inspectorId === "object" ? qc.inspectorId : null;
                    const failCount = qc.results?.filter((r: any) => r.status === "fail").length;
                    const isPending = qc.status === "pending";
                    return (
                      <TableRow key={qc._id} className="hover:bg-slate-50">
                        <TableCell className="text-center text-slate-400 text-sm">
                          {(page - 1) * 20 + idx + 1}
                        </TableCell>
                        <TableCell className="font-mono font-semibold text-sm">{qc.frameNumber}</TableCell>
                        <TableCell className="font-mono text-sm text-slate-600">{qc.engineNumber || "—"}</TableCell>
                        <TableCell className="text-sm">{qc.color || <span className="text-slate-400">—</span>}</TableCell>
                        <TableCell className="text-sm">{order?.orderCode || order?.name || "—"}</TableCell>
                        <TableCell className="text-sm text-slate-600">
                          {qc.inspectionDate ? dayjs(qc.inspectionDate).format("DD/MM/YYYY") : "—"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            {getStatusBadge(qc.status)}
                            {failCount > 0 && (
                              <span className="text-xs text-red-500">{failCount} lỗi</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-slate-600">{inspector?.name || "—"}</TableCell>
                        <TableCell>
                          <div className="flex justify-center items-center gap-1.5">
                            {isPending && (
                              <Button
                                size="sm"
                                className="gap-1 bg-emerald-600 hover:bg-emerald-700 text-white h-7 px-2 text-xs"
                                disabled={completeMutation.isPending}
                                onClick={() => completeMutation.mutate(qc._id)}
                              >
                                {completeMutation.isPending ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <CheckCircle className="w-3 h-3" />
                                )}
                                Hoàn thành
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1 h-7 px-2 text-xs"
                              onClick={() => navigate(`/admin/qc/${qc._id}/edit`)}
                            >
                              <Edit2 className="w-3 h-3" />
                              Sửa
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
                  <span className="text-sm text-slate-500">
                    Trang {pagination.page}/{pagination.totalPages} ({pagination.total} phiếu)
                  </span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                      ← Trước
                    </Button>
                    <Button variant="outline" size="sm" disabled={page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)}>
                      Sau →
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Create Form Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader className="mb-4">
            <SheetTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-600" />
              Tạo phiếu kiểm duyệt
            </SheetTitle>
            <SheetDescription>
              Lưu phiếu xong sẽ tự chuyển sang xe tiếp theo
            </SheetDescription>
          </SheetHeader>
          <QCCreateForm onSuccess={() => refetch()} />
        </SheetContent>
      </Sheet>
    </div>
  );
}
