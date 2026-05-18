import { env } from "@/lib/env";

export interface FetchOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

class ApiClient {
  private getBaseUrl() {
    return env.apiUrl;
  }

  private getHeaders(customHeaders?: HeadersInit): Headers {
    const headers = new Headers(customHeaders);
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("revora_token");
      if (token) headers.set("Authorization", `Bearer ${token}`);
    }
    return headers;
  }

  async request<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
    const { params, headers: customHeaders, ...restOptions } = options;
    let url = `${this.getBaseUrl()}/${endpoint.replace(/^\//, "")}`;

    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null) {
          searchParams.append(key, String(val));
        }
      });
      const qs = searchParams.toString();
      if (qs) url += `?${qs}`;
    }

    const headers = this.getHeaders(customHeaders);

    try {
      const response = await fetch(url, { ...restOptions, headers });

      if (!response.ok) {
        let errorData: any;
        try { errorData = await response.json(); }
        catch { errorData = { message: `HTTP ${response.status}: ${response.statusText}` }; }

        // Handle 401 — clear stale token
        if (response.status === 401 && typeof window !== "undefined") {
          localStorage.removeItem("revora_token");
          localStorage.removeItem("revora_user");
        }

        const msg = errorData?.message || `HTTP error ${response.status}`;
        throw new Error(Array.isArray(msg) ? msg.join(", ") : msg);
      }

      const contentType = response.headers.get("content-type");
      if (contentType?.includes("application/json")) {
        return (await response.json()) as T;
      }
      return {} as T;
    } catch (error: any) {
      if (env.isDevelopment) {
        console.error(`[API] ${options.method ?? "GET"} ${endpoint}:`, error.message);
      }
      throw error;
    }
  }

  get<T>(endpoint: string, options?: Omit<FetchOptions, "method" | "body">) {
    return this.request<T>(endpoint, { ...options, method: "GET" });
  }

  post<T>(endpoint: string, body?: any, options?: Omit<FetchOptions, "method" | "body">) {
    return this.request<T>(endpoint, { ...options, method: "POST", body: body ? JSON.stringify(body) : undefined });
  }

  put<T>(endpoint: string, body?: any, options?: Omit<FetchOptions, "method" | "body">) {
    return this.request<T>(endpoint, { ...options, method: "PUT", body: body ? JSON.stringify(body) : undefined });
  }

  patch<T>(endpoint: string, body?: any, options?: Omit<FetchOptions, "method" | "body">) {
    return this.request<T>(endpoint, { ...options, method: "PATCH", body: body ? JSON.stringify(body) : undefined });
  }

  delete<T>(endpoint: string, options?: Omit<FetchOptions, "method" | "body">) {
    return this.request<T>(endpoint, { ...options, method: "DELETE" });
  }
}

export const api = new ApiClient();
