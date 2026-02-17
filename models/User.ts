import mongoose, { Schema, Document } from 'mongoose';
import { IUser, IPanicContact, IWalletTransaction } from '@/types';

// Wallet Transaction Schema
const WalletTransactionSchema = new Schema<IWalletTransaction>({
  type: {
    type: String,
    enum: ['credit', 'debit', 'refund', 'withdrawal'],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  description: {
    type: String,
    required: true,
  },
  reference: {
    type: String,
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Panic Contact Schema
const PanicContactSchema = new Schema<IPanicContact>({
  name: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  relationship: {
    type: String,
    required: true,
  },
});

// User Schema
const UserSchema = new Schema<IUser & Document>({
  firebaseUid: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  phone: {
    type: String,
    sparse: true,
    unique: true,
  },
  role: {
    type: String,
    enum: ['user', 'companion', 'admin'],
    default: 'user',
    index: true,
  },
  status: {
    type: String,
    enum: ['active', 'suspended', 'banned', 'pending'],
    default: 'pending',
    index: true,
  },
  profile: {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    avatar: {
      type: String,
      default: null,
    },
    bio: {
      type: String,
      maxlength: 500,
    },
    dateOfBirth: {
      type: Date,
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other', 'prefer_not_to_say'],
    },
    location: {
      city: String,
      state: String,
      country: String,
      coordinates: {
        type: [Number],
        index: '2dsphere',
      },
    },
  },
  verification: {
    email: {
      type: Boolean,
      default: false,
    },
    phone: {
      type: Boolean,
      default: false,
    },
    identity: {
      type: String,
      enum: ['unverified', 'pending', 'verified', 'rejected'],
      default: 'unverified',
    },
    badge: {
      type: Boolean,
      default: false,
    },
  },
  wallet: {
    balance: {
      type: Number,
      default: 0,
      min: 0,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    transactions: [WalletTransactionSchema],
  },
  preferences: {
    notifications: {
      type: Boolean,
      default: true,
    },
    newsletter: {
      type: Boolean,
      default: false,
    },
    language: {
      type: String,
      default: 'en',
    },
    currency: {
      type: String,
      default: 'INR',
    },
  },
  safety: {
    panicContacts: [PanicContactSchema],
    lastPanicAlert: {
      type: Date,
    },
  },
  blockedUsers: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
  }],
  wishlist: [{
    type: Schema.Types.ObjectId,
    ref: 'Companion',
  }],
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Virtual for full name
UserSchema.virtual('fullName').get(function() {
  return `${this.profile.firstName} ${this.profile.lastName}`;
});

// Virtual for age
UserSchema.virtual('age').get(function() {
  if (!this.profile.dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(this.profile.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
});

// Index for search
UserSchema.index({ 'profile.firstName': 'text', 'profile.lastName': 'text', email: 'text' });

// Pre-save middleware
UserSchema.pre('save', function(next) {
  if (this.isModified('email')) {
    this.email = this.email.toLowerCase().trim();
  }
  next();
});

// Static methods
UserSchema.statics.findByFirebaseUid = function(firebaseUid: string) {
  return this.findOne({ firebaseUid });
};

UserSchema.statics.findByEmail = function(email: string) {
  return this.findOne({ email: email.toLowerCase().trim() });
};

// Instance methods
UserSchema.methods.addToWallet = function(amount: number, description: string, reference?: string) {
  this.wallet.balance += amount;
  this.wallet.transactions.push({
    type: amount > 0 ? 'credit' : 'debit',
    amount: Math.abs(amount),
    description,
    reference,
    status: 'completed',
    createdAt: new Date(),
  });
  return this.save();
};

UserSchema.methods.blockUser = function(userId: string) {
  if (!this.blockedUsers.includes(userId)) {
    this.blockedUsers.push(userId);
  }
  return this.save();
};

UserSchema.methods.unblockUser = function(userId: string) {
  this.blockedUsers = this.blockedUsers.filter((id: string) => id.toString() !== userId);
  return this.save();
};

UserSchema.methods.addToWishlist = function(companionId: string) {
  if (!this.wishlist.includes(companionId)) {
    this.wishlist.push(companionId);
  }
  return this.save();
};

UserSchema.methods.removeFromWishlist = function(companionId: string) {
  this.wishlist = this.wishlist.filter((id: string) => id.toString() !== companionId);
  return this.save();
};

const User = mongoose.models.User || mongoose.model<IUser & Document>('User', UserSchema);

export default User;
