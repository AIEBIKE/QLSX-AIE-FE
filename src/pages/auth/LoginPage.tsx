/**
 * =============================================
 * LOGIN PAGE - Trang Đăng Nhập
 * =============================================
 * Theme: AI EBIKE — Soft Luxury Edition (Tailwind Version)
 */

import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner"; // [minhlaoma-13/03-09:20]
import { Loader2, Eye, EyeOff, ArrowRight } from "lucide-react"; // [minhlaoma-13/03-09:20]
import * as apiHooks from "../../hooks/useMutations"; // [minhlaoma-13/03-09:20]

import { useAppDispatch } from "@/store/hooks";
import { loginSuccess } from "@/store/slices/authSlice";
import logoAiEbike from "@/assets/logo-aiebike.png";
import loginBgLuxury from "@/assets/login-bg-luxury.png"; // [minhlaoma-13/03-09:25]

export default function LoginPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const loginMutation = apiHooks.useLogin(); // [minhlaoma-13/03-09:20]

  useEffect(() => {
    if (loginMutation.isSuccess && loginMutation.data) {
      const data = loginMutation.data;
      if (data.success && data.data) {
        dispatch(
          loginSuccess({ user: data.data.user, token: data.data.token }),
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
      toast.error("Đăng nhập thất bại", { description: message });
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
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@300;400;500;600&family=Playfair+Display:ital,wght@0,400;0,500;1,400;1,500&display=swap');
      `}</style>
      <div className="flex min-h-screen w-full overflow-hidden bg-[#f5f3ef] font-['Be_Vietnam_Pro',sans-serif] selection:bg-[#0077c0]/10"> {/* [minhlaoma-13/03-09:30] */}
        {/* ── LEFT PANEL ── */}
        <div className="relative hidden flex-1 flex-col justify-end overflow-hidden lg:flex">
          {/* Background Layers */}
          <div 
            className="absolute inset-0 bg-cover bg-center transition-transform duration-20000 hover:scale-110" 
            style={{ backgroundImage: `url(${loginBgLuxury})` }}
          />
          <div className="absolute inset-0 bg-linear-to-br from-[#004b7a]/60 via-[#0077c0]/40 to-[#0095e8]/20" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_70%,rgba(245,130,31,0.1)_0%,transparent_60%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-size-[32px_32px]" />

          {/* Content */}
          <div className="relative z-10 p-12">
            {/* Status Badge */}
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/12 px-4 py-1.5 text-[0.75rem] font-medium tracking-widest text-white/85 uppercase">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#f5821f] shadow-[0_0_8px_rgba(245,130,31,0.6)]" />
              Hệ thống đang hoạt động
            </div>

            <h2 className="mb-5 font-['Playfair_Display',serif] text-5xl leading-tight tracking-tight text-white italic">
              Quản lý sản xuất{" "}
              <span className="text-[#f5821f]">thông minh hơn</span>
            </h2>

            <p className="max-w-[340px] text-[0.9rem] leading-relaxed font-light text-white/65">
              Nền tảng quản lý dây chuyền sản xuất xe đạp điện tích hợp AI —
              theo dõi, phân tích và tối ưu từng quy trình theo thời gian thực.
            </p>

            {/* Stats Section */}
            <div className="mt-10 flex gap-10">
              <div className="group transition-transform hover:-translate-y-1">
                <div className="text-[1.75rem] font-semibold leading-none text-white">
                  98%
                </div>
                <div className="mt-1 text-[0.75rem] font-light tracking-wide text-white/55">
                  Độ chính xác
                </div>
              </div>
              <div className="w-px bg-white/15" />
              <div className="transition-transform hover:-translate-y-1">
                <div className="text-[1.75rem] font-semibold leading-none text-white">
                  24/7
                </div>
                <div className="mt-1 text-[0.75rem] font-light tracking-wide text-white/55">
                  Giám sát liên tục
                </div>
              </div>
              <div className="w-px bg-white/15" />
              <div className="transition-transform hover:-translate-y-1">
                <div className="text-[1.75rem] font-semibold leading-none text-white">
                  3×
                </div>
                <div className="mt-1 text-[0.75rem] font-light tracking-wide text-white/55">
                  Hiệu suất tăng
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* ── RIGHT PANEL ── */}
        <div className="flex w-full items-center justify-center px-6 py-10 min-[960px]:w-[480px]">
          <div className="relative w-full max-w-[400px]">
            {/* Aesthetic Decoration */}
            <div className="pointer-events-none absolute -top-20 -right-20 h-[280px] w-[280px] rounded-full bg-[radial-gradient(circle,rgba(0,119,192,0.06)_0%,transparent_70%)]" />
            <div className="pointer-events-none absolute -bottom-24 -left-16 h-[200px] w-[200px] rounded-full bg-[radial-gradient(circle,rgba(245,130,31,0.07)_0%,transparent_70%)]" />

            {/* Logo Section */}
            <div className="mb-10 flex items-center gap-3">
              <img
                src={logoAiEbike}
                alt="AI EBIKE"
                className="h-[42px] object-contain"
              />
            </div>

            {/* Form Header */}
            <div className="mb-10">
              <h1 className="mb-1.5 font-['Playfair_Display',serif] text-3xl tracking-tight text-[#1a2332]">
                Chào mừng trở lại
              </h1>
              <p className="text-[0.85rem] font-light text-[#8a95a3]">
                Đăng nhập để vào hệ thống quản lý sản xuất
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Employee Code Field */}
              <div className="group space-y-2">
                <label
                  htmlFor="code"
                  className="block text-[0.78rem] font-medium tracking-widest text-[#5a6475] uppercase transition-colors group-focus-within:text-[#0077c0]"
                >
                  Mã nhân viên
                </label>
                <div className="relative">
                  <input
                    id="code"
                    type="text"
                    placeholder="Nhập mã nhân viên"
                    className="h-[52px] w-full rounded-xl border-1.5 border-[#e2e5ea] bg-white px-4 text-[0.9rem] text-[#1a2332] outline-none transition-all placeholder:text-[#b8bec8] focus:border-[#0077c0] focus:ring-4 focus:ring-[#0077c0]/8 disabled:bg-[#f8f9fb] disabled:text-[#adb5bd]"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    disabled={loginMutation.isPending}
                    autoComplete="username"
                    autoFocus
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="group space-y-2">
                <label
                  htmlFor="password"
                  className="block text-[0.78rem] font-medium tracking-widest text-[#5a6475] uppercase transition-colors group-focus-within:text-[#0077c0]"
                >
                  Mật khẩu
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Nhập mật khẩu"
                    className="h-[52px] w-full rounded-xl border-1.5 border-[#e2e5ea] bg-white pl-4 pr-12 text-[0.9rem] text-[#1a2332] outline-none transition-all placeholder:text-[#b8bec8] focus:border-[#0077c0] focus:ring-4 focus:ring-[#0077c0]/8 disabled:bg-[#f8f9fb] disabled:text-[#adb5bd]"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loginMutation.isPending}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="absolute top-1/2 right-3.5 -translate-y-1/2 rounded-full p-1.5 text-[#b8bec8] hover:bg-[#0077c0]/5 hover:text-[#0077c0] transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <Link
                  to="/forgot-password"
                  title="Quên mật khẩu?"
                  className="block text-right text-[0.8rem] font-semibold text-[#f5821f] transition-opacity hover:opacity-75"
                >
                  Quên mật khẩu?
                </Link>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loginMutation.isPending}
                className="flex h-[52px] w-full items-center justify-center gap-2.5 rounded-xl border-none bg-linear-to-br from-[#0077c0] via-[#0077c0] to-[#005fa3] text-[0.9rem] font-semibold tracking-wide text-white shadow-[0_4px_20px_rgba(0,119,192,0.28)] transition-all hover:-translate-y-0.5 hover:shadow-[0_6px_24px_rgba(0,119,192,0.36)] active:translate-y-0 active:shadow-sm disabled:opacity-65 disabled:cursor-not-allowed group/btn mt-8"
              >
                {loginMutation.isPending ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Đang đăng nhập...
                  </>
                ) : (
                  <>
                    Đăng nhập
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/18 transition-transform group-hover/btn:translate-x-0.5">
                      <ArrowRight size={11} />
                    </span>
                  </>
                )}
              </button>
            </form>

            {/* Form Footer */}
            <div className="mt-10 text-center text-[0.78rem] font-light text-[#a8b0bb]">
              © 2026 AI EBIKE · Hệ thống quản lý sản xuất
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
