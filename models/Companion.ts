import mongoose, { Schema, Document, Model } from 'mongoose';
import { ICompanion, IKYCDocument, IScheduleSlot, IExceptionDate } from '@/types';
import slugify from 'slugify';

// Interface for Companion instance methods
export interface ICompanionMethods {
  updateRating(): Promise<ICompanion & Document>;
  incrementBookings(completed?: boolean): Promise<ICompanion & Document>;
  addEarnings(amount: number): Promise<ICompanion & Document>;
  isAvailableOn(date: Date): boolean;
  submitKYC(documents: IKYCDocument[]): Promise<ICompanion & Document>;
  approveKYC(verifiedBy: string): Promise<ICompanion & Document>;
  rejectKYC(reason: string): Promise<ICompanion & Document>;
}

// Interface for Companion static methods
export interface ICompanionStatics {
  findBySlug(slug: string): any;
  findByUserId(userId: string): any;
  findApproved(filters?: any): any;
}

// Document type with methods
type CompanionDocument = ICompanion & Document & ICompanionMethods;

// Combined model type
type CompanionModel = Model<CompanionDocument> & ICompanionStatics;

// KYC Document Schema
const KYCDocumentSchema = new Schema<IKYCDocument>({
  type: {
    type: String,
    enum: ['id_proof', 'address_proof', 'photo', 'video_verification'],
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
  publicId: {
    type: String,
    required: true,
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
  verified: {
    type: Boolean,
    default: false,
  },
});

// Schedule Slot Schema
const ScheduleSlotSchema = new Schema<IScheduleSlot>({
  day: {
    type: String,
    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    required: true,
  },
  startTime: {
    type: String,
    required: true,
  },
  endTime: {
    type: String,
    required: true,
  },
  isAvailable: {
    type: Boolean,
    default: true,
  },
});

// Exception Date Schema
const ExceptionDateSchema = new Schema<IExceptionDate>({
  date: {
    type: Date,
    required: true,
  },
  isAvailable: {
    type: Boolean,
    default: false,
  },
  reason: {
    type: String,
  },
});

// Companion Schema
const CompanionSchema = new Schema<any, CompanionModel>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true,
  },
  slug: {
    type: String,
    unique: true,
    sparse: true,
    index: true,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'suspended'],
    default: 'pending',
    index: true,
  },
  kyc: {
    status: {
      type: String,
      enum: ['not_submitted', 'pending', 'verified', 'rejected'],
      default: 'not_submitted',
    },
    documents: [KYCDocumentSchema],
    submittedAt: {
      type: Date,
    },
    verifiedAt: {
      type: Date,
    },
    verifiedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    rejectionReason: {
      type: String,
    },
  },
  pricing: {
    hourlyRate: {
      type: Number,
      required: true,
      min: 100,
    },
    halfDayRate: {
      type: Number,
      min: 0,
    },
    fullDayRate: {
      type: Number,
      min: 0,
    },
    currency: {
      type: String,
      default: 'INR',
    },
  },
  services: [{
    type: String,
    trim: true,
  }],
  availability: {
    schedule: [ScheduleSlotSchema],
    exceptions: [ExceptionDateSchema],
    timezone: {
      type: String,
      default: 'Asia/Kolkata',
    },
  },
  stats: {
    totalBookings: {
      type: Number,
      default: 0,
    },
    completedBookings: {
      type: Number,
      default: 0,
    },
    cancelledBookings: {
      type: Number,
      default: 0,
    },
    totalEarnings: {
      type: Number,
      default: 0,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviewCount: {
      type: Number,
      default: 0,
    },
  },
  profile: {
    photos: [{
      type: String,
    }],
    videos: [{
      type: String,
    }],
    about: {
      type: String,
      maxlength: 2000,
    },
    languages: [{
      type: String,
      trim: true,
    }],
    interests: [{
      type: String,
      trim: true,
    }],
    personalityTraits: [{
      type: String,
      trim: true,
    }],
    availabilityNotes: {
      type: String,
      maxlength: 500,
    },
  },
  settings: {
    autoAccept: {
      type: Boolean,
      default: false,
    },
    minBookingHours: {
      type: Number,
      default: 1,
      min: 1,
    },
    maxBookingHours: {
      type: Number,
      default: 12,
      max: 24,
    },
    advanceBookingDays: {
      type: Number,
      default: 7,
      min: 0,
      max: 90,
    },
    instantBooking: {
      type: Boolean,
      default: false,
    },
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Indexes for search and filtering
CompanionSchema.index({ status: 1, 'kyc.status': 1 });
CompanionSchema.index({ 'pricing.hourlyRate': 1 });
CompanionSchema.index({ 'stats.rating': -1 });
CompanionSchema.index({ services: 1 });
CompanionSchema.index({ 'profile.languages': 1 });
CompanionSchema.index({ 'profile.interests': 1 });
CompanionSchema.index({ slug: 'text', 'profile.about': 'text' });

// Virtual for average earnings per booking
CompanionSchema.virtual('avgEarningsPerBooking').get(function(this: any) {
  if (this.stats.completedBookings === 0) return 0;
  return this.stats.totalEarnings / this.stats.completedBookings;
});

// Pre-save middleware to generate slug
CompanionSchema.pre('save', async function(next) {
  if (this.isNew || this.isModified('userId')) {
    const User = mongoose.model('User');
    const user = await User.findById(this.userId);
    if (user) {
      const baseSlug = slugify(`${user.profile.firstName}-${user.profile.lastName}`, {
        lower: true,
        strict: true,
      });
      
      // Check for existing slug and append number if needed
      let slug = baseSlug;
      let counter = 1;
      let existing = await mongoose.models.Companion.findOne({ slug });
      
      while (existing) {
        slug = `${baseSlug}-${counter}`;
        existing = await mongoose.models.Companion.findOne({ slug });
        counter++;
      }
      
      this.slug = slug;
    }
  }
  next();
});

// Static methods
CompanionSchema.statics.findBySlug = function(slug: string) {
  return this.findOne({ slug }).populate('userId', '-wallet -safety -blockedUsers');
};

CompanionSchema.statics.findByUserId = function(userId: string) {
  return this.findOne({ userId });
};

CompanionSchema.statics.findApproved = function(filters: any = {}) {
  return this.find({
    status: 'approved',
    'kyc.status': 'verified',
    ...filters,
  }).populate('userId', '-wallet -safety -blockedUsers');
};

// Instance methods
CompanionSchema.methods.updateRating = async function() {
  const Review = mongoose.model('Review');
  const reviews = await Review.find({ revieweeId: this.userId });
  
  if (reviews.length > 0) {
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    this.stats.rating = totalRating / reviews.length;
    this.stats.reviewCount = reviews.length;
  } else {
    this.stats.rating = 0;
    this.stats.reviewCount = 0;
  }
  
  return this.save();
};

CompanionSchema.methods.incrementBookings = function(completed: boolean = true) {
  this.stats.totalBookings += 1;
  if (completed) {
    this.stats.completedBookings += 1;
  } else {
    this.stats.cancelledBookings += 1;
  }
  return this.save();
};

CompanionSchema.methods.addEarnings = function(amount: number) {
  this.stats.totalEarnings += amount;
  return this.save();
};

CompanionSchema.methods.isAvailableOn = function(date: Date): boolean {
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayName = dayNames[date.getDay()];
  
  // Check exceptions first
  const exception = this.availability.exceptions.find(
    (ex: IExceptionDate) => ex.date.toDateString() === date.toDateString()
  );
  
  if (exception) {
    return exception.isAvailable;
  }
  
  // Check regular schedule
  const schedule = this.availability.schedule.find(
    (s: IScheduleSlot) => s.day === dayName && s.isAvailable
  );
  
  return !!schedule;
};

CompanionSchema.methods.submitKYC = function(documents: IKYCDocument[]) {
  this.kyc.documents = documents;
  this.kyc.status = 'pending';
  this.kyc.submittedAt = new Date();
  return this.save();
};

CompanionSchema.methods.approveKYC = function(verifiedBy: string) {
  this.kyc.status = 'verified';
  this.kyc.verifiedAt = new Date();
  this.kyc.verifiedBy = new mongoose.Types.ObjectId(verifiedBy);
  this.status = 'approved';
  return this.save();
};

CompanionSchema.methods.rejectKYC = function(reason: string) {
  this.kyc.status = 'rejected';
  this.kyc.rejectionReason = reason;
  return this.save();
};

// Create or get the model with proper typing
const Companion: CompanionModel = (mongoose.models.Companion as CompanionModel) || 
  mongoose.model<CompanionDocument, CompanionModel>('Companion', CompanionSchema);

export default Companion;
