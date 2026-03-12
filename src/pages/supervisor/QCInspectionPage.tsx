import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import {
  Shield,
  CheckCircle,
  XCircle,
  Search,
  ArrowLeft,
  Save,
  Loader2,
  AlertCircle,
} from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as api from "../../services/api";
import * as apiHooks from "../../hooks/useMutations";

export default function QCInspectionPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const orderIdFromQuery = queryParams.get("orderId");

  const queryClient = useQueryClient();

  const [frameNumber, setFrameNumber] = useState("");
  const [engineNumber, setEngineNumber] = useState("");
  const [color, setColor] = useState("");
  const [results, setResults] = useState<
    Record<string, { status: "pass" | "fail"; note?: string }>
  >({});
  const [framePrefix, setFramePrefix] = useState("");
  const [enginePrefix, setEnginePrefix] = useState("");
  const [autoIndex, setAutoIndex] = useState(1);
  const user = JSON.parse(
    localStorage.getItem("user") || Cookies.get("user") || "{}",
  );
  const roleCode = user.roleCode || user.role;
  const isSupervisor = roleCode === "SUPERVISOR";

  const { data: orderData, isLoading: loading } = useQuery({
    queryKey: ["qcOrder", orderIdFromQuery],
    queryFn: async () => {
      const res = await api.getProductionOrder(orderIdFromQuery!);
      const order = res.data.data;
      const vTypeId =
        typeof order.vehicleType === "object"
          ? (order.vehicleType as any)._id
          : order.vehicleType;
      const opRes = await api.getOperations({ vehicleTypeId: vTypeId });
      const ops = opRes.data.data;
      return { order, operations: ops };
    },
    enabled: !!orderIdFromQuery,
  });

  const activeOrder = orderData?.order || null;
  const operations = orderData?.operations || [];

  // Initialize results when operations change
  useEffect(() => {
    if (operations.length > 0 && Object.keys(results).length === 0) {
      const initialResults: any = {};
      operations.forEach((op: any) => {
        initialResults[op._id] = { status: "pass", note: "" };
      });
      setResults(initialResults);
    }
  }, [operations]);

  const handleStatusChange = (opId: string, status: "pass" | "fail") => {
    setResults((prev) => ({
      ...prev,
      [opId]: { ...prev[opId], status },
    }));
  };

  const handleNoteChange = (opId: string, note: string) => {
    setResults((prev) => ({
      ...prev,
      [opId]: { ...prev[opId], note },
    }));
  };

  const { mutate: inspectMutation, isPending: submitting } = apiHooks.useInspectVehicle();

  const handleSubmit = () => {
    if (!frameNumber) {
      toast.error("Vui lòng nhập số khung");
      return;
    }
    inspectMutation({
      frameNumber,
      engineNumber,
      color,
      results: Object.entries(results).map(([opId, data]) => ({
        operationId: opId,
        status: (data as any).status,
        note: (data as any).note,
      })),
    }, {
      onSuccess: () => {
        // Cập nhật Auto-increment một cách an toàn
        const nextIndex = autoIndex + 1;
        setAutoIndex(nextIndex);

        // Cập nhật số khung/số máy mới dựa trên Prefix
        if (framePrefix) {
          setFrameNumber(`${framePrefix}-${String(nextIndex).padStart(3, "0")}`);
        } else {
          setFrameNumber("");
        }

        if (enginePrefix) {
          setEngineNumber(`${enginePrefix}-${String(nextIndex).padStart(3, "0")}`);
        } else {
          setEngineNumber("");
        }

        // Reset kết quả kiểm tra để chuẩn bị cho xe tiếp theo
        const resetResults: any = {};
        operations.forEach((op: any) => {
          resetResults[op._id] = { status: "pass", note: "" };
        });
        setResults(resetResults);
        setColor("");
      }
    });
  };

  if (loading)
    return (
      <div className="flex justify-center p-20">
        <Loader2 className="animate-spin" />
      </div>
    );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="w-6 h-6 text-emerald-600" />
          Kiểm tra chất lượng (QC)
        </h1>
      </div>

      {!activeOrder ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-10">
              <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">
                Vui lòng chọn lệnh sản xuất để bắt đầu kiểm tra
              </p>
              <Button
                className="mt-4"
                onClick={() => navigate("/admin/production-orders")}
              >
                Danh sách lệnh sản xuất
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Thông tin xe</CardTitle>
              <CardDescription>
                Nhập thông tin nhận dạng phương tiện
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="frame">Số khung (Frame Number) *</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Prefix (VD: XDD)"
                      value={framePrefix}
                      onChange={(e) => {
                        setFramePrefix(e.target.value);
                        if (e.target.value) {
                          setFrameNumber(
                            `${e.target.value}-${String(autoIndex).padStart(3, "0")}`,
                          );
                        }
                      }}
                      disabled={!isSupervisor}
                      className="w-24"
                    />
                    <Input
                      id="frame"
                      placeholder="VD: FRAME-12345"
                      value={frameNumber}
                      disabled={!isSupervisor}
                      onChange={(e) => setFrameNumber(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="engine">Số máy (Engine Number)</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Prefix (VD: MS)"
                      value={enginePrefix}
                      onChange={(e) => {
                        setEnginePrefix(e.target.value);
                        if (e.target.value) {
                          setEngineNumber(
                            `${e.target.value}-${String(autoIndex).padStart(3, "0")}`,
                          );
                        }
                      }}
                      disabled={!isSupervisor}
                      className="w-24"
                    />
                    <Input
                      id="engine"
                      placeholder="VD: ENG-67890"
                      value={engineNumber}
                      disabled={!isSupervisor}
                      onChange={(e) => setEngineNumber(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="color">Màu sắc (Color)</Label>
                  <Input
                    id="color"
                    placeholder="VD: Đỏ đen"
                    value={color}
                    disabled={!isSupervisor}
                    onChange={(e) => setColor(e.target.value)}
                  />
                </div>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg text-sm grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-500">Lệnh:</span>{" "}
                  <strong>{activeOrder.orderCode || activeOrder.name}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Loại xe:</span>{" "}
                  <strong>
                    {typeof activeOrder.vehicleType === "object"
                      ? (activeOrder.vehicleType as any).name
                      : "—"}
                  </strong>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Danh mục kiểm tra</CardTitle>
              <CardDescription>
                Đánh giá Pass/Fail cho từng công đoạn
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {operations.map((op) => (
                  <div
                    key={op._id}
                    className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="flex-1">
                      <div className="font-semibold">{op.name}</div>
                      <div className="text-xs text-slate-500">
                        {typeof op.process === "object" 
                          ? op.process.name 
                          : (op as any).processId?.name}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex bg-slate-100 p-1 rounded-lg">
                        <button
                          onClick={() =>
                            isSupervisor && handleStatusChange(op._id, "pass")
                          }
                          disabled={!isSupervisor}
                          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                            results[op._id]?.status === "pass"
                              ? "bg-emerald-500 text-white shadow-sm"
                              : "text-slate-500 hover:text-slate-700"
                          } ${!isSupervisor && "cursor-not-allowed opacity-70"}`}
                        >
                          PASS
                        </button>
                        <button
                          onClick={() =>
                            isSupervisor && handleStatusChange(op._id, "fail")
                          }
                          disabled={!isSupervisor}
                          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                            results[op._id]?.status === "fail"
                              ? "bg-red-500 text-white shadow-sm"
                              : "text-slate-500 hover:text-slate-700"
                          } ${!isSupervisor && "cursor-not-allowed opacity-70"}`}
                        >
                          FAIL
                        </button>
                      </div>
                      <Input
                        placeholder="Ghi chú lỗi nếu có..."
                        className="text-xs w-48"
                        value={results[op._id]?.note}
                        disabled={!isSupervisor}
                        onChange={(e) =>
                          handleNoteChange(op._id, e.target.value)
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => navigate(-1)}>
              Hủy
            </Button>
            {isSupervisor && (
              <Button
                className="bg-[#0077c0] hover:bg-[#005f9e]"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Hoàn tất kiểm tra
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
