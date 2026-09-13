import type { ApiErrorBody } from "./types";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public fieldErrors: Record<string, string> = {},
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type QueryParams = Record<string, string | number | boolean | undefined | null>;

interface RequestOptions extends Omit<RequestInit, "body" | "headers"> {
  body?: unknown;
  query?: QueryParams;
  headers?: Record<string, string>;
}

/** Calls the Spring Boot API (through the Next.js rewrite). Throws ApiError on non-2xx responses. */
export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, query, headers, ...init } = options;

  const response = await fetch(buildUrl(path, query), {
    ...init,
    headers: {
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    credentials: "same-origin",
  });

  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as ApiErrorBody | null;
    throw new ApiError(response.status, error?.message ?? defaultMessage(response.status), error?.fieldErrors);
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

function buildUrl(path: string, query?: QueryParams) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  }
  const queryString = params.toString();
  return `/api${path}${queryString ? `?${queryString}` : ""}`;
}

function defaultMessage(status: number) {
  if (status === 401) return "Please log in to continue";
  if (status === 403) return "You do not have access to this resource";
  if (status === 404) return "Not found";
  return "Something went wrong. Please try again.";
}
