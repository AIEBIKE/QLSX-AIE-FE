import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Plus,
  Settings,
  Trash2,
  Clock,
  Users,
  Wrench,
  Star,
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/lib/useIsMobile";
import * as api from "../../services/api";

export default function ProcessManagementPage() {
  const [vehicleTypes, setVehicleTypes] = useState<any[]>([]);
  const [selectedVehicleType, setSelectedVehicleType] = useState<any>(null);
  const [processes, setProcesses] = useState<any[]>([]);
  const [operations, setOperations] = useState<any[]>([]);
  const [selectedProcess, setSelectedProcess] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);

  // Modal states
  const [processModalOpen, setProcessModalOpen] = useState(false);
  const [operationModalOpen, setOperationModalOpen] = useState(false);
  const [editingProcess, setEditingProcess] = useState<any>(null);
  const [editingOperation, setEditingOperation] = useState<any>(null);

  // Process form
  const [processForm, setProcessForm] = useState({
    name: "",
    code: "",
    order: 1,
    description: "",
  });
  // Operation form
  const [opForm, setOpForm] = useState({
    name: "",
    code: "",
    difficulty: 3,
    maxWorkers: 1,
    allowTeamwork: false,
    standardQuantity: "",
    standardMinutes: "",
    instructions: "",
  });

  useEffect(() => {
    loadVehicleTypes();
  }, []);
  useEffect(() => {
    if (selectedVehicleType) {
      loadProcesses();
      setSelectedProcess(null);
      setOperations([]);
    }
  }, [selectedVehicleType]);
  useEffect(() => {
    if (selectedProcess) {
      loadOperations();
    }
  }, [selectedProcess]);

  const loadVehicleTypes = async () => {
    try {
      const res = await api.getVehicleTypes({ active: true });
      const types = res.data.data || [];
      setVehicleTypes(types);
      if (types.length > 0) setSelectedVehicleType(types[0]);
    } catch {
      toast.error("Lỗi tải loại xe");
    } finally {
      setLoading(false);
    }
  };

  const loadProcesses = async () => {
    try {
      const res = await api.getProcesses({
        vehicleTypeId: selectedVehicleType._id,
      });
      const procs = res.data.data || [];
      setProcesses(procs);
      if (procs.length > 0 && !selectedProcess) setSelectedProcess(procs[0]);
    } catch {
      toast.error("Lỗi tải công đoạn");
    }
  };

  const loadOperations = async () => {
    try {
      const res = await api.getOperations({ processId: selectedProcess._id });
      setOperations(res.data.data || []);
    } catch {
      toast.error("Lỗi tải thao tác");
    }
  };

  // Process CRUD
  const handleProcessSubmit = async () => {
    try {
      const data = {
        ...processForm,
        order: Number(processForm.order),
        vehicleTypeId: selectedVehicleType._id,
      };
      if (editingProcess) {
        await api.updateProcess(editingProcess._id, data);
        toast.success("Cập nhật công đoạn thành công");
      } else {
        await api.createProcess(data);
        toast.success("Thêm công đoạn thành công");
      }
      setProcessModalOpen(false);
      setEditingProcess(null);
      loadProcesses();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || "Có lỗi xảy ra");
    }
  };

  const handleDeleteProcess = async (id: string) => {
    try {
      await api.deleteProcess(id);
      toast.success("Xóa công đoạn thành công");
      loadProcesses();
      if (selectedProcess?._id === id) {
        setSelectedProcess(null);
        setOperations([]);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || "Có lỗi xảy ra");
    }
  };

  // Operation CRUD
  const handleOperationSubmit = async () => {
    try {
      const data = {
        ...opForm,
        difficulty: Number(opForm.difficulty),
        maxWorkers: Number(opForm.maxWorkers),
        standardQuantity: opForm.standardQuantity
          ? Number(opForm.standardQuantity)
          : undefined,
        standardMinutes: opForm.standardMinutes
          ? Number(opForm.standardMinutes)
          : undefined,
        processId: selectedProcess._id,
      };
      if (editingOperation) {
        await api.updateOperation(editingOperation._id, data);
        toast.success("Cập nhật thao tác thành công");
      } else {
        await api.createOperation(data);
        toast.success("Thêm thao tác thành công");
      }
      setOperationModalOpen(false);
      setEditingOperation(null);
      loadOperations();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || "Có lỗi xảy ra");
    }
  };

  const handleDeleteOperation = async (id: string) => {
    try {
      await api.deleteOperation(id);
      toast.success("Xóa thao tác thành công");
      loadOperations();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || "Có lỗi xảy ra");
    }
  };

  const openProcessModal = (process: any = null) => {
    setEditingProcess(process);
    if (process) {
      setProcessForm({
        name: process.name,
        code: process.code,
        order: process.order,
        description: process.description || "",
      });
    } else {
      setProcessForm({
        name: "",
        code: "",
        order: processes.length + 1,
        description: "",
      });
    }
    setProcessModalOpen(true);
  };

  const openOperationModal = (operation: any = null) => {
    setEditingOperation(operation);
    if (operation) {
      setOpForm({
        name: operation.name,
        code: operation.code,
        difficulty: operation.difficulty || 3,
        maxWorkers: operation.maxWorkers || 1,
        allowTeamwork: operation.allowTeamwork || false,
        standardQuantity: operation.standardQuantity || "",
        standardMinutes: operation.standardMinutes || "",
        instructions: operation.instructions || "",
      });
    } else {
      setOpForm({
        name: "",
        code: "",
        difficulty: 3,
        maxWorkers: 1,
        allowTeamwork: false,
        standardQuantity: "",
        standardMinutes: "",
        instructions: "",
      });
    }
    setOperationModalOpen(true);
  };

  const totalOperations = operations.length;
  const totalTime = operations.reduce(
    (sum, op) => sum + (op.standardMinutes || 0),
    0,
  );
  const totalWorkers = operations.reduce(
    (sum, op) => sum + (op.maxWorkers || 1),
    0,
  );

  // Difficulty stars renderer
  const DifficultyStars = ({ value }: { value: number }) => (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${i <= value ? "fill-amber-400 text-amber-400" : "text-slate-200"}`}
        />
      ))}
      <span className="text-xs text-slate-400 ml-1">
        ({(value || 3).toFixed(1)})
      </span>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[300px]">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto">
      {/* Breadcrumb */}
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/admin">Trang chủ</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink>Sản xuất</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Quản lý công đoạn</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex justify-between items-start mb-6 flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">
            Công đoạn & Thao tác
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Cấu hình quy trình lắp ráp và tiêu chuẩn vận hành.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500">Loại xe:</span>
          <Select
            value={selectedVehicleType?._id || ""}
            onValueChange={(v) =>
              setSelectedVehicleType(vehicleTypes.find((vt) => vt._id === v))
            }
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Chọn loại xe..." />
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
      </div>

      {selectedVehicleType && (
        <div className="grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-6">
          {/* Left Panel - Assembly Stages */}
          <Card className="border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex justify-between items-center">
              <span className="font-semibold text-sm">
                Các công đoạn lắp ráp
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => openProcessModal()}
              >
                <Settings className="w-4 h-4" />
              </Button>
            </div>
            <div className="max-h-[500px] overflow-y-auto">
              {processes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <Wrench className="w-8 h-8 mb-2" />
                  <p className="text-sm">Chưa có công đoạn</p>
                </div>
              ) : (
                processes.map((p, index) => (
                  <div
                    key={p._id}
                    onClick={() => {
                      setSelectedProcess(p);
                      if (isMobile) setMobileSheetOpen(true);
                    }}
                    className={`px-5 py-4 cursor-pointer border-l-[3px] transition-all ${
                      selectedProcess?._id === p._id
                        ? "border-l-[#0077c0] bg-[#0077c0]/5"
                        : "border-l-transparent hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-semibold ${
                          selectedProcess?._id === p._id
                            ? "bg-[#0077c0] text-white"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {String(index + 1).padStart(2, "0")}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div
                          className={`font-semibold truncate ${selectedProcess?._id === p._id ? "text-[#0077c0]" : ""}`}
                        >
                          {p.name}
                        </div>
                        <span className="text-xs text-slate-400">
                          {operations.length > 0 &&
                          selectedProcess?._id === p._id
                            ? `${totalOperations} Thao tác • ${Math.round(totalTime)} phút`
                            : p.code}
                        </span>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 opacity-40 hover:opacity-100 text-red-500"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Xóa công đoạn này?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Tất cả thao tác thuộc công đoạn sẽ bị xóa.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Hủy</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteProcess(p._id)}
                              className="bg-red-500 hover:bg-red-600"
                            >
                              Xóa
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="px-5 py-4 border-t border-slate-200">
              <Button
                variant="outline"
                className="w-full border-dashed"
                onClick={() => openProcessModal()}
              >
                <Plus className="w-4 h-4 mr-1" /> Thêm công đoạn mới
              </Button>
            </div>
          </Card>

          {/* Right Panel - Operations (Desktop only) */}
          {!isMobile && (
            <Card className="border-slate-200 overflow-hidden">
              {selectedProcess ? (
                <>
                  <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center flex-wrap gap-3">
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-bold">
                          Thao tác {selectedProcess.name}
                        </h3>
                        <Badge className="bg-emerald-100 text-emerald-700">
                          Đang hoạt động
                        </Badge>
                      </div>
                      <div className="flex gap-4 mt-1.5">
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Wrench className="w-3 h-3" /> {totalOperations} Bước
                        </span>
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {Math.round(totalTime)}{" "}
                          phút
                        </span>
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Users className="w-3 h-3" /> {totalWorkers} KTV
                        </span>
                      </div>
                    </div>
                    <Button
                      onClick={() => openOperationModal()}
                      className="bg-[#0077c0] hover:bg-[#005fa3]"
                    >
                      <Plus className="w-4 h-4 mr-1" /> Thêm thao tác
                    </Button>
                  </div>

                  <div className="px-6 overflow-x-auto">
                    {operations.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                        <Wrench className="w-8 h-8 mb-2" />
                        <p className="text-sm">Chưa có thao tác</p>
                      </div>
                    ) : (
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-200 text-left">
                            <th className="py-3 w-10 text-slate-500 font-medium">
                              #
                            </th>
                            <th className="py-3 text-slate-500 font-medium">
                              TÊN THAO TÁC
                            </th>
                            <th className="py-3 text-center text-slate-500 font-medium">
                              TIÊU CHUẨN
                            </th>
                            <th className="py-3 text-center text-slate-500 font-medium">
                              ĐỘ KHÓ
                            </th>
                            <th className="py-3 w-14"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {operations.map((op, index) => (
                            <tr
                              key={op._id}
                              className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                            >
                              <td className="py-3">
                                <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-medium">
                                  {index + 1}
                                </div>
                              </td>
                              <td className="py-3">
                                <div className="font-medium">{op.name}</div>
                                <span className="text-xs text-slate-400">
                                  {op.description || `ID: ${op.code}`}
                                </span>
                              </td>
                              <td className="py-3 text-center">
                                <Badge
                                  variant="outline"
                                  className="bg-blue-50 text-blue-700 border-blue-200"
                                >
                                  {op.standardQuantity || "—"} sp/giờ
                                </Badge>
                              </td>
                              <td className="py-3 text-center">
                                <DifficultyStars value={op.difficulty || 3} />
                              </td>
                              <td className="py-3">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => openOperationModal(op)}
                                >
                                  <Settings className="w-4 h-4" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>

                  {operations.length > 0 && (
                    <div className="px-6 py-3 border-t border-slate-200 flex justify-between items-center text-sm text-slate-500">
                      <span>
                        Hiển thị {operations.length} / {operations.length} thao
                        tác
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-[400px] text-slate-400">
                  <Wrench className="w-10 h-10 mb-3" />
                  <p className="text-sm">Chọn công đoạn để xem thao tác</p>
                </div>
              )}
            </Card>
          )}
        </div>
      )}

      {/* Mobile Bottom Sheet - Operations */}
      <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
        <SheetContent
          side="bottom"
          className="max-h-[80vh] overflow-hidden flex flex-col rounded-t-2xl"
        >
          {selectedProcess && (
            <>
              <SheetHeader className="border-b border-slate-200 pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <SheetTitle className="text-lg">
                      {selectedProcess.name}
                    </SheetTitle>
                    <SheetDescription className="flex gap-3 mt-1">
                      <span className="flex items-center gap-1">
                        <Wrench className="w-3 h-3" /> {totalOperations} bước
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {Math.round(totalTime)}{" "}
                        phút
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" /> {totalWorkers} KTV
                      </span>
                    </SheetDescription>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => openOperationModal()}
                    className="bg-[#0077c0] hover:bg-[#005fa3]"
                  >
                    <Plus className="w-4 h-4 mr-1" /> Thêm
                  </Button>
                </div>
              </SheetHeader>

              <div className="flex-1 overflow-y-auto py-3 space-y-3 px-1">
                {operations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                    <Wrench className="w-8 h-8 mb-2" />
                    <p className="text-sm">Chưa có thao tác</p>
                  </div>
                ) : (
                  operations.map((op, index) => (
                    <div
                      key={op._id}
                      className="border border-slate-200 rounded-xl p-4 bg-white hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className="w-7 h-7 rounded-full bg-[#0077c0]/10 text-[#0077c0] flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                            {index + 1}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-sm truncate">
                              {op.name}
                            </div>
                            <div className="text-xs text-slate-400 mt-0.5">
                              {op.description || `Mã: ${op.code}`}
                            </div>
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                              <Badge
                                variant="outline"
                                className="bg-blue-50 text-blue-700 border-blue-200 text-xs"
                              >
                                {op.standardQuantity || "—"} sp/giờ
                              </Badge>
                              <DifficultyStars value={op.difficulty || 3} />
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          onClick={() => {
                            setMobileSheetOpen(false);
                            setTimeout(() => openOperationModal(op), 300);
                          }}
                        >
                          <Settings className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Process Modal */}
      <Dialog
        open={processModalOpen}
        onOpenChange={(open) => {
          if (!open) setProcessModalOpen(false);
        }}
      >
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>
              {editingProcess ? "Sửa công đoạn" : "Thêm công đoạn mới"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>Tên công đoạn *</Label>
              <Input
                value={processForm.name}
                onChange={(e) =>
                  setProcessForm({ ...processForm, name: e.target.value })
                }
                placeholder="VD: Lắp khung"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Mã *</Label>
                <Input
                  value={processForm.code}
                  onChange={(e) =>
                    setProcessForm({
                      ...processForm,
                      code: e.target.value.toUpperCase(),
                    })
                  }
                  placeholder="VD: KHUNG"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Thứ tự *</Label>
                <Input
                  type="number"
                  min={1}
                  value={processForm.order}
                  onChange={(e) =>
                    setProcessForm({
                      ...processForm,
                      order: parseInt(e.target.value) || 1,
                    })
                  }
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Mô tả</Label>
              <textarea
                className="w-full border border-slate-200 rounded-md p-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#0077c0]/20 focus:border-[#0077c0]"
                rows={2}
                value={processForm.description}
                onChange={(e) =>
                  setProcessForm({
                    ...processForm,
                    description: e.target.value,
                  })
                }
              />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setProcessModalOpen(false)}
            >
              Hủy
            </Button>
            <Button
              onClick={handleProcessSubmit}
              className="bg-[#0077c0] hover:bg-[#005fa3]"
            >
              {editingProcess ? "Cập nhật" : "Tạo mới"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Operation Modal */}
      <Dialog
        open={operationModalOpen}
        onOpenChange={(open) => {
          if (!open) setOperationModalOpen(false);
        }}
      >
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>
              {editingOperation ? "Sửa thao tác" : "Thêm thao tác mới"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>Tên thao tác *</Label>
              <Input
                value={opForm.name}
                onChange={(e) => setOpForm({ ...opForm, name: e.target.value })}
                placeholder="VD: Hàn khung chính"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Mã *</Label>
              <Input
                value={opForm.code}
                onChange={(e) =>
                  setOpForm({ ...opForm, code: e.target.value.toUpperCase() })
                }
                placeholder="VD: KHUNG-01"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Độ khó (1-5)</Label>
                <div className="flex gap-1 py-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <button
                      key={i}
                      onClick={() => setOpForm({ ...opForm, difficulty: i })}
                      className="focus:outline-none"
                    >
                      <Star
                        className={`w-5 h-5 cursor-pointer transition-colors ${i <= Number(opForm.difficulty) ? "fill-amber-400 text-amber-400" : "text-slate-200 hover:text-amber-300"}`}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Số công nhân tối đa</Label>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={opForm.maxWorkers}
                  onChange={(e) =>
                    setOpForm({
                      ...opForm,
                      maxWorkers: parseInt(e.target.value) || 1,
                    })
                  }
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={opForm.allowTeamwork}
                onCheckedChange={(checked) =>
                  setOpForm({ ...opForm, allowTeamwork: !!checked })
                }
              />
              <Label className="cursor-pointer">Cho phép làm nhóm</Label>
            </div>
            <div className="bg-slate-50 p-4 rounded-lg">
              <h4 className="font-bold text-sm mb-3">📊 Tiêu chuẩn sản xuất</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">SL tiêu chuẩn/Ca</Label>
                  <Input
                    type="number"
                    min={0}
                    value={opForm.standardQuantity}
                    onChange={(e) =>
                      setOpForm({ ...opForm, standardQuantity: e.target.value })
                    }
                    placeholder="VD: 100"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Phút/Sản phẩm</Label>
                  <Input
                    type="number"
                    min={0}
                    step={0.1}
                    value={opForm.standardMinutes}
                    onChange={(e) =>
                      setOpForm({ ...opForm, standardMinutes: e.target.value })
                    }
                    placeholder="Tự tính"
                  />
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                💡 Nhập một giá trị, giá trị còn lại sẽ được tính (dựa trên 480
                phút/ca)
              </p>
            </div>
            <div className="space-y-1.5">
              <Label>Hướng dẫn chi tiết</Label>
              <textarea
                className="w-full border border-slate-200 rounded-md p-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#0077c0]/20 focus:border-[#0077c0]"
                rows={2}
                value={opForm.instructions}
                onChange={(e) =>
                  setOpForm({ ...opForm, instructions: e.target.value })
                }
                placeholder="Hướng dẫn từng bước cho thao tác này..."
              />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setOperationModalOpen(false)}
            >
              Hủy
            </Button>
            <Button
              onClick={handleOperationSubmit}
              className="bg-emerald-500 hover:bg-emerald-600"
            >
              {editingOperation ? "Cập nhật" : "Tạo mới"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
