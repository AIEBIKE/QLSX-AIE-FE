import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle,
  Trophy,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as api from "../../services/api";
import { Registration } from "../../types";

export default function CompleteRegistrationPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [actualQuantity, setActualQuantity] = useState<number | null>(null);
  const [interruptionMinutes, setInterruptionMinutes] = useState(0);
  const [interruptionNote, setInterruptionNote] = useState("");

  const { data: registration, isLoading: loading } = useQuery<Registration | null>({
    queryKey: ["registration", id],
    queryFn: async () => {
      const res = await api.getTodayRegistrations();
      const reg = res.data.data?.find((r: any) => r._id === id);
      if (reg) {
        // If already completed, redirect back
        if (reg.status === "completed") {
          toast.info("Đăng ký này đã hoàn thành");
          navigate("/worker");
          return null;
        }
        // If still registered, auto-start it
        if (reg.status === "registered") {
          try {
            await api.startRegistration(id || "");
            reg.status = "in_progress";
          } catch (err: any) {
            console.error("Auto-start failed:", err);
          }
        }
        if (reg.actualQuantity !== null && reg.actualQuantity !== undefined) {
          setActualQuantity(reg.actualQuantity);
          setInterruptionNote(reg.interruptionNote || "");
          setInterruptionMinutes(reg.interruptionMinutes || 0);
        }
      }
      return (reg as Registration) ?? null;
    },
    enabled: !!id,
  });

  const submitMutation = useMutation({
    mutationFn: () =>
      api.completeRegistration(id || "", {
        quantity: actualQuantity!,
        interruptionNote: interruptionNote || "",
        interruptionMinutes: interruptionMinutes || 0,
      } as any),
    onSuccess: () => {
      toast.success("Đã lưu thành công!");
      queryClient.invalidateQueries({ queryKey: ["workerDashboard"] });
      navigate("/worker");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error?.message || "Có lỗi xảy ra");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (submitMutation.isPending || actualQuantity === null) return;
    submitMutation.mutate();
  };

  const calculateResult = () => {
    if (!registration || actualQuantity === null) return null;
    const expected =
      registration.adjustedExpectedQty || registration.expectedQuantity;
    const deviation = actualQuantity - expected;
    return { expected, actual: actualQuantity, deviation };
  };

  const result = calculateResult();

  if (loading)
    return (
      <div className="flex items-center justify-center h-[300px]">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );

  if (!registration) {
    return (
      <div className="max-w-[600px] mx-auto text-center py-20">
        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-bold mb-2">Không tìm thấy đăng ký</h3>
        <Button
          onClick={() => navigate("/worker")}
          className="bg-[#0077c0] hover:bg-[#005f9e]"
        >
          Quay lại Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-[600px] mx-auto">
      <Button
        variant="link"
        className="p-0 mb-4 text-slate-600"
        onClick={() => navigate("/worker")}
      >
        <ArrowLeft className="w-4 h-4 mr-1" /> Quay lại Dashboard
      </Button>

      <h2 className="text-2xl font-bold mb-6">📝 Nhập Sản Lượng Cuối Ngày</h2>

      {/* Operation Info */}
      <Card className="mb-6 border-slate-200">
        <CardContent className="pt-5">
          <p className="text-sm text-slate-500">Thao tác</p>
          <h3 className="text-xl font-bold mt-1 mb-1">
            {typeof registration.operationId === "object"
              ? registration.operationId.name
              : registration.operationId}
          </h3>
          <p className="text-sm text-slate-400">
            {typeof registration.operationId === "object"
              ? registration.operationId.code
              : ""}
          </p>
          <div className="mt-4 p-4 bg-blue-50 rounded-lg text-center">
            <p className="text-sm text-slate-500">Sản lượng quy định</p>
            <p className="text-3xl font-bold text-[#0077c0] mt-1">
              {registration.adjustedExpectedQty ||
                registration.expectedQuantity}
            </p>
            {registration.adjustedExpectedQty && (
              <p className="text-xs text-slate-400 mt-1">
                (Đã điều chỉnh từ {registration.expectedQuantity})
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Form */}
      <Card className="border-slate-200">
        <CardContent className="pt-5">
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="text-base font-bold block mb-2">
                Số lượng đã làm được *
              </label>
              <input
                type="number"
                min={0}
                autoFocus
                required
                value={actualQuantity ?? ""}
                onChange={(e) =>
                  setActualQuantity(
                    e.target.value ? Number(e.target.value) : null,
                  )
                }
                className="w-full h-14 text-center text-2xl font-bold border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0077c0]/30 focus:border-[#0077c0]"
              />
            </div>

            {/* Result Preview */}
            {result && (
              <div
                className={`mb-6 p-4 rounded-lg text-center ${
                  result.deviation > 0
                    ? "bg-emerald-50 border border-emerald-200"
                    : result.deviation < 0
                      ? "bg-red-50 border border-red-200"
                      : "bg-blue-50 border border-blue-200"
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  {result.deviation > 0 ? (
                    <Trophy className="w-5 h-5 text-emerald-600" />
                  ) : result.deviation < 0 ? (
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                  ) : (
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                  )}
                  <span
                    className={`font-semibold ${
                      result.deviation > 0
                        ? "text-emerald-700"
                        : result.deviation < 0
                          ? "text-red-700"
                          : "text-blue-700"
                    }`}
                  >
                    {result.deviation > 0
                      ? `🎉 Vượt ${result.deviation} sản phẩm!`
                      : result.deviation < 0
                        ? `⚠️ Thiếu ${Math.abs(result.deviation)} sản phẩm`
                        : `✅ Đạt đúng chỉ tiêu!`}
                  </span>
                </div>
              </div>
            )}

            {/* Interruption Section */}
            <div className="border-t pt-4 mb-6">
              <p className="text-sm text-center text-slate-400 mb-4">
                Nếu có gián đoạn (tùy chọn)
              </p>
              <div className="mb-4">
                <label className="text-sm text-slate-600 block mb-1">
                  Thời gian gián đoạn (phút)
                </label>
                <input
                  type="number"
                  min={0}
                  value={interruptionMinutes}
                  onChange={(e) =>
                    setInterruptionMinutes(Number(e.target.value))
                  }
                  placeholder="0"
                  className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0077c0]/20"
                />
              </div>
              <div className="mb-4">
                <label className="text-sm text-slate-600 block mb-1">
                  Lý do gián đoạn
                </label>
                <textarea
                  rows={2}
                  value={interruptionNote}
                  onChange={(e) => setInterruptionNote(e.target.value)}
                  placeholder="VD: Chờ công đoạn trước, máy hỏng..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0077c0]/20 resize-none"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={submitMutation.isPending || actualQuantity === null}
              className="w-full h-[50px] text-base bg-emerald-500 hover:bg-emerald-600"
            >
              {submitMutation.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
              ) : (
                <CheckCircle className="w-5 h-5 mr-2" />
              )}
              Xác Nhận Hoàn Thành
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
