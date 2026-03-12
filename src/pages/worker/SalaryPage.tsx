import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowUp,
  Calendar,
  Package,
  Trophy,
  AlertTriangle,
  Download,
  Loader2,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "../../contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import * as api from "../../services/api";
import dayjs from "dayjs";

export default function SalaryPage() {
  const { user } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState(dayjs().format("YYYY-MM"));

  const { data: salaryResult, isLoading: loading } = useQuery({
    queryKey: ["workerSalary", selectedMonth],
    queryFn: async () => {
      const d = dayjs(selectedMonth);
      const month = d.month() + 1;
      const year = d.year();
      const res = await api.getWorkerSalary({ month, year });
      const data: any = res.data.data;
      return {
        summary: data?.summary || null,
        dailyDetails: data?.dailyDetails || [],
      };
    },
    staleTime: 30_000,
  });

  const salaryData = salaryResult?.summary || null;
  const dailyBreakdown = salaryResult?.dailyDetails || [];

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("vi-VN").format(value || 0);

  const calculateChange = () => {
    if (!salaryData?.previousMonthIncome || !salaryData?.netIncome) return 0;
    return (
      ((salaryData.netIncome - salaryData.previousMonthIncome) /
        salaryData.previousMonthIncome) *
      100
    ).toFixed(1);
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );

  // Tổng thời gian làm việc (phút)
  const totalWorkingMinutes = dailyBreakdown.reduce(
    (sum: number, r: any) => sum + (r.workingMinutes || 0),
    0,
  );
  const shiftMinutesPerDay = 480; // 8 tiếng/ca
  const totalShiftMinutes = (salaryData?.workingDays || 0) * shiftMinutesPerDay;
  const efficiencyPercent =
    totalShiftMinutes > 0
      ? Math.round((totalWorkingMinutes / totalShiftMinutes) * 100)
      : 0;

  const statCards = [
    {
      label: "Ngày công",
      sublabel: "Ca làm tiêu chuẩn",
      value: salaryData?.workingDays || 0,
      icon: Calendar,
      color: "text-blue-600",
      bg: "bg-blue-100",
    },
    {
      label: "Tổng sản lượng",
      sublabel: "Số sản phẩm",
      value: formatCurrency(salaryData?.totalOutput || 0),
      icon: Package,
      color: "text-orange-600",
      bg: "bg-orange-100",
    },
    {
      label: "Tổng tiền thưởng",
      sublabel: "↗ Hiệu suất",
      value: `+${formatCurrency(salaryData?.totalBonus || 0)}đ`,
      icon: Trophy,
      color: "text-emerald-600",
      bg: "bg-emerald-100",
    },
    {
      label: "Tổng tiền phạt",
      sublabel: "↗ Vi phạm",
      value: `-${formatCurrency(salaryData?.totalPenalty || 0)}đ`,
      icon: AlertTriangle,
      color: "text-red-500",
      bg: "bg-red-100",
    },
  ];

  return (
    <div className="max-w-[1000px] mx-auto">
      {/* Header */}
      <div className="flex justify-between items-start mb-6 flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-2xl font-bold">Tổng hợp Lương & Thưởng</h2>
            <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
              Đang làm việc
            </Badge>
          </div>
          <p className="text-sm text-slate-500">
            Công nhân: <strong>{user?.name}</strong> (Mã: {user?.code})
          </p>
        </div>
        <div className="flex gap-3 items-center">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="h-9 px-3 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#0077c0]/20"
          />
          <Button variant="outline">
            <Download className="w-4 h-4 mr-1" /> Xuất báo cáo
          </Button>
        </div>
      </div>

      {/* Net Income Card */}
      <Card className="mb-6 bg-gradient-to-r from-[#0077c0] to-[#005f9e] text-white border-0">
        <CardContent className="pt-6 pb-6">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <p className="text-sm text-white/70 uppercase tracking-wider">
                THU NHẬP RÒNG ({dayjs(selectedMonth).format("MM/YYYY")})
              </p>
              <p className="text-3xl font-bold mt-1">
                {formatCurrency(salaryData?.netIncome || 0)}đ
              </p>
              {Number(calculateChange()) !== 0 && (
                <span className="inline-flex items-center gap-1 mt-2 bg-white/20 px-3 py-1 rounded-full text-sm">
                  <ArrowUp className="w-3.5 h-3.5" /> {calculateChange()}% so
                  với tháng trước
                </span>
              )}
            </div>
            <Button
              variant="outline"
              className="text-white border-white/50 hover:bg-white/10 hover:text-white"
            >
              Xem chi tiết
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {statCards.map((s, i) => (
          <Card key={i} className="border-slate-200">
            <CardContent className="pt-5">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${s.bg} ${s.color}`}
              >
                <s.icon className="w-5 h-5" />
              </div>
              <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-slate-500 mt-1">{s.sublabel}</div>
              <div className="text-sm font-medium mt-0.5">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Working Minutes vs 480-min Comparison */}
      {totalWorkingMinutes > 0 && (
        <Card className="mb-6 border-slate-200">
          <CardContent className="pt-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-violet-100 text-violet-600">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-medium">
                  Thời gian làm việc thực tế
                </div>
                <div className="text-xs text-slate-500">
                  {Math.floor(totalWorkingMinutes / 60)}h{" "}
                  {totalWorkingMinutes % 60}p /{" "}
                  {Math.floor(totalShiftMinutes / 60)}h tiêu chuẩn (
                  {shiftMinutesPerDay} phút × {salaryData?.workingDays || 0}{" "}
                  ngày)
                </div>
              </div>
              <div className="ml-auto text-right">
                <span
                  className={`text-2xl font-bold ${efficiencyPercent >= 100 ? "text-emerald-600" : efficiencyPercent >= 80 ? "text-blue-600" : "text-amber-600"}`}
                >
                  {efficiencyPercent}%
                </span>
                <div className="text-xs text-slate-500">Hiệu suất</div>
              </div>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5">
              <div
                className={`h-2.5 rounded-full transition-all ${efficiencyPercent >= 100 ? "bg-emerald-500" : efficiencyPercent >= 80 ? "bg-blue-500" : "bg-amber-500"}`}
                style={{ width: `${Math.min(efficiencyPercent, 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Daily Breakdown */}
      <Card className="border-slate-200">
        <CardHeader className="flex-row items-center justify-between pb-3">
          <CardTitle className="text-lg">Chi tiết theo ngày</CardTitle>
          <Button variant="link" size="sm" className="text-[#0077c0]">
            Xem tất cả
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {dailyBreakdown.length === 0 ? (
            <div className="py-10 text-center text-slate-400">
              Không có dữ liệu
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left">
                    <th className="px-4 py-3 font-medium text-slate-500">
                      NGÀY
                    </th>
                    <th className="px-4 py-3 font-medium text-slate-500">
                      THAO TÁC
                    </th>
                    <th className="px-4 py-3 font-medium text-slate-500 text-center">
                      TIÊU CHUẨN
                    </th>
                    <th className="px-4 py-3 font-medium text-slate-500 text-center">
                      THỰC TẾ
                    </th>
                    <th className="px-4 py-3 font-medium text-slate-500 text-center">
                      CHÊNH LỆCH
                    </th>
                    <th className="px-4 py-3 font-medium text-emerald-600 text-right">
                      THƯỞNG
                    </th>
                    <th className="px-4 py-3 font-medium text-red-500 text-right">
                      PHẠT
                    </th>
                    <th className="px-4 py-3 font-medium text-violet-600 text-center">
                      PHÚT
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {dailyBreakdown.map((row: any, i: number) => (
                    <tr
                      key={i}
                      className="border-b border-slate-100 hover:bg-slate-50"
                    >
                      <td className="px-4 py-2.5 font-medium">
                        {dayjs(row.date).format("DD/MM/YYYY")}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full ${row.difference >= 0 ? "bg-[#0077c0]" : "bg-amber-400"}`}
                          />
                          {row.operation || row.operationId?.name}
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        {row.standardOutput || row.expectedQuantity}
                      </td>
                      <td className="px-4 py-2.5 text-center font-semibold">
                        {row.actualOutput || row.actualQuantity}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium ${
                            row.difference > 0
                              ? "bg-emerald-100 text-emerald-700"
                              : row.difference < 0
                                ? "bg-red-100 text-red-700"
                                : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {row.difference > 0 ? "+" : ""}
                          {row.difference}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        {row.bonus > 0 ? (
                          <span className="text-emerald-600 font-medium">
                            +{formatCurrency(row.bonus)}đ
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        {row.penalty > 0 ? (
                          <span className="text-red-500 font-medium">
                            -{formatCurrency(row.penalty)}đ
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <span className="text-sm text-violet-600 font-medium">
                          {row.workingMinutes ? `${row.workingMinutes}p` : "-"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="px-4 py-3 border-t text-sm text-slate-400 flex justify-between">
            <span>
              Hiển thị 1 đến {dailyBreakdown.length} / {dailyBreakdown.length}{" "}
              kết quả
            </span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" disabled>
                Trước
              </Button>
              <Button size="sm" variant="outline" disabled>
                Sau
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
