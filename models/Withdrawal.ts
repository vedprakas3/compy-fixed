import mongoose, { Schema, Document, Model, Query } from 'mongoose';
import { IWithdrawal } from '@/types';

// Interface for Withdrawal instance methods
export interface IWithdrawalMethods {
  process(processedBy: string, transactionReference: string): Promise<IWithdrawal & Document>;
  reject(reason: string, processedBy: string): Promise<IWithdrawal & Document>;
  startProcessing(): Promise<IWithdrawal & Document>;
}

// Interface for Withdrawal static methods
export interface IWithdrawalStatics {
  findByUser(userId: string, filters?: any): any;
  findPending(): any;
  getTotalWithdrawn(userId: string): Promise<number>;
  getWithdrawalStats(): Promise<{
    total: number;
    totalAmount: number;
    pending: number;
    processing: number;
    completed: number;
    rejected: number;
    completedAmount: number;
  }>;
}

// Document type with methods
type WithdrawalDocument = IWithdrawal & Document & IWithdrawalMethods;

// Combined model type
type WithdrawalModel = Model<WithdrawalDocument> & IWithdrawalStatics;

// Withdrawal Schema
const WithdrawalSchema = new Schema<any, WithdrawalModel>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  currency: {
    type: String,
    default: 'INR',
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'rejected'],
    default: 'pending',
    index: true,
  },
  method: {
    type: String,
    enum: ['bank_transfer', 'upi', 'paypal'],
    required: true,
  },
  details: {
    accountNumber: {
      type: String,
    },
    ifscCode: {
      type: String,
    },
    accountHolderName: {
      type: String,
    },
    upiId: {
      type: String,
    },
    paypalEmail: {
      type: String,
    },
  },
  processedAt: {
    type: Date,
  },
  processedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  rejectionReason: {
    type: String,
  },
  transactionReference: {
    type: String,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Indexes
WithdrawalSchema.index({ userId: 1, status: 1 });
WithdrawalSchema.index({ status: 1, createdAt: -1 });
WithdrawalSchema.index({ createdAt: -1 });

// Static methods
WithdrawalSchema.statics.findByUser = function(userId: string, filters: any = {}) {
  return this.find({ userId, ...filters }).sort({ createdAt: -1 });
};

WithdrawalSchema.statics.findPending = function() {
  return this.find({ status: { $in: ['pending', 'processing'] } })
    .populate('userId', 'profile.firstName profile.lastName email')
    .sort({ createdAt: 1 });
};

WithdrawalSchema.statics.getTotalWithdrawn = async function(userId: string) {
  const result = await this.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        status: 'completed',
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$amount' },
      },
    },
  ]);
  
  return result.length > 0 ? result[0].total : 0;
};

WithdrawalSchema.statics.getWithdrawalStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
        processing: { $sum: { $cond: [{ $eq: ['$status', 'processing'] }, 1, 0] } },
        completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
        rejected: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } },
        completedAmount: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$amount', 0] },
        },
      },
    },
  ]);
  
  return stats.length > 0 ? stats[0] : {
    total: 0,
    totalAmount: 0,
    pending: 0,
    processing: 0,
    completed: 0,
    rejected: 0,
    completedAmount: 0,
  };
};

// Instance methods
WithdrawalSchema.methods.process = function(processedBy: string, transactionReference: string) {
  this.status = 'completed';
  this.processedBy = new mongoose.Types.ObjectId(processedBy);
  this.processedAt = new Date();
  this.transactionReference = transactionReference;
  return this.save();
};

WithdrawalSchema.methods.reject = function(reason: string, processedBy: string) {
  this.status = 'rejected';
  this.rejectionReason = reason;
  this.processedBy = new mongoose.Types.ObjectId(processedBy);
  this.processedAt = new Date();
  return this.save();
};

WithdrawalSchema.methods.startProcessing = function() {
  this.status = 'processing';
  return this.save();
};

// Create or get the model with proper typing
const Withdrawal: WithdrawalModel = (mongoose.models.Withdrawal as WithdrawalModel) || 
  mongoose.model<WithdrawalDocument>('Withdrawal', WithdrawalSchema) as WithdrawalModel;

export default Withdrawal;
