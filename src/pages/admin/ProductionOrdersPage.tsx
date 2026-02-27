import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import dayjs from "dayjs";
import {
  Plus,
  Play,
  CheckCircle,
  Trash2,
  Eye,
  Maximize2,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import * as api from "../../services/api";

const statusMap: Record<string, { label: string; className: string }> = {
  pending: {
    label: "Chờ",
    className: "bg-amber-100 text-amber-700 border-amber-200",
  },
  in_progress: {
    label: "Đang thực hiện",
    className: "bg-blue-100 text-blue-700 border-blue-200",
  },
  completed: {
    label: "Hoàn thành",
    className: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
  cancelled: {
    label: "Đã hủy",
    className: "bg-red-100 text-red-700 border-red-200",
  },
};

export default function ProductionOrdersPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [vehicleTypes, setVehicleTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailModal, setDetailModal] = useState<any>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    vehicleTypeId: "",
    quantity: 1,
    startDate: dayjs().format("YYYY-MM-DD"),
    expectedEndDate: "",
    frameNumbers: "",
    engineNumbers: "",
  });

  useEffect(() => {
    loadData();
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const loadData = async () => {
    try {
      const [ordersRes, vtRes] = await Promise.all([
        api.getProductionOrders(),
        api.getVehicleTypes({ active: true }),
      ]);
      setOrders(ordersRes.data.data || []);
      setVehicleTypes(vtRes.data.data || []);
    } catch {
      toast.error("Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const data = {
        ...formData,
        quantity: Number(formData.quantity),
        frameNumbers: formData.frameNumbers
          ? formData.frameNumbers.split("\n").filter(Boolean)
          : [],
        engineNumbers: formData.engineNumbers
          ? formData.engineNumbers.split("\n").filter(Boolean)
          : [],
        expectedEndDate: formData.expectedEndDate || undefined,
      };
      await api.createProductionOrder(data);
      toast.success("Tạo lệnh thành công");
      setModalOpen(false);
      setFormData({
        vehicleTypeId: "",
        quantity: 1,
        startDate: dayjs().format("YYYY-MM-DD"),
        expectedEndDate: "",
        frameNumbers: "",
        engineNumbers: "",
      });
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || "Có lỗi xảy ra");
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await api.updateProductionOrderStatus(id, status);
      toast.success("Cập nhật thành công");
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || "Có lỗi xảy ra");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteProductionOrder(id);
      toast.success("Xóa thành công");
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || "Có lỗi xảy ra");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[300px]">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div>
        <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
          <h2 className="text-xl font-bold text-slate-800">📋 Lệnh Sản Xuất</h2>
          <Button
            onClick={() => setModalOpen(true)}
            className="bg-[#0077c0] hover:bg-[#005fa3]"
          >
            <Plus className="w-4 h-4 mr-1" /> Tạo
          </Button>
        </div>

        {isMobile ? (
          /* Mobile Card View */
          <div className="space-y-3">
            {orders.map((order) => {
              const s = statusMap[order.status] || {
                label: order.status,
                className: "bg-gray-100 text-gray-700",
              };
              return (
                <Card key={order._id} className="border-slate-200">
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="font-bold text-base">
                          {order.orderCode}
                        </span>
                        <div className="text-sm text-slate-600">
                          {order.vehicleTypeId?.code} -{" "}
                          {order.vehicleTypeId?.name}
                        </div>
                      </div>
                      <Badge variant="outline" className={s.className}>
                        {s.label}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                      <div>
                        <span className="text-slate-500">SL:</span>{" "}
                        <strong>{order.quantity}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500">Bắt đầu:</span>{" "}
                        {dayjs(order.startDate).format("DD/MM")}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-100">
                      {order.status === "pending" && (
                        <Button
                          size="sm"
                          className="bg-[#0077c0] hover:bg-[#005fa3]"
                          onClick={() =>
                            handleStatusChange(order._id, "in_progress")
                          }
                        >
                          <Play className="w-3.5 h-3.5 mr-1" /> Bắt đầu
                        </Button>
                      )}
                      {order.status === "in_progress" && (
                        <Button
                          size="sm"
                          className="bg-emerald-500 hover:bg-emerald-600"
                          onClick={() =>
                            handleStatusChange(order._id, "completed")
                          }
                        >
                          <CheckCircle className="w-3.5 h-3.5 mr-1" /> Hoàn
                          thành
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setDetailModal(order)}
                      >
                        <Maximize2 className="w-3.5 h-3.5 mr-1" /> Chi tiết
                      </Button>
                      {order.status !== "in_progress" &&
                        order.status !== "completed" && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-red-500"
                              >
                                <Trash2 className="w-3.5 h-3.5 mr-1" /> Xóa
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Xóa lệnh sản xuất này?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Hành động không thể hoàn tác
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Hủy</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(order._id)}
                                  className="bg-red-500 hover:bg-red-600"
                                >
                                  Xóa
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          /* Desktop Table View */
          <Card className="border-slate-200">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã lệnh</TableHead>
                  <TableHead>Loại xe</TableHead>
                  <TableHead className="text-center w-[60px]">SL</TableHead>
                  <TableHead className="w-[80px]">Ngày</TableHead>
                  <TableHead className="w-[130px]">Trạng thái</TableHead>
                  <TableHead className="w-[140px] text-right">
                    Thao tác
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => {
                  const s = statusMap[order.status] || {
                    label: order.status,
                    className: "bg-gray-100 text-gray-700",
                  };
                  return (
                    <TableRow key={order._id}>
                      <TableCell className="font-bold">
                        {order.orderCode}
                      </TableCell>
                      <TableCell>
                        {order.vehicleTypeId ? order.vehicleTypeId.code : "-"}
                      </TableCell>
                      <TableCell className="text-center">
                        {order.quantity}
                      </TableCell>
                      <TableCell>
                        {dayjs(order.startDate).format("DD/MM")}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={s.className}>
                          {s.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
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
                          {order.status === "pending" && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="icon"
                                  className="h-8 w-8 bg-[#0077c0] hover:bg-[#005fa3]"
                                  onClick={() =>
                                    handleStatusChange(order._id, "in_progress")
                                  }
                                >
                                  <Play className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Bắt đầu</TooltipContent>
                            </Tooltip>
                          )}
                          {order.status === "in_progress" && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="icon"
                                  className="h-8 w-8 bg-emerald-500 hover:bg-emerald-600"
                                  onClick={() =>
                                    handleStatusChange(order._id, "completed")
                                  }
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Hoàn thành</TooltipContent>
                            </Tooltip>
                          )}
                          {order.status !== "in_progress" &&
                            order.status !== "completed" && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 text-red-500"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      Xóa lệnh này?
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Hành động không thể hoàn tác
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Hủy</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDelete(order._id)}
                                      className="bg-red-500 hover:bg-red-600"
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
                })}
              </TableBody>
            </Table>
          </Card>
        )}

        {/* Detail Modal */}
        <Dialog
          open={!!detailModal}
          onOpenChange={(open) => {
            if (!open) setDetailModal(null);
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Chi tiết: {detailModal?.orderCode}</DialogTitle>
            </DialogHeader>
            {detailModal && (
              <div className="space-y-3 mt-2">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-slate-500">Loại xe:</span>{" "}
                    <span className="font-semibold">
                      {detailModal.vehicleTypeId?.name}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">Số lượng:</span>{" "}
                    <span className="font-semibold">
                      {detailModal.quantity}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">Bắt đầu:</span>{" "}
                    {dayjs(detailModal.startDate).format("DD/MM/YYYY")}
                  </div>
                  <div>
                    <span className="text-slate-500">Dự kiến:</span>{" "}
                    {detailModal.expectedEndDate
                      ? dayjs(detailModal.expectedEndDate).format("DD/MM/YYYY")
                      : "-"}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">
                    Số khung ({detailModal.frameNumbers?.length || 0}):
                  </p>
                  <p className="font-mono text-xs bg-slate-50 p-2 rounded">
                    {detailModal.frameNumbers?.join(", ") || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">
                    Số động cơ ({detailModal.engineNumbers?.length || 0}):
                  </p>
                  <p className="font-mono text-xs bg-slate-50 p-2 rounded">
                    {detailModal.engineNumbers?.join(", ") || "-"}
                  </p>
                </div>
                {detailModal.note && (
                  <div>
                    <span className="text-sm text-slate-500">Ghi chú:</span>{" "}
                    <span className="text-sm">{detailModal.note}</span>
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setDetailModal(null)}>
                Đóng
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create Modal */}
        <Dialog
          open={modalOpen}
          onOpenChange={(open) => {
            if (!open) setModalOpen(false);
          }}
        >
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Tạo Lệnh Sản Xuất</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="space-y-1.5">
                <Label>Loại xe *</Label>
                <Select
                  value={formData.vehicleTypeId}
                  onValueChange={(v) =>
                    setFormData({ ...formData, vehicleTypeId: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="-- Chọn --" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicleTypes.map((vt) => (
                      <SelectItem key={vt._id} value={vt._id}>
                        {vt.code} - {vt.name}
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
                  value={formData.quantity}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      quantity: parseInt(e.target.value) || 1,
                    })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Ngày bắt đầu *</Label>
                  <Input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Dự kiến</Label>
                  <Input
                    type="date"
                    value={formData.expectedEndDate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        expectedEndDate: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Số khung (mỗi dòng 1 số)</Label>
                <textarea
                  className="w-full border border-slate-200 rounded-md p-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#0077c0]/20 focus:border-[#0077c0]"
                  rows={2}
                  value={formData.frameNumbers}
                  onChange={(e) =>
                    setFormData({ ...formData, frameNumbers: e.target.value })
                  }
                  placeholder={"XDD-A1-001\nXDD-A1-002"}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Số động cơ (mỗi dòng 1 số)</Label>
                <textarea
                  className="w-full border border-slate-200 rounded-md p-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#0077c0]/20 focus:border-[#0077c0]"
                  rows={2}
                  value={formData.engineNumbers}
                  onChange={(e) =>
                    setFormData({ ...formData, engineNumbers: e.target.value })
                  }
                  placeholder={"DC-A1-001\nDC-A1-002"}
                />
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
                Tạo
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
