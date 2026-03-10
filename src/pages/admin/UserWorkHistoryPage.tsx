import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { ArrowLeft, Filter, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import * as api from "../../services/api";
import { Pagination } from "@/components/shared/Pagination";

const statusColors: Record<string, string> = {
  registered: "bg-blue-100 text-blue-700",
  in_progress: "bg-cyan-100 text-cyan-700",
  completed: "bg-emerald-100 text-emerald-700",
  reassigned: "bg-orange-100 text-orange-700",
};
const statusLabels: Record<string, string> = {
  registered: "Đăng ký",
  in_progress: "Đang làm",
  completed: "Hoàn thành",
  reassigned: "Chuyển",
};

export default function UserWorkHistoryPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  const loadHistory = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (startDate) params.startDate = new Date(startDate).toISOString();
      if (endDate) params.endDate = new Date(endDate).toISOString();
      params.page = pagination.page;
      params.limit = pagination.limit;
      const res = await api.getUserWorkHistory(id as string, params);
      setData({
        user: res.data.meta?.user,
        registrations: res.data.data,
        statistics: res.data.meta?.statistics,
      });
      if (res.data.pagination) {
        setPagination((prev) => ({
          ...prev,
          total: res.data.pagination.total,
          totalPages: res.data.pagination.totalPages,
        }));
      }
    } catch (error) {
      console.error("Lỗi tải lịch sử:", error);
    } finally {
      setLoading(false);
    }
  }, [id, startDate, endDate]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory, pagination.page, pagination.limit]);

  const formatMinutes = (minutes: number) => {
    if (!minutes) return "0 phút";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins} phút`;
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value || 0);

  const { user, registrations, statistics } = data || {};

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className={isMobile ? "p-3" : "p-6"}>
      <Button
        variant="outline"
        size="sm"
        className="mb-4"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="w-4 h-4 mr-1" /> Quay lại
      </Button>

      {/* User Info */}
      <Card className="mb-4 border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">
            Lịch sử làm việc: {user?.code} - {user?.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-6 text-sm text-slate-500">
            <span>
              Vai trò: <strong className="text-slate-700">{user?.role}</strong>
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      {statistics && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
          {[
            { label: "Tổng đăng ký", value: statistics.totalRegistrations },
            {
              label: "Hoàn thành",
              value: statistics.totalCompleted,
              color: "text-emerald-600",
            },
            { label: "Tổng SL", value: statistics.totalQuantity },
            {
              label: "Tổng giờ",
              value: formatMinutes(statistics.totalWorkingMinutes),
            },
            {
              label: "Tổng thưởng",
              value: formatCurrency(statistics.totalBonus),
              color: "text-emerald-600",
            },
            {
              label: "Tổng phạt",
              value: formatCurrency(statistics.totalPenalty),
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
      )}

      {/* Date Filters */}
      <div className="border-t border-slate-200 pt-4 mb-4">
        <div className="flex items-end gap-3 flex-wrap">
          <div>
            <label className="text-xs text-slate-500 block mb-1">Từ ngày</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-9 px-3 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#0077c0]/20"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 block mb-1">
              Đến ngày
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-9 px-3 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#0077c0]/20"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadHistory}
            disabled={loading}
          >
            <Filter className="w-3.5 h-3.5 mr-1" /> Lọc
          </Button>
        </div>
      </div>

      {/* Data Table / Mobile Cards */}
      {isMobile ? (
        <div className="space-y-3">
          {(registrations || []).map((item: any) => (
            <Card key={item._id} className="border-slate-200">
              <CardContent className="pt-4 pb-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium text-sm">
                    {dayjs(item.date).format("DD/MM/YYYY")}
                  </span>
                  <Badge
                    variant="outline"
                    className={statusColors[item.status] || ""}
                  >
                    {statusLabels[item.status] || item.status}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 mb-2">
                  {item.productionOrderId?.orderCode} - {item.operationId?.name}
                </p>
                <div className="flex justify-between text-sm">
                  <span>
                    SL: {item.actualQuantity}/{item.expectedQuantity}
                  </span>
                  <span
                    className={
                      item.deviation > 0
                        ? "text-emerald-600"
                        : item.deviation < 0
                          ? "text-red-500"
                          : ""
                    }
                  >
                    {item.deviation > 0 ? `+${item.deviation}` : item.deviation}
                  </span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span>Giờ: {formatMinutes(item.workingMinutes)}</span>
                  <div className="flex gap-2">
                    {item.bonusAmount > 0 && (
                      <span className="text-emerald-600">
                        +{formatCurrency(item.bonusAmount)}
                      </span>
                    )}
                    {item.penaltyAmount > 0 && (
                      <span className="text-red-500">
                        -{formatCurrency(item.penaltyAmount)}
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left">
                  <th className="px-4 py-3 font-medium text-slate-500 w-[100px]">
                    Ngày
                  </th>
                  <th className="px-4 py-3 font-medium text-slate-500">
                    Lệnh SX
                  </th>
                  <th className="px-4 py-3 font-medium text-slate-500">
                    Thao tác
                  </th>
                  <th className="px-4 py-3 font-medium text-slate-500 text-right w-[80px]">
                    SL kỳ vọng
                  </th>
                  <th className="px-4 py-3 font-medium text-slate-500 text-right w-[80px]">
                    SL thực
                  </th>
                  <th className="px-4 py-3 font-medium text-slate-500 text-right w-[80px]">
                    Chênh lệch
                  </th>
                  <th className="px-4 py-3 font-medium text-slate-500 text-right w-[80px]">
                    Thời gian
                  </th>
                  <th className="px-4 py-3 font-medium text-slate-500 w-[120px]">
                    Thưởng/Phạt
                  </th>
                  <th className="px-4 py-3 font-medium text-slate-500 w-[140px]">
                    Trạng thái
                  </th>
                </tr>
              </thead>
              <tbody>
                {(registrations || []).map((r: any) => (
                  <tr
                    key={r._id}
                    className="border-b border-slate-100 hover:bg-slate-50"
                  >
                    <td className="px-4 py-2.5">
                      {dayjs(r.date).format("DD/MM/YYYY")}
                    </td>
                    <td className="px-4 py-2.5">
                      {r.productionOrderId?.orderCode}
                    </td>
                    <td className="px-4 py-2.5">{r.operationId?.name}</td>
                    <td className="px-4 py-2.5 text-right">
                      {r.expectedQuantity}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      {r.actualQuantity}
                    </td>
                    <td
                      className={`px-4 py-2.5 text-right ${r.deviation > 0 ? "text-emerald-600" : r.deviation < 0 ? "text-red-500" : ""}`}
                    >
                      {r.deviation > 0 ? `+${r.deviation}` : r.deviation}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      {formatMinutes(r.workingMinutes)}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex flex-col">
                        {r.bonusAmount > 0 && (
                          <span className="text-emerald-600 text-xs">
                            +{formatCurrency(r.bonusAmount)}
                          </span>
                        )}
                        {r.penaltyAmount > 0 && (
                          <span className="text-red-500 text-xs">
                            -{formatCurrency(r.penaltyAmount)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex gap-1">
                        <Badge
                          variant="outline"
                          className={statusColors[r.status] || ""}
                        >
                          {statusLabels[r.status] || r.status}
                        </Badge>
                        {r.isReplacement && (
                          <Badge
                            variant="outline"
                            className="bg-purple-100 text-purple-700"
                          >
                            Bổ sung
                          </Badge>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 flex items-center justify-between border-t border-slate-200">
            <div className="text-sm text-slate-500">
              Hiển thị {registrations?.length || 0} / {pagination.total} bản ghi
            </div>
            <Pagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              limit={pagination.limit}
              total={pagination.total}
              onPageChange={(p) =>
                setPagination((prev) => ({ ...prev, page: p }))
              }
              onLimitChange={(l) =>
                setPagination((prev) => ({ ...prev, limit: l, page: 1 }))
              }
            />
          </div>
        </Card>
      )}
    </div>
  );
}
