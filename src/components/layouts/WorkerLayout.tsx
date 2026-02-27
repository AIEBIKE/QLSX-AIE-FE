import { useState, useEffect, ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  CheckCircle,
  LogOut,
  PanelLeftClose,
  PanelLeft,
  Menu,
  Settings,
  Wallet,
  User,
  MoreVertical,
  BadgeCheck,
  CreditCard,
  Bell,
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
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useAuth } from "../../contexts/AuthContext";

interface MenuItem {
  key: string;
  icon: ReactNode;
  label: string;
}

interface WorkerLayoutProps {
  children: ReactNode;
}

export default function WorkerLayout({ children }: WorkerLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

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

  const menuItems: MenuItem[] = [
    {
      key: "/worker",
      icon: <LayoutDashboard className="w-4 h-4" />,
      label: "Dashboard",
    },
    {
      key: "/summary",
      icon: <CheckCircle className="w-4 h-4" />,
      label: "Tổng kết ngày",
    },
    {
      key: "/worker/salary",
      icon: <Wallet className="w-4 h-4" />,
      label: "Lương & Thưởng",
    },
  ];

  const extraMenuItems: MenuItem[] = [];
  if (user?.role === "admin" || user?.role === "supervisor") {
    extraMenuItems.push({
      key: "/admin",
      icon: <Settings className="w-4 h-4" />,
      label: "Quản trị",
    });
  }

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

  const getRoleLabel = (role?: string) => {
    if (role === "worker") return "Công nhân";
    if (role === "admin") return "Quản trị";
    return "Giám sát";
  };

  const siderWidth = collapsed ? 64 : 200;

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
              ? "bg-emerald-600 text-white shadow-md"
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
          {collapsed && !isMobile ? "👷" : "👷 Công Nhân"}
        </span>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {menuItems.map((item) => (
          <NavItem key={item.key} item={item} />
        ))}

        {extraMenuItems.length > 0 && (
          <>
            <div className="my-2 border-t border-white/10" />
            {extraMenuItems.map((item) => (
              <NavItem key={item.key} item={item} />
            ))}
          </>
        )}
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
              <AvatarFallback className="bg-emerald-600 text-white text-sm font-semibold">
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
                    {user?.code} • {getRoleLabel(user?.role)}
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
                <AvatarFallback className="rounded-lg bg-emerald-600 text-white text-xs font-semibold">
                  {getInitials(user?.name || "")}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user?.name}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {user?.code} • {getRoleLabel(user?.role)}
                </span>
              </div>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => navigate("/worker/account")}>
              <BadgeCheck className="w-4 h-4 mr-2" />
              Tài khoản
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/worker/salary")}>
              <CreditCard className="w-4 h-4 mr-2" />
              Lương & Thưởng
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/worker")}>
              <Bell className="w-4 h-4 mr-2" />
              Thông báo
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
    <div className="min-h-screen flex bg-slate-50">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <aside
          className="fixed left-0 top-0 bottom-0 z-30 overflow-hidden transition-all duration-200"
          style={{
            width: siderWidth,
            background: "linear-gradient(135deg, #1e3a5f 0%, #0d1b2a 100%)",
          }}
        >
          <SidebarContent />
        </aside>
      )}

      {/* Mobile Sheet */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="left"
          className="p-0 w-[200px] border-0"
          style={{
            background: "linear-gradient(135deg, #1e3a5f 0%, #0d1b2a 100%)",
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
          {/* Left side */}
          <div className="flex items-center gap-3">
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
            {!isMobile && (
              <span className="font-semibold text-slate-700">
                🔋 Quản Lý Sản Xuất - AI EBIKE
              </span>
            )}
          </div>

          {/* Right side - User */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
                <Avatar className="w-9 h-9">
                  <AvatarFallback className="bg-emerald-600 text-white text-sm font-semibold">
                    {getInitials(user?.name || "")}
                  </AvatarFallback>
                </Avatar>
                {!isMobile && (
                  <span className="font-semibold text-sm text-slate-700">
                    {user?.name}
                  </span>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-lg">
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarFallback className="rounded-lg bg-emerald-600 text-white text-xs font-semibold">
                      {getInitials(user?.name || "")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{user?.name}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {user?.code} • {getRoleLabel(user?.role)}
                    </span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => navigate("/worker/account")}>
                  <BadgeCheck className="w-4 h-4 mr-2" />
                  Tài khoản
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/worker/salary")}>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Lương & Thưởng
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/worker")}>
                  <Bell className="w-4 h-4 mr-2" />
                  Thông báo
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
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-6">
          <div className="bg-white rounded-xl p-4 md:p-6 min-h-[calc(100vh-120px)] shadow-sm border border-slate-100">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
