import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Maximize2, Trash2, Eye, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import * as api from "@/services/api";
import Cookies from "js-cookie";
import dayjs from "dayjs";
import { Pagination } from "@/components/shared/Pagination";

const statusMap: Record<string, { label: string; className: string }> = {
  active: {
    label: "Đang sản xuất",
    className: "bg-blue-100 text-blue-700 border-blue-200",
  },
  completed: {
    label: "Hoàn thành",
    className: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
  paused: {
    label: "Tạm dừng",
    className: "bg-amber-100 text-amber-700 border-amber-200",
  },
  cancelled: {
    label: "Đã hủy",
    className: "bg-red-100 text-red-700 border-red-200",
  },
  draft: {
    label: "Nháp",
    className: "bg-slate-100 text-slate-700 border-slate-200",
  },
};

export default function ProductionOrdersPage() {
  const navigate = useNavigate();
  const user = JSON.parse(
    localStorage.getItem("user") || Cookies.get("user") || "{}",
  );
  const roleCode = (user.roleCode || user.role || "").toUpperCase();
  const isAdmin = roleCode === "ADMIN";
  const isFacManager = roleCode === "FAC_MANAGER";
  const isSupervisor = roleCode === "SUPERVISOR";
  const canEdit = isFacManager; // Only Factory Manager can CRUD orders
  const canView = isAdmin || isFacManager || isSupervisor;

  const [orders, setOrders] = useState<any[]>([]);
  const [vehicleTypes, setVehicleTypes] = useState<any[]>([]);
  const [factories, setFactories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [selectedFactory, setSelectedFactory] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  const [formData, setFormData] = useState({
    vehicleTypeId: "",
    factoryId: user.factoryId || "",
    quantity: 1,
    startDate: dayjs().format("YYYY-MM-DD"),
    expectedEndDate: "",
    note: "",
    frameNumbers: "",
    engineNumbers: "",
    frameNumberPrefix: "",
    engineNumberPrefix: "",
  });

  useEffect(() => {
    loadData();
  }, [selectedFactory, pagination.page, pagination.limit]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ordersRes, vtRes, fRes] = await Promise.all([
        api.getProductionOrders({
          factoryId: selectedFactory !== "all" ? selectedFactory : undefined,
          page: pagination.page,
          limit: pagination.limit,
          search: searchTerm || undefined,
        }),
        api.getVehicleTypes({ active: true, limit: 100 }),
        isAdmin ? api.getFactories() : Promise.resolve({ data: { data: [] } }),
      ]);

      setOrders(ordersRes.data.data || []);
      if (ordersRes.data.pagination) {
        setPagination((prev) => ({
          ...prev,
          total: ordersRes.data.pagination.total,
          totalPages: ordersRes.data.pagination.totalPages,
        }));
      }
      setVehicleTypes(vtRes.data.data || []);
      if (isAdmin) setFactories((fRes as any).data.data || []);
    } catch {
      toast.error("Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    loadData();
  };

  const handleSubmit = async () => {
    try {
      const data: any = {
        ...formData,
        frameNumbers: formData.frameNumbers
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
        engineNumbers: formData.engineNumbers
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
      };
      // Gửi prefix nếu có (backend sẽ tự sinh)
      if (formData.frameNumberPrefix)
        data.frameNumberPrefix = formData.frameNumberPrefix;
      if (formData.engineNumberPrefix)
        data.engineNumberPrefix = formData.engineNumberPrefix;
      await api.createProductionOrder(data as any);
      toast.success("Tạo lệnh thành công");
      setModalOpen(false);
      resetForm();
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || "Lỗi tạo lệnh");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteProductionOrder(id);
      toast.success("Xóa thành công");
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || "Lỗi khi xóa");
    }
  };

  const resetForm = () => {
    setFormData({
      vehicleTypeId: "",
      factoryId: user.factoryId || "",
      quantity: 1,
      startDate: dayjs().format("YYYY-MM-DD"),
      expectedEndDate: "",
      note: "",
      frameNumbers: "",
      engineNumbers: "",
      frameNumberPrefix: "",
      engineNumberPrefix: "",
    });
  };

  return (
    <TooltipProvider>
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <div className="flex items-center gap-4 flex-wrap flex-1">
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">
            📋 Lệnh Sản Xuất
          </h2>

          <form
            onSubmit={handleSearch}
            className="flex gap-2 min-w-[200px] flex-1 max-w-sm"
          >
            <Input
              placeholder="Tìm mã lệnh..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-9 shadow-sm"
            />
            <Button type="submit" variant="secondary" size="sm" className="h-9">
              Tìm
            </Button>
          </form>

          {isAdmin && (
            <div className="flex items-center gap-2 min-w-[200px]">
              <span className="text-sm font-medium text-slate-500 whitespace-nowrap">
                Nhà máy:
              </span>
              <Select
                value={selectedFactory}
                onValueChange={setSelectedFactory}
              >
                <SelectTrigger className="w-[180px] h-9 shadow-sm">
                  <SelectValue placeholder="Tất cả nhà máy" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả nhà máy</SelectItem>
                  {factories.map((f) => (
                    <SelectItem key={f._id} value={f._id}>
                      {f.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        {canEdit && (
          <Button
            onClick={() => {
              resetForm();
              setModalOpen(true);
            }}
            className="bg-primary hover:bg-primary/90 text-white"
          >
            <Plus className="mr-2 h-4 w-4" />
            Tạo lệnh mới
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-[#0077c0]" />
        </div>
      ) : (
        <>
          {isMobile ? (
            <div className="space-y-4">
              {orders.length === 0 ? (
                <Card className="p-8 text-center border-dashed border-2 border-slate-200">
                  <p className="text-slate-500">Chưa có lệnh sản xuất nào</p>
                </Card>
              ) : (
                orders.map((order) => {
                  const status = statusMap[order.status] || {
                    label: order.status,
                    className: "bg-slate-100",
                  };
                  return (
                    <Card
                      key={order._id}
                      className="border-slate-200 hover:shadow-md transition-shadow cursor-pointer overflow-hidden group"
                      onClick={() =>
                        navigate(`/admin/production-orders/${order._id}`)
                      }
                    >
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="font-bold text-slate-800 text-lg group-hover:text-[#0077c0] transition-colors">
                              {order.orderCode}
                            </div>
                            <div className="text-sm font-medium text-slate-600 mt-0.5">
                              {order.vehicleTypeId?.name}
                            </div>
                            <div className="text-xs text-slate-400 mt-0.5">
                              🏭 {order.factoryId?.name || "—"}
                            </div>
                          </div>
                          <Badge
                            variant="outline"
                            className={`${status.className} border shadow-sm`}
                          >
                            {status.label}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-3 mt-4 text-sm bg-slate-50 p-3 rounded-lg border border-slate-100">
                          <div>
                            <div className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">
                              Số lượng
                            </div>
                            <div className="font-bold text-slate-700">
                              {order.quantity} xe
                            </div>
                          </div>
                          <div>
                            <div className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">
                              Bắt đầu
                            </div>
                            <div className="font-semibold text-slate-600">
                              {dayjs(order.startDate).format("DD/MM/YYYY")}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          ) : (
            <Card className="border-slate-200 shadow-sm overflow-hidden bg-white">
              <Table>
                <TableHeader className="bg-slate-50/80 border-b border-slate-200">
                  <TableRow>
                    <TableHead className="font-bold text-slate-700 w-[140px]">
                      Mã lệnh
                    </TableHead>
                    <TableHead className="font-bold text-slate-700">
                      Loại xe
                    </TableHead>
                    <TableHead className="font-bold text-slate-700">
                      Nhà máy
                    </TableHead>
                    <TableHead className="font-bold text-slate-700 text-center">
                      Số lượng
                    </TableHead>
                    <TableHead className="font-bold text-slate-700">
                      Trạng thái
                    </TableHead>
                    <TableHead className="font-bold text-slate-700">
                      Ngày bắt đầu
                    </TableHead>
                    <TableHead className="font-bold text-slate-700 text-right w-[120px]">
                      Thao tác
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center py-16 text-slate-400"
                      >
                        <div className="flex flex-col items-center">
                          <Maximize2 className="w-12 h-12 mb-2 opacity-20" />
                          <p>Chưa có lệnh sản xuất nào trong danh sách</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    orders.map((order) => {
                      const status = statusMap[order.status] || {
                        label: order.status,
                        className: "bg-slate-100",
                      };
                      return (
                        <TableRow
                          key={order._id}
                          className="hover:bg-slate-50/50 transition-colors group"
                        >
                          <TableCell className="font-bold text-slate-900 font-mono">
                            {order.orderCode}
                          </TableCell>
                          <TableCell>
                            <div className="font-medium text-slate-700">
                              {order.vehicleTypeId?.name}
                            </div>
                            <div className="text-xs text-slate-400 font-mono">
                              {order.vehicleTypeId?.code}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-slate-600">
                              {order.factoryId?.name || "—"}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant="secondary"
                              className="font-bold text-slate-700 bg-slate-100 px-2.5"
                            >
                              {order.quantity}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`${status.className} border shadow-sm font-medium`}
                            >
                              {status.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-slate-600">
                            {dayjs(order.startDate).format("DD/MM/YYYY")}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-[#0077c0] hover:bg-blue-50"
                                    onClick={() =>
                                      navigate(
                                        `/admin/production-orders/${order._id}`,
                                      )
                                    }
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Xem chi tiết</TooltipContent>
                              </Tooltip>

                              {canEdit && order.status === "pending" && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-red-500 hover:bg-red-50"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>
                                        Xóa lệnh sản xuất?
                                      </AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Bạn có chắc chắn muốn xóa lệnh{" "}
                                        <span className="font-bold">
                                          {order.orderCode}
                                        </span>
                                        ?
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Hủy</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleDelete(order._id)}
                                        className="bg-red-600 hover:bg-red-700"
                                      >
                                        Xóa
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </Card>
          )}

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
        </>
      )}

      {/* Create Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-800">
              Tạo Lệnh Sản Xuất Mới
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-5 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Loại xe *</Label>
                <Select
                  value={formData.vehicleTypeId}
                  onValueChange={(v) =>
                    setFormData({ ...formData, vehicleTypeId: v })
                  }
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Chọn loại xe" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicleTypes.map((vt) => (
                      <SelectItem key={vt._id} value={vt._id}>
                        {vt.name} ({vt.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {isAdmin && (
                <div className="space-y-2">
                  <Label>Nhà máy *</Label>
                  <Select
                    value={formData.factoryId}
                    onValueChange={(v) =>
                      setFormData({ ...formData, factoryId: v })
                    }
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Chọn nhà máy" />
                    </SelectTrigger>
                    <SelectContent>
                      {factories.map((f) => (
                        <SelectItem key={f._id} value={f._id}>
                          {f.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Số lượng *</Label>
                <Input
                  type="number"
                  min={1}
                  value={formData.quantity}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      quantity: parseInt(e.target.value) || 1,
                    })
                  }
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label>Ngày bắt đầu *</Label>
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                  className="h-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Dự kiến kết thúc</Label>
              <Input
                type="date"
                value={formData.expectedEndDate}
                onChange={(e) =>
                  setFormData({ ...formData, expectedEndDate: e.target.value })
                }
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <Label>Prefix số khung (tự sinh)</Label>
              <div className="flex gap-2">
                <Input
                  value={formData.frameNumberPrefix}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      frameNumberPrefix: e.target.value,
                    })
                  }
                  placeholder="VD: XDD"
                  className="h-10 flex-1"
                />
                <span className="text-xs text-slate-400 self-center whitespace-nowrap">
                  {formData.frameNumberPrefix && formData.quantity > 0
                    ? `→ ${formData.frameNumberPrefix}-001 ... ${formData.frameNumberPrefix}-${String(formData.quantity).padStart(3, "0")}`
                    : "Hoặc nhập thủ công bên dưới"}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Danh sách số khung (Mỗi số 1 dòng)</Label>
              <textarea
                className="w-full min-h-[80px] border border-slate-200 rounded-md p-3 text-sm font-mono resize-none focus:ring-2 focus:ring-[#0077c0]/20 transition-all"
                value={formData.frameNumbers}
                onChange={(e) =>
                  setFormData({ ...formData, frameNumbers: e.target.value })
                }
                placeholder={
                  formData.frameNumberPrefix
                    ? "Tự động sinh từ prefix..."
                    : "VD:\nXDD-001\nXDD-002"
                }
                disabled={!!formData.frameNumberPrefix}
              />
            </div>

            <div className="space-y-2">
              <Label>Prefix số máy (tự sinh)</Label>
              <div className="flex gap-2">
                <Input
                  value={formData.engineNumberPrefix}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      engineNumberPrefix: e.target.value,
                    })
                  }
                  placeholder="VD: MS"
                  className="h-10 flex-1"
                />
                <span className="text-xs text-slate-400 self-center whitespace-nowrap">
                  {formData.engineNumberPrefix && formData.quantity > 0
                    ? `→ ${formData.engineNumberPrefix}-001 ... ${formData.engineNumberPrefix}-${String(formData.quantity).padStart(3, "0")}`
                    : "Hoặc nhập thủ công bên dưới"}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Danh sách số máy (Mỗi số 1 dòng)</Label>
              <textarea
                className="w-full min-h-[80px] border border-slate-200 rounded-md p-3 text-sm font-mono resize-none focus:ring-2 focus:ring-[#0077c0]/20 transition-all"
                value={formData.engineNumbers}
                onChange={(e) =>
                  setFormData({ ...formData, engineNumbers: e.target.value })
                }
                placeholder={
                  formData.engineNumberPrefix
                    ? "Tự động sinh từ prefix..."
                    : "VD:\nMS-001\nMS-002"
                }
                disabled={!!formData.engineNumberPrefix}
              />
            </div>

            <div className="space-y-2">
              <Label>Ghi chú</Label>
              <Input
                value={formData.note}
                onChange={(e) =>
                  setFormData({ ...formData, note: e.target.value })
                }
                placeholder="Thêm thông tin bổ sung nếu cần..."
                className="h-10"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Hủy
            </Button>
            <Button
              onClick={handleSubmit}
              className="bg-[#0077c0] hover:bg-[#005fa3]"
            >
              Tạo Lệnh
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
