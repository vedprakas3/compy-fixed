'use client';

import { useState, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from './useAuth';
import { IBooking } from '@/types';

interface BookingFilters {
  status?: string;
  upcoming?: boolean;
  past?: boolean;
}

interface UseBookingReturn {
  bookings: IBooking[];
  booking: IBooking | null;
  loading: boolean;
  error: string | null;
  fetchBookings: (filters?: BookingFilters) => Promise<void>;
  fetchBooking: (bookingId: string) => Promise<void>;
  createBooking: (data: any) => Promise<any>;
  updateBooking: (bookingId: string, data: any) => Promise<any>;
  cancelBooking: (bookingId: string, reason: string) => Promise<any>;
  confirmBooking: (bookingId: string) => Promise<any>;
  startBooking: (bookingId: string) => Promise<any>;
  completeBooking: (bookingId: string) => Promise<any>;
}

export function useBooking(): UseBookingReturn {
  const [bookings, setBookings] = useState<IBooking[]>([]);
  const [booking, setBooking] = useState<IBooking | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { firebaseUser } = useAuth();

  const getAuthHeaders = useCallback(async () => {
    if (!firebaseUser) throw new Error('Not authenticated');
    const token = await firebaseUser.getIdToken();
    return { Authorization: `Bearer ${token}` };
  }, [firebaseUser]);

  const fetchBookings = useCallback(async (filters: BookingFilters = {}) => {
    setLoading(true);
    setError(null);

    try {
      const headers = await getAuthHeaders();
      const response = await axios.get('/api/bookings', { headers, params: filters });
      
      if (response.data.success) {
        setBookings(response.data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  const fetchBooking = useCallback(async (bookingId: string) => {
    setLoading(true);
    setError(null);

    try {
      const headers = await getAuthHeaders();
      const response = await axios.get(`/api/bookings/${bookingId}`, { headers });
      
      if (response.data.success) {
        setBooking(response.data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch booking');
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  const createBooking = useCallback(async (data: any) => {
    setLoading(true);
    setError(null);

    try {
      const headers = await getAuthHeaders();
      const response = await axios.post('/api/bookings', data, { headers });
      
      if (response.data.success) {
        setBooking(response.data.data);
        return response.data;
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create booking');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  const updateBooking = useCallback(async (bookingId: string, data: any) => {
    setLoading(true);
    setError(null);

    try {
      const headers = await getAuthHeaders();
      const response = await axios.put(`/api/bookings/${bookingId}`, data, { headers });
      
      if (response.data.success) {
        setBooking(response.data.data);
        return response.data;
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update booking');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  const cancelBooking = useCallback(async (bookingId: string, reason: string) => {
    setLoading(true);
    setError(null);

    try {
      const headers = await getAuthHeaders();
      const response = await axios.post(
        `/api/bookings/${bookingId}/cancel`,
        { reason },
        { headers }
      );
      
      if (response.data.success) {
        setBooking(response.data.data);
        return response.data;
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to cancel booking');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  const confirmBooking = useCallback(async (bookingId: string) => {
    setLoading(true);
    setError(null);

    try {
      const headers = await getAuthHeaders();
      const response = await axios.post(
        `/api/bookings/${bookingId}/confirm`,
        {},
        { headers }
      );
      
      if (response.data.success) {
        setBooking(response.data.data);
        return response.data;
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to confirm booking');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  const startBooking = useCallback(async (bookingId: string) => {
    setLoading(true);
    setError(null);

    try {
      const headers = await getAuthHeaders();
      const response = await axios.post(
        `/api/bookings/${bookingId}/start`,
        {},
        { headers }
      );
      
      if (response.data.success) {
        setBooking(response.data.data);
        return response.data;
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to start booking');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  const completeBooking = useCallback(async (bookingId: string) => {
    setLoading(true);
    setError(null);

    try {
      const headers = await getAuthHeaders();
      const response = await axios.post(
        `/api/bookings/${bookingId}/complete`,
        {},
        { headers }
      );
      
      if (response.data.success) {
        setBooking(response.data.data);
        return response.data;
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to complete booking');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  return {
    bookings,
    booking,
    loading,
    error,
    fetchBookings,
    fetchBooking,
    createBooking,
    updateBooking,
    cancelBooking,
    confirmBooking,
    startBooking,
    completeBooking,
  };
}

export default useBooking;
