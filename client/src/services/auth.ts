import { api, setToken, clearToken } from "@/lib/api";
import type { User } from "@/types";

type AuthResponse = {
  status: "success";
  message: string;
  data: { user: User; token: string };
};

type MeResponse = {
  status: "success";
  message: string;
  data: { user: User };
};

export type UpdateMePayload = {
  name?: string;
  photo?: string;
  bio?: string;
  phoneNumber?: string;
  dateOfBirth?: string | null;
  languages?: string[];
  expertise?: string[];
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };
  preferences?: {
    newsletter?: boolean;
    emailNotifications?: boolean;
    smsNotifications?: boolean;
  };
};

export const authService = {
  async register(payload: {
    name: string;
    email: string;
    password: string;
    passwordConfirm: string;
    photo?: string;
  }): Promise<User> {
    const { data } = await api.post<AuthResponse>("/auth/register", payload);
    setToken(data.data.token);
    return data.data.user;
  },

  async login(email: string, password: string): Promise<User> {
    const { data } = await api.post<AuthResponse>("/auth/login", {
      email,
      password,
    });
    setToken(data.data.token);
    return data.data.user;
  },

  async getMe(): Promise<User> {
    const { data } = await api.get<MeResponse>("/users/me");
    return data.data.user;
  },

  async updateMe(payload: UpdateMePayload): Promise<User> {
    const { data } = await api.patch<MeResponse>("/users/me", payload);
    return data.data.user;
  },

  async updatePassword(payload: {
    currentPassword: string;
    password: string;
    passwordConfirm: string;
  }): Promise<void> {
    await api.patch("/users/me/password", payload);
    clearToken();
  },

  async forgotPassword(email: string): Promise<void> {
    await api.post("/auth/forgotpassword", { email });
  },

  async resetPassword(
    resetToken: string,
    payload: { password: string; passwordConfirm: string },
  ): Promise<User> {
    const { data } = await api.put<AuthResponse>(
      `/auth/resetpassword/${resetToken}`,
      payload,
    );
    setToken(data.data.token);
    return data.data.user;
  },

  async logout(): Promise<void> {
    try {
      await api.get("/auth/logout");
    } finally {
      clearToken();
    }
  },

  async deleteMe(): Promise<void> {
    await api.delete("/users/me");
    clearToken();
  },
};
