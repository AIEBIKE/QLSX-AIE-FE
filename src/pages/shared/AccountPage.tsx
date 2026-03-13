import { useState, FormEvent, useRef } from "react";
import { useAuth } from "../../contexts/AuthContext";
import {
  updateProfile,
  changePassword,
  uploadAvatar,
} from "../../services/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import Cropper, { Area, Point } from "react-easy-crop";
import getCroppedImg from "../../shared/utils/cropImage";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  User,
  Mail,
  Building2,
  Shield,
  Hash,
  MapPin,
  Calendar,
  CreditCard,
  Lock,
  Save,
  Eye,
  EyeOff,
  Camera,
  Loader2,
} from "lucide-react";

export default function AccountPage() {
  const { user, updateUser } = useAuth();

  // Profile form state
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [dateOfBirth, setDateOfBirth] = useState(
    user?.dateOfBirth
      ? new Date(user.dateOfBirth).toISOString().split("T")[0]
      : "",
  );
  const [citizenId, setCitizenId] = useState(user?.citizenId || "");
  const [address, setAddress] = useState(user?.address || "");
  const [profileLoading, setProfileLoading] = useState(false);

  // Avatar upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarLoading, setAvatarLoading] = useState(false);

  // Image cropping state
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isCropping, setIsCropping] = useState(false);

  // Password form state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const getInitials = (name: string) => {
    if (!name) return "?";
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name[0].toUpperCase();
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Kích thước ảnh không được vượt quá 2MB");
      return;
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Vui lòng chọn định dạng ảnh hợp lệ (JPG, PNG, WebP)");
      return;
    }

    // Instead of uploading, open cropper
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      setImageSrc(reader.result as string);
      setIsCropping(true);
    });
    reader.readAsDataURL(file);
  };

  const onCropComplete = (croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleCropSave = async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    try {
      setAvatarLoading(true);
      setIsCropping(false);

      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
      if (!croppedImage) {
        toast.error("Không thể xử lý ảnh đã cắt");
        return;
      }

      // Create a unique filename
      const filename = `avatar_${user?.code || Date.now()}.jpg`;
      const file = new File([croppedImage], filename, { type: "image/jpeg" });

      const formData = new FormData();
      formData.append("avatar", file);

      const res = await uploadAvatar(formData);
      if (res.data.success) {
        toast.success("Cập nhật ảnh đại diện thành công");
        updateUser({ avatar: res.data.data.avatar });
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.error?.message || "Lỗi khi tải ảnh lên",
      );
    } finally {
      setAvatarLoading(false);
      setImageSrc(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const getRoleLabel = (role?: string) => {
    if (!role) return "Người dùng";
    const r = role.toUpperCase();
    if (r === "ADMIN") return "Quản trị viên";
    if (r === "FAC_MANAGER") return "Quản lý nhà máy";
    if (r === "SUPERVISOR") return "Giám sát (QA/QC)";
    if (r === "WORKER") return "Công nhân";
    return "Người dùng";
  };

  const getRoleBadgeColor = (role?: string) => {
    if (!role) return "bg-slate-100 text-slate-700 border-slate-200";
    const r = role.toUpperCase();
    if (r === "ADMIN") return "bg-blue-100 text-blue-700 border-blue-200";
    if (r === "FAC_MANAGER")
      return "bg-indigo-100 text-indigo-700 border-indigo-200";
    if (r === "SUPERVISOR")
      return "bg-amber-100 text-amber-700 border-amber-200";
    if (r === "WORKER")
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    return "bg-slate-100 text-slate-700 border-slate-200";
  };

  const handleProfileSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Tên không được để trống");
      return;
    }

    setProfileLoading(true);
    try {
      const res = await updateProfile({
        name: name.trim(),
        email: email.trim() || undefined,
        dateOfBirth: dateOfBirth || undefined,
        citizenId: citizenId.trim() || undefined,
        address: address.trim() || undefined,
      });
      updateUser(res.data.data);
      toast.success("Cập nhật thông tin thành công!");
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || "Cập nhật thất bại";
      toast.error(msg);
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!currentPassword || !newPassword) {
      toast.error("Vui lòng nhập đầy đủ thông tin");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Mật khẩu mới phải có ít nhất 6 ký tự");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp");
      return;
    }

    setPasswordLoading(true);
    try {
      await changePassword({ currentPassword, newPassword });
      toast.success("Đổi mật khẩu thành công!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || "Đổi mật khẩu thất bại";
      toast.error(msg);
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Tài khoản</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Quản lý thông tin cá nhân và bảo mật tài khoản
        </p>
      </div>

      {/* Profile Overview Card */}
      <Card className="border-0 shadow-md bg-gradient-to-r from-slate-900 to-slate-800 text-white overflow-hidden">
        <CardContent className="pt-6 pb-6">
          <div className="flex items-center gap-4">
            <div
              className="relative group/avatar cursor-pointer"
              onClick={handleAvatarClick}
            >
              <Avatar className="w-16 h-16 border-2 border-white/20 shadow-lg">
                <AvatarImage
                  src={user?.avatar}
                  alt={user?.name}
                  className="object-cover"
                />
                <AvatarFallback className="bg-white/10 text-white text-xl font-bold">
                  {getInitials(user?.name || "")}
                </AvatarFallback>
              </Avatar>

              {/* Overlay edit button */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover/avatar:opacity-100 transition-opacity">
                {avatarLoading ? (
                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                ) : (
                  <Camera className="w-5 h-5 text-white" />
                )}
              </div>

              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
              />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold truncate">{user?.name}</h2>
              <div className="flex items-center gap-2 mt-1 text-sm text-white/70">
                <Hash className="w-3.5 h-3.5" />
                <span>{user?.code}</span>
              </div>
              <div className="mt-2">
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getRoleBadgeColor(user?.roleCode)}`}
                >
                  <Shield className="w-3 h-3" />
                  {getRoleLabel(user?.roleCode)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Edit Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="w-5 h-5 text-blue-600" />
            Thông tin cá nhân
          </CardTitle>
          <CardDescription>Cập nhật tên và email của bạn</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            {/* Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Họ và tên <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
                  placeholder="Nhập họ và tên"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
                  placeholder="your@email.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Date of Birth */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Năm sinh
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
                  />
                </div>
              </div>

              {/* Citizen ID */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  CCCD
                </label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={citizenId}
                    onChange={(e) => setCitizenId(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
                    placeholder="Số CCCD"
                  />
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Địa chỉ
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
                  placeholder="Địa chỉ thường trú"
                />
              </div>
            </div>

            {/* Readonly fields */}
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-500">
                  Mã nhân viên
                </label>
                <div className="px-4 py-2.5 rounded-lg bg-slate-50 border border-slate-100 text-sm text-slate-600 font-mono">
                  {user?.code}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-500">
                  Vai trò
                </label>
                <div className="px-4 py-2.5 rounded-lg bg-slate-50 border border-slate-100 text-sm text-slate-600">
                  {getRoleLabel(user?.roleCode)}
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                disabled={profileLoading}
                className="bg-[#0077c0] hover:bg-[#005f9e] text-white"
              >
                <Save className="w-4 h-4 mr-2" />
                {profileLoading ? "Đang lưu..." : "Lưu thay đổi"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Password Change Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Lock className="w-5 h-5 text-amber-600" />
            Đổi mật khẩu
          </CardTitle>
          <CardDescription>
            Đảm bảo tài khoản của bạn được bảo mật bằng mật khẩu mạnh
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            {/* Current Password */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Mật khẩu hiện tại <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-sm"
                  placeholder="Nhập mật khẩu hiện tại"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showCurrentPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Mật khẩu mới <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-sm"
                  placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showNewPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {newPassword && newPassword.length < 6 && (
                <p className="text-xs text-red-500">
                  Mật khẩu phải có ít nhất 6 ký tự
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Xác nhận mật khẩu <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-sm"
                  placeholder="Nhập lại mật khẩu mới"
                />
              </div>
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-xs text-red-500">
                  Mật khẩu xác nhận không khớp
                </p>
              )}
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                disabled={passwordLoading}
                variant="outline"
                className="border-amber-300 text-amber-700 hover:bg-amber-50"
              >
                <Lock className="w-4 h-4 mr-2" />
                {passwordLoading ? "Đang xử lý..." : "Đổi mật khẩu"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Image Cropping Dialog */}
      <Dialog open={isCropping} onOpenChange={setIsCropping}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden">
          <DialogHeader className="p-4 border-b">
            <DialogTitle>Cắt ảnh đại diện</DialogTitle>
          </DialogHeader>
          <div className="relative w-full h-[400px] bg-slate-900">
            {imageSrc && (
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            )}
          </div>
          <div className="p-4 space-y-4 bg-white">
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-medium text-slate-500">
                <span>Thu phóng</span>
                <span>{Math.round(zoom * 100)}%</span>
              </div>
              <input
                type="range"
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                aria-labelledby="Zoom"
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>
            <DialogFooter className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setIsCropping(false)}
                className="flex-1"
              >
                Hủy
              </Button>
              <Button
                onClick={handleCropSave}
                disabled={avatarLoading}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {avatarLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Lưu
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
