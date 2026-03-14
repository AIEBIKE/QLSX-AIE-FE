import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle,
  Clock,
  Users,
  Play,
  Trash2,
  ChevronRight,
  Wrench,
  Paintbrush,
  Shield,
  Zap,
  Hammer,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query"; // [splinh-12/03-14:36]
import { useAuth } from "../../contexts/AuthContext"; // [splinh-12/03-14:36]
import * as apiHooks from "../../hooks/useMutations";
import * as queryHooks from "../../hooks/useQueries"; // [splinh-12/03-14:48]

const getOperationIcon = (processName = "") => {
  const n = processName.toLowerCase();
  if (n.includes("hàn") || n.includes("welding"))
    return <Wrench className="w-4 h-4" />;
  if (n.includes("sơn") || n.includes("paint"))
    return <Paintbrush className="w-4 h-4" />;
  if (n.includes("kiểm") || n.includes("qc") || n.includes("quality"))
    return <Shield className="w-4 h-4" />;
  if (n.includes("điện") || n.includes("electric"))
    return <Zap className="w-4 h-4" />;
  return <Hammer className="w-4 h-4" />;
};

const iconColorMap: Record<string, string> = {
  welding: "bg-orange-100 text-orange-600",
  painting: "bg-violet-100 text-violet-600",
  qc: "bg-emerald-100 text-emerald-600",
  electrical: "bg-yellow-100 text-yellow-600",
  assembly: "bg-blue-100 text-blue-600",
};

const getIconColorClass = (processName = "") => {
  const n = processName.toLowerCase();
  if (n.includes("hàn") || n.includes("welding")) return "welding";
  if (n.includes("sơn") || n.includes("paint")) return "painting";
  if (n.includes("kiểm") || n.includes("qc") || n.includes("quality"))
    return "qc";
  if (n.includes("điện") || n.includes("electric")) return "electrical";
  return "assembly";
};

const RegistrationCard = ({
  reg,
  onStart,
  onCancel,
  onComplete,
  isSupplemental = false,
}: {
  reg: any;
  onStart: (id: string) => void;
  onCancel: (id: string) => void;
  onComplete: (id: string) => void;
  isSupplemental?: boolean;
}) => {
  return (
    <Card
      className={`border-slate-200 ${isSupplemental ? "border-l-4 border-l-amber-400 bg-amber-50/30" : ""}`}
    >
      <CardContent className="py-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-4">
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconColorMap[getIconColorClass(reg.operationId?.processId?.name)] || "bg-blue-100 text-blue-600"}`}
            >
              {getOperationIcon(reg.operationId?.processId?.name)}
            </div>
            <div>
              <div className="font-semibold flex items-center gap-2">
                {reg.operationId?.name}
                {isSupplemental && (
                  <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200 text-[10px] h-4">
                    Bổ sung
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-sm text-slate-500">
                  Tiêu chuẩn: <strong>{reg.expectedQuantity}/ca</strong>
                </span>
                {reg.status === "completed" ? (
                  reg.actualQuantity < reg.expectedQuantity ? (
                    <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">
                      ⚠️ Hoàn thành (Thiếu)
                    </Badge>
                  ) : (
                    <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                      ✓ Hoàn thành
                    </Badge>
                  )
                ) : reg.status === "in_progress" ? (
                  <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
                    ⏱ Đang làm
                  </Badge>
                ) : (
                  <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                    📋 Đã đăng ký
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {reg.status === "registered" ? (
              <>
                <Button
                  size="sm"
                  onClick={() => onStart(reg._id)}
                  className="bg-emerald-500 hover:bg-emerald-600"
                >
                  <Play className="w-3.5 h-3.5 mr-1" /> Bắt đầu
                </Button>
                {!isSupplemental && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-slate-400 border-slate-200 hover:bg-slate-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Hủy đăng ký?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Hủy đăng ký thao tác này?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Không</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => onCancel(reg._id)}
                          className="bg-red-500 hover:bg-red-600"
                        >
                          Hủy đăng ký
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </>
            ) : reg.status === "in_progress" ? (
              <>
                <Button
                  size="sm"
                  onClick={() => onComplete(reg._id)}
                  className="bg-[#0077c0] hover:bg-[#005f9e]"
                >
                  <CheckCircle className="w-3.5 h-3.5 mr-1" /> Nhập kết quả
                </Button>
                {!isSupplemental && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-slate-400 border-slate-200 hover:bg-slate-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Hủy đăng ký?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Hủy đăng ký thao tác này?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Không</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => onCancel(reg._id)}
                          className="bg-red-500 hover:bg-red-600"
                        >
                          Hủy đăng ký
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </>
            ) : (
              <Badge
                variant="outline"
                className={`${
                  reg.actualQuantity < reg.expectedQuantity
                    ? "bg-orange-50 text-orange-700 border-orange-200"
                    : "bg-emerald-50 text-emerald-700 border-emerald-100"
                } px-3 py-1`}
              >
                SL: {reg.actualQuantity}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function WorkerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient(); // [splinh-12/03-14:36]

  const { data: orderData, isLoading: loadingOrder } =
    queryHooks.useCurrentOrder(); // [splinh-12/03-14:48]
  const { data: registrations = [], isLoading: loadingReg } =
    queryHooks.useTodayRegistrations(); // [splinh-12/03-14:48]

  const loading = loadingOrder || loadingReg;

  const activeOrder = (orderData as any)?.order || null; // [splinh-12/03-14:38]
  const processes = (orderData as any)?.processes || []; // [splinh-12/03-14:38]
  const operations = (orderData as any)?.operations || []; // [splinh-12/03-14:38]
  const todayRegistrations = registrations || [];
  const regularRegistrations = todayRegistrations.filter(
    (r: any) => !r.isReplacement,
  );
  const supplementalRegistrations = todayRegistrations.filter(
    (r: any) => r.isReplacement,
  );

  const { mutate: registerMutation, isPending: registering } =
    apiHooks.useRegisterOperation();
  const { mutate: cancelMutation } = apiHooks.useCancelRegistration();
  const { mutate: startMutation } = apiHooks.useStartRegistration();

  const [selectedProcess, setSelectedProcess] = useState("all");
  const [isOutOfTime, setIsOutOfTime] = useState(false);

  useEffect(() => {
    const checkTime = () => {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentTime = currentHour * 60 + currentMinute;
      const startTimeLimit = 6 * 60 + 30; // 06:30
      const endTimeLimit = 17 * 60; // 17:00
      setIsOutOfTime(
        currentTime < startTimeLimit || currentTime > endTimeLimit,
      );
    };
    checkTime();
    const timer = setInterval(checkTime, 60000);
    return () => clearInterval(timer);
  }, []);

  const handleRegister = (operationId: string) => {
    if (registering) return;
    registerMutation(operationId);
  };

  const handleCancelRegistration = (regId: string) => {
    cancelMutation(regId);
  };

  const handleStartRegistration = (regId: string) => {
    startMutation(regId);
  };

  const isRegistered = (opId: string) =>
    todayRegistrations.some(
      (r: any) => r.operationId?._id === opId || r.operationId === opId,
    );

  const filteredOperations = operations.filter(
    (op: any) =>
      selectedProcess === "all" || op.processId?._id === selectedProcess,
  );

  if (loading)
    return (
      <div className="flex items-center justify-center h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );

  return (
    <div className="max-w-[1200px] mx-auto">
      {/* Time Window Warning */}
      {isOutOfTime && (
        <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-6 rounded-r-lg shadow-sm">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-amber-500 mr-3" />
            <p className="text-sm text-amber-800">
              Hệ thống chỉ mở đăng ký từ{" "}
              <span className="font-bold">06:30 đến 17:00</span>. Hiện tại ngoài
              khung giờ quy định.
            </p>
          </div>
        </div>
      )}
      {/* Production Order Header */}
      {activeOrder ? (
        <Card className="mb-6 border-slate-200">
          <CardContent className="pt-5">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div>
                <p className="text-xs font-semibold text-[#0077c0] uppercase tracking-wider mb-1">
                  ⚡ Lệnh sản xuất
                </p>
                <h3 className="text-xl font-bold flex items-center gap-3">
                  {activeOrder.orderCode}
                  <span className="text-slate-300 font-normal">|</span>
                  <span className="text-lg font-normal text-slate-600">
                    {activeOrder.vehicleTypeId?.name}
                  </span>
                </h3>
              </div>
              <div className="flex gap-6">
                <div className="text-right">
                  <p className="text-xs text-slate-400">Mục tiêu</p>
                  <p className="text-xl font-bold">{activeOrder.quantity} xe</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400">Còn lại</p>
                  <p className="text-xl font-bold text-[#0077c0]">
                    {activeOrder.quantity -
                      (activeOrder.completedQuantity || 0)}{" "}
                    xe
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="mb-6 border-amber-200 bg-amber-50">
          <CardContent className="pt-5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5" />
              <div>
                <p className="font-medium text-amber-800">
                  Không có lệnh sản xuất đang thực hiện
                </p>
                <p className="text-sm text-amber-600">
                  Vui lòng liên hệ quản lý để được phân công.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {activeOrder && (
        <>
          {/* Today's Registrations */}
          <div className="mb-8 space-y-8">
            {/* Regular Registrations */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-bold">✅ Đã đăng ký hôm nay</h4>
                <span className="text-sm text-slate-400">
                  {regularRegistrations.length} thao tác
                </span>
              </div>
              {regularRegistrations.length === 0 ? (
                <Card className="border-slate-200">
                  <CardContent className="py-10 text-center text-slate-400">
                    Chưa đăng ký thao tác nào hôm nay
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {regularRegistrations.map((reg: any) => (
                    <RegistrationCard
                      key={reg._id}
                      reg={reg}
                      onStart={handleStartRegistration}
                      onCancel={handleCancelRegistration}
                      onComplete={(id) => navigate(`/worker/complete/${id}`)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Supplemental Registrations */}
            {supplementalRegistrations.length > 0 && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-lg font-bold text-amber-600 flex items-center gap-2">
                    <Zap className="w-5 h-5 fill-amber-500 text-amber-500" />
                    Được đăng ký bổ sung
                  </h4>
                  <span className="text-sm text-slate-400">
                    {supplementalRegistrations.length} thao tác
                  </span>
                </div>
                <div className="space-y-3">
                  {supplementalRegistrations.map((reg: any) => (
                    <RegistrationCard
                      key={reg._id}
                      reg={reg}
                      onStart={handleStartRegistration}
                      onCancel={handleCancelRegistration}
                      onComplete={(id) => navigate(`/worker/complete/${id}`)}
                      isSupplemental
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Available Operations */}
          <div>
            <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
              <h4 className="text-lg font-bold">⚙️ Thao tác có thể đăng ký</h4>
              <div className="flex gap-2 overflow-x-auto">
                <Button
                  variant={selectedProcess === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedProcess("all")}
                  className={
                    selectedProcess === "all"
                      ? "bg-[#0077c0] hover:bg-[#005f9e]"
                      : ""
                  }
                >
                  Tất cả
                </Button>
                {processes.map((p: any) => (
                  <Button
                    key={p._id}
                    variant={selectedProcess === p._id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedProcess(p._id)}
                    className={
                      selectedProcess === p._id
                        ? "bg-[#0077c0] hover:bg-[#005f9e]"
                        : ""
                    }
                  >
                    {p.name}
                  </Button>
                ))}
              </div>
            </div>

            {filteredOperations.length === 0 ? (
              <Card className="border-slate-200">
                <CardContent className="py-10 text-center text-slate-400">
                  Không có thao tác khả dụng
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredOperations.map((op: any) => {
                  const registered = isRegistered(op._id);
                  const available = op.isAvailable;
                  const isFull = !available && !registered;

                  return (
                    <Card
                      key={op._id}
                      className={`border-slate-200 ${isFull ? "opacity-60" : ""}`}
                    >
                      <CardContent className="pt-5">
                        <div className="flex justify-between items-start mb-4">
                          <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconColorMap[getIconColorClass(op.processId?.name)] || "bg-blue-100 text-blue-600"}`}
                          >
                            {getOperationIcon(op.processId?.name)}
                          </div>
                          <span className="text-xs text-slate-400">
                            ID: {op.code}
                          </span>
                        </div>

                        <div className="mb-4">
                          <div className="font-semibold text-base mb-1">
                            {op.name}
                          </div>
                          <span className="text-sm text-slate-500">
                            {op.processId?.name}
                          </span>
                        </div>

                        <div className="flex gap-6 mb-4">
                          <div>
                            <p className="text-[10px] uppercase text-slate-400 tracking-wider">
                              Tiêu chuẩn
                            </p>
                            <p className="font-semibold text-[#0077c0]">
                              {op.standardQuantity || "—"} sp/ca
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase text-slate-400 tracking-wider">
                              Thời gian
                            </p>
                            <p className="font-semibold text-slate-600">
                              {op.standardMinutes || "—"} min/sp
                            </p>
                          </div>
                        </div>

                        <div className="mb-4 flex items-center gap-2">
                          <Users
                            className={`w-4 h-4 ${isFull ? "text-red-500" : "text-slate-400"}`}
                          />
                          <span
                            className={`text-sm ${isFull ? "text-red-500" : "text-slate-500"}`}
                          >
                            {op.allowTeamwork
                              ? `Người làm: ${op.currentWorkers}/${op.maxWorkers}${isFull ? " (Đã đủ)" : ""}`
                              : op.currentWorkers > 0
                                ? "1/1 (Có người)"
                                : "0/1"}
                          </span>
                        </div>

                        {registered ? (
                          <Button
                            className="w-full bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                            disabled
                          >
                            <CheckCircle className="w-4 h-4 mr-1" /> Đã đăng ký
                          </Button>
                        ) : available ? (
                          <Button
                            className="w-full bg-[#0077c0] hover:bg-[#005f9e]"
                            onClick={() => handleRegister(op._id)}
                            disabled={registering || isOutOfTime}
                          >
                            <ChevronRight className="w-4 h-4 mr-1" />{" "}
                            {isOutOfTime ? "Ngoài giờ" : "Đăng ký →"}
                          </Button>
                        ) : (
                          <Button className="w-full" disabled variant="outline">
                            Đã đủ người
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
