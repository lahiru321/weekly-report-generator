import { api } from "./api";
import type { Project, ProjectRequest } from "./types";

export const projectsApi = {
  list: () => api<Project[]>("/projects"),
  create: (body: ProjectRequest) => api<Project>("/projects", { method: "POST", body }),
  update: (id: number, body: ProjectRequest) => api<Project>(`/projects/${id}`, { method: "PUT", body }),
  remove: (id: number) => api<void>(`/projects/${id}`, { method: "DELETE" }),
};
