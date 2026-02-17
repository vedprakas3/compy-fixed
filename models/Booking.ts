import mongoose, { Schema, Document, Model } from 'mongoose';
import { IBooking, IReviewSummary } from '@/types';

// Interface for Booking instance methods
export interface IBookingMethods {
  confirm(): Promise<IBooking & Document>;
  start(): Promise<IBooking & Document>;
  complete(): Promise<IBooking & Document>;
  cancel(cancelledBy: string, reason: string, refundAmount?: number): Promise<IBooking & Document>;
  markAsPaid(razorpayOrderId: string, razorpayPaymentId: string, razorpaySignature: string): Promise<IBooking & Document>;
  releaseEscrow(): Promise<IBooking & Document>;
  refund(): Promise<IBooking & Document>;
  addUserReview(rating: number, comment: string): Promise<IBooking & Document>;
  addCompanionReview(rating: number, comment: string): Promise<IBooking & Document>;
}

// Interface for Booking static methods
export interface IBookingStatics {
  findByBookingId(bookingId: string): Promise<any>;
  findByUser(userId: string, filters?: any): Promise<any[]>;
  findByCompanion(companionId: string, filters?: any): Promise<any[]>;
  findOverlapping(companionId: string, startDateTime: Date, endDateTime: Date, excludeBookingId?: string): Promise<any[]>;
}

// Document type with methods
type BookingDocument = IBooking & Document & IBookingMethods;

// Combined model type
type BookingModel = Model<BookingDocument> & IBookingStatics;

// Review Summary Schema (embedded in booking)
const ReviewSummarySchema = new Schema<IReviewSummary>({
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  comment: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, { _id: false });

// Booking Schema
const BookingSchema = new Schema<any, BookingModel>({
  bookingId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  companionId: {
    type: Schema.Types.ObjectId,
    ref: 'Companion',
    required: true,
    index: true,
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'disputed', 'refunded'],
    default: 'pending',
    index: true,
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'escrow', 'released', 'refunded', 'failed'],
    default: 'pending',
    index: true,
  },
  dates: {
    startDateTime: {
      type: Date,
      required: true,
      index: true,
    },
    endDateTime: {
      type: Date,
      required: true,
    },
    duration: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  location: {
    type: {
      type: String,
      enum: ['user_place', 'companion_place', 'public', 'hotel'],
      required: true,
    },
    address: {
      type: String,
    },
    city: {
      type: String,
      required: true,
    },
    coordinates: {
      type: [Number],
      index: '2dsphere',
    },
    notes: {
      type: String,
    },
  },
  pricing: {
    hourlyRate: {
      type: Number,
      required: true,
      min: 0,
    },
    totalHours: {
      type: Number,
      required: true,
      min: 1,
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    platformFee: {
      type: Number,
      required: true,
      min: 0,
    },
    tax: {
      type: Number,
      required: true,
      min: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'INR',
    },
  },
  payment: {
    razorpayOrderId: {
      type: String,
    },
    razorpayPaymentId: {
      type: String,
    },
    razorpaySignature: {
      type: String,
    },
    paidAt: {
      type: Date,
    },
    escrowReleasedAt: {
      type: Date,
    },
  },
  commission: {
    percentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    platformAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    companionAmount: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  requirements: {
    type: String,
    maxlength: 1000,
  },
  specialRequests: {
    type: String,
    maxlength: 500,
  },
  cancellation: {
    cancelledBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    reason: {
      type: String,
    },
    cancelledAt: {
      type: Date,
    },
    refundAmount: {
      type: Number,
      min: 0,
    },
  },
  review: {
    userReview: ReviewSummarySchema,
    companionReview: ReviewSummarySchema,
  },
  chatRoomId: {
    type: Schema.Types.ObjectId,
    ref: 'ChatRoom',
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Compound indexes
BookingSchema.index({ userId: 1, status: 1 });
BookingSchema.index({ companionId: 1, status: 1 });
BookingSchema.index({ 'dates.startDateTime': 1, 'dates.endDateTime': 1 });
BookingSchema.index({ createdAt: -1 });

// Virtual for checking if booking is upcoming
BookingSchema.virtual('isUpcoming').get(function(this: any) {
  return this.dates.startDateTime > new Date() && ['pending', 'confirmed'].includes(this.status);
});

// Virtual for checking if booking is ongoing
BookingSchema.virtual('isOngoing').get(function(this: any) {
  const now = new Date();
  return now >= this.dates.startDateTime && now <= this.dates.endDateTime && this.status === 'in_progress';
});

// Virtual for checking if booking is past
BookingSchema.virtual('isPast').get(function(this: any) {
  return this.dates.endDateTime < new Date() || ['completed', 'cancelled', 'refunded'].includes(this.status);
});

// Pre-save middleware to generate booking ID
BookingSchema.pre('save', async function(next) {
  if (this.isNew && !this.bookingId) {
    const date = new Date();
    const prefix = 'BK';
    const timestamp = date.getTime().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    this.bookingId = `${prefix}-${timestamp}-${random}`;
  }
  next();
});

// Static methods
BookingSchema.statics.findByBookingId = function(bookingId: string) {
  return this.findOne({ bookingId })
    .populate('userId', 'profile.firstName profile.lastName profile.avatar email')
    .populate('companionId', 'slug profile.photos pricing.hourlyRate');
};

BookingSchema.statics.findByUser = function(userId: string, filters: any = {}) {
  return this.find({ userId, ...filters })
    .populate('companionId', 'slug profile.photos pricing.hourlyRate userId')
    .sort({ createdAt: -1 });
};

BookingSchema.statics.findByCompanion = function(companionId: string, filters: any = {}) {
  return this.find({ companionId, ...filters })
    .populate('userId', 'profile.firstName profile.lastName profile.avatar')
    .sort({ createdAt: -1 });
};

BookingSchema.statics.findOverlapping = function(
  companionId: string,
  startDateTime: Date,
  endDateTime: Date,
  excludeBookingId?: string
) {
  const query: any = {
    companionId,
    status: { $in: ['pending', 'confirmed', 'in_progress'] },
    $or: [
      { 'dates.startDateTime': { $lt: endDateTime, $gte: startDateTime } },
      { 'dates.endDateTime': { $gt: startDateTime, $lte: endDateTime } },
      { 'dates.startDateTime': { $lte: startDateTime }, 'dates.endDateTime': { $gte: endDateTime } },
    ],
  };
  
  if (excludeBookingId) {
    query.bookingId = { $ne: excludeBookingId };
  }
  
  return this.find(query);
};

// Instance methods
BookingSchema.methods.confirm = function() {
  this.status = 'confirmed';
  return this.save();
};

BookingSchema.methods.start = function() {
  this.status = 'in_progress';
  return this.save();
};

BookingSchema.methods.complete = function() {
  this.status = 'completed';
  return this.save();
};

BookingSchema.methods.cancel = function(cancelledBy: string, reason: string, refundAmount: number = 0) {
  this.status = 'cancelled';
  this.cancellation = {
    cancelledBy: new mongoose.Types.ObjectId(cancelledBy),
    reason,
    cancelledAt: new Date(),
    refundAmount,
  };
  return this.save();
};

BookingSchema.methods.markAsPaid = function(razorpayOrderId: string, razorpayPaymentId: string, razorpaySignature: string) {
  this.paymentStatus = 'escrow';
  this.payment = {
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
    paidAt: new Date(),
  };
  return this.save();
};

BookingSchema.methods.releaseEscrow = function() {
  this.paymentStatus = 'released';
  this.payment.escrowReleasedAt = new Date();
  return this.save();
};

BookingSchema.methods.refund = function() {
  this.paymentStatus = 'refunded';
  this.status = 'refunded';
  return this.save();
};

BookingSchema.methods.addUserReview = function(rating: number, comment: string) {
  this.review = this.review || {};
  this.review.userReview = {
    rating,
    comment,
    createdAt: new Date(),
  };
  return this.save();
};

BookingSchema.methods.addCompanionReview = function(rating: number, comment: string) {
  this.review = this.review || {};
  this.review.companionReview = {
    rating,
    comment,
    createdAt: new Date(),
  };
  return this.save();
};

// Create or get the model with proper typing
const Booking: BookingModel = (mongoose.models.Booking as BookingModel) || 
  mongoose.model<BookingDocument, BookingModel>('Booking', BookingSchema);

export default Booking;
