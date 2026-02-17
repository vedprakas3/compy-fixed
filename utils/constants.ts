// ============================================
// Application Constants
// ============================================

export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'Rent-A-Companion';
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// ============================================
// User Roles
// ============================================

export const USER_ROLES = {
  USER: 'user',
  COMPANION: 'companion',
  ADMIN: 'admin',
} as const;

// ============================================
// User Status
// ============================================

export const USER_STATUS = {
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  BANNED: 'banned',
  PENDING: 'pending',
} as const;

// ============================================
// Companion Status
// ============================================

export const COMPANION_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  SUSPENDED: 'suspended',
} as const;

// ============================================
// KYC Status
// ============================================

export const KYC_STATUS = {
  NOT_SUBMITTED: 'not_submitted',
  PENDING: 'pending',
  VERIFIED: 'verified',
  REJECTED: 'rejected',
} as const;

// ============================================
// Booking Status
// ============================================

export const BOOKING_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  DISPUTED: 'disputed',
  REFUNDED: 'refunded',
} as const;

// ============================================
// Payment Status
// ============================================

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  ESCROW: 'escrow',
  RELEASED: 'released',
  REFUNDED: 'refunded',
  FAILED: 'failed',
} as const;

// ============================================
// Report Types
// ============================================

export const REPORT_TYPES = {
  INAPPROPRIATE_BEHAVIOR: 'inappropriate_behavior',
  HARASSMENT: 'harassment',
  FAKE_PROFILE: 'fake_profile',
  SCAM: 'scam',
  NO_SHOW: 'no_show',
  PAYMENT_ISSUE: 'payment_issue',
  SAFETY_CONCERN: 'safety_concern',
  OTHER: 'other',
} as const;

// ============================================
// Report Status
// ============================================

export const REPORT_STATUS = {
  PENDING: 'pending',
  INVESTIGATING: 'investigating',
  RESOLVED: 'resolved',
  DISMISSED: 'dismissed',
} as const;

// ============================================
// Withdrawal Status
// ============================================

export const WITHDRAWAL_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  REJECTED: 'rejected',
} as const;

// ============================================
// Location Types
// ============================================

export const LOCATION_TYPES = {
  USER_PLACE: 'user_place',
  COMPANION_PLACE: 'companion_place',
  PUBLIC: 'public',
  HOTEL: 'hotel',
} as const;

// ============================================
// Gender Options
// ============================================

export const GENDER_OPTIONS = {
  MALE: 'male',
  FEMALE: 'female',
  OTHER: 'other',
  PREFER_NOT_TO_SAY: 'prefer_not_to_say',
} as const;

// ============================================
// Languages
// ============================================

export const LANGUAGES = [
  'English',
  'Hindi',
  'Spanish',
  'French',
  'German',
  'Mandarin',
  'Japanese',
  'Korean',
  'Arabic',
  'Portuguese',
  'Russian',
  'Italian',
  'Dutch',
  'Tamil',
  'Telugu',
  'Kannada',
  'Malayalam',
  'Marathi',
  'Gujarati',
  'Bengali',
  'Punjabi',
  'Urdu',
] as const;

// ============================================
// Interests
// ============================================

export const INTERESTS = [
  'Movies',
  'Music',
  'Travel',
  'Food',
  'Sports',
  'Reading',
  'Gaming',
  'Photography',
  'Art',
  'Dancing',
  'Cooking',
  'Fitness',
  'Yoga',
  'Hiking',
  'Shopping',
  'Partying',
  'Networking',
  'Business',
  'Technology',
  'Fashion',
  'Beauty',
  'Wellness',
  'Pets',
  'Nature',
  'History',
  'Culture',
  'Languages',
  'Education',
  'Volunteering',
  'Social Causes',
] as const;

// ============================================
// Personality Traits
// ============================================

export const PERSONALITY_TRAITS = [
  'Adventurous',
  'Ambitious',
  'Artistic',
  'Calm',
  'Charismatic',
  'Cheerful',
  'Confident',
  'Creative',
  'Curious',
  'Easygoing',
  'Energetic',
  'Extroverted',
  'Friendly',
  'Funny',
  'Generous',
  'Genuine',
  'Honest',
  'Humorous',
  'Independent',
  'Intellectual',
  'Introverted',
  'Kind',
  'Laid-back',
  'Listener',
  'Optimistic',
  'Outgoing',
  'Passionate',
  'Patient',
  'Reliable',
  'Romantic',
  'Sociable',
  'Spontaneous',
  'Thoughtful',
  'Trustworthy',
] as const;

// ============================================
// Services
// ============================================

export const SERVICES = [
  'Dinner Date',
  'Movie Companion',
  'Event Partner',
  'Travel Companion',
  'Shopping Partner',
  'Party Companion',
  'Business Meeting',
  'Social Event',
  'Wedding Date',
  'Tour Guide',
  'Language Practice',
  'Coffee Chat',
  'Walk/Exercise',
  'Game Night',
  'Concert/Festival',
  'Sports Event',
  'Art Gallery/Museum',
  'Theater/Show',
  'Networking Event',
  'Casual Hangout',
] as const;

// ============================================
// Days of Week
// ============================================

export const DAYS_OF_WEEK = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const;

// ============================================
// Time Slots
// ============================================

export const TIME_SLOTS = [
  '00:00', '01:00', '02:00', '03:00', '04:00', '05:00',
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
  '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
  '18:00', '19:00', '20:00', '21:00', '22:00', '23:00',
] as const;

// ============================================
// Currencies
// ============================================

export const CURRENCIES = {
  INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  USD: { code: 'USD', symbol: '$', name: 'US Dollar' },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro' },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound' },
} as const;

// ============================================
// Payment Methods
// ============================================

export const PAYMENT_METHODS = {
  BANK_TRANSFER: 'bank_transfer',
  UPI: 'upi',
  PAYPAL: 'paypal',
} as const;

// ============================================
// Commission Settings
// ============================================

export const COMMISSION_SETTINGS = {
  DEFAULT_PERCENTAGE: parseInt(process.env.PLATFORM_COMMISSION_PERCENTAGE || '15'),
  MIN_WITHDRAWAL: parseInt(process.env.MIN_WITHDRAWAL_AMOUNT || '500'),
  ESCROW_HOLD_DAYS: parseInt(process.env.ESCROW_HOLD_DAYS || '1'),
} as const;

// ============================================
// Pagination
// ============================================

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

// ============================================
// File Upload Limits
// ============================================

export const UPLOAD_LIMITS = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_IMAGES: 10,
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  ALLOWED_VIDEO_TYPES: ['video/mp4', 'video/webm', 'video/quicktime'],
} as const;

// ============================================
// Chat Settings
// ============================================

export const CHAT_SETTINGS = {
  MAX_MESSAGE_LENGTH: 2000,
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  TYPING_TIMEOUT: 3000, // 3 seconds
} as const;

// ============================================
// Review Settings
// ============================================

export const REVIEW_SETTINGS = {
  MIN_RATING: 1,
  MAX_RATING: 5,
  MIN_COMMENT_LENGTH: 10,
  MAX_COMMENT_LENGTH: 1000,
  EDIT_WINDOW_HOURS: 24,
} as const;

// ============================================
// Booking Settings
// ============================================

export const BOOKING_SETTINGS = {
  MIN_HOURS: 1,
  MAX_HOURS: 24,
  MIN_ADVANCE_BOOKING_HOURS: 2,
  MAX_ADVANCE_BOOKING_DAYS: 90,
  CANCELLATION_WINDOW_HOURS: 24,
  REFUND_PERCENTAGE: {
    BEFORE_48_HOURS: 100,
    BEFORE_24_HOURS: 50,
    WITHIN_24_HOURS: 0,
  },
} as const;

// ============================================
// Severity Levels
// ============================================

export const SEVERITY_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const;

// ============================================
// Notification Types
// ============================================

export const NOTIFICATION_TYPES = {
  BOOKING_CREATED: 'booking_created',
  BOOKING_CONFIRMED: 'booking_confirmed',
  BOOKING_CANCELLED: 'booking_cancelled',
  BOOKING_REMINDER: 'booking_reminder',
  PAYMENT_RECEIVED: 'payment_received',
  PAYMENT_RELEASED: 'payment_released',
  REVIEW_RECEIVED: 'review_received',
  MESSAGE_RECEIVED: 'message_received',
  KYC_APPROVED: 'kyc_approved',
  KYC_REJECTED: 'kyc_rejected',
  WITHDRAWAL_PROCESSED: 'withdrawal_processed',
  ACCOUNT_SUSPENDED: 'account_suspended',
  REPORT_RESOLVED: 'report_resolved',
} as const;

// ============================================
// SEO Defaults
// ============================================

export const SEO_DEFAULTS = {
  TITLE: `${APP_NAME} - Find Your Perfect Companion`,
  DESCRIPTION: 'Connect with verified companions for social events, travel, and more. Safe, secure, and professional companion services.',
  KEYWORDS: 'companion, rent a friend, social companion, travel companion, event companion, dating, friendship',
  OG_IMAGE: `${APP_URL}/images/og-image.jpg`,
  TWITTER_HANDLE: '@rentacompanion',
} as const;
