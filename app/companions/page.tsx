'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useCompanions } from '@/hooks/useCompanions';
import { ICompanion } from '@/types';
import Image from 'next/image';

export default function CompanionsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { companions, loading, fetchCompanions } = useCompanions();
  const [filters, setFilters] = useState({
    location: '',
    minPrice: '',
    maxPrice: '',
    rating: '',
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    fetchCompanions();
  }, [isAuthenticated, router, fetchCompanions]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const applyFilters = () => {
    const apiFilters: any = {};
    if (filters.location) apiFilters.location = filters.location;
    if (filters.minPrice) apiFilters.minPrice = parseInt(filters.minPrice);
    if (filters.maxPrice) apiFilters.maxPrice = parseInt(filters.maxPrice);
    if (filters.rating) apiFilters.rating = parseInt(filters.rating);
    
    fetchCompanions(apiFilters);
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold gradient-text">
            Rent-A-Companion
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
              Dashboard
            </Link>
            <Link href="/profile" className="text-gray-600 hover:text-gray-900">
              Profile
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="card p-6 sticky top-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={filters.location}
                    onChange={handleFilterChange}
                    placeholder="City name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price Range (₹/hour)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      name="minPrice"
                      value={filters.minPrice}
                      onChange={handleFilterChange}
                      placeholder="Min"
                      className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                    />
                    <input
                      type="number"
                      name="maxPrice"
                      value={filters.maxPrice}
                      onChange={handleFilterChange}
                      placeholder="Max"
                      className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Minimum Rating
                  </label>
                  <select
                    name="rating"
                    value={filters.rating}
                    onChange={handleFilterChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Any Rating</option>
                    <option value="4">4+ Stars</option>
                    <option value="3">3+ Stars</option>
                    <option value="2">2+ Stars</option>
                  </select>
                </div>

                <button
                  onClick={applyFilters}
                  className="w-full btn-primary"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>

          {/* Companions Grid */}
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Find Companions</h1>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="loading-spinner w-12 h-12"></div>
              </div>
            ) : companions.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600">No companions found matching your criteria.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {companions.map((companion: ICompanion) => (
                  <Link
                    key={companion._id}
                    href={`/companions/${companion.slug}`}
                    className="card overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    <div className="relative h-48 bg-gray-200">
                      {companion.profile.photos && companion.profile.photos[0] ? (
                        <Image
                          src={companion.profile.photos[0]}
                          alt="Companion"
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-primary-100">
                          <span className="text-4xl text-primary-600">
                            {(companion.userId as any)?.profile?.firstName?.[0]}
                          </span>
                        </div>
                      )}
                      {companion.verification?.badge && (
                        <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                          Verified
                        </div>
                      )}
                    </div>
                    
                    <div className="p-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {(companion.userId as any)?.profile?.firstName} {(companion.userId as any)?.profile?.lastName}
                      </h3>
                      
                      <div className="flex items-center mt-2">
                        <div className="flex items-center text-yellow-400">
                          {[...Array(5)].map((_, i) => (
                            <svg
                              key={i}
                              className={`w-4 h-4 ${i < Math.floor(companion.stats.rating) ? 'fill-current' : 'text-gray-300'}`}
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                        <span className="ml-2 text-sm text-gray-600">
                          {companion.stats.rating.toFixed(1)} ({companion.stats.reviewCount} reviews)
                        </span>
                      </div>
                      
                      <div className="mt-3 flex flex-wrap gap-2">
                        {companion.profile.interests?.slice(0, 3).map((interest, idx) => (
                          <span
                            key={idx}
                            className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
                          >
                            {interest}
                          </span>
                        ))}
                      </div>
                      
                      <div className="mt-4 flex items-center justify-between">
                        <span className="text-lg font-bold text-primary-600">
                          ₹{companion.pricing.hourlyRate}
                          <span className="text-sm text-gray-500 font-normal">/hour</span>
                        </span>
                        <span className="text-sm text-gray-500">
                          {companion.stats.completedBookings} bookings
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
