/**
 * =============================================
 * AUTH CONTEXT - Bridge giữa Redux và Context
 * =============================================
 * Context này đọc state từ localStorage (được Redux quản lý)
 * để tương thích với các route guards hiện tại
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { getMe, login as apiLogin, logout as apiLogout } from "../services/api";
import type { User, UserRole } from "../types";

/**
 * Chuẩn hóa user object từ API response
 * Backend trả về roleCode (viết hoa: "ADMIN", "WORKER", "SUPERVISOR", "FAC_MANAGER")
 * Frontend cần role (viết thường: "admin", "worker", "supervisor")
 */
const normalizeUser = (apiUser: any): User => {
  // Lấy role code từ nhiều nguồn có thể
  const rawRole: string =
    apiUser.roleCode ||
    apiUser.role ||
    (apiUser.roleId && typeof apiUser.roleId === "object"
      ? apiUser.roleId.code
      : "") ||
    "";

  // Map uppercase role code → lowercase UserRole
  const roleMap: Record<string, UserRole> = {
    ADMIN: "admin",
    admin: "admin",
    SUPERVISOR: "supervisor",
    supervisor: "supervisor",
    FAC_MANAGER: "supervisor", // Factory Manager → treated as supervisor in routing
    fac_manager: "supervisor",
    WORKER: "worker",
    worker: "worker",
  };

  const role = roleMap[rawRole] || "worker";

  return {
    ...apiUser,
    _id: apiUser._id || apiUser.id,
    role,
  };
};

interface AuthContextType {
  user: User | null;
  login: (code: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  updateUser: (updatedUser: Partial<User>) => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Kiểm tra token và user từ localStorage khi mount
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("token");
      const userStr = localStorage.getItem("user");

      if (token && userStr) {
        try {
          const savedUser = JSON.parse(userStr);
          setUser(normalizeUser(savedUser));
        } catch {
          // JSON parse error
          localStorage.removeItem("token");
          localStorage.removeItem("user");
        }
      }
      setLoading(false);
    };

    checkAuth();

    // Lắng nghe thay đổi từ localStorage (từ Redux authSlice)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "token" || e.key === "user") {
        checkAuth();
      }
    };

    window.addEventListener("storage", handleStorageChange);

    // Custom event để đồng bộ trong cùng tab
    const handleAuthChange = () => {
      checkAuth();
    };
    window.addEventListener("auth-changed", handleAuthChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("auth-changed", handleAuthChange);
    };
  }, []);

  const login = async (code: string, password: string): Promise<User> => {
    const res = await apiLogin(code, password);
    const { token, user: rawUser } = res.data.data;
    const user = normalizeUser(rawUser);
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    setUser(user);

    // Dispatch custom event để đồng bộ
    window.dispatchEvent(new Event("auth-changed"));

    return user;
  };

  const logout = async (): Promise<void> => {
    try {
      await apiLogout();
    } catch {
      // Ignore logout errors
    }
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);

    // Dispatch custom event
    window.dispatchEvent(new Event("auth-changed"));
  };

  const updateUser = (updatedUser: Partial<User>) => {
    if (!user) return;
    const newUser = { ...user, ...updatedUser };
    setUser(newUser);
    localStorage.setItem("user", JSON.stringify(newUser));
    window.dispatchEvent(new Event("auth-changed"));
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
