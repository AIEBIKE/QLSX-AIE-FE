import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Car,
  FileText,
  Users,
  CheckCircle,
  Loader2,
  Zap,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "../../contexts/AuthContext";
import { useVehicleTypes, useActiveProductionOrder, useAllRegistrations } from "@/hooks/useQueries";
import * as api from "../../services/api";

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: vtData, isLoading: vtLoading } = useVehicleTypes({ active: true });
  const { data: activeOrder, isLoading: activeLoading } = useActiveProductionOrder();
  const { data: registrationsData, isLoading: regsLoading } = useAllRegistrations({
    date: new Date().toISOString().split("T")[0],
  });

  const loading = vtLoading || activeLoading || regsLoading;

  const stats = useMemo(() => {
    if (!vtData || !registrationsData) return null;
    
    const regs = (registrationsData as any) || [];
    const completed = regs.filter((r: any) => r.status === "completed").length;

    return {
      vehicleTypes: vtData.pagination?.total || 0,
      activeOrder: activeOrder,
      todayRegistrations: regs.length,
      completedRegistrations: completed,
    };
  }, [vtData, activeOrder, registrationsData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#0077c0]" />
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    {
      label: "Loại xe",
      value: stats.vehicleTypes,
      icon: <Car className="w-5 h-5" />,
      gradient: "from-violet-500 to-purple-700",
    },
    {
      label: "Lệnh SX Active",
      value: stats.activeOrder ? stats.activeOrder.orderCode : "Không có",
      icon: <FileText className="w-5 h-5" />,
      gradient: "from-pink-500 to-rose-600",
      small: !stats.activeOrder,
    },
    {
      label: "Đăng ký hôm nay",
      value: stats.todayRegistrations,
      icon: <Users className="w-5 h-5" />,
      gradient: "from-sky-400 to-cyan-500",
    },
    {
      label: "Đã hoàn thành",
      value: stats.completedRegistrations,
      icon: <CheckCircle className="w-5 h-5" />,
      gradient: "from-emerald-400 to-teal-500",
    },
  ];

  const completionPercent =
    stats.todayRegistrations > 0
      ? Math.round(
          (stats.completedRegistrations / stats.todayRegistrations) * 100,
        )
      : 0;

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800">📊 Dashboard</h2>
        <p className="text-slate-500 mt-1">
          Xin chào, {user?.name}! Đây là tổng quan hệ thống hôm nay.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map((stat, i) => (
          <div
            key={i}
            className={`rounded-xl bg-linear-to-br ${stat.gradient} p-5 text-white shadow-lg`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-white/80 text-sm font-medium">
                {stat.label}
              </span>
              <div className="bg-white/20 rounded-lg p-2">{stat.icon}</div>
            </div>
            <div className={`font-bold ${stat.small ? "text-lg" : "text-3xl"}`}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Active Order Details */}
      {stats.activeOrder && (
        <Card className="mb-6 border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">
              📋 Lệnh sản xuất đang thực hiện
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-slate-500">Mã lệnh</p>
                <p className="text-xl font-bold text-slate-800">
                  {stats.activeOrder.orderCode}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Loại xe</p>
                <p className="text-xl font-bold text-slate-800">
                  {typeof stats.activeOrder.vehicleTypeId === "object"
                    ? stats.activeOrder.vehicleTypeId.name
                    : stats.activeOrder.vehicleTypeId}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Số lượng</p>
                <p className="text-xl font-bold text-slate-800">
                  {stats.activeOrder.quantity}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bottom Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />
              Thao tác nhanh
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-600">
            <p>
              • Vào <strong>Lệnh sản xuất</strong> để tạo/kích hoạt lệnh mới
            </p>
            <p>
              • Xem <strong>Đăng ký công</strong> để theo dõi tiến độ công nhân
            </p>
            <p>
              • Cài đặt <strong>Định mức</strong> cho thao tác mới
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              Tiến độ hôm nay
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Tổng đăng ký</span>
              <span className="font-semibold text-slate-800">
                {stats.todayRegistrations}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Đã hoàn thành</span>
              <span className="font-semibold text-emerald-600">
                {stats.completedRegistrations} ({completionPercent}%)
              </span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${completionPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Đang thực hiện</span>
              <span className="font-semibold text-amber-600">
                {stats.todayRegistrations - stats.completedRegistrations}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
