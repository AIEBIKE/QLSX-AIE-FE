import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Cookies from "js-cookie";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  History,
  Users,
  Shield,
  Crown,
  Search,
  LayoutList,
  LayoutGrid,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  EyeOff,
  User,
  Loader2,
} from "lucide-react";
import { Pagination } from "@/components/shared/Pagination";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import * as api from "../../services/api";
import { getNextCodeApi } from "@/services/authService";
import {
  useUsers,
  usePendingUsers,
  useFactories,
} from "@/hooks/useQueries";
import {
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
  useApproveUser,
  useRejectUser,
} from "@/hooks/useMutations";

// ─── Helpers ─────────────────────────────────────────
const getAvatarColor = (name: string) => {
  const colors = [
    "#f56a00",
    "#7265e6",
    "#ffbf00",
    "#00a2ae",
    "#eb2f96",
    "#52c41a",
    "#1677ff",
    "#722ed1",
  ];
  return colors[name?.charCodeAt(0) % colors.length || 0];
};

const getInitials = (name: string) => {
  if (!name) return "?";
  const parts = name.split(" ");
  if (parts.length >= 2)
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name[0].toUpperCase();
};

const getRoleBadge = (role: string) => {
  const map: Record<
    string,
    { label: string; className: string; icon: React.ReactNode }
  > = {
    admin: {
      label: "Admin",
      className: "bg-red-100 text-red-700 border-red-200",
      icon: <Crown className="w-3 h-3" />,
    },
    supervisor: {
      label: "Giám sát",
      className: "bg-blue-100 text-blue-700 border-blue-200",
      icon: <Shield className="w-3 h-3" />,
    },
    worker: {
      label: "Công nhân",
      className: "bg-emerald-100 text-emerald-700 border-emerald-200",
      icon: <Users className="w-3 h-3" />,
    },
    fac_manager: {
      label: "Quản lý nhà máy",
      className: "bg-purple-100 text-purple-700 border-purple-200",
      icon: <Users className="w-3 h-3" />,
    },
  };
  return (
    map[role] || {
      label: role,
      className: "bg-gray-100 text-gray-700",
      icon: <User className="w-3 h-3" />,
    }
  );
};

// ─── Types ───────────────────────────────────────────
interface UserType {
  _id: string;
  code: string;
  name: string;
  role: string;
  factoryId?: any; // Liên kết nhà máy
  active: boolean;
  status?: "pending" | "approved" | "rejected";
  dateOfBirth?: string;
  citizenId?: string;
  address?: string;
  createdAt?: string;
}

// ─── Component ───────────────────────────────────────
export default function UsersManagementPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [selectedFactory, setSelectedFactory] = useState<string>("all");

  const currentUser = JSON.parse(Cookies.get("user") || "{}");
  const roleCode = currentUser.roleCode || currentUser.role;
  const isAdmin = roleCode === "ADMIN" || roleCode === "admin";
  const isFacManager = roleCode === "FAC_MANAGER" || roleCode === "fac_manager";

  const { data: factories = [] } = useQuery({
    queryKey: ["factories"],
    queryFn: async () => {
      const res = await api.getFactories();
      return res.data.data || [];
    },
  });

  // Form state
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    role: "worker" as string,
    password: "123456",
    factoryId: "",
    active: true,
    dateOfBirth: "",
    citizenId: "",
    address: "",
  });
  const [showPassword, setShowPassword] = useState(false);

  // Active tab from URL
  const activeTab = searchParams.get("tab") || "all";
  const setActiveTab = (tab: string) => setSearchParams({ tab });

  // Filters
  const [searchText, setSearchText] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) setViewMode("cards");
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
    meta: { total: 0, active: 0, inactive: 0 },
  });

  const { data: usersData, isLoading: loadingUsers } = useQuery({
    queryKey: [
      "users",
      selectedFactory,
      filterRole,
      filterStatus,
      pagination.page,
      pagination.limit,
      searchText,
    ],
    queryFn: async () => {
      const res = await api.getUsers({
        factoryId: selectedFactory !== "all" ? selectedFactory : undefined,
        role: filterRole !== "all" ? filterRole : undefined,
        active:
          filterStatus === "active"
            ? true
            : filterStatus === "inactive"
              ? false
              : undefined,
        search: searchText || undefined,
        page: pagination.page,
        limit: pagination.limit,
      });
      return res.data;
    },
  });

  const users = usersData?.data || [];
  useEffect(() => {
    if (usersData?.pagination) {
      setPagination((prev) => ({
        ...prev,
        total: usersData.pagination.total,
        totalPages: usersData.pagination.totalPages,
        meta: usersData.meta || { total: 0, active: 0, inactive: 0 },
      }));
    }
  }, [usersData]);

  const { data: pendingUsersData, isLoading: loadingPending } = usePendingUsers(!isFacManager);

  const pendingUsers = pendingUsersData || [];

  const loading = loadingUsers || loadingPending;

  // Fetch next employee code based on role
  const fetchNextCode = useCallback(async (role: string) => {
    try {
      const res = await getNextCodeApi(role);
      if (res.success && res.data?.code) {
        setFormData((prev) => ({ ...prev, code: res.data!.code }));
      }
    } catch (error) {
      console.error("Error fetching next code:", error);
    }
  }, []);

  const approveMutation = useApproveUser();
  const rejectMutation = useRejectUser();
  const createUserMut = useCreateUser();
  const updateUserMut = useUpdateUser();
  const deleteUserMut = useDeleteUser();

  const handleApprove = (userId: string) => {
    approveMutation.mutate(userId);
  };

  const handleReject = (userId: string) => {
    rejectMutation.mutate(userId);
  };

  const handleSubmit = () => {
    const payload: any = {
      name: formData.name,
      code: formData.code,
      role: formData.role,
      factoryId: formData.factoryId || undefined,
      dateOfBirth: formData.dateOfBirth || undefined,
      citizenId: formData.citizenId || undefined,
      address: formData.address || undefined,
    };
    
    const onSuccess = () => {
      setModalOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["users"] });
    };

    if (editingUser) {
      if (formData.password) payload.password = formData.password;
      payload.active = formData.active;
      updateUserMut.mutate(
        { id: editingUser._id, data: payload },
        { onSuccess },
      );
    } else {
      payload.password = formData.password;
      createUserMut.mutate(payload, { onSuccess });
    }
  };

  const handleDelete = (id: string) => {
    deleteUserMut.mutate(id, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["users"] });
      },
    });
  };

  const resetForm = () => {
    setFormData({
      code: "",
      name: "",
      role: "worker",
      password: "123456",
      factoryId: isFacManager ? currentUser.factoryId || "" : "",
      active: true,
      dateOfBirth: "",
      citizenId: "",
      address: "",
    });
    setEditingUser(null);
  };

  const openEdit = (user: UserType) => {
    setEditingUser(user);
    setFormData({
      code: user.code,
      name: user.name,
      role: user.role,
      password: "",
      factoryId:
        typeof user.factoryId === "object"
          ? user.factoryId?._id
          : user.factoryId || "",
      active: user.active,
      dateOfBirth: user.dateOfBirth
        ? new Date(user.dateOfBirth).toISOString().split("T")[0]
        : "",
      citizenId: user.citizenId || "",
      address: user.address || "",
    });
    setModalOpen(true);
  };

  const openCreate = () => {
    resetForm();
    setModalOpen(true);
    setTimeout(() => fetchNextCode("worker"), 100);
  };

  // ─── Stat cards ────────────────────────────────────
  const statCards = [
    {
      label: "Tổng cộng",
      value: pagination.meta?.total || 0,
      icon: <Users className="w-4 h-4 text-blue-500" />,
      color: "text-blue-600",
    },
    {
      label: "Hoạt động",
      value: pagination.meta?.active || 0,
      icon: <CheckCircle className="w-4 h-4 text-emerald-500" />,
      color: "text-emerald-600",
    },
    {
      label: "Đã khóa",
      value: pagination.meta?.inactive || 0,
      icon: <XCircle className="w-4 h-4 text-gray-400" />,
      color: "text-gray-500",
    },
  ].filter((s) => {
    if (isFacManager) {
      return s.label !== "Admin" && s.label !== "Giám sát";
    }
    return true;
  });

  return (
    <TooltipProvider>
      <div>
        {/* Header */}
        <div className="flex justify-between items-start flex-wrap gap-3 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">
              👥 {isFacManager ? "Quản lý công nhân" : "Quản lý người dùng"}
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              Quản lý thông tin và phân quyền{" "}
              {isFacManager ? "công nhân" : "người dùng"} trong hệ thống
            </p>
          </div>
          <Button
            onClick={openCreate}
            className="bg-[#0077c0] hover:bg-[#005fa3]"
          >
            <Plus className="w-4 h-4 mr-2" />
            {isFacManager ? "Thêm công nhân" : "Thêm người dùng"}
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mb-6">
          {statCards.map((s, i) => (
            <Card key={i} className="text-center border-slate-200">
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center justify-center gap-1 mb-1">
                  {s.icon}
                </div>
                <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                <div className="text-xs text-slate-500">{s.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
          <TabsList>
            <TabsTrigger value="all" className="gap-1.5">
              <Users className="w-4 h-4" /> Tất cả ({users.length})
            </TabsTrigger>
            {!isFacManager && (
              <TabsTrigger value="pending" className="gap-1.5 relative">
                <Clock className="w-4 h-4 text-amber-500" /> Chờ duyệt
                {pendingUsers.length > 0 && (
                  <span className="ml-1 bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5">
                    {pendingUsers.length}
                  </span>
                )}
              </TabsTrigger>
            )}
          </TabsList>

          {/* Pending tab */}
          {!isFacManager && (
            <TabsContent value="pending">
              <Card className="border-slate-200">
                <CardContent className="pt-4">
                  {pendingUsers.length === 0 ? (
                    <div className="text-center py-10">
                      <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                      <h3 className="text-lg font-semibold text-slate-700">
                        Không có tài khoản chờ duyệt
                      </h3>
                      <p className="text-slate-500 text-sm">
                        Tất cả tài khoản đã được xử lý
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {pendingUsers.map((u) => {
                        const roleBadge = getRoleBadge(u.role);
                        return (
                          <div
                            key={u._id}
                            className="flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:bg-slate-50"
                          >
                            <div className="flex items-center gap-3">
                              <Avatar className="w-10 h-10">
                                <AvatarFallback
                                  style={{
                                    backgroundColor: getAvatarColor(u.name),
                                  }}
                                  className="text-white text-sm font-semibold"
                                >
                                  {getInitials(u.name)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-sm">
                                    {u.name}
                                  </span>
                                  <Badge variant="outline" className="text-xs">
                                    {u.code}
                                  </Badge>
                                  <Badge
                                    variant="outline"
                                    className={`text-xs ${roleBadge.className}`}
                                  >
                                    {roleBadge.icon}
                                    <span className="ml-1">
                                      {roleBadge.label}
                                    </span>
                                  </Badge>
                                </div>
                                <p className="text-xs text-slate-500">
                                  Đăng ký:{" "}
                                  {u.createdAt
                                    ? new Date(u.createdAt).toLocaleDateString(
                                        "vi-VN",
                                      )
                                    : "N/A"}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    size="sm"
                                    className="bg-emerald-500 hover:bg-emerald-600"
                                  >
                                    <CheckCircle className="w-3.5 h-3.5 mr-1" />{" "}
                                    Duyệt
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      Duyệt tài khoản?
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Người dùng sẽ có thể đăng nhập sau khi
                                      được duyệt
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Hủy</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleApprove(u._id)}
                                      className="bg-emerald-500 hover:bg-emerald-600"
                                    >
                                      Duyệt
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button size="sm" variant="destructive">
                                    <XCircle className="w-3.5 h-3.5 mr-1" /> Từ
                                    chối
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      Từ chối tài khoản?
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Người dùng sẽ không thể đăng nhập
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Hủy</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleReject(u._id)}
                                      className="bg-red-500 hover:bg-red-600"
                                    >
                                      Từ chối
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* All users tab */}
          <TabsContent value="all">
            {/* Filters */}
            <Card className="mb-4 border-slate-200">
              <CardContent className="py-3">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex-1 min-w-[200px]">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        placeholder="Tìm theo tên, mã nhân viên..."
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>
                  {isAdmin && (
                    <Select
                      value={selectedFactory}
                      onValueChange={setSelectedFactory}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Nhà máy" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tất cả nhà máy</SelectItem>
                        {factories.map((f) => (
                          <SelectItem key={f._id} value={f._id}>
                            {f.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <Select value={filterRole} onValueChange={setFilterRole}>
                    <SelectTrigger className="w-[160px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả vai trò</SelectItem>
                      <SelectItem value="worker">Công nhân</SelectItem>
                      <SelectItem value="supervisor">Giám sát</SelectItem>
                      {!isFacManager && (
                        <SelectItem value="admin">Admin</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-[160px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả trạng thái</SelectItem>
                      <SelectItem value="active">Hoạt động</SelectItem>
                      <SelectItem value="inactive">Đã khóa</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex items-center gap-2 ml-auto">
                    <span className="text-xs text-slate-500">
                      Hiển thị {users.length} / {pagination.total}
                    </span>
                    {!isMobile && (
                      <div className="flex border rounded-md overflow-hidden">
                        <button
                          onClick={() => setViewMode("table")}
                          className={`p-2 ${viewMode === "table" ? "bg-slate-100" : "hover:bg-slate-50"}`}
                        >
                          <LayoutList className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setViewMode("cards")}
                          className={`p-2 ${viewMode === "cards" ? "bg-slate-100" : "hover:bg-slate-50"}`}
                        >
                          <LayoutGrid className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Table View */}
            {viewMode === "table" && !isMobile ? (
              <Card className="border-slate-200">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Người dùng</TableHead>
                      <TableHead className="w-[130px]">Vai trò</TableHead>
                      <TableHead className="w-[120px]">Trạng thái</TableHead>
                      <TableHead className="w-[150px] text-right">
                        Thao tác
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-10">
                          <Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-400" />
                        </TableCell>
                      </TableRow>
                    ) : users.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="text-center py-10 text-slate-500"
                        >
                          Không tìm thấy người dùng phù hợp
                        </TableCell>
                      </TableRow>
                    ) : (
                      users.map((u) => {
                        const role = getRoleBadge(u.role);
                        return (
                          <TableRow key={u._id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="w-9 h-9">
                                  <AvatarFallback
                                    style={{
                                      backgroundColor: getAvatarColor(u.name),
                                    }}
                                    className="text-white text-xs font-semibold"
                                  >
                                    {getInitials(u.name)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-semibold text-sm">
                                    {u.name}
                                  </div>
                                  <div className="text-xs text-slate-500">
                                    {u.code}{" "}
                                    {u.factoryId &&
                                      ` • 🏭 ${
                                        typeof u.factoryId === "object"
                                          ? (u.factoryId as any).name
                                          : factories.find(
                                              (f) => f._id === u.factoryId,
                                            )?.name || u.factoryId
                                      }`}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={`${role.className} gap-1`}
                              >
                                {role.icon} {role.label}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1.5">
                                <div
                                  className={`w-2 h-2 rounded-full ${u.active ? "bg-emerald-500" : "bg-gray-300"}`}
                                />
                                <span className="text-sm">
                                  {u.active ? "Hoạt động" : "Đã khóa"}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-8 w-8"
                                      onClick={() =>
                                        navigate(
                                          `/admin/users/${u._id}/history`,
                                        )
                                      }
                                    >
                                      <History className="w-4 h-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    Lịch sử làm việc
                                  </TooltipContent>
                                </Tooltip>
                                <>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8"
                                        onClick={() => openEdit(u)}
                                      >
                                        <Pencil className="w-4 h-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Chỉnh sửa</TooltipContent>
                                  </Tooltip>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8 text-red-500 hover:text-red-600"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>
                                          Xóa người dùng này?
                                        </AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Hành động này không thể hoàn tác
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>
                                          Hủy
                                        </AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => handleDelete(u._id)}
                                          className="bg-red-500 hover:bg-red-600"
                                        >
                                          Xóa
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
                <Pagination
                  page={pagination.page}
                  totalPages={pagination.totalPages}
                  limit={pagination.limit}
                  total={pagination.total}
                  onPageChange={(p: number) =>
                    setPagination((prev) => ({ ...prev, page: p }))
                  }
                  onLimitChange={(l: number) =>
                    setPagination((prev) => ({ ...prev, limit: l, page: 1 }))
                  }
                />
              </Card>
            ) : (
              /* Card View */
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {users.map((u) => {
                    const role = getRoleBadge(u.role);
                    return (
                      <Card
                        key={u._id}
                        className={`border-slate-200 ${!u.active ? "opacity-70" : ""}`}
                      >
                        <CardContent className="pt-4">
                          <div className="flex gap-3">
                            <div className="relative">
                              <Avatar className="w-11 h-11">
                                <AvatarFallback
                                  style={{
                                    backgroundColor: getAvatarColor(u.name),
                                  }}
                                  className="text-white text-sm font-semibold"
                                >
                                  {getInitials(u.name)}
                                </AvatarFallback>
                              </Avatar>
                              {u.active && (
                                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-sm truncate">
                                {u.name}
                              </div>
                              <div className="text-xs text-slate-500">
                                {u.code}
                              </div>
                              {u.factoryId && (
                                <div className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                                  <span>🏭</span>{" "}
                                  {typeof u.factoryId === "object"
                                    ? (u.factoryId as any).name
                                    : factories.find(
                                        (f) => f._id === u.factoryId,
                                      )?.name || u.factoryId}
                                </div>
                              )}
                            </div>
                            <Badge
                              variant="outline"
                              className={`h-fit text-xs ${role.className}`}
                            >
                              {role.label}
                            </Badge>
                          </div>

                          <div className="flex justify-end gap-1 mt-3 pt-3 border-t border-slate-100">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 text-xs"
                              onClick={() =>
                                navigate(`/admin/users/${u._id}/history`)
                              }
                            >
                              <History className="w-3.5 h-3.5 mr-1" /> Lịch sử
                            </Button>
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 text-xs"
                                onClick={() => openEdit(u)}
                              >
                                <Pencil className="w-3.5 h-3.5 mr-1" /> Sửa
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 text-red-500"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      Xóa người dùng này?
                                    </AlertDialogTitle>
                                  </AlertDialogHeader>
                                  <AlertDialogDescription>
                                    Hành động này không thể hoàn tác
                                  </AlertDialogDescription>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Hủy</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDelete(u._id)}
                                      className="bg-red-500 hover:bg-red-600"
                                    >
                                      Xóa
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                  {users.length === 0 && (
                    <Card className="col-span-full">
                      <CardContent className="py-10 text-center text-slate-500">
                        Không tìm thấy người dùng phù hợp
                      </CardContent>
                    </Card>
                  )}
                </div>
                <Pagination
                  page={pagination.page}
                  totalPages={pagination.totalPages}
                  limit={pagination.limit}
                  total={pagination.total}
                  onPageChange={(p: number) =>
                    setPagination((prev) => ({ ...prev, page: p }))
                  }
                  onLimitChange={(l: number) =>
                    setPagination((prev) => ({ ...prev, limit: l, page: 1 }))
                  }
                />
              </>
            )}
          </TabsContent>
        </Tabs>

        {/* Create/Edit Modal */}
        <Dialog
          open={modalOpen}
          onOpenChange={(open) => {
            if (!open) {
              setModalOpen(false);
              resetForm();
            } else setModalOpen(true);
          }}
        >
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {editingUser ? (
                  <Pencil className="w-4 h-4" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                {editingUser ? "Chỉnh sửa người dùng" : "Thêm người dùng mới"}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Mã nhân viên *</Label>
                  <Input
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        code: e.target.value.toUpperCase(),
                      })
                    }
                    disabled={!!editingUser}
                    placeholder="Tự động"
                  />
                  {!editingUser && (
                    <p className="text-xs text-muted-foreground">
                      Tự động tạo theo vai trò
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label>Vai trò *</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(v) => {
                      setFormData({ ...formData, role: v });
                      if (!editingUser) fetchNextCode(v);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn vai trò" />
                    </SelectTrigger>
                    <SelectContent>
                      {isAdmin && (
                        <>
                          <SelectItem value="admin">
                            Quản trị viên (Admin)
                          </SelectItem>
                          <SelectItem value="fac_manager">
                            Quản lý nhà máy
                          </SelectItem>
                        </>
                      )}
                      {isFacManager && (
                        <>
                          <SelectItem value="supervisor">
                            Giám sát sản xuất
                          </SelectItem>
                          <SelectItem value="worker">Công nhân</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Họ tên *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  disabled={!!editingUser}
                  placeholder="Nguyễn Văn A"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Năm sinh</Label>
                  <Input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) =>
                      setFormData({ ...formData, dateOfBirth: e.target.value })
                    }
                    disabled={!!editingUser}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>CCCD</Label>
                  <Input
                    value={formData.citizenId}
                    onChange={(e) =>
                      setFormData({ ...formData, citizenId: e.target.value })
                    }
                    disabled={!!editingUser}
                    placeholder="Số CCCD"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Địa chỉ</Label>
                <Input
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  disabled={!!editingUser}
                  placeholder="Địa chỉ thường trú"
                />
              </div>

              <div className="space-y-1.5">
                <Label>{editingUser ? "Mật khẩu mới" : "Mật khẩu *"}</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    disabled={!!editingUser}
                    placeholder={
                      editingUser
                        ? "Để trống nếu không muốn đổi"
                        : "Nhập mật khẩu"
                    }
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {(!isFacManager || formData.factoryId) && (
                <div className="space-y-1.5">
                  <Label>
                    Nhà máy{" "}
                    {isFacManager ? "" : "(Bắt buộc cho Giám sát/Công nhân)"}
                  </Label>
                  <Select
                    value={formData.factoryId}
                    onValueChange={(v) =>
                      setFormData({ ...formData, factoryId: v })
                    }
                    disabled={isFacManager}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn nhà máy" />
                    </SelectTrigger>
                    <SelectContent>
                      {!isFacManager && (
                        <SelectItem value="none">
                          Không gán (Chỉ dành cho Admin tổng)
                        </SelectItem>
                      )}
                      {factories.map((f) => (
                        <SelectItem key={f._id} value={f._id}>
                          🏭 {f.name} ({f.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {editingUser && (
                <div className="flex items-center justify-between">
                  <Label>Trạng thái</Label>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.active}
                      onCheckedChange={(v) =>
                        setFormData({ ...formData, active: v })
                      }
                    />
                    <span className="text-sm">
                      {formData.active ? "Hoạt động" : "Đã khóa"}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="mt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setModalOpen(false);
                  resetForm();
                }}
              >
                Hủy
              </Button>
              <Button
                onClick={handleSubmit}
                className="bg-[#0077c0] hover:bg-[#005fa3]"
              >
                {editingUser ? "Cập nhật" : "Tạo người dùng"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
