import { useState, useEffect, ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import {
  LayoutDashboard,
  Car,
  GitBranch,
  BarChart3,
  FileText,
  Wrench,
  Users,
  LogOut,
  PanelLeftClose,
  PanelLeft,
  Menu,
  Bell,
  ChevronDown,
  Wallet,
  User,
  MoreVertical,
  BadgeCheck,
  CreditCard,
  Building2,
  ShieldCheck,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuGroup,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "../../contexts/AuthContext";
import * as api from "../../services/api";

interface MenuItem {
  key: string;
  icon: ReactNode;
  label: string;
  divider?: boolean;
}

const menuItems: MenuItem[] = [
  {
    key: "/admin",
    icon: <LayoutDashboard className="w-4 h-4" />,
    label: "Dashboard",
  },
  {
    key: "/admin/factories",
    icon: <Building2 className="w-4 h-4" />,
    label: "Nhà máy",
  },
  {
    key: "/admin/vehicle-types",
    icon: <Car className="w-4 h-4" />,
    label: "Loại xe",
  },
  {
    key: "/admin/processes",
    icon: <GitBranch className="w-4 h-4" />,
    label: "Công đoạn & Thao tác",
  },
  {
    key: "/admin/standards",
    icon: <BarChart3 className="w-4 h-4" />,
    label: "Định mức sản xuất",
  },
  {
    key: "/admin/orders",
    icon: <FileText className="w-4 h-4" />,
    label: "Lệnh sản xuất",
  },
  {
    key: "/admin/registrations",
    icon: <Wrench className="w-4 h-4" />,
    label: "Đăng ký công",
  },
  {
    key: "/admin/qc",
    icon: <ShieldCheck className="w-4 h-4" />,
    label: "Kiểm tra QC",
  },
  {
    key: "/admin/salary-summary",
    icon: <Wallet className="w-4 h-4" />,
    label: "Tổng hợp lương",
  },
  {
    key: "/admin/users",
    icon: <Users className="w-4 h-4" />,
    label: "Quản lý người dùng",
  },
];

const extraMenuItems: MenuItem[] = [
  {
    key: "/worker",
    icon: <User className="w-4 h-4" />,
    label: "Giao diện Công nhân",
  },
];

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Fetch pending users count
  const { data: pendingData } = useQuery({
    queryKey: ["pendingUsersCount"],
    queryFn: async () => {
      const res = await api.default.get("/auth/users/pending");
      return res.data;
    },
    refetchInterval: 30000,
  });
  const pendingCount = pendingData?.count || 0;

  // Fetch shortage registrations count
  const { data: shortageData } = useQuery({
    queryKey: ["shortageCount"],
    queryFn: async () => {
      const res = await api.default.get("/registrations/admin/shortage-count");
      return res.data;
    },
    refetchInterval: 30000,
  });
  const shortageCount = shortageData?.count || 0;
  const totalNotif = pendingCount + shortageCount;

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setMobileOpen(false);
      }
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleMenuClick = (key: string) => {
    navigate(key);
    if (isMobile) setMobileOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const getInitials = (name: string) => {
    if (!name) return "?";
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name[0].toUpperCase();
  };

  const getRoleName = (u: any) => {
    if (u?.roleId?.name) return u.roleId.name;
    const code = u?.roleCode || u?.role;
    const mapping: Record<string, string> = {
      ADMIN: "Quản trị viên",
      FAC_MANAGER: "Quản lý nhà máy",
      SUPERVISOR: "Giám sát (QA/QC)",
      WORKER: "Công nhân",
      admin: "Quản trị viên",
      supervisor: "Quản lý nhà máy",
      worker: "Công nhân",
    };
    return mapping[code] || "Người dùng";
  };

  const siderWidth = collapsed ? 64 : 220;

  const NavItem = ({ item }: { item: MenuItem }) => {
    const isActive = location.pathname === item.key;
    return (
      <button
        onClick={() => handleMenuClick(item.key)}
        className={`
          w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
          transition-all duration-200 cursor-pointer
          ${
            isActive
              ? "bg-[#0077c0] text-white shadow-md"
              : "text-slate-300 hover:bg-white/10 hover:text-white"
          }
          ${collapsed && !isMobile ? "justify-center px-2" : ""}
        `}
        title={collapsed && !isMobile ? item.label : undefined}
      >
        {item.icon}
        {!(collapsed && !isMobile) && (
          <span className="truncate">{item.label}</span>
        )}
      </button>
    );
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="h-16 flex items-center justify-center bg-white/10 border-b border-white/10">
        <span className="text-white font-bold text-base">
          {collapsed && !isMobile ? "🔋" : "🔋 AI EBIKE"}
        </span>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {menuItems
          .filter((item) => {
            const role = user?.roleCode || user?.role;
            if (role === "ADMIN" || role === "admin") return true;

            // Quản lý nhà máy
            if (role === "FAC_MANAGER" || role === "fac_manager") {
              const facManagerIncluded = [
                "/admin",
                "/admin/factories",
                "/admin/vehicle-types",
                "/admin/processes",
                "/admin/orders",
                "/admin/standards",
                "/admin/users", // Quản lý công nhân
              ];
              // Có thể giữ lại các tab báo cáo nếu cần thiết, ví dụ: "/admin/registrations", "/admin/salary-summary"
              // Nhưng theo yêu cầu rạch ròi thì hiện tại đưa vào các tab chính trước.
              return (
                facManagerIncluded.includes(item.key) ||
                item.key === "/admin/registrations" ||
                item.key === "/admin/salary-summary"
              );
            }

            // Giám sát QA/QC
            if (role === "SUPERVISOR" || role === "supervisor") {
              const supervisorIncluded = [
                "/admin",
                "/admin/factories",
                "/admin/vehicle-types",
                "/admin/processes",
                "/admin/orders",
                "/admin/standards",
                "/admin/qc",
                "/admin/registrations", // Thêm đăng ký công cho GS
              ];
              return supervisorIncluded.includes(item.key);
            }

            return false;
          })

          .map((item) => {
            const role = user?.roleCode || user?.role;
            const isFacManager =
              role === "FAC_MANAGER" || role === "fac_manager";
            let displayItem = { ...item };
            if (isFacManager && item.key === "/admin/users") {
              displayItem.label = "Quản lý công nhân";
            }
            return <NavItem key={displayItem.key} item={displayItem} />;
          })}

        {/* Divider and Extra Items */}
        {extraMenuItems
          .filter((item) => {
            const role = user?.roleCode || user?.role;
            if (item.key === "/worker") {
              return role === "WORKER" || role === "worker";
            }
            return true;
          })
          .map((item) => (
            <div key={item.key}>
              <div className="my-2 border-t border-white/10" />
              <NavItem item={item} />
            </div>
          ))}
      </nav>

      {/* User Profile Section at bottom */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className={`
              flex items-center gap-3 border-t border-white/10 cursor-pointer
              hover:bg-white/10 transition-colors duration-200
              ${collapsed && !isMobile ? "p-2 justify-center" : "px-4 py-3"}
            `}
          >
            <Avatar
              className={`${collapsed && !isMobile ? "w-8 h-8" : "w-10 h-10"} shrink-0`}
            >
              <AvatarFallback className="bg-[#0077c0] text-white text-sm font-semibold">
                {getInitials(user?.name || "")}
              </AvatarFallback>
            </Avatar>
            {!(collapsed && !isMobile) && (
              <>
                <div className="flex-1 min-w-0 text-left">
                  <div className="text-white font-semibold text-sm truncate">
                    {user?.name}
                  </div>
                  <div className="text-white/60 text-xs truncate">
                    {user?.code} • {getRoleName(user)}
                  </div>
                </div>
                <MoreVertical className="w-4 h-4 text-white/60" />
              </>
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
          side={isMobile ? "bottom" : "right"}
          align="end"
          sideOffset={4}
        >
          <DropdownMenuLabel className="p-0 font-normal">
            <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarFallback className="rounded-lg bg-[#0077c0] text-white text-xs font-semibold">
                  {getInitials(user?.name || "")}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user?.name}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {user?.code} • {getRoleName(user)}
                </span>
              </div>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => navigate("/admin/account")}>
              <BadgeCheck className="w-4 h-4 mr-2" />
              Tài khoản
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/admin/salary-summary")}>
              <CreditCard className="w-4 h-4 mr-2" />
              Tổng hợp lương
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setNotifOpen(true)}>
              <Bell className="w-4 h-4 mr-2" />
              Thông báo
              {totalNotif > 0 && (
                <span className="ml-auto bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {totalNotif}
                </span>
              )}
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleLogout}
            className="text-red-600 focus:text-red-600"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Đăng xuất
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  return (
    <TooltipProvider>
      <div className="min-h-screen flex bg-slate-50">
        {/* Desktop Sidebar */}
        {!isMobile && (
          <aside
            className="fixed left-0 top-0 bottom-0 z-30 overflow-hidden transition-all duration-200"
            style={{
              width: siderWidth,
              background: "linear-gradient(180deg, #0d1b2a 0%, #1a2e44 100%)",
            }}
          >
            <SidebarContent />
          </aside>
        )}

        {/* Mobile Sheet */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent
            side="left"
            className="p-0 w-[220px] border-0"
            style={{
              background: "linear-gradient(180deg, #0d1b2a 0%, #1a2e44 100%)",
            }}
          >
            <SidebarContent />
          </SheetContent>
        </Sheet>

        {/* Main Content */}
        <div
          className="flex-1 flex flex-col transition-all duration-200"
          style={{ marginLeft: isMobile ? 0 : siderWidth }}
        >
          {/* Header */}
          <header className="sticky top-0 z-20 h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 shadow-sm">
            {/* Left side - Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                isMobile ? setMobileOpen(true) : setCollapsed(!collapsed)
              }
              className="h-10 w-10"
            >
              {isMobile ? (
                <Menu className="w-5 h-5" />
              ) : collapsed ? (
                <PanelLeft className="w-5 h-5" />
              ) : (
                <PanelLeftClose className="w-5 h-5" />
              )}
            </Button>

            {/* Right side */}
            <div className="flex items-center gap-3">
              {/* Factory Info for Non-Admins */}
              {user?.roleCode !== "ADMIN" &&
                user?.roleCode !== "admin" &&
                (user as any).factory && (
                  <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-lg">
                    <Building2 className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">
                      Nhà máy: {(user as any).factory.name}
                    </span>
                  </div>
                )}

              {/* Notification Bell */}
              <Button
                variant={totalNotif > 0 ? "default" : "ghost"}
                size="icon"
                className={`relative h-10 w-10 ${
                  totalNotif > 0
                    ? "bg-amber-500 hover:bg-amber-600 text-white animate-pulse"
                    : ""
                }`}
                onClick={() => setNotifOpen(true)}
              >
                <Bell className="w-5 h-5" />
                {totalNotif > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {totalNotif}
                  </span>
                )}
              </Button>

              {/* Notification Offcanvas */}
              <Sheet open={notifOpen} onOpenChange={setNotifOpen}>
                <SheetContent
                  side="right"
                  className="w-[400px] sm:max-w-[420px] p-0 flex flex-col"
                >
                  <SheetHeader className="px-5 pt-5 pb-3 border-b border-slate-200">
                    <SheetTitle className="flex items-center gap-2 text-lg">
                      <Bell className="w-5 h-5 text-[#0077c0]" />
                      Thông báo
                      {totalNotif > 0 && (
                        <Badge className="bg-red-500 text-white text-xs">
                          {totalNotif}
                        </Badge>
                      )}
                    </SheetTitle>
                    <SheetDescription className="text-xs text-slate-500">
                      Các thông báo cần xử lý
                    </SheetDescription>
                  </SheetHeader>

                  <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                    {/* Pending users section */}
                    {pendingCount > 0 && (
                      <button
                        className="w-full text-left p-3 rounded-lg bg-amber-50 border border-amber-200 hover:bg-amber-100 transition-colors"
                        onClick={() => {
                          setNotifOpen(false);
                          navigate("/admin/users?tab=pending");
                        }}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Users className="w-4 h-4 text-amber-600" />
                          <span className="text-sm font-semibold text-amber-800">
                            {pendingCount} tài khoản chờ duyệt
                          </span>
                          <ExternalLink className="w-3.5 h-3.5 text-amber-500 ml-auto" />
                        </div>
                        <p className="text-xs text-amber-600">
                          Bấm để duyệt tài khoản
                        </p>
                      </button>
                    )}

                    {/* Shortage items section */}
                    {shortageCount > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 px-1">
                          <AlertTriangle className="w-4 h-4 text-orange-500" />
                          <span className="text-sm font-semibold text-slate-700">
                            Cần bổ sung công nhân ({shortageCount})
                          </span>
                        </div>
                        {(() => {
                          // Group by orderId
                          const items = shortageData?.items || [];
                          const byOrder: Record<string, any[]> = {};
                          items.forEach((item: any) => {
                            const key = item.orderId;
                            if (!byOrder[key]) byOrder[key] = [];
                            byOrder[key].push(item);
                          });
                          return Object.entries(byOrder).map(
                            ([orderId, orderItems]) => {
                              const first = orderItems[0];
                              return (
                                <div
                                  key={orderId}
                                  className="rounded-lg border border-slate-200 bg-white overflow-hidden"
                                >
                                  {/* Order header - clickable */}
                                  <button
                                    className="w-full text-left px-3 py-2.5 bg-slate-50 hover:bg-slate-100 transition-colors flex items-center gap-2 border-b border-slate-100"
                                    onClick={() => {
                                      setNotifOpen(false);
                                      navigate(`/admin/production-orders/${orderId}`);
                                    }}
                                  >
                                    <FileText className="w-4 h-4 text-[#0077c0]" />
                                    <div className="flex-1 min-w-0">
                                      <div className="text-sm font-semibold text-slate-800 truncate">
                                        {first.orderName || first.orderCode}
                                      </div>
                                      {first.orderCode && first.orderName && (
                                        <span className="text-[11px] text-slate-400">
                                          {first.orderCode}
                                        </span>
                                      )}
                                    </div>
                                    <Badge
                                      variant="outline"
                                      className="bg-orange-100 text-orange-700 text-[10px]"
                                    >
                                      {orderItems.length} thiếu
                                    </Badge>
                                    <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                                  </button>
                                  {/* Shortage details */}
                                  <div className="divide-y divide-slate-100">
                                    {orderItems.map((item: any) => (
                                      <div
                                        key={item._id}
                                        className="px-3 py-2 hover:bg-orange-50/50 cursor-pointer transition-colors"
                                        onClick={() => {
                                          setNotifOpen(false);
                                          navigate(`/admin/production-orders/${orderId}`);
                                        }}
                                      >
                                        <div className="flex items-center justify-between">
                                          <div className="flex-1 min-w-0">
                                            <div className="text-xs font-medium text-slate-700">
                                              {item.processName} →{" "}
                                              {item.operationName}
                                            </div>
                                            <div className="text-[11px] text-slate-500 mt-0.5">
                                              {item.workerName} (
                                              {item.workerCode})
                                              {item.date && (
                                                <span className="ml-1.5 text-slate-400">
                                                  ·{" "}
                                                  {dayjs(item.date).format(
                                                    "DD/MM",
                                                  )}
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                          <div className="text-right ml-2">
                                            <span className="text-xs font-bold text-orange-600">
                                              -{item.shortage}
                                            </span>
                                            <div className="text-[10px] text-slate-400">
                                              {item.actualQuantity}/
                                              {item.expectedQuantity}
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            },
                          );
                        })()}
                      </div>
                    )}

                    {/* Empty state */}
                    {totalNotif === 0 && (
                      <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                        <Bell className="w-10 h-10 mb-3 text-slate-300" />
                        <span className="text-sm">Không có thông báo nào</span>
                      </div>
                    )}
                  </div>
                </SheetContent>
              </Sheet>

              {/* User Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
                    <Avatar className="w-9 h-9">
                      <AvatarFallback className="bg-[#0077c0] text-white text-sm font-semibold">
                        {getInitials(user?.name || "")}
                      </AvatarFallback>
                    </Avatar>
                    {!isMobile && (
                      <div className="flex items-center gap-1">
                        <span className="font-semibold text-sm text-slate-700">
                          {user?.name}
                        </span>
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      </div>
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-lg">
                  <DropdownMenuLabel className="p-0 font-normal">
                    <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                      <Avatar className="h-8 w-8 rounded-lg">
                        <AvatarFallback className="rounded-lg bg-[#0077c0] text-white text-xs font-semibold">
                          {getInitials(user?.name || "")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-medium">
                          {user?.name}
                        </span>
                        <span className="truncate text-xs text-muted-foreground">
                          {user?.code} • {getRoleName(user)}
                        </span>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem
                      onClick={() => navigate("/admin/account")}
                    >
                      <BadgeCheck className="w-4 h-4 mr-2" />
                      Tài khoản
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => navigate("/admin/salary-summary")}
                    >
                      <CreditCard className="w-4 h-4 mr-2" />
                      Tổng hợp lương
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setNotifOpen(true)}>
                      <Bell className="w-4 h-4 mr-2" />
                      Thông báo
                      {totalNotif > 0 && (
                        <span className="ml-auto bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                          {totalNotif}
                        </span>
                      )}
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-red-600 focus:text-red-600"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Đăng xuất
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 p-4 md:p-6">
            <div className="bg-white rounded-xl p-4 md:p-6 min-h-[calc(100vh-120px)] shadow-sm border border-slate-100">
              {children}
            </div>
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
