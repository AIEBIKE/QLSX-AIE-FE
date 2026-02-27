/**
 * =============================================
 * AUTH SERVICE - API calls cho Authentication
 * =============================================
 * Sử dụng React Query mutations
 */

import axios from "axios";

// Base API URL
const API_URL = "/api/auth";

// Types
export interface LoginCredentials {
  code: string;
  password: string;
}

export interface RegisterData {
  name: string;
  code?: string;
  email?: string;
  password: string;
  department?: string;
  role?: "worker" | "supervisor" | "admin";
}

/**
 * Lấy mã nhân viên tiếp theo theo vai trò
 */
export const getNextCodeApi = async (
  role: string,
): Promise<{
  success: boolean;
  data?: { code: string };
  error?: { message: string };
}> => {
  const response = await axios.get(`${API_URL}/next-code/${role}`);
  return response.data;
};

export interface AuthResponse {
  success: boolean;
  message?: string;
  data?: {
    token: string;
    user: {
      id: string;
      name: string;
      code: string;
      email?: string;
      role: "admin" | "supervisor" | "worker";
      department?: string;
    };
  };
  error?: {
    code: string;
    message: string;
  };
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  token: string;
  password: string;
}

/**
 * Đăng nhập
 */
export const loginApi = async (
  credentials: LoginCredentials,
): Promise<AuthResponse> => {
  const response = await axios.post<AuthResponse>(
    `${API_URL}/login`,
    credentials,
  );
  return response.data;
};

/**
 * Đăng ký
 */
export const registerApi = async (
  data: RegisterData,
): Promise<AuthResponse> => {
  const response = await axios.post<AuthResponse>(`${API_URL}/register`, data);
  return response.data;
};

/**
 * Quên mật khẩu - gửi email reset
 */
export const forgotPasswordApi = async (
  data: ForgotPasswordData,
): Promise<{ success: boolean; message: string }> => {
  const response = await axios.post(`${API_URL}/forgot-password`, data);
  return response.data;
};

/**
 * Đặt lại mật khẩu với token
 */
export const resetPasswordApi = async (
  data: ResetPasswordData,
): Promise<{ success: boolean; message: string }> => {
  const response = await axios.post(`${API_URL}/reset-password`, data);
  return response.data;
};

/**
 * Lấy thông tin user hiện tại
 */
export const getMeApi = async (): Promise<AuthResponse> => {
  const token = localStorage.getItem("token");
  const response = await axios.get<AuthResponse>(`${API_URL}/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Đăng xuất
 */
export const logoutApi = async (): Promise<{ success: boolean }> => {
  const token = localStorage.getItem("token");
  const response = await axios.post(
    `${API_URL}/logout`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
  return response.data;
};
