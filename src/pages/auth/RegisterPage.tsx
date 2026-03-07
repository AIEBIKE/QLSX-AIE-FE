/**
 * =============================================
 * REGISTER PAGE - Trang Đăng Ký
 * =============================================
 * Theme: AI EBIKE Orange + Blue
 * Features: Role selection, auto-code generation, pending approval
 */

import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Loader2,
  UserPlus,
  Eye,
  EyeOff,
  CheckCircle,
  Clock,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import logoAiEbike from "@/assets/logo-aiebike.png";
import {
  registerApi,
  RegisterData,
  getNextCodeApi,
} from "@/services/authService";

export default function RegisterPage() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [role, setRole] = useState<
    "worker" | "supervisor" | "admin" | "fac_manager"
  >("worker");
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Fetch next code when role changes
  const { data: nextCodeData, refetch: refetchNextCode } = useQuery({
    queryKey: ["nextCode", role],
    queryFn: () => getNextCodeApi(role),
    enabled: true,
  });

  // Update code when next code is fetched
  useEffect(() => {
    if (nextCodeData?.success && nextCodeData.data?.code) {
      setCode(nextCodeData.data.code);
    }
  }, [nextCodeData]);

  // Refetch when role changes
  useEffect(() => {
    refetchNextCode();
  }, [role, refetchNextCode]);

  const registerMutation = useMutation({
    mutationFn: (data: RegisterData) => registerApi(data),
    onSuccess: (data) => {
      if (data.success) {
        setIsSuccess(true);
        toast.success("Đăng ký thành công!", {
          description: "Tài khoản đang chờ admin duyệt",
        });
      } else {
        toast.error("Đăng ký thất bại", {
          description: data.error?.message || "Có lỗi xảy ra",
        });
      }
    },
    onError: (error: unknown) => {
      const err = error as {
        response?: { data?: { error?: { message?: string } } };
      };
      const message =
        err.response?.data?.error?.message || "Có lỗi xảy ra, vui lòng thử lại";
      toast.error("Đăng ký thất bại", { description: message });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !password.trim()) {
      toast.warning("Vui lòng nhập đầy đủ thông tin bắt buộc");
      return;
    }

    if (password.length < 6) {
      toast.warning("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }

    if (password !== confirmPassword) {
      toast.warning("Mật khẩu xác nhận không khớp");
      return;
    }

    registerMutation.mutate({
      name: name.trim(),
      code: code.trim() || undefined,
      email: email.trim() || undefined,
      password,
      role,
    });
  };

  if (isSuccess) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{
          background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
        }}
      >
        <Card className="w-full max-w-md shadow-2xl border-0">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto w-16 h-16 bg-amber-500 rounded-full flex items-center justify-center mb-4">
              <Clock className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-amber-600">
              Đăng ký thành công!
            </CardTitle>
            <CardDescription className="text-base">
              Tài khoản của bạn đang <strong>chờ admin duyệt</strong>.
              <br />
              Bạn sẽ có thể đăng nhập sau khi được phê duyệt.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="bg-amber-50 rounded-lg p-4 mb-4">
              <p className="text-sm text-amber-800">
                <strong>Mã nhân viên:</strong> {code}
              </p>
              <p className="text-sm text-amber-800">
                <strong>Vai trò:</strong>{" "}
                {role === "worker"
                  ? "Công nhân"
                  : role === "supervisor"
                    ? "Giám sát"
                    : "Admin"}
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            <Button
              onClick={() => navigate("/login")}
              className="w-full text-white"
              style={{
                background: "linear-gradient(135deg, #0077c0, #004b7a)",
              }}
            >
              Quay lại đăng nhập
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: "linear-gradient(135deg, #0077c0 0%, #004b7a 100%)",
      }}
    >
      <div className="w-full max-w-md mx-auto">
        <Card className="shadow-2xl border-0">
          <CardHeader className="text-center space-y-4 pb-2">
            <div className="flex justify-center">
              <img
                src={logoAiEbike}
                alt="AI EBIKE"
                className="h-12 object-contain"
              />
            </div>
            <div>
              <CardTitle
                className="text-2xl font-bold"
                style={{ color: "#0077c0" }}
              >
                Đăng ký
              </CardTitle>
              <CardDescription className="mt-1">
                Tạo tài khoản mới để sử dụng hệ thống
              </CardDescription>
            </div>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="name">Họ và tên *</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Nhập họ và tên"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={registerMutation.isPending}
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="role">Vai trò *</Label>
                  <Select
                    value={role}
                    onValueChange={(v) =>
                      setRole(
                        v as "worker" | "supervisor" | "admin" | "fac_manager",
                      )
                    }
                    disabled={registerMutation.isPending}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn vai trò" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">👑 Admin</SelectItem>
                      <SelectItem value="fac_manager">
                        🏭 Quản lý nhà máy
                      </SelectItem>
                      <SelectItem value="supervisor">👔 Giám sát</SelectItem>
                      <SelectItem value="worker">👷 Công nhân</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="code">Mã nhân viên</Label>
                  <Input
                    id="code"
                    type="text"
                    placeholder="Tự động"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    disabled={registerMutation.isPending}
                    className="bg-gray-50"
                  />
                  <p className="text-xs text-muted-foreground">
                    Tự động tạo theo vai trò
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email">Email (không bắt buộc)</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={registerMutation.isPending}
                />
                <p className="text-xs text-muted-foreground">
                  Dùng để khôi phục mật khẩu
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Mật khẩu *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Ít nhất 6 ký tự"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={registerMutation.isPending}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword">Xác nhận mật khẩu *</Label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Nhập lại mật khẩu"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={registerMutation.isPending}
                />
              </div>

              {/* Notice about approval */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                <strong>⚠️ Lưu ý:</strong> Sau khi đăng ký, tài khoản sẽ cần
                được admin duyệt trước khi bạn có thể đăng nhập.
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-4">
              <Button
                type="submit"
                className="w-full text-white"
                style={{
                  background: "linear-gradient(135deg, #f5821f, #e06d0a)",
                }}
                disabled={registerMutation.isPending}
              >
                {registerMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Đang đăng ký...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    Đăng ký
                  </>
                )}
              </Button>

              <p className="text-sm text-center text-muted-foreground">
                Đã có tài khoản?{" "}
                <Link
                  to="/login"
                  className="hover:underline font-medium"
                  style={{ color: "#0077c0" }}
                >
                  Đăng nhập
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>

        <p className="text-center text-white/80 text-sm mt-6">
          © 2026 AI EBIKE
        </p>
      </div>
    </div>
  );
}
