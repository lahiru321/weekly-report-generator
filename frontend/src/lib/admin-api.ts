import { api } from "./api";
import type { CreateUserRequest, Role, User } from "./types";

export const adminApi = {
  users: () => api<User[]>("/admin/users"),
  createUser: (body: CreateUserRequest) => api<User>("/admin/users", { method: "POST", body }),
  changeRole: (id: number, role: Role) => api<User>(`/admin/users/${id}/role`, { method: "PATCH", body: { role } }),
  setActive: (id: number, active: boolean) =>
    api<User>(`/admin/users/${id}/active`, { method: "PATCH", body: { active } }),
};
