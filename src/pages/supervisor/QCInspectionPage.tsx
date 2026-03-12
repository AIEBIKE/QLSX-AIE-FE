import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import {
  Shield,
  Search,
  ArrowLeft,
  Save,
  Loader2,
  AlertCircle,
  Filter,
  ClipboardList,
  Info,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as api from "../../services/api";
import dayjs from "dayjs";
import * as apiHooks from "../../hooks/useMutations";

export default function QCInspectionPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // --- Vehicle info state ---
  const [frameNumber, setFrameNumber] = useState("");
  const [engineNumber, setEngineNumber] = useState("");
  const [color, setColor] = useState("");
  const [inspectionDate, setInspectionDate] = useState(
    dayjs().format("YYYY-MM-DD")
  );

  // --- Filter state ---
  const [selectedProcessId, setSelectedProcessId] = useState<string>("all");
  const [searchOperation, setSearchOperation] = useState("");

  // --- Results state ---
  const [results, setResults] = useState<
    Record<string, { status: "pass" | "fail"; note?: string }>
  >({});

  // --- Prefix / auto-index ---
  const [framePrefix, setFramePrefix] = useState("");
  const [enginePrefix, setEnginePrefix] = useState("");
  const [autoIndex, setAutoIndex] = useState(1);

  const user = JSON.parse(
    localStorage.getItem("user") || Cookies.get("user") || "{}"
  );
  const roleCode = user.roleCode || user.role;
  const isSupervisor =
    roleCode === "SUPERVISOR" || roleCode === "ADMIN" || roleCode === "FAC_MANAGER";

  // --- Auto-load active production order ---
  const { data: activeOrderData, isLoading: loadingOrder } = useQuery({
    queryKey: ["activeProductionOrder"],
    queryFn: async () => {
      const res = await api.getActiveProductionOrder();
      return res.data.data; // null nếu không có
    },
  });

  const activeOrder = activeOrderData || null;
  const activeOrderId = activeOrder?._id || null;

  // --- Load operations từ loại xe của lệnh ---
  const vehicleTypeId = useMemo(() => {
    if (!activeOrder) return null;
    const vt = activeOrder.vehicleType || activeOrder.vehicleTypeId;
    return vt && typeof vt === "object" ? (vt as any)._id : vt;
  }, [activeOrder]);

  const { data: opsData, isLoading: loadingOps } = useQuery({
    queryKey: ["operationsForQC", vehicleTypeId],
    queryFn: async () => {
      const res = await api.getOperations({ vehicleTypeId });
      return res.data.data;
    },
    enabled: !!vehicleTypeId,
  });

  const operations: any[] = opsData || [];

  // Extract unique processes from operations
  const processes = useMemo(() => {
    const map = new Map<string, { _id: string; name: string }>();
    operations.forEach((op: any) => {
      const proc = op.processId || op.process;
      if (proc && typeof proc === "object") {
        map.set(proc._id, { _id: proc._id, name: proc.name });
      }
    });
    return Array.from(map.values());
  }, [operations]);

  // Filtered operations
  const filteredOperations = useMemo(() => {
    return operations.filter((op: any) => {
      const proc = op.processId || op.process;
      const procId = proc && typeof proc === "object" ? proc._id : proc;
      const matchProcess =
        selectedProcessId === "all" || procId === selectedProcessId;
      const matchSearch =
        !searchOperation ||
        op.name.toLowerCase().includes(searchOperation.toLowerCase());
      return matchProcess && matchSearch;
    });
  }, [operations, selectedProcessId, searchOperation]);

  // Initialize results when operations change
  useEffect(() => {
    if (operations.length > 0 && Object.keys(results).length === 0) {
      const init: any = {};
      operations.forEach((op: any) => {
        init[op._id] = { status: "pass", note: "" };
      });
      setResults(init);
    }
  }, [operations]);

  const handleStatusChange = (opId: string, status: "pass" | "fail") => {
    setResults((prev) => ({ ...prev, [opId]: { ...prev[opId], status } }));
  };
  const handleNoteChange = (opId: string, note: string) => {
    setResults((prev) => ({ ...prev, [opId]: { ...prev[opId], note } }));
  };

  const inspectMutation = useMutation({
    mutationFn: (payload: any) => api.inspectVehicle(payload),
    onSuccess: () => {
      toast.success("Đã lưu phiếu kiểm duyệt!");
      queryClient.invalidateQueries({ queryKey: ["qcList"] });

      const nextIndex = autoIndex + 1;
      setAutoIndex(nextIndex);

      setFrameNumber(
        framePrefix ? `${framePrefix}-${String(nextIndex).padStart(3, "0")}` : ""
      );
      setEngineNumber(
        enginePrefix ? `${enginePrefix}-${String(nextIndex).padStart(3, "0")}` : ""
      );
      setColor("");

      // Reset results
      const reset: any = {};
      operations.forEach((op: any) => {
        reset[op._id] = { status: "pass", note: "" };
      });
      setResults(reset);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error?.message || "Lỗi khi lưu phiếu");
    },
  });

  const handleSubmit = () => {
    if (!frameNumber) {
      toast.error("Vui lòng nhập số khung");
      return;
    }
    if (!activeOrderId) {
      toast.error("Không có lệnh sản xuất đang hoạt động");
      return;
    }
    const payload = {
      productionOrderId: activeOrderId,
      frameNumber,
      engineNumber,
      color,
      inspectionDate,
      results: Object.entries(results).map(([opId, data]) => {
        const op = operations.find((o: any) => o._id === opId);
        const proc = op?.processId || op?.process;
        return {
          operationId: opId,
          operationName: op?.name || "",
          processId: proc && typeof proc === "object" ? proc._id : proc,
          processName: proc && typeof proc === "object" ? proc.name : "",
          status: data.status,
          note: data.note,
        };
      }),
    };
    inspectMutation.mutate(payload);
  };

  const failCount = Object.values(results).filter((r) => r.status === "fail").length;

  const isLoading = loadingOrder || loadingOps;

  // --- Render ---
  if (loadingOrder) {
    return (
      <div className="flex justify-center p-20">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Shield className="w-6 h-6 text-emerald-600" />
              Tạo phiếu kiểm duyệt
            </h1>
            {activeOrder && (
              <p className="text-sm text-slate-500 mt-0.5">
                Lệnh:{" "}
                <strong>{activeOrder.orderCode || (activeOrder as any).name}</strong>
                {" "}
                <Badge variant="outline" className="text-xs ml-1 bg-emerald-50 text-emerald-700 border-emerald-200">
                  Đang sản xuất
                </Badge>
              </p>
            )}
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() => navigate("/admin/qc/list")}
          className="gap-2"
        >
          <ClipboardList className="w-4 h-4" />
          Danh sách phiếu
        </Button>
      </div>

      {/* No active order */}
      {!activeOrder ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-700 mb-2">
                Không có lệnh sản xuất đang hoạt động
              </h3>
              <p className="text-slate-500 text-sm">
                Hiện tại nhà máy chưa có lệnh sản xuất nào ở trạng thái{" "}
                <strong>Đang sản xuất</strong>.
              </p>
              <p className="text-slate-400 text-xs mt-1">
                Vui lòng liên hệ Quản lý nhà máy để bắt đầu lệnh sản xuất.
              </p>
              <Button
                variant="outline"
                className="mt-5"
                onClick={() => navigate("/admin/orders")}
              >
                Xem danh sách lệnh sản xuất
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Vehicle Info Card */}
          <Card>
            <CardHeader>
              <CardTitle>Thông tin xe</CardTitle>
              <CardDescription>
                Nhập thông tin nhận dạng phương tiện cho phiếu kiểm duyệt
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Frame Number */}
                <div className="space-y-2">
                  <Label>Số khung *</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Prefix (VD: XDD)"
                      value={framePrefix}
                      onChange={(e) => {
                        setFramePrefix(e.target.value);
                        if (e.target.value) {
                          setFrameNumber(
                            `${e.target.value}-${String(autoIndex).padStart(3, "0")}`
                          );
                        }
                      }}
                      className="w-24"
                    />
                    <Input
                      placeholder="VD: XDD-001"
                      value={frameNumber}
                      onChange={(e) => setFrameNumber(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>

                {/* Engine Number */}
                <div className="space-y-2">
                  <Label>Số động cơ</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Prefix (VD: DC)"
                      value={enginePrefix}
                      onChange={(e) => {
                        setEnginePrefix(e.target.value);
                        if (e.target.value) {
                          setEngineNumber(
                            `${e.target.value}-${String(autoIndex).padStart(3, "0")}`
                          );
                        }
                      }}
                      className="w-24"
                    />
                    <Input
                      placeholder="VD: DC-001"
                      value={engineNumber}
                      onChange={(e) => setEngineNumber(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>

                {/* Color */}
                <div className="space-y-2">
                  <Label>Màu xe</Label>
                  <Input
                    placeholder="VD: Đỏ đen"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                  />
                </div>

                {/* Inspection Date */}
                <div className="space-y-2">
                  <Label>Ngày kiểm duyệt</Label>
                  <Input
                    type="date"
                    value={inspectionDate}
                    onChange={(e) => setInspectionDate(e.target.value)}
                  />
                </div>
              </div>

              {/* Order info */}
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <div className="grid grid-cols-2 gap-x-6 gap-y-1 flex-1">
                  <div>
                    <span className="text-slate-500">Loại xe:</span>{" "}
                    <strong>
                      {typeof activeOrder.vehicleType === "object"
                        ? (activeOrder.vehicleType as any).name
                        : typeof (activeOrder as any).vehicleTypeId === "object"
                        ? (activeOrder as any).vehicleTypeId?.name
                        : "—"}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Số lượng:</span>{" "}
                    <strong>{activeOrder.quantity} xe</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Mã lệnh:</span>{" "}
                    <strong>{(activeOrder as any).orderCode}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Xe tiếp theo:</span>{" "}
                    <strong className="text-[#0077c0]">#{autoIndex}</strong>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Operations Checklist */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle>Danh mục kiểm tra thao tác</CardTitle>
                  <CardDescription>
                    Mặc định = PASS. Chỉ bấm FAIL khi phát hiện lỗi.
                  </CardDescription>
                </div>
                {failCount > 0 && (
                  <Badge variant="destructive" className="text-sm">
                    {failCount} lỗi
                  </Badge>
                )}
              </div>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <div className="flex items-center gap-2 flex-1">
                  <Filter className="w-4 h-4 text-slate-400 shrink-0" />
                  <Select
                    value={selectedProcessId}
                    onValueChange={setSelectedProcessId}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Lọc theo công đoạn" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả công đoạn</SelectItem>
                      {processes.map((p) => (
                        <SelectItem key={p._id} value={p._id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2 flex-1">
                  <Search className="w-4 h-4 text-slate-400 shrink-0" />
                  <Input
                    placeholder="Tìm thao tác..."
                    value={searchOperation}
                    onChange={(e) => setSearchOperation(e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {loadingOps ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="animate-spin text-slate-300" />
                </div>
              ) : filteredOperations.length === 0 ? (
                <div className="text-center py-10 text-slate-400">
                  Không có thao tác nào phù hợp
                </div>
              ) : (
                <div className="divide-y">
                  {filteredOperations.map((op: any) => {
                    const proc = op.processId || op.process;
                    const procName =
                      proc && typeof proc === "object" ? proc.name : "";
                    return (
                      <div
                        key={op._id}
                        className={`p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${
                          results[op._id]?.status === "fail" ? "bg-red-50" : ""
                        }`}
                      >
                        <div className="flex-1">
                          <div className="font-semibold text-sm">{op.name}</div>
                          {procName && (
                            <div className="text-xs text-slate-400 mt-0.5">
                              📌 {procName}
                            </div>
                          )}
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
                              Đạt
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
                              Lỗi
                            </button>
                          </div>
                          <Input
                            placeholder="Ghi chú lỗi..."
                            className="text-xs w-44"
                            value={results[op._id]?.note || ""}
                            disabled={
                              !isSupervisor ||
                              results[op._id]?.status !== "fail"
                            }
                            onChange={(e) =>
                              handleNoteChange(op._id, e.target.value)
                            }
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-between gap-3">
            <Button
              variant="outline"
              onClick={() => navigate("/admin/qc/list")}
            >
              <ClipboardList className="w-4 h-4 mr-2" />
              Xem danh sách phiếu
            </Button>
            {isSupervisor && (
              <Button
                className="bg-[#0077c0] hover:bg-[#005f9e]"
                onClick={handleSubmit}
                // disabled={submitting}
              >
                {/* {submitting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )} */}
                Lưu phiếu kiểm duyệt
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
}