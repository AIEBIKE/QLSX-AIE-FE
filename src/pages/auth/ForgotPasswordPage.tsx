/**
 * =============================================
 * FORGOT PASSWORD PAGE - Trang Quên Mật Khẩu
 * =============================================
 * Theme: AI EBIKE Orange + Blue
 */

import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Mail, CheckCircle, ArrowLeft } from "lucide-react";

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
import { forgotPasswordApi } from "@/services/authService";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const forgotMutation = useMutation({
    mutationFn: (email: string) => forgotPasswordApi(email),
    onSuccess: (data) => {
      if (data.success) {
        setIsSuccess(true);
        toast.success("Đã gửi email!", {
          description: "Vui lòng kiểm tra hộp thư của bạn",
        });
      } else {
        toast.error("Thất bại", {
          description: data.error?.message || "Có lỗi xảy ra",
        });
      }
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.error?.message ||
        "Có lỗi xảy ra, vui lòng thử lại";
      toast.error("Thất bại", { description: message });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.warning("Vui lòng nhập email");
      return;
    }
    forgotMutation.mutate(email.trim());
  };

  if (isSuccess) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{
          background: "linear-gradient(135deg, #0077c0 0%, #004b7a 100%)",
        }}
      >
        <Card className="w-full max-w-md shadow-2xl border-0">
          <CardHeader className="text-center space-y-2">
            <div
              className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4"
              style={{
                background: "linear-gradient(135deg, #10b981, #059669)",
              }}
            >
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-green-700">
              Đã gửi email!
            </CardTitle>
            <CardDescription>
              Chúng tôi đã gửi hướng dẫn đặt lại mật khẩu đến{" "}
              <strong>{email}</strong>. Vui lòng kiểm tra hộp thư (bao gồm cả
              thư rác).
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex flex-col gap-4">
            <Link to="/login" className="w-full">
              <Button className="w-full" variant="outline">
                <ArrowLeft className="w-4 h-4" />
                Quay lại đăng nhập
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
                Quên mật khẩu
              </CardTitle>
              <CardDescription className="mt-1">
                Nhập email để nhận link đặt lại mật khẩu
              </CardDescription>
            </div>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Nhập email đã đăng ký"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={forgotMutation.isPending}
                  autoFocus
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
                disabled={forgotMutation.isPending}
              >
                {forgotMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Đang gửi...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4" />
                    Gửi link đặt lại
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
