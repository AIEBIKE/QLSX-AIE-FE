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
import type { User } from "../types";
import Cookies from "js-cookie";

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
      // Only the user info is stored in this accessible cookie, the token is HttpOnly.
      const userStr = Cookies.get("user");

      if (userStr) {
        try {
          const savedUser = JSON.parse(userStr);
          setUser(savedUser);
        } catch {
          // JSON parse error
          Cookies.remove("user");
        }
      }
      setLoading(false);
    };

    checkAuth();

    // Since Cookies don't fire "storage" events on the same window,
    // we use a custom event to sync across components/tabs if needed.
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "user") {
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
    const { token, user } = res.data.data;
    // Add roleCode helper to the user object for easier access in UI
    const roleCode = (user.roleId as any)?.code || user.role;
    const userWithRoleCode = {
      ...user,
      roleCode,
    };

    // Cookie is set by backend, we just update the local context state
    setUser(userWithRoleCode);

    // Dispatch custom event để đồng bộ
    window.dispatchEvent(new Event("auth-changed"));

    return userWithRoleCode;
  };

  const logout = async (): Promise<void> => {
    try {
      await apiLogout();
    } catch {
      // Ignore logout errors
    }
    // Token is cleared by backend response headers
    Cookies.remove("user");
    setUser(null);

    // Dispatch custom event
    window.dispatchEvent(new Event("auth-changed"));
  };

  const updateUser = (updatedUser: Partial<User>) => {
    if (!user) return;

    // Recalculate roleCode if roleId or role changed
    const roleCode =
      (updatedUser.roleId as any)?.code ||
      (user.roleId as any)?.code ||
      updatedUser.role ||
      user.role;

    const newUser = {
      ...user,
      ...updatedUser,
      roleCode,
    };

    setUser(newUser);
    Cookies.set("user", JSON.stringify(newUser));
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
