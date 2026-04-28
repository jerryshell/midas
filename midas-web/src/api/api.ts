const baseURL = import.meta.env.VITE_API_BASE_URL;

interface ApiError extends Error {
  response: {
    data: any;
    status: number;
  };
}

async function request(path: string, options: RequestInit = {}): Promise<any> {
  const url = `${baseURL}${path}`;

  const defaultHeaders: Record<string, string> = {};

  if (options.body && typeof options.body === "string") {
    defaultHeaders["Content-Type"] = "application/json";
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });

  if (!response.ok) {
    let errorData: any;
    try {
      errorData = await response.text();
    } catch {
      errorData = response.statusText;
    }
    const error = new Error(`Request failed with status ${response.status}`) as ApiError;
    error.response = {
      data: errorData,
      status: response.status,
    };
    throw error;
  }

  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return response.json();
  }
  return response.text();
}

const api = {
  get: (path: string) => request(path, { method: "GET" }),
  post: (path: string, data?: any) =>
    request(path, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    }),
};

export default api;
