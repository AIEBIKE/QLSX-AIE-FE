import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import * as api from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";

export default function VehicleTypesPage() {
  const { user } = useAuth();
  const roleCode = user?.roleCode || user?.role;
  const isAdmin = roleCode === "ADMIN" || roleCode === "admin";

  const [vehicleTypes, setVehicleTypes] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    framePrefix: "",
    enginePrefix: "",
  });

  useEffect(() => {
    loadVehicleTypes();
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const loadVehicleTypes = async () => {
    try {
      const res = await api.getVehicleTypes();
      setVehicleTypes(res.data.data || []);
    } catch {
      toast.error("Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      if (editingId) {
        await api.updateVehicleType(editingId, formData);
        toast.success("Cập nhật thành công");
      } else {
        await api.createVehicleType(formData);
        toast.success("Thêm thành công");
      }
      setModalOpen(false);
      resetForm();
      loadVehicleTypes();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || "Có lỗi xảy ra");
    }
  };

  const handleEdit = (record: any) => {
    setFormData({
      name: record.name || "",
      code: record.code || "",
      framePrefix: record.framePrefix || "",
      enginePrefix: record.enginePrefix || "",
    });
    setEditingId(record._id);
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteVehicleType(id);
      toast.success("Xóa thành công");
      loadVehicleTypes();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || "Có lỗi xảy ra");
    }
  };

  const resetForm = () => {
    setFormData({ name: "", code: "", framePrefix: "", enginePrefix: "" });
    setEditingId(null);
  };

  const handleAdd = () => {
    resetForm();
    setModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[300px]">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <h2 className="text-xl font-bold text-slate-800">🚗 Loại Xe</h2>
        {isAdmin && (
          <Button
            onClick={handleAdd}
            className="bg-[#0077c0] hover:bg-[#005fa3]"
          >
            <Plus className="w-4 h-4 mr-1" /> Thêm
          </Button>
        )}
      </div>

      {isMobile ? (
        <div className="space-y-3">
          {vehicleTypes.map((vt) => (
            <Card key={vt._id} className="border-slate-200">
              <CardContent className="pt-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-bold text-base font-mono">
                      {vt.code}
                    </span>
                    <div className="text-sm">{vt.name}</div>
                    {vt.framePrefix && (
                      <span className="text-xs text-slate-500">
                        Khung: {vt.framePrefix}
                      </span>
                    )}
                  </div>
                  <Badge
                    variant={vt.active ? "default" : "secondary"}
                    className={
                      vt.active
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-red-100 text-red-700"
                    }
                  >
                    {vt.active ? "On" : "Off"}
                  </Badge>
                </div>
                {isAdmin && (
                  <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(vt)}
                    >
                      <Pencil className="w-3.5 h-3.5 mr-1" /> Sửa
                    </Button>
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
                          <AlertDialogTitle>Xóa loại xe này?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Hành động này không thể hoàn tác
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Hủy</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(vt._id)}
                            className="bg-red-500 hover:bg-red-600"
                          >
                            Xóa
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-slate-200">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã</TableHead>
                <TableHead>Tên loại xe</TableHead>
                <TableHead>Prefix Khung</TableHead>
                <TableHead className="w-[100px]">Trạng thái</TableHead>
                {isAdmin && (
                  <TableHead className="w-[120px] text-right">
                    Thao tác
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {vehicleTypes.map((vt) => (
                <TableRow key={vt._id}>
                  <TableCell className="font-bold font-mono">
                    {vt.code}
                  </TableCell>
                  <TableCell>{vt.name}</TableCell>
                  <TableCell className="text-slate-500">
                    {vt.framePrefix || "-"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        vt.active
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-red-50 text-red-600 border-red-200"
                      }
                    >
                      {vt.active ? "Hoạt động" : "Tắt"}
                    </Badge>
                  </TableCell>
                  {isAdmin && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => handleEdit(vt)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
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
                                Xóa loại xe này?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Hành động này không thể hoàn tác
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Hủy</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(vt._id)}
                                className="bg-red-500 hover:bg-red-600"
                              >
                                Xóa
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Create/Edit Modal */}
      <Dialog
        open={modalOpen}
        onOpenChange={(open) => {
          if (!open) {
            setModalOpen(false);
            resetForm();
          }
        }}
      >
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Sửa Loại Xe" : "Thêm Loại Xe"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>Tên loại xe *</Label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="VD: Wave Alpha"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Mã loại xe *</Label>
              <Input
                value={formData.code}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    code: e.target.value.toUpperCase(),
                  })
                }
                placeholder="VD: WAVE-A"
                disabled={!!editingId}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Prefix số khung</Label>
              <Input
                value={formData.framePrefix}
                onChange={(e) =>
                  setFormData({ ...formData, framePrefix: e.target.value })
                }
                placeholder="VD: XDD-A1-"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Prefix số động cơ</Label>
              <Input
                value={formData.enginePrefix}
                onChange={(e) =>
                  setFormData({ ...formData, enginePrefix: e.target.value })
                }
                placeholder="VD: DC-A1-"
              />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setModalOpen(false);
                resetForm();
              }}
            >
              Hủy
            </Button>
            <Button
              onClick={handleSubmit}
              className="bg-[#0077c0] hover:bg-[#005fa3]"
            >
              {editingId ? "Cập nhật" : "Tạo mới"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
