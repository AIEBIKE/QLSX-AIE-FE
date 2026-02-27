import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  getProcesses,
  getProcess,
  getCurrentShift,
  startShift,
  endShift,
} from "../services/api";
import type { Process, Shift } from "../types";
import { AxiosError } from "axios";

interface Operation {
  _id: string;
  name: string;
  standardTime: number;
}

interface ProcessWithOperations extends Process {
  operations?: Operation[];
  operationCount?: number;
}

interface WorkLog {
  _id: string;
  operationId?: { name: string };
  startTime: string;
  standardMinutes: number;
  durationMinutes: number;
  status: string;
}

interface ApiErrorResponse {
  error?: { message?: string };
}

const WorkStationPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [processes, setProcesses] = useState<ProcessWithOperations[]>([]);
  const [selectedProcess, setSelectedProcess] =
    useState<ProcessWithOperations | null>(null);
  const [operations, setOperations] = useState<Operation[]>([]);
  const [shift, setShift] = useState<Shift | null>(null);
  const [activeWorkLog, setActiveWorkLog] = useState<WorkLog | null>(null);
  const [todayLogs, setTodayLogs] = useState<WorkLog[]>([]);
  const [timer, setTimer] = useState(0);
  const [loading, setLoading] = useState(true);

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  // Timer
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (activeWorkLog) {
      interval = setInterval(() => {
        const start = new Date(activeWorkLog.startTime);
        const now = new Date();
        setTimer(Math.floor((now.getTime() - start.getTime()) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeWorkLog]);

  const loadData = async () => {
    try {
      const [processRes, shiftRes] = await Promise.all([
        getProcesses(),
        getCurrentShift(),
      ]);
      setProcesses(processRes.data.data as ProcessWithOperations[]);
      setShift(shiftRes.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartShift = async () => {
    try {
      const res = await startShift();
      setShift(res.data.data);
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      alert(axiosError.response?.data?.error?.message || "Lỗi");
    }
  };

  const handleEndShift = async () => {
    if (!confirm("Bạn có chắc muốn kết thúc ca?")) return;
    try {
      await endShift();
      navigate("/summary");
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      alert(axiosError.response?.data?.error?.message || "Lỗi");
    }
  };

  const handleSelectProcess = async (process: ProcessWithOperations) => {
    try {
      const res = await getProcess(process._id);
      const data = res.data.data as ProcessWithOperations;
      setSelectedProcess(data);
      setOperations(data.operations || []);
    } catch (err) {
      console.error(err);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getTotalStats = () => {
    const completed = todayLogs.filter((l) => l.status === "completed");
    const totalMins = completed.reduce((sum, l) => sum + l.durationMinutes, 0);
    const standardMins = completed.reduce(
      (sum, l) =>
        sum + (l as WorkLog & { standardMinutes: number }).standardMinutes,
      0,
    );
    const efficiency =
      totalMins > 0 ? Math.round((standardMins / totalMins) * 100) : 0;
    return { count: completed.length, totalMins, standardMins, efficiency };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Đang tải...</div>
      </div>
    );
  }

  const stats = getTotalStats();

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-blue-600 text-white px-4 py-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <svg
                className="w-6 h-6"
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
              <div className="font-bold">{user?.name}</div>
              <div className="text-sm text-blue-200">{user?.code}</div>
            </div>
          </div>
          <button onClick={logout} className="text-blue-200 hover:text-white">
            Đăng xuất
          </button>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* Shift Status */}
        {!shift ? (
          <div className="card text-center">
            <h2 className="text-xl font-bold mb-4">Chưa bắt đầu ca làm việc</h2>
            <button onClick={handleStartShift} className="btn-big btn-success">
              🚀 BẮT ĐẦU CA
            </button>
          </div>
        ) : (
          <>
            {/* Stats Bar */}
            <div className="grid grid-cols-3 gap-3">
              <div className="card text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {stats.count}
                </div>
                <div className="text-sm text-gray-500">Thao tác</div>
              </div>
              <div className="card text-center">
                <div className="text-2xl font-bold text-green-600">
                  {stats.totalMins}p
                </div>
                <div className="text-sm text-gray-500">Thời gian</div>
              </div>
              <div className="card text-center">
                <div
                  className={`text-2xl font-bold ${stats.efficiency >= 100 ? "text-green-600" : "text-yellow-600"}`}
                >
                  {stats.efficiency}%
                </div>
                <div className="text-sm text-gray-500">Hiệu suất</div>
              </div>
            </div>

            {/* Active Operation */}
            {activeWorkLog && (
              <div className="card bg-yellow-50 border-2 border-yellow-400">
                <div className="text-center">
                  <div className="text-sm text-yellow-600 font-medium mb-2">
                    ĐANG THỰC HIỆN
                  </div>
                  <div className="text-xl font-bold mb-2">
                    {activeWorkLog.operationId?.name}
                  </div>
                  <div className="timer-display text-yellow-600 mb-4">
                    {formatTime(timer)}
                  </div>
                  <div className="text-sm text-gray-500 mb-4">
                    Thời gian chuẩn: {activeWorkLog.standardMinutes} phút
                  </div>
                  <button className="btn-big btn-success w-full">
                    ✅ HOÀN THÀNH
                  </button>
                </div>
              </div>
            )}

            {/* Process Selection */}
            {!activeWorkLog && (
              <>
                <div className="card">
                  <h3 className="font-bold text-lg mb-3">Chọn Công Đoạn</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {processes.map((p) => (
                      <button
                        key={p._id}
                        onClick={() => handleSelectProcess(p)}
                        className={`process-card text-left ${selectedProcess?._id === p._id ? "selected" : ""}`}
                      >
                        <div className="font-bold text-blue-600">
                          CD{p.order}
                        </div>
                        <div className="text-sm text-gray-600 truncate">
                          {p.name}
                        </div>
                        <div className="text-xs text-gray-400">
                          {p.operationCount} thao tác
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Operations */}
                {selectedProcess && (
                  <div className="card">
                    <h3 className="font-bold text-lg mb-3">
                      Thao tác - {selectedProcess.name}
                    </h3>
                    <div className="space-y-2">
                      {operations.map((op) => (
                        <div
                          key={op._id}
                          className="operation-card available flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2"
                        >
                          <div>
                            <div className="font-medium">{op.name}</div>
                            <div className="text-sm text-gray-500">
                              ⏱️ {op.standardTime} phút
                            </div>
                          </div>
                          <button className="w-full sm:w-auto bg-green-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-green-700">
                            BẮT ĐẦU
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* End Shift Button */}
            <button
              onClick={handleEndShift}
              className="btn-big btn-danger w-full"
            >
              🏁 KẾT THÚC CA
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default WorkStationPage;
