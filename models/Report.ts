import mongoose, { Schema, Document, Model } from 'mongoose';
import { IReport } from '@/types';

// Interface for Report static methods
interface IReportStatics {
  findByReporter(reporterId: string): Promise<(IReport & Document)[]>;
  findByReported(reportedId: string): Promise<(IReport & Document)[]>;
  findPending(): Promise<(IReport & Document)[]>;
  findBySeverity(severity: string): Promise<(IReport & Document)[]>;
  getReportStats(): Promise<{
    total: number;
    pending: number;
    investigating: number;
    resolved: number;
    dismissed: number;
    critical: number;
    high: number;
  }>;
}

type ReportModel = Model<IReport & Document> & IReportStatics;

// Report Schema
const ReportSchema = new Schema<IReport & Document, ReportModel>({
  reporterId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  reportedId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  bookingId: {
    type: Schema.Types.ObjectId,
    ref: 'Booking',
    index: true,
  },
  type: {
    type: String,
    enum: [
      'inappropriate_behavior',
      'harassment',
      'fake_profile',
      'scam',
      'no_show',
      'payment_issue',
      'safety_concern',
      'other',
    ],
    required: true,
    index: true,
  },
  description: {
    type: String,
    required: true,
    maxlength: 2000,
  },
  evidence: [{
    type: String, // URLs to evidence files
  }],
  status: {
    type: String,
    enum: ['pending', 'investigating', 'resolved', 'dismissed'],
    default: 'pending',
    index: true,
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
    index: true,
  },
  assignedTo: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  resolution: {
    action: {
      type: String,
      enum: ['warning', 'suspension', 'ban', 'dismissed'],
    },
    notes: {
      type: String,
    },
    resolvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    resolvedAt: {
      type: Date,
    },
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Compound indexes
ReportSchema.index({ reporterId: 1, reportedId: 1 });
ReportSchema.index({ status: 1, severity: 1 });
ReportSchema.index({ type: 1, status: 1 });
ReportSchema.index({ createdAt: -1 });

// Static methods
ReportSchema.statics.findByReporter = function(reporterId: string) {
  return this.find({ reporterId })
    .populate('reportedId', 'profile.firstName profile.lastName email')
    .populate('bookingId', 'bookingId dates.startDateTime')
    .sort({ createdAt: -1 });
};

ReportSchema.statics.findByReported = function(reportedId: string) {
  return this.find({ reportedId })
    .populate('reporterId', 'profile.firstName profile.lastName email')
    .sort({ createdAt: -1 });
};

ReportSchema.statics.findPending = function() {
  return this.find({ status: { $in: ['pending', 'investigating'] } })
    .populate('reporterId', 'profile.firstName profile.lastName email')
    .populate('reportedId', 'profile.firstName profile.lastName email')
    .sort({ severity: -1, createdAt: -1 });
};

ReportSchema.statics.findBySeverity = function(severity: string) {
  return this.find({ severity })
    .populate('reporterId', 'profile.firstName profile.lastName email')
    .populate('reportedId', 'profile.firstName profile.lastName email')
    .sort({ createdAt: -1 });
};

ReportSchema.statics.getReportStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
        investigating: { $sum: { $cond: [{ $eq: ['$status', 'investigating'] }, 1, 0] } },
        resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
        dismissed: { $sum: { $cond: [{ $eq: ['$status', 'dismissed'] }, 1, 0] } },
        critical: { $sum: { $cond: [{ $eq: ['$severity', 'critical'] }, 1, 0] } },
        high: { $sum: { $cond: [{ $eq: ['$severity', 'high'] }, 1, 0] } },
      },
    },
  ]);
  
  return stats.length > 0 ? stats[0] : {
    total: 0,
    pending: 0,
    investigating: 0,
    resolved: 0,
    dismissed: 0,
    critical: 0,
    high: 0,
  };
};

// Instance methods
ReportSchema.methods.assign = function(adminId: string) {
  this.assignedTo = new mongoose.Types.ObjectId(adminId);
  this.status = 'investigating';
  return this.save();
};

ReportSchema.methods.resolve = function(action: string, notes: string, resolvedBy: string) {
  this.status = 'resolved';
  this.resolution = {
    action: action as any,
    notes,
    resolvedBy: new mongoose.Types.ObjectId(resolvedBy),
    resolvedAt: new Date(),
  };
  return this.save();
};

ReportSchema.methods.dismiss = function(notes: string, resolvedBy: string) {
  this.status = 'dismissed';
  this.resolution = {
    action: 'dismissed',
    notes,
    resolvedBy: new mongoose.Types.ObjectId(resolvedBy),
    resolvedAt: new Date(),
  };
  return this.save();
};

ReportSchema.methods.escalate = function() {
  const severityLevels = ['low', 'medium', 'high', 'critical'];
  const currentIndex = severityLevels.indexOf(this.severity);
  if (currentIndex < severityLevels.length - 1) {
    this.severity = severityLevels[currentIndex + 1] as any;
  }
  return this.save();
};

const Report = (mongoose.models.Report as ReportModel) || 
  mongoose.model<IReport & Document, ReportModel>('Report', ReportSchema);

export default Report;
