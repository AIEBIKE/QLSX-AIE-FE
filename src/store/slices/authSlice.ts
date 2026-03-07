/**
 * =============================================
 * AUTH SLICE - Redux Slice cho Authentication
 * =============================================
 * Quản lý state: user, token, isAuthenticated
 */

import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import Cookies from "js-cookie";

/**
 * Interface cho User
 */
interface User {
  id: string;
  name: string;
  code: string;
  email?: string;
  role: "admin" | "supervisor" | "worker" | "fac_manager";
}

/**
 * Interface cho Auth State
 */
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
}

/**
 * Lấy initial state từ localStorage
 */
const getInitialState = (): AuthState => {
  // HttpOnly token cannot be read from JS, but we maintain user state
  const token = null;
  const userStr = Cookies.get("user");

  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      return {
        user,
        token,
        isAuthenticated: true,
        loading: false,
      };
    } catch {
      // JSON parse error, clear storage
      Cookies.remove("user");
    }
  }

  return {
    user: null,
    token: null,
    isAuthenticated: false,
    loading: false,
  };
};

/**
 * Auth Slice
 */
const authSlice = createSlice({
  name: "auth",
  initialState: getInitialState(),
  reducers: {
    /**
     * Đăng nhập thành công
     */
    loginSuccess: (
      state,
      action: PayloadAction<{ user: User; token: string }>,
    ) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.loading = false;

      // Lưu vào Cookies
      // token is managed by backend (HttpOnly)
      Cookies.set("user", JSON.stringify(action.payload.user));
    },

    /**
     * Đăng xuất
     */
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.loading = false;

      // Xóa khỏi Cookies
      Cookies.remove("user");
    },

    /**
     * Cập nhật thông tin user
     */
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        Cookies.set("user", JSON.stringify(state.user));
      }
    },

    /**
     * Set loading state
     */
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
  },
});

// Export actions
export const { loginSuccess, logout, updateUser, setLoading } =
  authSlice.actions;

// Export reducer
export default authSlice.reducer;

// Selectors
export const selectUser = (state: { auth: AuthState }) => state.auth.user;
export const selectToken = (state: { auth: AuthState }) => state.auth.token;
export const selectIsAuthenticated = (state: { auth: AuthState }) =>
  state.auth.isAuthenticated;
export const selectAuthLoading = (state: { auth: AuthState }) =>
  state.auth.loading;
