/**
 * =============================================
 * LOGIN PAGE - Trang Đăng Nhập
 * =============================================
 * Theme: AI EBIKE Orange + Blue
 */

import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner"; // [splinh-12/03-15:05]
import { Loader2, LogIn, Eye, EyeOff } from "lucide-react";
import * as apiHooks from "../../hooks/useMutations"; // [splinh-12/03-15:05]

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
import { LoginCredentials } from "@/services/authService"; // [splinh-12/03-15:05]
import { useAppDispatch } from "@/store/hooks";
import { loginSuccess } from "@/store/slices/authSlice";

export default function LoginPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const loginMutation = apiHooks.useLogin(); // [splinh-12/03-15:05]

  useState(() => {
    if (loginMutation.isSuccess && loginMutation.data) {
      const data = loginMutation.data;
      if (data.success && data.data) {
        dispatch(
          loginSuccess({
            user: data.data.user,
            token: data.data.token,
          }),
        );
        window.dispatchEvent(new Event("auth-changed"));
        toast.success("Đăng nhập thành công!", {
          description: `Chào mừng ${data.data.user.name}`,
        });
        navigate("/");
      } else {
        toast.error("Đăng nhập thất bại", {
          description: data.error?.message || "Có lỗi xảy ra",
        });
      }
    }
  });

  useState(() => {
    if (loginMutation.isError) {
      const error = loginMutation.error as any;
      const message =
        error.response?.data?.error?.message ||
        "Có lỗi xảy ra, vui lòng thử lại";
      toast.error("Đăng nhập thất bại", {
        description: message,
      });
    }
  });

  // Re-write login mutation handling logic to use useEffect for side effects
  useEffect(() => {
    if (loginMutation.isSuccess && loginMutation.data) {
      const data = loginMutation.data;
      if (data.success && data.data) {
        dispatch(
          loginSuccess({
            user: data.data.user,
            token: data.data.token,
          }),
        );
        window.dispatchEvent(new Event("auth-changed"));
        toast.success("Đăng nhập thành công!", {
          description: `Chào mừng ${data.data.user.name}`,
        });
        navigate("/");
      } else {
        toast.error("Đăng nhập thất bại", {
          description: (data as any).error?.message || "Có lỗi xảy ra",
        });
      }
    }
  }, [loginMutation.isSuccess, loginMutation.data, dispatch, navigate]);

  useEffect(() => {
    if (loginMutation.isError && loginMutation.error) {
      const error = loginMutation.error as any;
      const message =
        error.response?.data?.error?.message ||
        "Có lỗi xảy ra, vui lòng thử lại";
      toast.error("Đăng nhập thất bại", {
        description: message,
      });
    }
  }, [loginMutation.isError, loginMutation.error]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !password.trim()) {
      toast.warning("Vui lòng nhập đầy đủ thông tin");
      return;
    }
    loginMutation.mutate({ code: code.trim(), password });
  };

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
            {/* Logo AI EBIKE */}
            <div className="flex justify-center">
              <img
                src={logoAiEbike}
                alt="AI EBIKE"
                className="h-14 object-contain"
              />
            </div>
            <div>
              <CardTitle
                className="text-2xl font-bold"
                style={{ color: "#0077c0" }}
              >
                Đăng nhập
              </CardTitle>
              <CardDescription className="mt-1">
                Quản lý Sản Xuất - AI EBIKE
              </CardDescription>
            </div>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Mã nhân viên</Label>
                <Input
                  id="code"
                  type="text"
                  placeholder="Nhập mã nhân viên"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  disabled={loginMutation.isPending}
                  autoComplete="username"
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Mật khẩu</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Nhập mật khẩu"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loginMutation.isPending}
                    autoComplete="current-password"
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

              <div className="text-right">
                <Link
                  to="/forgot-password"
                  className="text-sm hover:underline"
                  style={{ color: "#f5821f" }}
                >
                  Quên mật khẩu?
                </Link>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-4">
              <Button
                type="submit"
                className="w-full text-white"
                style={{
                  background: "linear-gradient(135deg, #f5821f, #e06d0a)",
                }}
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Đang đăng nhập...
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    Đăng nhập
                  </>
                )}
              </Button>

              <p className="text-sm text-center text-muted-foreground">
                Chưa có tài khoản?{" "}
                <Link
                  to="/register"
                  className="hover:underline font-medium"
                  style={{ color: "#0077c0" }}
                >
                  Đăng ký ngay
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
