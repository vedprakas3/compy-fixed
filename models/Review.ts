import mongoose, { Schema, Document, Model } from 'mongoose';
import { IReview } from '@/types';

// Interface for Review instance methods
export interface IReviewMethods {
  hide(): Promise<IReview & Document>;
  show(): Promise<IReview & Document>;
  moderate(notes: string): Promise<IReview & Document>;
}

// Interface for Review static methods
export interface IReviewStatics {
  findByBooking(bookingId: string): any;
  findByReviewee(revieweeId: string, filters?: any): any;
  findByReviewer(reviewerId: string): any;
  getAverageRating(revieweeId: string): Promise<{ average: number; count: number }>;
  getRatingDistribution(revieweeId: string): Promise<{ 5: number; 4: number; 3: number; 2: number; 1: number }>;
}

// Document type with methods
type ReviewDocument = IReview & Document & IReviewMethods;

// Combined model type
type ReviewModel = Model<ReviewDocument> & IReviewStatics;

// Review Schema
const ReviewSchema = new Schema<any, ReviewModel>({
  bookingId: {
    type: Schema.Types.ObjectId,
    ref: 'Booking',
    required: true,
    index: true,
  },
  reviewerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  revieweeId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  reviewerRole: {
    type: String,
    enum: ['user', 'companion'],
    required: true,
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  comment: {
    type: String,
    required: true,
    maxlength: 1000,
  },
  categories: {
    punctuality: {
      type: Number,
      min: 1,
      max: 5,
    },
    communication: {
      type: Number,
      min: 1,
      max: 5,
    },
    behavior: {
      type: Number,
      min: 1,
      max: 5,
    },
    overall: {
      type: Number,
      min: 1,
      max: 5,
    },
  },
  isVisible: {
    type: Boolean,
    default: true,
  },
  moderated: {
    type: Boolean,
    default: false,
  },
  moderationNotes: {
    type: String,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Compound indexes
ReviewSchema.index({ reviewerId: 1, revieweeId: 1 });
ReviewSchema.index({ revieweeId: 1, isVisible: 1 });
ReviewSchema.index({ bookingId: 1, reviewerId: 1 }, { unique: true });
ReviewSchema.index({ rating: -1 });
ReviewSchema.index({ createdAt: -1 });

// Text index for search
ReviewSchema.index({ comment: 'text' });

// Static methods
ReviewSchema.statics.findByBooking = function(bookingId: string) {
  return this.find({ bookingId })
    .populate('reviewerId', 'profile.firstName profile.lastName profile.avatar')
    .populate('revieweeId', 'profile.firstName profile.lastName profile.avatar');
};

ReviewSchema.statics.findByReviewee = function(revieweeId: string, filters: any = {}) {
  return this.find({ revieweeId, isVisible: true, ...filters })
    .populate('reviewerId', 'profile.firstName profile.lastName profile.avatar')
    .sort({ createdAt: -1 });
};

ReviewSchema.statics.findByReviewer = function(reviewerId: string) {
  return this.find({ reviewerId })
    .populate('revieweeId', 'profile.firstName profile.lastName profile.avatar')
    .sort({ createdAt: -1 });
};

ReviewSchema.statics.getAverageRating = async function(revieweeId: string) {
  const result = await this.aggregate([
    { $match: { revieweeId: new mongoose.Types.ObjectId(revieweeId), isVisible: true } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
      },
    },
  ]);
  
  return result.length > 0
    ? { average: result[0].averageRating, count: result[0].totalReviews }
    : { average: 0, count: 0 };
};

ReviewSchema.statics.getRatingDistribution = async function(revieweeId: string) {
  const result = await this.aggregate([
    { $match: { revieweeId: new mongoose.Types.ObjectId(revieweeId), isVisible: true } },
    {
      $group: {
        _id: '$rating',
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: -1 } },
  ]);
  
  const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  result.forEach((item: any) => {
    distribution[item._id as keyof typeof distribution] = item.count;
  });
  
  return distribution;
};

// Instance methods
ReviewSchema.methods.hide = function() {
  this.isVisible = false;
  return this.save();
};

ReviewSchema.methods.show = function() {
  this.isVisible = true;
  return this.save();
};

ReviewSchema.methods.moderate = function(notes: string) {
  this.moderated = true;
  this.moderationNotes = notes;
  return this.save();
};

// Create or get the model with proper typing
const Review: ReviewModel = (mongoose.models.Review as ReviewModel) || 
  mongoose.model<ReviewDocument, ReviewModel>('Review', ReviewSchema);

export default Review;
