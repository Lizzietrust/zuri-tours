import { api } from "@/lib/api";
import type { User, Tour, Review } from "@/types";

type ApiResponse<T> = {
  status: "success";
  message: string;
  data: T;
  results?: number;
  total?: number;
  page?: number;
  pages?: number;
  limit?: number;
};

export type PaginatedUsers = {
  data: User[];
  total: number;
  page: number;
  pages: number;
  limit: number;
};

export const adminService = {
  /* ---------- USERS ---------- */
  async getAllUsers(params?: {
    page?: number;
    limit?: number;
    sort?: string;
    role?: string;
    search?: string;
  }): Promise<PaginatedUsers> {
    const { data } = await api.get<ApiResponse<User[]>>("/users", { params });
    return {
      data: data.data,
      total: data.total ?? data.data.length,
      page: data.page ?? 1,
      pages: data.pages ?? 1,
      limit: data.limit ?? data.data.length,
    };
  },

  async getUser(id: string): Promise<User> {
    const { data } = await api.get<ApiResponse<User>>(`/users/${id}`);
    return data.data;
  },

  async updateUser(id: string, payload: Partial<User>): Promise<User> {
    const { data } = await api.patch<ApiResponse<User>>(
      `/users/${id}`,
      payload,
    );
    return data.data;
  },

  async updateUserRole(id: string, role: User["role"]): Promise<User> {
    const { data } = await api.patch<ApiResponse<User>>(`/users/${id}/role`, {
      role,
    });
    return data.data;
  },

  async deleteUser(id: string): Promise<void> {
    await api.delete(`/users/${id}`);
  },

  async restoreUser(id: string): Promise<User> {
    const { data } = await api.patch<ApiResponse<User>>(`/users/${id}/restore`);
    return data.data;
  },

  async permanentDeleteUser(id: string): Promise<void> {
    await api.delete(`/users/${id}/permanent`);
  },

  async bulkDeleteUsers(userIds: string[]): Promise<void> {
    await api.delete("/users/bulk/delete", { data: { userIds } });
  },

  async bulkUpdateUsers(
    userIds: string[],
    updates: Partial<User>,
  ): Promise<void> {
    await api.patch("/users/bulk/update", { userIds, updates });
  },

  async searchUsers(q: string, role?: string): Promise<User[]> {
    const { data } = await api.get<ApiResponse<User[]>>("/users/search", {
      params: { q, role },
    });
    return data.data;
  },

  /* ---------- TOURS ---------- */
  async getAllTours(params?: {
    page?: number;
    limit?: number;
    sort?: string;
    search?: string;
  }): Promise<{ data: Tour[]; total: number; pages: number }> {
    const { data } = await api.get<ApiResponse<Tour[]>>("/tours", { params });
    return {
      data: data.data,
      total: data.total ?? data.data.length,
      pages: data.pages ?? 1,
    };
  },

  async createTour(payload: Partial<Tour>): Promise<Tour> {
    const { data } = await api.post<ApiResponse<Tour>>("/tours", payload);
    return data.data;
  },

  async updateTour(id: string, payload: Partial<Tour>): Promise<Tour> {
    const { data } = await api.patch<ApiResponse<Tour>>(
      `/tours/${id}`,
      payload,
    );
    return data.data;
  },

  async deleteTour(id: string): Promise<void> {
    await api.delete(`/tours/${id}`);
  },

  /* ---------- REVIEWS ---------- */
  async getAllReviews(params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<{ data: Review[]; total: number }> {
    const { data } = await api.get<ApiResponse<Review[]>>("/reviews", {
      params,
    });
    return { data: data.data, total: data.total ?? data.data.length };
  },

  async approveReview(id: string): Promise<Review> {
    const { data } = await api.patch<ApiResponse<Review>>(
      `/reviews/${id}/approve`,
    );
    return data.data;
  },

  async rejectReview(id: string): Promise<Review> {
    const { data } = await api.patch<ApiResponse<Review>>(
      `/reviews/${id}/reject`,
    );
    return data.data;
  },

  async deleteReview(id: string): Promise<void> {
    await api.delete(`/reviews/${id}`);
  },

  /* ---------- STATS ---------- */
  async getUsersWithStats(): Promise<User[]> {
    const { data } = await api.get<ApiResponse<User[]>>("/users/stats/all");
    return data.data;
  },
};
