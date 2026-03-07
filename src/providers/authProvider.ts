import { AuthProvider } from "react-admin";
import Cookies from "js-cookie";

// @ts-ignore
const API_URL = import.meta.env.VITE_API_URL || "/api";

export const authProvider: AuthProvider = {
  login: async ({ username, password }) => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: username, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Đăng nhập thất bại");
    }

    const { data } = await response.json();
    // Token is HttpOnly, so we don't set it in JS
    Cookies.set("user", JSON.stringify(data.user));

    return Promise.resolve();
  },

  logout: () => {
    Cookies.remove("user");
    return Promise.resolve();
  },

  checkAuth: () => {
    return Cookies.get("user") ? Promise.resolve() : Promise.reject();
  },

  checkError: (error) => {
    const status = error.status;
    if (status === 401 || status === 403) {
      Cookies.remove("user");
      return Promise.reject();
    }
    return Promise.resolve();
  },

  getIdentity: () => {
    const user = Cookies.get("user");
    if (!user) {
      return Promise.reject();
    }

    const userData = JSON.parse(user);
    return Promise.resolve({
      id: userData.id,
      fullName: userData.name,
      avatar: undefined,
    });
  },

  getPermissions: () => {
    const user = Cookies.get("user");
    if (!user) {
      return Promise.resolve(null);
    }

    const userData = JSON.parse(user);
    return Promise.resolve(userData.role);
  },
};

export default authProvider;
