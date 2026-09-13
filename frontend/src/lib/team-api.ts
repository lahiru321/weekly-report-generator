import { api } from "./api";
import type { MemberProfile, User } from "./types";

export const teamApi = {
  members: () => api<User[]>("/manager/members"),
  profile: (id: number) => api<MemberProfile>(`/manager/members/${id}`),
};
