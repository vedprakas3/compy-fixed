'use client';

import { useState, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from './useAuth';
import { ICompanion, ISearchFilters } from '@/types';

interface UseCompanionsReturn {
  companions: ICompanion[];
  companion: ICompanion | null;
  loading: boolean;
  error: string | null;
  total: number;
  totalPages: number;
  currentPage: number;
  fetchCompanions: (filters?: ISearchFilters, page?: number, limit?: number) => Promise<void>;
  fetchCompanion: (slug: string) => Promise<void>;
  searchCompanions: (query: string, filters?: ISearchFilters) => Promise<void>;
  addToWishlist: (companionId: string) => Promise<void>;
  removeFromWishlist: (companionId: string) => Promise<void>;
}

export function useCompanions(): UseCompanionsReturn {
  const [companions, setCompanions] = useState<ICompanion[]>([]);
  const [companion, setCompanion] = useState<ICompanion | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const { firebaseUser } = useAuth();

  const getAuthHeaders = useCallback(async () => {
    if (!firebaseUser) return {};
    const token = await firebaseUser.getIdToken();
    return { Authorization: `Bearer ${token}` };
  }, [firebaseUser]);

  const fetchCompanions = useCallback(async (
    filters: ISearchFilters = {},
    page: number = 1,
    limit: number = 20
  ) => {
    setLoading(true);
    setError(null);

    try {
      const headers = await getAuthHeaders();
      const response = await axios.get('/api/companions', {
        headers,
        params: { ...filters, page, limit },
      });

      if (response.data.success) {
        setCompanions(response.data.data);
        setTotal(response.data.meta?.total || 0);
        setTotalPages(response.data.meta?.totalPages || 0);
        setCurrentPage(response.data.meta?.page || 1);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch companions');
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  const fetchCompanion = useCallback(async (slug: string) => {
    setLoading(true);
    setError(null);

    try {
      const headers = await getAuthHeaders();
      const response = await axios.get(`/api/companions/${slug}`, { headers });

      if (response.data.success) {
        setCompanion(response.data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch companion');
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  const searchCompanions = useCallback(async (query: string, filters: ISearchFilters = {}) => {
    setLoading(true);
    setError(null);

    try {
      const headers = await getAuthHeaders();
      const response = await axios.get('/api/companions/search', {
        headers,
        params: { q: query, ...filters },
      });

      if (response.data.success) {
        setCompanions(response.data.data);
        setTotal(response.data.meta?.total || 0);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to search companions');
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  const addToWishlist = useCallback(async (companionId: string) => {
    try {
      const headers = await getAuthHeaders();
      await axios.post(`/api/user/wishlist/${companionId}`, {}, { headers });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add to wishlist');
      throw err;
    }
  }, [getAuthHeaders]);

  const removeFromWishlist = useCallback(async (companionId: string) => {
    try {
      const headers = await getAuthHeaders();
      await axios.delete(`/api/user/wishlist/${companionId}`, { headers });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to remove from wishlist');
      throw err;
    }
  }, [getAuthHeaders]);

  return {
    companions,
    companion,
    loading,
    error,
    total,
    totalPages,
    currentPage,
    fetchCompanions,
    fetchCompanion,
    searchCompanions,
    addToWishlist,
    removeFromWishlist,
  };
}

export default useCompanions;
