/**
 * =============================================
 * RESET PASSWORD PAGE - Trang Đặt Lại Mật Khẩu
 * =============================================
 * Theme: AI EBIKE Orange + Blue
 */

import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Loader2,
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  ArrowLeft,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import logoAiEbike from "@/assets/logo-aiebike.png";
import { resetPasswordApi, ResetPasswordData } from "@/services/authService";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      toast.error("Link không hợp lệ", {
        description: "Vui lòng yêu cầu link mới từ trang Quên mật khẩu",
      });
    }
  }, [token]);

  const resetMutation = useMutation({
    mutationFn: (data: ResetPasswordData) => resetPasswordApi(data),
    onSuccess: (data) => {
      if (data.success) {
        setIsSuccess(true);
        toast.success("Đặt lại mật khẩu thành công!", {
          description: "Vui lòng đăng nhập với mật khẩu mới",
        });
      } else {
        toast.error("Thất bại", { description: "Có lỗi xảy ra" });
      }
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.error?.message ||
        "Token không hợp lệ hoặc đã hết hạn";
      toast.error("Thất bại", { description: message });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      toast.warning("Vui lòng nhập mật khẩu mới");
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
    if (!token) {
      toast.error("Token không hợp lệ");
      return;
    }
    resetMutation.mutate({ token, password });
  };

  if (!token) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{
          background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
        }}
      >
        <Card className="w-full max-w-md shadow-2xl border-0">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mb-4">
              <XCircle className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-red-700">
              Link không hợp lệ
            </CardTitle>
            <CardDescription>
              Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex flex-col gap-4">
            <Link to="/forgot-password" className="w-full">
              <Button
                className="w-full text-white"
                style={{
                  background: "linear-gradient(135deg, #f5821f, #e06d0a)",
                }}
              >
                Yêu cầu link mới
              </Button>
            </Link>
            <Link to="/login" className="w-full">
              <Button variant="ghost" className="w-full">
                <ArrowLeft className="w-4 h-4" />
                Quay lại đăng nhập
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{
          background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
        }}
      >
        <Card className="w-full max-w-md shadow-2xl border-0">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-green-700">
              Đặt lại mật khẩu thành công!
            </CardTitle>
            <CardDescription>
              Mật khẩu của bạn đã được cập nhật. Vui lòng đăng nhập với mật khẩu
              mới.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Link to="/login" className="w-full">
              <Button
                className="w-full text-white"
                style={{
                  background: "linear-gradient(135deg, #f5821f, #e06d0a)",
                }}
              >
                Đăng nhập ngay
              </Button>
            </Link>
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
                Đặt lại mật khẩu
              </CardTitle>
              <CardDescription className="mt-1">
                Nhập mật khẩu mới cho tài khoản
              </CardDescription>
            </div>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Mật khẩu mới</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Ít nhất 6 ký tự"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={resetMutation.isPending}
                    autoFocus
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

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Nhập lại mật khẩu mới"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={resetMutation.isPending}
                />
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-4">
              <Button
                type="submit"
                className="w-full text-white"
                style={{
                  background: "linear-gradient(135deg, #f5821f, #e06d0a)",
                }}
                disabled={resetMutation.isPending}
              >
                {resetMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    Đặt lại mật khẩu
                  </>
                )}
              </Button>

              <Link to="/login" className="w-full">
                <Button variant="ghost" className="w-full">
                  <ArrowLeft className="w-4 h-4" />
                  Quay lại đăng nhập
                </Button>
              </Link>
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
