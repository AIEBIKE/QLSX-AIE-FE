import { useState, useEffect, useMemo } from "react";
import Cookies from "js-cookie";
import { Save, Loader2, AlertCircle, Filter, Search, Info } from "lucide-react";
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

interface QCCreateFormProps {
  onSuccess?: () => void;
}

export default function QCCreateForm({ onSuccess }: QCCreateFormProps) {
  const queryClient = useQueryClient();

  const [frameNumber, setFrameNumber] = useState("");
  const [engineNumber, setEngineNumber] = useState("");
  const [color, setColor] = useState("");
  const [inspectionDate, setInspectionDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [selectedProcessId, setSelectedProcessId] = useState<string>("all");
  const [searchOperation, setSearchOperation] = useState("");
  const [results, setResults] = useState<Record<string, { status: "pass" | "fail"; note?: string }>>({});
  const [framePrefix, setFramePrefix] = useState("");
  const [enginePrefix, setEnginePrefix] = useState("");
  const [autoIndex, setAutoIndex] = useState(1);
  const [opPage, setOpPage] = useState(1);
  const OPS_PER_PAGE = 6;


  const user = JSON.parse(localStorage.getItem("user") || Cookies.get("user") || "{}");
  const roleCode = user.roleCode || user.role;
  const isSupervisor = roleCode === "SUPERVISOR" || roleCode === "ADMIN" || roleCode === "FAC_MANAGER";

  // Load active order
  const { data: activeOrder, isLoading: loadingOrder } = useQuery({
    queryKey: ["activeProductionOrder"],
    queryFn: async () => {
      const res = await api.getActiveProductionOrder();
      return res.data.data;
    },
  });

  const activeOrderId = activeOrder?._id || null;

  const vehicleTypeId = useMemo(() => {
    if (!activeOrder) return null;
    const vt = activeOrder.vehicleType || (activeOrder as any).vehicleTypeId;
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

  const processes = useMemo(() => {
    const map = new Map<string, { _id: string; name: string }>();
    operations.forEach((op: any) => {
      const proc = op.processId || op.process;
      if (proc && typeof proc === "object") map.set(proc._id, { _id: proc._id, name: proc.name });
    });
    return Array.from(map.values());
  }, [operations]);

  const filteredOperations = useMemo(() => {
    return operations.filter((op: any) => {
      const proc = op.processId || op.process;
      const procId = proc && typeof proc === "object" ? proc._id : proc;
      const matchProcess = selectedProcessId === "all" || procId === selectedProcessId;
      const matchSearch = !searchOperation || op.name.toLowerCase().includes(searchOperation.toLowerCase());
      return matchProcess && matchSearch;
    });
  }, [operations, selectedProcessId, searchOperation]);

  // Reset về trang 1 khi filter thay đổi
  useEffect(() => { setOpPage(1); }, [selectedProcessId, searchOperation]);

  const opTotalPages = Math.ceil(filteredOperations.length / OPS_PER_PAGE);
  const pagedOperations = filteredOperations.slice((opPage - 1) * OPS_PER_PAGE, opPage * OPS_PER_PAGE);


  useEffect(() => {
    if (operations.length > 0 && Object.keys(results).length === 0) {
      const init: any = {};
      operations.forEach((op: any) => { init[op._id] = { status: "pass", note: "" }; });
      setResults(init);
    }
  }, [operations]);

  // Auto-fill prefix từ lệnh sản xuất
  useEffect(() => {
    if (!activeOrder) return;

    // Ưu tiên lấy tiền tố trực tiếp từ DB (lệnh mới)
    const directFramePrefix = (activeOrder as any).frameNumberPrefix;
    const directEnginePrefix = (activeOrder as any).engineNumberPrefix;

    // Fallback: tách từ phần tử đầu tiên của array (lệnh cũ)
    const extractPrefix = (val: string) => {
      const match = val.match(/^(.+)-\d+$/);
      return match ? match[1] : "";
    };
    const frames: string[] = (activeOrder as any).frameNumbers || [];
    const engines: string[] = (activeOrder as any).engineNumbers || [];

    const fp = directFramePrefix || (frames.length > 0 ? extractPrefix(frames[0]) : "");
    const ep = directEnginePrefix || (engines.length > 0 ? extractPrefix(engines[0]) : "");

    if (fp) {
      setFramePrefix(fp);
      setFrameNumber(`${fp}-${String(autoIndex).padStart(3, "0")}`);
    }
    if (ep) {
      setEnginePrefix(ep);
      setEngineNumber(`${ep}-${String(autoIndex).padStart(3, "0")}`);
    }
  }, [activeOrder]);



  const handleStatusChange = (opId: string, status: "pass" | "fail") =>
    setResults((prev) => ({ ...prev, [opId]: { ...prev[opId], status } }));

  const handleNoteChange = (opId: string, note: string) =>
    setResults((prev) => ({ ...prev, [opId]: { ...prev[opId], note } }));

  const inspectMutation = useMutation({
    mutationFn: (payload: any) => api.inspectVehicle(payload),
    onSuccess: () => {
      toast.success("Đã lưu phiếu kiểm duyệt!");
      queryClient.invalidateQueries({ queryKey: ["qcList"] });

      const nextIndex = autoIndex + 1;
      setAutoIndex(nextIndex);
      setFrameNumber(framePrefix ? `${framePrefix}-${String(nextIndex).padStart(3, "0")}` : "");
      setEngineNumber(enginePrefix ? `${enginePrefix}-${String(nextIndex).padStart(3, "0")}` : "");
      setColor("");

      const reset: any = {};
      operations.forEach((op: any) => { reset[op._id] = { status: "pass", note: "" }; });
      setResults(reset);

      onSuccess?.();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error?.message || "Lỗi khi lưu phiếu");
    },
  });

  const handleSubmit = () => {
    if (!frameNumber) { toast.error("Vui lòng nhập số khung"); return; }
    if (!activeOrderId) { toast.error("Không có lệnh sản xuất đang hoạt động"); return; }

    inspectMutation.mutate({
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
    });
  };

  const failCount = Object.values(results).filter((r) => r.status === "fail").length;

  if (loadingOrder) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="animate-spin text-slate-300" />
      </div>
    );
  }

  if (!activeOrder) {
    return (
      <div className="text-center py-12 px-4">
        <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-700 mb-2">
          Không có lệnh sản xuất đang hoạt động
        </h3>
        <p className="text-slate-500 text-sm">
          Nhà máy chưa có lệnh nào ở trạng thái <strong>Đang sản xuất</strong>.
        </p>
        <p className="text-slate-400 text-xs mt-1">
          Vui lòng liên hệ Quản lý nhà máy để bắt đầu lệnh sản xuất.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5 p-4">
      {/* Order info banner */}
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm flex items-start gap-2">
        <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
        <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 flex-1 text-xs">
          <div><span className="text-slate-500">Lệnh:</span> <strong>{(activeOrder as any).orderCode}</strong></div>
          <div><span className="text-slate-500">Loại xe:</span> <strong>
            {(() => {
              const vt = activeOrder.vehicleType || (activeOrder as any).vehicleTypeId;
              return vt && typeof vt === "object" ? (vt as any).name : "—";
            })()}
          </strong></div>
          <div><span className="text-slate-500">Số lượng:</span> <strong>{activeOrder.quantity} xe</strong></div>
          <div><span className="text-slate-500">Xe tiếp theo:</span> <strong className="text-[#0077c0]">#{autoIndex}</strong></div>
        </div>
      </div>

      {/* Vehicle info */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Số khung *</Label>
          <div className="flex gap-1.5">
            <Input
              placeholder="Prefix"
              value={framePrefix}
              onChange={(e) => {
                setFramePrefix(e.target.value);
                if (e.target.value) setFrameNumber(`${e.target.value}-${String(autoIndex).padStart(3, "0")}`);
              }}
              className="w-20 text-xs"
            />
            <Input
              placeholder="VD: XDD-001"
              value={frameNumber}
              onChange={(e) => setFrameNumber(e.target.value)}
              className="flex-1 text-xs"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Số động cơ</Label>
          <div className="flex gap-1.5">
            <Input
              placeholder="Prefix"
              value={enginePrefix}
              onChange={(e) => {
                setEnginePrefix(e.target.value);
                if (e.target.value) setEngineNumber(`${e.target.value}-${String(autoIndex).padStart(3, "0")}`);
              }}
              className="w-20 text-xs"
            />
            <Input
              placeholder="VD: DC-001"
              value={engineNumber}
              onChange={(e) => setEngineNumber(e.target.value)}
              className="flex-1 text-xs"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Màu xe</Label>
          <Input placeholder="VD: Đỏ đen" value={color} onChange={(e) => setColor(e.target.value)} className="text-xs" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Ngày kiểm duyệt</Label>
          <Input type="date" value={inspectionDate} onChange={(e) => setInspectionDate(e.target.value)} className="text-xs" />
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <div className="flex items-center gap-1.5 flex-1">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <Select value={selectedProcessId} onValueChange={setSelectedProcessId}>
            <SelectTrigger className="text-xs h-8">
              <SelectValue placeholder="Công đoạn" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả công đoạn</SelectItem>
              {processes.map((p) => (
                <SelectItem key={p._id} value={p._id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-1.5 flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <Input
            placeholder="Tìm thao tác..."
            value={searchOperation}
            onChange={(e) => setSearchOperation(e.target.value)}
            className="text-xs h-8"
          />
        </div>
        {failCount > 0 && (
          <Badge variant="destructive" className="shrink-0 self-center">{failCount} lỗi</Badge>
        )}
      </div>

      {/* Operations list */}
      <div className="border rounded-lg overflow-hidden">
        {loadingOps ? (
          <div className="flex justify-center py-8">
            <Loader2 className="animate-spin text-slate-300" />
          </div>
        ) : filteredOperations.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">Không có thao tác phù hợp</div>
        ) : (
          <div className="divide-y">
            {pagedOperations.map((op: any) => {
              const proc = op.processId || op.process;
              const procName = proc && typeof proc === "object" ? proc.name : "";
              const isFail = results[op._id]?.status === "fail";
              return (
                <div
                  key={op._id}
                  className={`px-4 py-3 flex items-center justify-between gap-3 transition-colors ${isFail ? "bg-red-50" : ""}`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-xs truncate">{op.name}</div>
                    {procName && <div className="text-[10px] text-slate-400">📌 {procName}</div>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex bg-slate-100 p-0.5 rounded-md">
                      <button
                        onClick={() => isSupervisor && handleStatusChange(op._id, "pass")}
                        className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                          !isFail ? "bg-emerald-500 text-white shadow-sm" : "text-slate-500 hover:text-slate-700"
                        }`}
                      >PASS</button>
                      <button
                        onClick={() => isSupervisor && handleStatusChange(op._id, "fail")}
                        className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                          isFail ? "bg-red-500 text-white shadow-sm" : "text-slate-500 hover:text-slate-700"
                        }`}
                      >FAIL</button>
                    </div>
                    <Input
                      placeholder="Ghi chú..."
                      className="text-[11px] w-32 h-7"
                      value={results[op._id]?.note || ""}
                      disabled={!isFail}
                      onChange={(e) => handleNoteChange(op._id, e.target.value)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {opTotalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>Trang {opPage}/{opTotalPages} ({filteredOperations.length} thao tác)</span>
          <div className="flex gap-1">
            <button
              disabled={opPage <= 1}
              onClick={() => setOpPage((p) => p - 1)}
              className="px-2 py-1 rounded border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
            >←</button>
            {Array.from({ length: opTotalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setOpPage(p)}
                className={`px-2 py-1 rounded border text-xs ${
                  p === opPage
                    ? "bg-[#0077c0] text-white border-[#0077c0]"
                    : "border-slate-200 hover:bg-slate-50"
                }`}
              >{p}</button>
            ))}
            <button
              disabled={opPage >= opTotalPages}
              onClick={() => setOpPage((p) => p + 1)}
              className="px-2 py-1 rounded border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
            >→</button>
          </div>
        </div>
      )}


      {/* Submit */}
      {isSupervisor && (
        <Button
          className="w-full bg-[#0077c0] hover:bg-[#005f9e]"
          onClick={handleSubmit}
          disabled={inspectMutation.isPending}
        >
          {inspectMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Lưu phiếu kiểm duyệt
        </Button>
      )}
    </div>
  );
}
