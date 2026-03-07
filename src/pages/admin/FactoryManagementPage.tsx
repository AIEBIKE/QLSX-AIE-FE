import { useState, useEffect } from "react";
import {
  Factory,
  Plus,
  MapPin,
  Pencil,
  Trash2,
  Building2,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import * as api from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";

export default function FactoryManagementPage() {
  const { user } = useAuth();
  const roleCode = user?.roleCode || user?.role;
  const isAdmin = roleCode === "ADMIN" || roleCode === "admin";

  const [factories, setFactories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFactory, setEditingFactory] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    location: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadFactories();
  }, []);

  const loadFactories = async () => {
    setLoading(true);
    try {
      const res = await api.getFactories();
      setFactories(res.data.data);
    } catch (err) {
      toast.error("Không thể tải danh sách nhà máy");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (factory?: any) => {
    if (factory) {
      setEditingFactory(factory);
      setFormData({
        name: factory.name,
        code: factory.code,
        location: factory.location || "",
      });
    } else {
      setEditingFactory(null);
      setFormData({ name: "", code: "", location: "" });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.code) {
      toast.error("Vui lòng nhập tên và mã nhà máy");
      return;
    }

    setSaving(true);
    try {
      if (editingFactory) {
        await api.updateFactory(editingFactory._id, formData);
        toast.success("Cập nhật thành công!");
      } else {
        await api.createFactory(formData);
        toast.success("Thêm nhà máy mới thành công!");
      }
      setIsDialogOpen(false);
      loadFactories();
    } catch (err: any) {
      toast.error(
        err.response?.data?.error?.message || "Lỗi khi lưu thông tin",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa nhà máy này?")) return;
    try {
      await api.deleteFactory(id);
      toast.success("Đã xóa nhà máy");
      loadFactories();
    } catch (err) {
      toast.error("Không thể xóa nhà máy");
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Factory className="w-6 h-6 text-[#0077c0]" />
          Quản lý Nhà Máy
        </h1>
        {isAdmin && (
          <Button
            onClick={() => handleOpenDialog()}
            className="bg-[#0077c0] hover:bg-[#005f9e]"
          >
            <Plus className="w-4 h-4 mr-2" /> Thêm nhà máy
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center p-20">
          <Loader2 className="animate-spin text-slate-400" />
        </div>
      ) : factories.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-20 text-center">
            <Building2 className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-500">
              Chưa có nhà máy nào được định nghĩa
            </p>
            {isAdmin && (
              <Button variant="link" onClick={() => handleOpenDialog()}>
                Tạo nhà máy đầu tiên
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {factories.map((f) => (
            <Card
              key={f._id}
              className="overflow-hidden border-slate-200 hover:shadow-md transition-shadow"
            >
              <div className="bg-[#0077c0] h-2 w-full" />
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{f.name}</CardTitle>
                    <CardDescription className="font-mono text-xs uppercase tracking-wider">
                      {f.code}
                    </CardDescription>
                  </div>
                  <Badge variant={f.active ? "default" : "secondary"}>
                    {f.active ? "Hoạt động" : "Tạm dừng"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3 text-sm text-slate-600">
                  <MapPin className="w-4 h-4 text-slate-400 mt-1 shrink-0" />
                  <span>{f.location || "Chưa cập nhật địa chỉ"}</span>
                </div>
                {isAdmin && (
                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenDialog(f)}
                    >
                      <Pencil className="w-3.5 h-3.5 mr-1.5" /> Sửa
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => handleDelete(f._id)}
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Xóa
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editingFactory ? "Sửa nhà máy" : "Thêm nhà máy mới"}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Tên nhà máy *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="VD: Nhà máy Long Thành"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="code">Mã nhà máy *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value })
                  }
                  placeholder="VD: NM-LT"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="location">Địa chỉ</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  placeholder="Nhập địa chỉ nhà máy..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-[#0077c0] hover:bg-[#005f9e]"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                {editingFactory ? "Cập nhật" : "Thêm mới"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
