import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { ArrowLeft, Printer, Loader2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import * as api from "../../services/api";

const statusColors: Record<string, string> = {
  pending: "bg-slate-100 text-slate-600",
  in_progress: "bg-blue-100 text-blue-700",
  completed: "bg-emerald-100 text-emerald-700",
  registered: "bg-cyan-100 text-cyan-700",
  reassigned: "bg-orange-100 text-orange-700",
};
const statusLabels: Record<string, string> = {
  pending: "Chờ",
  in_progress: "Đang làm",
  completed: "Hoàn thành",
  registered: "Đăng ký",
  reassigned: "Chuyển",
};

export default function ProductionOrderReportPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<any>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  const loadReport = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.getOrderReport(id || "");
      setReport(res.data.data);
    } catch (error) {
      console.error("Lỗi tải báo cáo:", error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const formatMinutes = (minutes: number) => {
    if (!minutes) return "0 phút";
    const h = Math.floor(minutes / 60),
      m = minutes % 60;
    return h > 0 ? `${h}h ${m}m` : `${m} phút`;
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value || 0);

  const toggleDay = (date: string) =>
    setExpandedDays((p) => ({ ...p, [date]: !p[date] }));

  if (loading)
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  if (!report)
    return (
      <div className="text-center py-20 text-slate-400">
        Không tìm thấy báo cáo
      </div>
    );

  const { order, dailyReport, workerSummary, statistics } = report;

  return (
    <div className={`print-container ${isMobile ? "p-3" : "p-6"}`}>
      <div className="flex gap-3 mb-4 no-print">
        <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Quay lại
        </Button>
        <Button variant="outline" size="sm" onClick={() => window.print()}>
          <Printer className="w-4 h-4 mr-1" /> In báo cáo
        </Button>
      </div>

      {/* Order Info */}
      <Card className="mb-4 border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">
            Báo cáo lệnh sản xuất: {order?.orderCode}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={`grid ${isMobile ? "grid-cols-1" : "grid-cols-3"} gap-4 text-sm`}
          >
            <div>
              <span className="text-slate-500">Loại xe:</span>{" "}
              <strong>{order?.vehicleType?.name}</strong>
            </div>
            <div>
              <span className="text-slate-500">Số lượng:</span>{" "}
              <strong>{order?.quantity}</strong>
            </div>
            <div>
              <span className="text-slate-500">Trạng thái:</span>{" "}
              <Badge
                variant="outline"
                className={statusColors[order?.status] || ""}
              >
                {statusLabels[order?.status] || order?.status}
              </Badge>
            </div>
            <div>
              <span className="text-slate-500">Ngày bắt đầu:</span>{" "}
              <strong>{dayjs(order?.startDate).format("DD/MM/YYYY")}</strong>
            </div>
            <div>
              <span className="text-slate-500">Ngày hoàn thành:</span>{" "}
              <strong>
                {order?.actualEndDate
                  ? dayjs(order?.actualEndDate).format("DD/MM/YYYY")
                  : "-"}
              </strong>
            </div>
            <div>
              <span className="text-slate-500">Người tạo:</span>{" "}
              <strong>{order?.createdBy?.name}</strong>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
        {[
          { label: "Tổng đăng ký", value: statistics?.totalRegistrations },
          {
            label: "Hoàn thành",
            value: statistics?.totalCompleted,
            color: "text-emerald-600",
          },
          { label: "Tổng SL", value: statistics?.totalQuantityProduced },
          {
            label: "Tổng giờ",
            value: formatMinutes(statistics?.totalWorkingMinutes),
          },
          {
            label: "Tổng thưởng",
            value: formatCurrency(statistics?.totalBonus),
            color: "text-emerald-600",
          },
          {
            label: "Tổng phạt",
            value: formatCurrency(statistics?.totalPenalty),
            color: "text-red-500",
          },
        ].map((s, i) => (
          <Card key={i} className="border-slate-200">
            <CardContent className="pt-4 pb-3 text-center">
              <div className={`text-xl font-bold ${s.color || ""}`}>
                {s.value}
              </div>
              <div className="text-xs text-slate-500 mt-1">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Worker Summary */}
      <Card className="mb-4 border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Tổng hợp theo công nhân</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isMobile ? (
            <div className="divide-y">
              {(workerSummary || []).map((item: any, i: number) => (
                <div key={i} className="p-3">
                  <div className="flex justify-between font-medium text-sm">
                    {item.code} - {item.name}
                    <span>{item.operations} thao tác</span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span>SL: {item.totalQuantity}</span>
                    <span>Giờ: {formatMinutes(item.totalMinutes)}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-emerald-600">
                      +{formatCurrency(item.totalBonus)}
                    </span>
                    <span className="text-red-500">
                      -{formatCurrency(item.totalPenalty)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="px-4 py-2.5 font-medium text-slate-500 w-[80px]">
                      Mã
                    </th>
                    <th className="px-4 py-2.5 font-medium text-slate-500">
                      Tên
                    </th>
                    <th className="px-4 py-2.5 font-medium text-slate-500 text-right">
                      Số lượng
                    </th>
                    <th className="px-4 py-2.5 font-medium text-slate-500 text-right">
                      Thời gian
                    </th>
                    <th className="px-4 py-2.5 font-medium text-slate-500 text-right">
                      Thưởng
                    </th>
                    <th className="px-4 py-2.5 font-medium text-slate-500 text-right">
                      Phạt
                    </th>
                    <th className="px-4 py-2.5 font-medium text-slate-500 text-right">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(workerSummary || []).map((r: any, i: number) => (
                    <tr
                      key={i}
                      className="border-b border-slate-100 hover:bg-slate-50"
                    >
                      <td className="px-4 py-2">{r.code}</td>
                      <td className="px-4 py-2">{r.name}</td>
                      <td className="px-4 py-2 text-right">
                        {r.totalQuantity}
                      </td>
                      <td className="px-4 py-2 text-right">
                        {formatMinutes(r.totalMinutes)}
                      </td>
                      <td className="px-4 py-2 text-right text-emerald-600">
                        {formatCurrency(r.totalBonus)}
                      </td>
                      <td className="px-4 py-2 text-right text-red-500">
                        {formatCurrency(r.totalPenalty)}
                      </td>
                      <td className="px-4 py-2 text-right">{r.operations}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Daily Report - Collapsible */}
      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Chi tiết theo ngày</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {Object.entries(dailyReport || {}).map(
              ([date, records]: [string, any]) => (
                <div key={date}>
                  <button
                    onClick={() => toggleDay(date)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">
                        {dayjs(date).format("DD/MM/YYYY")}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {records.length} đăng ký
                      </Badge>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 transition-transform ${expandedDays[date] ? "rotate-180" : ""}`}
                    />
                  </button>
                  {expandedDays[date] &&
                    (isMobile ? (
                      <div className="px-4 pb-3 space-y-2">
                        {records.map((item: any, i: number) => (
                          <div
                            key={i}
                            className="bg-slate-50 rounded-lg p-3 text-sm"
                          >
                            <div className="flex justify-between">
                              <strong>
                                {item.worker?.code} - {item.worker?.name}
                              </strong>
                              <Badge
                                variant="outline"
                                className={statusColors[item.status] || ""}
                              >
                                {statusLabels[item.status] || item.status}
                              </Badge>
                            </div>
                            <p className="text-slate-500 text-xs mt-1">
                              {item.process?.name} → {item.operation?.name}
                            </p>
                            <div className="flex justify-between mt-1">
                              <span>
                                SL: {item.actualQuantity}/
                                {item.expectedQuantity}
                              </span>
                              <span>
                                Giờ: {formatMinutes(item.workingMinutes)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="px-4 pb-3 overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b text-left">
                              <th className="py-2 font-medium text-slate-500 w-[150px]">
                                Công nhân
                              </th>
                              <th className="py-2 font-medium text-slate-500">
                                Công đoạn
                              </th>
                              <th className="py-2 font-medium text-slate-500">
                                Thao tác
                              </th>
                              <th className="py-2 font-medium text-slate-500 text-right w-[80px]">
                                SL kỳ vọng
                              </th>
                              <th className="py-2 font-medium text-slate-500 text-right w-[80px]">
                                SL thực
                              </th>
                              <th className="py-2 font-medium text-slate-500 text-right w-[80px]">
                                Chênh lệch
                              </th>
                              <th className="py-2 font-medium text-slate-500 text-right w-[80px]">
                                Thời gian
                              </th>
                              <th className="py-2 font-medium text-slate-500 w-[100px]">
                                Trạng thái
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {records.map((r: any, i: number) => (
                              <tr key={i} className="border-b border-slate-100">
                                <td className="py-2">
                                  {r.worker?.code} - {r.worker?.name}
                                </td>
                                <td className="py-2">{r.process?.name}</td>
                                <td className="py-2">{r.operation?.name}</td>
                                <td className="py-2 text-right">
                                  {r.expectedQuantity}
                                </td>
                                <td className="py-2 text-right">
                                  {r.actualQuantity}
                                </td>
                                <td
                                  className={`py-2 text-right ${r.deviation > 0 ? "text-emerald-600" : r.deviation < 0 ? "text-red-500" : ""}`}
                                >
                                  {r.deviation > 0
                                    ? `+${r.deviation}`
                                    : r.deviation}
                                </td>
                                <td className="py-2 text-right">
                                  {formatMinutes(r.workingMinutes)}
                                </td>
                                <td className="py-2">
                                  <Badge
                                    variant="outline"
                                    className={statusColors[r.status] || ""}
                                  >
                                    {statusLabels[r.status] || r.status}
                                  </Badge>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ))}
                </div>
              ),
            )}
          </div>
        </CardContent>
      </Card>

      <style>{`@media print { .no-print { display: none !important; } .print-container { padding: 0 !important; } }`}</style>
    </div>
  );
}
