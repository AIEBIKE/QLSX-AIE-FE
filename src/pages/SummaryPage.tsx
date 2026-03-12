import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext"; // [splinh-12/03-15:22]
import { useShiftSummary } from "../hooks/useQueries"; // [splinh-12/03-15:20]

interface OperationSummary {
  name: string;
  standardTime: number;
  actualTime: number;
  efficiency: number;
}

interface ShiftResult {
  type: "bonus" | "neutral" | "penalty";
  label: string;
  percent: number;
}

interface ShiftSummaryData {
  totalOperations: number;
  totalWorkingMinutes: number;
  totalStandardMinutes: number;
  efficiencyPercent: number;
  result?: ShiftResult;
  operations?: OperationSummary[];
}

const SummaryPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const { data: summaryData, isLoading: loading } = useShiftSummary(); // [splinh-12/03-15:20]
  const summary = summaryData as ShiftSummaryData | undefined; // [splinh-12/03-15:20]

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 to-indigo-100">
        <div className="text-xl text-blue-600 animate-pulse">Đang tải...</div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 to-indigo-100">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-sm mx-4">
          <div className="text-6xl mb-4">📋</div>
          <h2 className="text-xl font-bold mb-4 text-gray-800">
            Không có dữ liệu ca làm việc
          </h2>
          <button onClick={() => navigate("/")} className="btn-big btn-primary">
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  const resultBg: Record<string, string> = {
    bonus: "bg-gradient-to-r from-green-500 to-emerald-600",
    neutral: "bg-gradient-to-r from-yellow-500 to-amber-600",
    penalty: "bg-gradient-to-r from-red-500 to-rose-600",
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-blue-50 pb-24">
      {/* Header */}
      <header className="bg-linear-to-br from-blue-600 to-indigo-700 text-white px-4 py-6 text-center shadow-lg">
        <h1 className="text-2xl font-bold tracking-wide">
          TỔNG KẾT CA LÀM VIỆC
        </h1>
        <p className="text-blue-200 mt-1">
          {new Date().toLocaleDateString("vi-VN", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </header>

      <div className="p-4 space-y-5 max-w-lg mx-auto">
        {/* User Info Card */}
        <div className="bg-white rounded-2xl shadow-md p-5 flex items-center gap-4 border border-blue-100">
          <div className="w-16 h-16 bg-linear-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center shadow-md">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
          <div>
            <div className="text-xl font-bold text-gray-800">{user?.name}</div>
            <div className="text-gray-500 text-sm">
              Mã nhân viên:{" "}
              <span className="font-medium text-blue-600">{user?.code}</span>
            </div>
          </div>
        </div>

        {/* Summary Stats Card */}
        <div className="bg-white rounded-2xl shadow-md p-5 border border-blue-100">
          <h3 className="font-bold text-lg mb-5 text-center text-gray-800 flex items-center justify-center gap-2">
            <span className="text-2xl">📊</span> KẾT QUẢ
          </h3>

          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="text-center p-4 bg-linear-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
              <div className="text-3xl font-bold text-blue-600">
                {summary.totalOperations}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Thao tác hoàn thành
              </div>
            </div>
            <div className="text-center p-4 bg-linear-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100">
              <div className="text-3xl font-bold text-green-600">
                {summary.totalWorkingMinutes}
                <span className="text-lg">p</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Thời gian thực tế
              </div>
            </div>
            <div className="text-center p-4 bg-linear-to-br from-purple-50 to-violet-50 rounded-xl border border-purple-100">
              <div className="text-3xl font-bold text-purple-600">
                {summary.totalStandardMinutes}
                <span className="text-lg">p</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">Thời gian chuẩn</div>
            </div>
            <div className="text-center p-4 bg-linear-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-100">
              <div
                className={`text-3xl font-bold ${summary.efficiencyPercent >= 100 ? "text-green-600" : "text-amber-600"}`}
              >
                {summary.efficiencyPercent}
                <span className="text-lg">%</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">Hiệu suất</div>
            </div>
          </div>

          {/* Result Banner */}
          <div
            className={`${resultBg[(summary.result?.type as string) || ""] || "bg-gray-500"} text-white rounded-2xl p-6 text-center shadow-lg`} // [splinh-12/03-15:20]
          >
            <div className="text-3xl mb-2">
              {summary.result?.type === "bonus"
                ? "🎉"
                : summary.result?.type === "penalty"
                  ? "⚠️"
                  : "✅"}
            </div>
            <div className="text-2xl font-bold mb-1">
              {summary.result?.label}
            </div>
            {summary.result?.percent !== 0 && (
              <div className="text-lg opacity-90">
                {(summary.result?.percent ?? 0) > 0 ? "+" : ""}
                {summary.result?.percent}% lương
              </div>
            )}
          </div>
        </div>

        {/* Operations Detail Card */}
        {summary.operations && summary.operations.length > 0 && (
          <div className="bg-white rounded-2xl shadow-md p-5 border border-blue-100">
            <h3 className="font-bold text-lg mb-4 text-gray-800 flex items-center gap-2">
              <span className="text-xl">📝</span> Chi tiết thao tác
            </h3>
            <div className="space-y-2">
              {summary.operations.map((op, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center p-3 bg-linear-to-br from-gray-50 to-slate-50 rounded-xl border border-gray-100"
                >
                  <div>
                    <div className="font-medium text-gray-800">{op.name}</div>
                    <div className="text-xs text-gray-500">
                      Chuẩn: {op.standardTime}p | Thực tế: {op.actualTime}p
                    </div>
                  </div>
                  <div
                    className={`font-bold text-lg px-3 py-1 rounded-lg ${op.efficiency >= 100 ? "bg-green-100 text-green-600" : "bg-amber-100 text-amber-600"}`}
                  >
                    {op.efficiency}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sticky Footer Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg p-4">
        <div className="max-w-lg mx-auto flex gap-3">
          <button
            onClick={() => navigate("/")}
            className="flex-1 py-3.5 px-4 bg-linear-to-br from-blue-500 to-indigo-600 text-white font-semibold rounded-xl shadow-md hover:from-blue-600 hover:to-indigo-700 transition-all flex items-center justify-center gap-2"
          >
            <span>🏠</span> Về trang chính
          </button>
          <button
            onClick={logout}
            className="py-3.5 px-5 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-all flex items-center justify-center gap-2 border border-gray-200"
          >
            <span>🚪</span> Đăng xuất
          </button>
        </div>
      </div>
    </div>
  );
};

export default SummaryPage;
