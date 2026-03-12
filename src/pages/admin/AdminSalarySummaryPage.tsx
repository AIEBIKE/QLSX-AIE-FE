import { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useAdminSalarySummary } from "@/hooks/useQueries";
import dayjs from "dayjs";
import {
  Users,
  DollarSign,
  Trophy,
  AlertTriangle,
  Calendar,
  Download,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import * as api from "../../services/api";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    value,
  );

const avatarColors = [
  "#f56a00",
  "#7265e6",
  "#ffbf00",
  "#00a2ae",
  "#eb2f96",
  "#52c41a",
  "#1677ff",
  "#722ed1",
];
const getAvatarColor = (name: string) =>
  avatarColors[name?.charCodeAt(0) % avatarColors.length || 0];
const getInitials = (name: string) => {
  if (!name) return "?";
  const p = name.split(" ");
  return p.length >= 2
    ? (p[0][0] + p[p.length - 1][0]).toUpperCase()
    : name[0].toUpperCase();
};

import { Pagination } from "@/components/shared/Pagination";

interface WorkerStat {
  user: { _id: string; code: string; name: string };
  totalQuantity: number;
  totalBonus: number;
  totalPenalty: number;
  totalNetIncome: number;
  registrationCount: number;
}
interface SalaryResponse {
  data: WorkerStat[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  meta: {
    summary: {
      totalWorkers: number;
      totalRegistrations: number;
      totalQuantity: number;
      totalBonus: number;
      totalPenalty: number;
      totalNetIncome: number;
    };
    chartData: {
      date: string;
      bonus: number;
      penalty: number;
      quantity: number;
    }[];
    dateRange: { start: string; end: string };
  };
}

export default function AdminSalarySummaryPage() {
  const [period, setPeriod] = useState("month");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
  });

  const queryParams = useMemo(() => {
    const p: Record<string, any> = {
      period,
      page: pagination.page,
      limit: pagination.limit,
    };
    if (period === "custom" && startDate && endDate) {
      p.startDate = new Date(startDate).toISOString();
      p.endDate = new Date(endDate).toISOString();
    }
    return p;
  }, [period, startDate, endDate, pagination.page, pagination.limit]);

  const { data: resData, isLoading } = useAdminSalarySummary(queryParams);

  const data = resData?.meta;
  const workers = resData?.data || [];
  const paginationInfo = resData?.pagination;

  const statCards = data
    ? [
        {
          label: "Công nhân",
          value: data.summary.totalWorkers,
          icon: Users,
          bg: "bg-blue-50",
          color: "text-blue-600",
        },
        {
          label: "Tổng sản lượng",
          value: data.summary.totalQuantity.toLocaleString(),
          icon: Trophy,
          bg: "bg-emerald-50",
          color: "text-emerald-600",
        },
        {
          label: "Số ca làm",
          value: data.summary.totalRegistrations,
          icon: Calendar,
          bg: "bg-orange-50",
          color: "text-orange-600",
        },
        {
          label: "Tổng thưởng",
          value: formatCurrency(data.summary.totalBonus),
          icon: Trophy,
          bg: "bg-green-50",
          color: "text-green-600",
        },
        {
          label: "Tổng phạt",
          value: formatCurrency(data.summary.totalPenalty),
          icon: AlertTriangle,
          bg: "bg-red-50",
          color: "text-red-500",
        },
        {
          label: "Thu nhập ròng",
          value: formatCurrency(data.summary.totalNetIncome),
          icon: DollarSign,
          bg: data.summary.totalNetIncome >= 0 ? "bg-emerald-50" : "bg-red-50",
          color:
            data.summary.totalNetIncome >= 0
              ? "text-emerald-600"
              : "text-red-500",
        },
      ]
    : [];

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold">💰 Tổng hợp Lương & Thưởng</h2>
        <p className="text-sm text-slate-500 mt-1">
          Thống kê lương, thưởng, phạt của tất cả công nhân
        </p>
      </div>

      {/* Filters */}
      <Card className="mb-6 border-slate-200">
        <CardContent className="pt-5">
          <div className="flex items-end gap-4 flex-wrap">
            <div>
              <label className="text-xs text-slate-500 block mb-1">
                Khoảng thời gian
              </label>
              <Select
                value={period}
                onValueChange={(v) => {
                  setPeriod(v);
                  setStartDate("");
                  setEndDate("");
                }}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Tuần này</SelectItem>
                  <SelectItem value="month">Tháng này</SelectItem>
                  <SelectItem value="year">Năm nay</SelectItem>
                  <SelectItem value="custom">Tùy chọn</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {period === "custom" && (
              <>
                <div>
                  <label className="text-xs text-slate-500 block mb-1">
                    Từ ngày
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="h-9 px-3 border border-slate-200 rounded-md text-sm"
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
                    className="h-9 px-3 border border-slate-200 rounded-md text-sm"
                  />
                </div>
              </>
            )}
            <div className="ml-auto">
              <Button variant="outline">
                <Download className="w-4 h-4 mr-1" /> Xuất Excel
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      ) : data ? (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
            {statCards.map((s, i) => (
              <Card key={i} className="border-slate-200">
                <CardContent className="pt-4 pb-3 text-center">
                  <s.icon className={`w-5 h-5 mx-auto mb-1 ${s.color}`} />
                  <div className={`text-lg font-bold ${s.color}`}>
                    {s.value}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">{s.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <Card className="border-slate-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">
                  📈 Xu hướng Thưởng/Phạt theo ngày
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={data.chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(v) => dayjs(v).format("DD/MM")}
                      fontSize={12}
                    />
                    <YAxis
                      tickFormatter={(v) => `${v / 1000}k`}
                      fontSize={12}
                    />
                    <RechartsTooltip
                      formatter={(v: any) => formatCurrency(v as number)}
                      labelFormatter={(l) => dayjs(l).format("DD/MM/YYYY")}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="bonus"
                      name="Thưởng"
                      stroke="#52c41a"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="penalty"
                      name="Phạt"
                      stroke="#ff4d4f"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card className="border-slate-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">
                  📊 Sản lượng theo ngày
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={data.chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(v) => dayjs(v).format("DD/MM")}
                      fontSize={12}
                    />
                    <YAxis fontSize={12} />
                    <RechartsTooltip
                      labelFormatter={(l) => dayjs(l).format("DD/MM/YYYY")}
                    />
                    <Legend />
                    <Bar dataKey="quantity" name="Sản lượng" fill="#0077c0" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Workers Table */}
          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                👥 Chi tiết theo công nhân
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="px-4 py-3 font-medium text-slate-500">
                        Công nhân
                      </th>
                      <th className="px-4 py-3 font-medium text-slate-500 text-right">
                        Số lượng
                      </th>
                      <th className="px-4 py-3 font-medium text-slate-500 text-right">
                        Tiền thưởng
                      </th>
                      <th className="px-4 py-3 font-medium text-slate-500 text-right">
                        Tiền phạt
                      </th>
                      <th className="px-4 py-3 font-medium text-slate-500 text-right">
                        Thu nhập ròng
                      </th>
                      <th className="px-4 py-3 font-medium text-slate-500 text-center">
                        Số ca
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {workers.map((w) => (
                      <tr
                        key={w.user._id}
                        className="border-b border-slate-100 hover:bg-slate-50"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarFallback
                                style={{
                                  backgroundColor: getAvatarColor(w.user.name),
                                }}
                                className="text-white text-xs"
                              >
                                {getInitials(w.user.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{w.user.name}</div>
                              <span className="text-xs text-slate-400">
                                {w.user.code}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold">
                          {w.totalQuantity.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right text-emerald-600 font-semibold">
                          {formatCurrency(w.totalBonus)}
                        </td>
                        <td
                          className="px-4 py-3 text-right"
                          style={{
                            color: w.totalPenalty > 0 ? "#ef4444" : "#94a3b8",
                          }}
                        >
                          {w.totalPenalty > 0 ? "-" : ""}
                          {formatCurrency(w.totalPenalty)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Badge
                            variant="outline"
                            className={
                              w.totalNetIncome >= 0
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-red-100 text-red-700"
                            }
                          >
                            {formatCurrency(w.totalNetIncome)}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {w.registrationCount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-3 flex items-center justify-between border-t">
                <div className="text-sm text-slate-500">
                  Hiển thị {workers.length} / {paginationInfo?.total || 0} công
                  nhân
                </div>
                {paginationInfo && (
                  <Pagination
                    page={paginationInfo.page}
                    totalPages={paginationInfo.totalPages}
                    limit={paginationInfo.limit}
                    total={paginationInfo.total}
                    onPageChange={(p) =>
                      setPagination((prev) => ({ ...prev, page: p }))
                    }
                    onLimitChange={(l) =>
                      setPagination((prev) => ({ ...prev, limit: l, page: 1 }))
                    }
                  />
                )}
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card className="border-slate-200">
          <CardContent className="py-10 text-center text-slate-400">
            Không có dữ liệu
          </CardContent>
        </Card>
      )}
    </div>
  );
}
