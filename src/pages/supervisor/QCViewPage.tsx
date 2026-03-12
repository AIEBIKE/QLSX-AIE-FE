import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Shield,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Filter,
  Search,
  ClipboardList,
  CheckCircle2,
  XCircle,
  Eye,
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
import * as queryHooks from "../../hooks/useQueries"; // [splinh-12/03-14:33]
import dayjs from "dayjs";

export default function QCViewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Filter state
  const [selectedProcessId, setSelectedProcessId] = useState<string>("all");
  const [searchOperation, setSearchOperation] = useState("");
  const [opPage, setOpPage] = useState(1);
  const OPS_PER_PAGE = 6;

  // Load QC detail
  const { data: qcData, isLoading: loadingQC } = queryHooks.useQCDetail(id); // [splinh-12/03-14:33]

  // Load all operations for the vehicle type from order
  const vehicleTypeId = useMemo(() => {
    const order = qcData?.productionOrderId;
    if (!order || typeof order !== "object") return null;
    const vt = (order as any).vehicleTypeId;
    if (!vt) return null;
    return typeof vt === "object" ? (vt as any)._id : vt;
  }, [qcData]);

  const { data: operations = [] } = queryHooks.useOperations({ vehicleTypeId }); // [splinh-12/03-14:33]

  // Build results map from qcData
  const results = useMemo(() => {
    if (!qcData) return {} as Record<string, { status: "pass" | "fail"; note: string }>;
    const map: Record<string, { status: "pass" | "fail"; note: string }> = {};
    (qcData.results || []).forEach((r: any) => {
      const opId =
        r.operationId && typeof r.operationId === "object"
          ? r.operationId._id
          : r.operationId;
      map[opId] = {
        status: r.status || "pass",
        note: r.note || "",
      };
    });
    return map;
  }, [qcData]);

  // Extract processes
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

  useEffect(() => { setOpPage(1); }, [selectedProcessId, searchOperation]);

  const opTotalPages = Math.ceil(filteredOperations.length / OPS_PER_PAGE);
  const pagedOperations = filteredOperations.slice((opPage - 1) * OPS_PER_PAGE, opPage * OPS_PER_PAGE);

  const failCount = Object.values(results).filter((r) => r.status === "fail").length;

  if (loadingQC)
    return (
      <div className="flex justify-center p-20">
        <Loader2 className="animate-spin" />
      </div>
    );

  if (!qcData)
    return (
      <div className="text-center py-20 text-slate-400">
        <AlertCircle className="w-10 h-10 mx-auto mb-3" />
        <p>Không tìm thấy phiếu kiểm duyệt</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => navigate("/admin/qc/list")}
        >
          Quay lại danh sách
        </Button>
      </div>
    );

  const order =
    typeof qcData.productionOrderId === "object"
      ? qcData.productionOrderId
      : null;

  const getStatusColor = (status: string) =>
    status === "pending"
      ? "bg-amber-100 text-amber-700 border-amber-200"
      : status === "passed"
      ? "bg-emerald-100 text-emerald-700 border-emerald-200"
      : "bg-red-100 text-red-700 border-red-200";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate("/admin/qc/list")}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Eye className="w-6 h-6 text-blue-600" />
              Chi tiết phiếu kiểm duyệt
            </h1>
            {order && (
              <p className="text-sm text-slate-500 mt-0.5">
                Lệnh: <strong>{(order as any).orderCode || (order as any).name}</strong>
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

      {/* Status Badge */}
      <div className="flex items-center gap-2">
        <Badge className={getStatusColor(qcData.status)}>
          {qcData.status === "pending"
            ? "⏳ Chờ kiểm duyệt"
            : qcData.status === "passed"
            ? "✅ Đạt"
            : "❌ Có lỗi"}
        </Badge>
        {failCount > 0 && (
          <span className="text-sm text-red-500 font-medium">{failCount} lỗi</span>
        )}
        <Badge variant="outline" className="text-slate-500 text-xs ml-auto">
          🔒 Chỉ xem
        </Badge>
      </div>

      {/* Vehicle Info */}
      <Card>
        <CardHeader>
          <CardTitle>Thông tin xe</CardTitle>
          <CardDescription>Thông tin nhận dạng xe</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-500 text-xs">Số khung</Label>
              <Input value={qcData.frameNumber || "—"} disabled className="font-mono bg-slate-50" />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-500 text-xs">Số động cơ</Label>
              <Input value={qcData.engineNumber || "—"} disabled className="font-mono bg-slate-50" />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-500 text-xs">Màu xe</Label>
              <Input value={qcData.color || "—"} disabled className="bg-slate-50" />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-500 text-xs">Ngày kiểm duyệt</Label>
              <Input
                value={qcData.inspectionDate ? dayjs(qcData.inspectionDate).format("DD/MM/YYYY") : "—"}
                disabled
                className="bg-slate-50"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Operations Checklist */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle>Kết quả kiểm tra thao tác</CardTitle>
              <CardDescription>
                Xem kết quả PASS/FAIL từng thao tác
              </CardDescription>
            </div>
            {failCount > 0 && (
              <Badge variant="destructive">{failCount} lỗi</Badge>
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
          {operations.length === 0 ? (
            <div className="flex justify-center py-10">
              <Loader2 className="animate-spin text-slate-300" />
            </div>
          ) : filteredOperations.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              Không có thao tác phù hợp
            </div>
          ) : (
            <div className="divide-y">
              {pagedOperations.map((op: any) => {
                const proc = op.processId || op.process;
                const procName =
                  proc && typeof proc === "object" ? proc.name : "";
                const r = results[op._id];
                const status = r?.status || "pass";
                return (
                  <div
                    key={op._id}
                    className={`p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                      status === "fail" ? "bg-red-50" : ""
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
                      {status === "pass" ? (
                        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Đạt
                        </Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-700 border-red-200 gap-1">
                          <XCircle className="w-3 h-3" />
                          Lỗi
                        </Badge>
                      )}
                      {r?.note && (
                        <span className="text-xs text-red-600 max-w-[150px] truncate" title={r.note}>
                          {r.note}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>

        {/* Pagination */}
        {opTotalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 text-xs text-slate-500">
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
      </Card>

      {/* Footer */}
      <div className="flex justify-start">
        <Button variant="outline" onClick={() => navigate("/admin/qc/list")}>
          ← Quay lại danh sách
        </Button>
      </div>
    </div>
  );
}
