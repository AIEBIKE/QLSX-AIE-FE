import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { Pagination } from "@/components/shared/Pagination";
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
import { useVehicleTypes } from "@/hooks/useQueries";
import { useCreateVehicleType, useUpdateVehicleType, useDeleteVehicleType } from "@/hooks/useMutations";
import { useAuth } from "../../contexts/AuthContext";

export default function VehicleTypesPage() {
  const { user } = useAuth();
  const roleCode = user?.roleCode || user?.role;
  const isAdmin = roleCode === "ADMIN" || roleCode === "admin";

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    framePrefix: "",
    enginePrefix: "",
  });

  const vtParams = useMemo(() => ({
    page,
    limit,
    search: searchTerm || undefined,
  }), [page, limit, searchTerm]);

  const { data: vtData, isLoading: loading } = useVehicleTypes(vtParams);
  const vehicleTypes = vtData?.data || [];
  const pagination = {
    page,
    limit,
    total: vtData?.pagination?.total || 0,
    totalPages: vtData?.pagination?.totalPages || 1,
  };

  const createMutation = useCreateVehicleType();
  const updateMutation = useUpdateVehicleType();

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  const handleSubmit = () => {
    if (editingId) {
      updateMutation.mutate(
        { id: editingId, data: formData },
        {
          onSuccess: () => {
            setModalOpen(false);
            resetForm();
          },
        },
      );
    } else {
      createMutation.mutate(formData, {
        onSuccess: () => {
          setModalOpen(false);
          resetForm();
        },
      });
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

  const deleteMutation = useDeleteVehicleType();

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const resetForm = () => {
    setFormData({ name: "", code: "", framePrefix: "", enginePrefix: "" });
    setEditingId(null);
  };

  const handleAdd = () => {
    resetForm();
    setModalOpen(true);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-4 flex-1 min-w-[300px]">
          <h2 className="text-xl font-bold text-slate-800">🚗 Loại Xe</h2>
          <form onSubmit={handleSearch} className="flex gap-2 flex-1 max-w-sm">
            <Input
              placeholder="Tìm theo tên hoặc mã..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-9"
            />
            <Button type="submit" variant="secondary" className="h-9">
              Tìm
            </Button>
          </form>
        </div>
        {isAdmin && (
          <Button
            onClick={handleAdd}
            className="bg-[#0077c0] hover:bg-[#005fa3]"
          >
            <Plus className="w-4 h-4 mr-1" /> Thêm
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-[300px]">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      ) : (
        <>
          {isMobile ? (
            <div className="space-y-3">
              {vehicleTypes.map((vt: any) => (
                <Card key={vt._id} className="border-slate-200">
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800">
                            {vt.name}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {vt.code}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-500 mt-1">
                          Khung: {vt.framePrefix} | Máy: {vt.enginePrefix}
                        </p>
                      </div>
                      {isAdmin && (
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-blue-600"
                            onClick={() => handleEdit(vt)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-600"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Xác nhận xóa?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Hành động này không thể hoàn tác.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Hủy</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(vt._id)}
                                  className="bg-red-600"
                                >
                                  Xóa
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-slate-200 shadow-sm overflow-hidden">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="font-bold">Mã loại xe</TableHead>
                    <TableHead className="font-bold">Tên loại xe</TableHead>
                    <TableHead className="font-bold">Tiền tố khung</TableHead>
                    <TableHead className="font-bold">Tiền tố máy</TableHead>
                    {isAdmin && (
                      <TableHead className="text-right font-bold w-[100px]">
                        Thao tác
                      </TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vehicleTypes.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={isAdmin ? 5 : 4}
                        className="text-center py-10 text-slate-500"
                      >
                        Chưa có dữ liệu loại xe
                      </TableCell>
                    </TableRow>
                  ) : (
                    vehicleTypes.map((vt) => (
                      <TableRow key={vt._id} className="hover:bg-slate-50">
                        <TableCell>
                          <Badge variant="secondary" className="font-mono">
                            {vt.code}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium text-slate-700">
                          {vt.name}
                        </TableCell>
                        <TableCell className="text-slate-600">
                          {vt.framePrefix || "-"}
                        </TableCell>
                        <TableCell className="text-slate-600">
                          {vt.enginePrefix || "-"}
                        </TableCell>
                        {isAdmin && (
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                onClick={() => handleEdit(vt)}
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      Xác nhận xóa loại xe?
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Bạn đang xóa loại xe{" "}
                                      <span className="font-bold">
                                        {vt.name}
                                      </span>
                                      . Hành động này không thể hoàn tác.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Hủy</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDelete(vt._id)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Xác nhận xóa
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))
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
            onPageChange={(p: number) => setPage(p)}
            onLimitChange={() => setPage(1)}
          />
        </>
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
