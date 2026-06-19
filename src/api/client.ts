import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import type { ApiResponse } from '../types';

const TOKEN_KEY = 'stepup_admin_token';

type RetryableRequestConfig = InternalAxiosRequestConfig & { _retry?: boolean };

export const api = axios.create({
  baseURL: '/api/v1',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiResponse<unknown>>) => {
    const original = error.config as RetryableRequestConfig | undefined;
    const url = original?.url ?? '';
    if (
      error.response?.status === 401 &&
      original &&
      !original._retry &&
      !url.includes('/auth/login') &&
      !url.includes('/auth/refresh')
    ) {
      original._retry = true;
      try {
        const result = await unwrap<{ accessToken: string }>(api.post('/auth/refresh'));
        setAccessToken(result.accessToken);
        original.headers.Authorization = `Bearer ${result.accessToken}`;
        return api(original);
      } catch {
        clearAccessToken();
        if (!window.location.pathname.startsWith('/login')) {
          window.location.href = '/login';
        }
      }
    } else if (error.response?.status === 401 && !url.includes('/auth/login')) {
      clearAccessToken();
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export function setAccessToken(token: string) {
  sessionStorage.setItem(TOKEN_KEY, token);
  localStorage.removeItem(TOKEN_KEY);
}

export function clearAccessToken() {
  sessionStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(TOKEN_KEY);
}

export function getAccessToken() {
  const sessionToken = sessionStorage.getItem(TOKEN_KEY);
  if (sessionToken) return sessionToken;

  const legacyToken = localStorage.getItem(TOKEN_KEY);
  if (legacyToken) {
    sessionStorage.setItem(TOKEN_KEY, legacyToken);
    localStorage.removeItem(TOKEN_KEY);
  }
  return legacyToken;
}

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiResponse<unknown> | undefined;
    if (data?.errors) {
      const details = Object.entries(data.errors)
        .flatMap(([field, messages]) => messages.map((msg) => `${field}: ${msg}`))
        .join(' - ');
      if (details) return `${data.message || 'Validation failed'} - ${details}`;
    }
    return data?.message || error.message;
  }
  if (error instanceof Error) return error.message;
  return 'Something went wrong';
}

export async function unwrap<T>(promise: Promise<{ data: ApiResponse<T> }>): Promise<T> {
  const { data } = await promise;
  if (!data.success) throw new Error(data.message || 'Request failed');
  return data.data as T;
}

export async function unwrapList<T>(
  promise: Promise<{ data: ApiResponse<T[]> & { meta?: ApiResponse<T>['meta'] } }>
) {
  const { data } = await promise;
  if (!data.success) throw new Error(data.message || 'Request failed');
  return { items: data.data ?? [], meta: data.meta };
}

export function mediaUrl(path?: string | null): string {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return path;
}

async function refreshAccessToken(): Promise<string | null> {
  try {
    const result = await unwrap<{ accessToken: string }>(api.post('/auth/refresh'));
    setAccessToken(result.accessToken);
    return result.accessToken;
  } catch {
    return null;
  }
}

export async function postForm<T>(
  url: string,
  formData: FormData,
  method: 'POST' | 'PUT' | 'PATCH' = 'POST'
): Promise<T> {
  let token = getAccessToken();
  let response = await fetch(`/api/v1${url}`, {
    method,
    body: formData,
    credentials: 'include',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (response.status === 401) {
    token = await refreshAccessToken();
    if (token) {
      response = await fetch(`/api/v1${url}`, {
        method,
        body: formData,
        credentials: 'include',
        headers: { Authorization: `Bearer ${token}` },
      });
    }
  }

  if (response.status === 401) {
    clearAccessToken();
    window.location.href = '/login';
    throw new Error('Session expired. Please sign in again.');
  }

  let data: ApiResponse<T>;
  try {
    data = (await response.json()) as ApiResponse<T>;
  } catch {
    throw new Error(`Upload failed (${response.status})`);
  }

  if (!response.ok || !data.success) {
    if (data.errors) {
      const details = Object.entries(data.errors)
        .flatMap(([field, messages]) => messages.map((msg) => `${field}: ${msg}`))
        .join(' - ');
      throw new Error(details ? `${data.message || 'Upload failed'} - ${details}` : data.message || 'Upload failed');
    }
    throw new Error(data.message || `Upload failed (${response.status})`);
  }
  return data.data as T;
}
