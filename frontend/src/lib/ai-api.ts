import { api } from "./api";
import type { AiReply, AiStatus, ChatMessage } from "./types";

export const aiApi = {
  status: () => api<AiStatus>("/manager/ai/status"),
  summary: (week: string) => api<AiReply>("/manager/ai/summary", { method: "POST", query: { week } }),
  // The whole conversation is sent each time; the backend doesn't store chats
  chat: (messages: ChatMessage[]) => api<AiReply>("/manager/ai/chat", { method: "POST", body: { messages } }),
};
