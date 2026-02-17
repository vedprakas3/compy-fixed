// ============================================
// User Types
// ============================================
export type UserRole = 'user' | 'companion' | 'admin';

export type UserStatus = 'active' | 'suspended' | 'banned' | 'pending';

export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected';

export interface IUser {
  _id?: string;
  firebaseUid: string;
  email: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  profile: {
    firstName: string;
    lastName: string;
    avatar?: string;
    bio?: string;
    dateOfBirth?: Date;
    gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
    location?: {
      city?: string;
      state?: string;
      country?: string;
      coordinates?: [number, number];
    };
  };
  verification: {
    email: boolean;
    phone: boolean;
    identity: VerificationStatus;
    badge: boolean;
  };
  wallet: {
    balance: number;
    currency: string;
    transactions: IWalletTransaction[];
  };
  preferences: {
    notifications: boolean;
    newsletter: boolean;
    language: string;
    currency: string;
  };
  safety: {
    panicContacts: IPanicContact[];
    lastPanicAlert?: Date;
  };
  blockedUsers: string[];
  wishlist: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IPanicContact {
  name: string;
  phone: string;
  relationship: string;
}

export interface IWalletTransaction {
  _id?: string;
  type: 'credit' | 'debit' | 'refund' | 'withdrawal';
  amount: number;
  description: string;
  reference?: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: Date;
}

// ============================================
// Companion Types
// ============================================
export type CompanionStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

export type KYCStatus = 'not_submitted' | 'pending' | 'verified' | 'rejected';

export interface ICompanion {
  _id?: string;
  userId: string;
  slug: string;
  status: CompanionStatus;
  kyc: {
    status: KYCStatus;
    documents: IKYCDocument[];
    submittedAt?: Date;
    verifiedAt?: Date;
    verifiedBy?: string;
    rejectionReason?: string;
  };
  pricing: {
    hourlyRate: number;
    halfDayRate?: number;
    fullDayRate?: number;
    currency: string;
  };
  services: string[];
  availability: IAvailability;
  stats: {
    totalBookings: number;
    completedBookings: number;
    cancelledBookings: number;
    totalEarnings: number;
    rating: number;
    reviewCount: number;
  };
  profile: {
    photos: string[];
    videos?: string[];
    about: string;
    languages: string[];
    interests: string[];
    personalityTraits: string[];
    availabilityNotes?: string;
  };
  settings: {
    autoAccept: boolean;
    minBookingHours: number;
    maxBookingHours: number;
    advanceBookingDays: number;
    instantBooking: boolean;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IKYCDocument {
  type: 'id_proof' | 'address_proof' | 'photo' | 'video_verification';
  url: string;
  publicId: string;
  uploadedAt: Date;
  verified: boolean;
}

export interface IAvailability {
  schedule: IScheduleSlot[];
  exceptions: IExceptionDate[];
  timezone: string;
}

export interface IScheduleSlot {
  day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

export interface IExceptionDate {
  date: Date;
  isAvailable: boolean;
  reason?: string;
}

// ============================================
// Booking Types
// ============================================
export type BookingStatus = 
  | 'pending' 
  | 'confirmed' 
  | 'in_progress' 
  | 'completed' 
  | 'cancelled' 
  | 'disputed' 
  | 'refunded';

export type PaymentStatus = 'pending' | 'paid' | 'escrow' | 'released' | 'refunded' | 'failed';

export interface IBooking {
  _id?: string;
  bookingId: string;
  userId: string;
  companionId: string;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  dates: {
    startDateTime: Date;
    endDateTime: Date;
    duration: number;
  };
  location: {
    type: 'user_place' | 'companion_place' | 'public' | 'hotel';
    address?: string;
    city: string;
    coordinates?: [number, number];
    notes?: string;
  };
  pricing: {
    hourlyRate: number;
    totalHours: number;
    subtotal: number;
    platformFee: number;
    tax: number;
    total: number;
    currency: string;
  };
  payment: {
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    razorpaySignature?: string;
    paidAt?: Date;
    escrowReleasedAt?: Date;
  };
  commission: {
    percentage: number;
    platformAmount: number;
    companionAmount: number;
  };
  requirements?: string;
  specialRequests?: string;
  cancellation?: {
    cancelledBy: string;
    reason: string;
    cancelledAt: Date;
    refundAmount: number;
  };
  review?: {
    userReview?: IReviewSummary;
    companionReview?: IReviewSummary;
  };
  chatRoomId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IReviewSummary {
  rating: number;
  comment: string;
  createdAt: Date;
}

// ============================================
// Review Types
// ============================================
export interface IReview {
  _id?: string;
  bookingId: string;
  reviewerId: string;
  revieweeId: string;
  reviewerRole: 'user' | 'companion';
  rating: number;
  comment: string;
  categories: {
    punctuality: number;
    communication: number;
    behavior: number;
    overall: number;
  };
  isVisible: boolean;
  moderated: boolean;
  moderationNotes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// ============================================
// Report Types
// ============================================
export type ReportStatus = 'pending' | 'investigating' | 'resolved' | 'dismissed';

export type ReportType = 
  | 'inappropriate_behavior' 
  | 'harassment' 
  | 'fake_profile' 
  | 'scam' 
  | 'no_show' 
  | 'payment_issue' 
  | 'safety_concern' 
  | 'other';

export interface IReport {
  _id?: string;
  reporterId: string;
  reportedId: string;
  bookingId?: string;
  type: ReportType;
  description: string;
  evidence?: string[];
  status: ReportStatus;
  severity: 'low' | 'medium' | 'high' | 'critical';
  assignedTo?: string;
  resolution?: {
    action: 'warning' | 'suspension' | 'ban' | 'dismissed';
    notes: string;
    resolvedBy: string;
    resolvedAt: Date;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

// ============================================
// Chat Types
// ============================================
export interface IChatRoom {
  _id?: string;
  bookingId: string;
  participants: string[];
  status: 'active' | 'archived' | 'blocked';
  lastMessage?: IChatMessage;
  unreadCount: Map<string, number>;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IChatMessage {
  _id?: string;
  roomId: string;
  senderId: string;
  type: 'text' | 'image' | 'file' | 'system';
  content: string;
  fileUrl?: string;
  isRead: boolean;
  readAt?: Date;
  createdAt?: Date;
}

// ============================================
// Withdrawal Types
// ============================================
export type WithdrawalStatus = 'pending' | 'processing' | 'completed' | 'rejected';

export interface IWithdrawal {
  _id?: string;
  userId: string;
  amount: number;
  currency: string;
  status: WithdrawalStatus;
  method: 'bank_transfer' | 'upi' | 'paypal';
  details: {
    accountNumber?: string;
    ifscCode?: string;
    accountHolderName?: string;
    upiId?: string;
    paypalEmail?: string;
  };
  processedAt?: Date;
  processedBy?: string;
  rejectionReason?: string;
  transactionReference?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// ============================================
// Analytics Types
// ============================================
export interface IAnalytics {
  userId: string;
  date: Date;
  bookings: {
    total: number;
    completed: number;
    cancelled: number;
    revenue: number;
  };
  profile: {
    views: number;
    uniqueViews: number;
    inquiries: number;
  };
  ratings: {
    average: number;
    count: number;
  };
}

// ============================================
// API Response Types
// ============================================
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

// ============================================
// Search & Filter Types
// ============================================
export interface ISearchFilters {
  location?: string;
  gender?: string;
  minAge?: number;
  maxAge?: number;
  languages?: string[];
  interests?: string[];
  minPrice?: number;
  maxPrice?: number;
  rating?: number;
  availability?: Date;
  services?: string[];
  verified?: boolean;
}

// ============================================
// AI Types
// ============================================
export interface ICompatibilityScore {
  userId: string;
  companionId: string;
  score: number;
  factors: {
    interests: number;
    personality: number;
    language: number;
    location: number;
  };
  reasons: string[];
}

export interface IContentModerationResult {
  flagged: boolean;
  categories: {
    harassment: boolean;
    hateSpeech: boolean;
    sexual: boolean;
    violence: boolean;
    spam: boolean;
  };
  confidence: number;
  action: 'allow' | 'warn' | 'block';
}
