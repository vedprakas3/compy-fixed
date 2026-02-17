'use client';

import { useState, useCallback } from 'react';
import axios, { AxiosRequestConfig, AxiosError } from 'axios';
import { useAuth } from './useAuth';

interface UseApiOptions {
  requireAuth?: boolean;
}

interface UseApiReturn<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  execute: (...args: any[]) => Promise<T | null>;
  reset: () => void;
}

export function useApi<T = any>(
  apiFunction: (...args: any[]) => Promise<any>,
  options: UseApiOptions = {}
): UseApiReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { firebaseUser } = useAuth();

  const execute = useCallback(
    async (...args: any[]): Promise<T | null> => {
      setLoading(true);
      setError(null);

      try {
        let config: AxiosRequestConfig = {};

        if (options.requireAuth && firebaseUser) {
          const token = await firebaseUser.getIdToken();
          config = {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          };
        }

        const response = await apiFunction(...args, config);
        setData(response.data);
        return response.data;
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || err.message || 'An error occurred';
        setError(errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [apiFunction, firebaseUser, options.requireAuth]
  );

  const reset = useCallback(() => {
    setData(null);
    setLoading(false);
    setError(null);
  }, []);

  return { data, loading, error, execute, reset };
}

// Hook for GET requests
export function useGet<T = any>(url: string, options: UseApiOptions = {}) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { firebaseUser } = useAuth();

  const fetch = useCallback(
    async (params?: any) => {
      setLoading(true);
      setError(null);

      try {
        const headers: any = {};
        if (options.requireAuth && firebaseUser) {
          const token = await firebaseUser.getIdToken();
          headers.Authorization = `Bearer ${token}`;
        }

        const response = await axios.get(url, { headers, params });
        setData(response.data);
        return response.data;
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch data';
        setError(errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [url, firebaseUser, options.requireAuth]
  );

  const refetch = useCallback(() => {
    return fetch();
  }, [fetch]);

  return { data, loading, error, fetch, refetch };
}

// Hook for POST requests
export function usePost<T = any>(url: string, options: UseApiOptions = {}) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { firebaseUser } = useAuth();

  const post = useCallback(
    async (body?: any) => {
      setLoading(true);
      setError(null);

      try {
        const headers: any = {};
        if (options.requireAuth && firebaseUser) {
          const token = await firebaseUser.getIdToken();
          headers.Authorization = `Bearer ${token}`;
        }

        const response = await axios.post(url, body, { headers });
        setData(response.data);
        return response.data;
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || err.message || 'Failed to post data';
        setError(errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [url, firebaseUser, options.requireAuth]
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
  }, []);

  return { data, loading, error, post, reset };
}

// Hook for PUT requests
export function usePut<T = any>(url: string, options: UseApiOptions = {}) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { firebaseUser } = useAuth();

  const put = useCallback(
    async (body?: any) => {
      setLoading(true);
      setError(null);

      try {
        const headers: any = {};
        if (options.requireAuth && firebaseUser) {
          const token = await firebaseUser.getIdToken();
          headers.Authorization = `Bearer ${token}`;
        }

        const response = await axios.put(url, body, { headers });
        setData(response.data);
        return response.data;
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || err.message || 'Failed to update data';
        setError(errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [url, firebaseUser, options.requireAuth]
  );

  return { data, loading, error, put };
}

// Hook for DELETE requests
export function useDelete<T = any>(url: string, options: UseApiOptions = {}) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { firebaseUser } = useAuth();

  const deleteRequest = useCallback(
    async (params?: any) => {
      setLoading(true);
      setError(null);

      try {
        const headers: any = {};
        if (options.requireAuth && firebaseUser) {
          const token = await firebaseUser.getIdToken();
          headers.Authorization = `Bearer ${token}`;
        }

        const response = await axios.delete(url, { headers, params });
        setData(response.data);
        return response.data;
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || err.message || 'Failed to delete';
        setError(errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [url, firebaseUser, options.requireAuth]
  );

  return { data, loading, error, delete: deleteRequest };
}

export default useApi;
