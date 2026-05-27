const baseURL = import.meta.env.VITE_API_BASE_URL;

interface ApiError extends Error {
  response: {
    data: any;
    status: number;
  };
}

function buildHeaders(hasBody: boolean, extra?: HeadersInit): HeadersInit {
  const headers: Record<string, string> = hasBody ? { "Content-Type": "application/json" } : {};
  return { ...headers, ...(extra as Record<string, string>) };
}

async function parseError(response: Response): Promise<never> {
  let errorData: any;
  try {
    errorData = await response.text();
  } catch {
    errorData = response.statusText;
  }
  const error = new Error(`Request failed with status ${response.status}`) as ApiError;
  error.response = { data: errorData, status: response.status };
  throw error;
}

async function parseBody(response: Response): Promise<any> {
  const contentType = response.headers.get("content-type");
  return contentType?.includes("application/json") ? response.json() : response.text();
}

async function request(path: string, options: RequestInit = {}): Promise<any> {
  const response = await fetch(`${baseURL}${path}`, {
    ...options,
    headers: buildHeaders(typeof options.body === "string", options.headers),
  });

  if (!response.ok) return parseError(response);
  return parseBody(response);
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
