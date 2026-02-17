import mongoose, { Schema, Document } from 'mongoose';
import { IChatRoom, IChatMessage } from '@/types';

// Chat Message Schema
const ChatMessageSchema = new Schema<IChatMessage & Document>({
  roomId: {
    type: Schema.Types.ObjectId,
    ref: 'ChatRoom',
    required: true,
    index: true,
  },
  senderId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  type: {
    type: String,
    enum: ['text', 'image', 'file', 'system'],
    default: 'text',
  },
  content: {
    type: String,
    required: true,
    maxlength: 2000,
  },
  fileUrl: {
    type: String,
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  readAt: {
    type: Date,
  },
}, {
  timestamps: true,
});

// Chat Room Schema
const ChatRoomSchema = new Schema<IChatRoom & Document>({
  bookingId: {
    type: Schema.Types.ObjectId,
    ref: 'Booking',
    required: true,
    unique: true,
    index: true,
  },
  participants: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  }],
  status: {
    type: String,
    enum: ['active', 'archived', 'blocked'],
    default: 'active',
    index: true,
  },
  lastMessage: {
    type: ChatMessageSchema,
  },
  unreadCount: {
    type: Map,
    of: Number,
    default: new Map(),
  },
}, {
  timestamps: true,
});

// Indexes
ChatRoomSchema.index({ participants: 1 });
ChatRoomSchema.index({ status: 1, updatedAt: -1 });

// Chat Message Indexes
ChatMessageSchema.index({ roomId: 1, createdAt: -1 });
ChatMessageSchema.index({ senderId: 1, createdAt: -1 });
ChatMessageSchema.index({ isRead: 1 });

// Static methods for ChatRoom
ChatRoomSchema.statics.findByBooking = function(bookingId: string) {
  return this.findOne({ bookingId });
};

ChatRoomSchema.statics.findByUser = function(userId: string) {
  return this.find({
    participants: new mongoose.Types.ObjectId(userId),
    status: { $ne: 'blocked' },
  })
    .populate('participants', 'profile.firstName profile.lastName profile.avatar')
    .populate('bookingId', 'bookingId status')
    .sort({ updatedAt: -1 });
};

ChatRoomSchema.statics.findOrCreate = async function(bookingId: string, participants: string[]) {
  let room = await this.findOne({ bookingId });
  
  if (!room) {
    room = await this.create({
      bookingId,
      participants: participants.map(id => new mongoose.Types.ObjectId(id)),
      status: 'active',
      unreadCount: new Map(participants.map(id => [id, 0])),
    });
  }
  
  return room;
};

// Instance methods for ChatRoom
ChatRoomSchema.methods.addMessage = async function(senderId: string, content: string, type: string = 'text', fileUrl?: string) {
  const ChatMessage = mongoose.model('ChatMessage');
  
  const message = await ChatMessage.create({
    roomId: this._id,
    senderId: new mongoose.Types.ObjectId(senderId),
    content,
    type,
    fileUrl,
    isRead: false,
  });
  
  // Update last message
  this.lastMessage = message;
  
  // Increment unread count for other participants
  this.participants.forEach((participantId: any) => {
    if (participantId.toString() !== senderId) {
      const currentCount = this.unreadCount.get(participantId.toString()) || 0;
      this.unreadCount.set(participantId.toString(), currentCount + 1);
    }
  });
  
  this.updatedAt = new Date();
  await this.save();
  
  return message;
};

ChatRoomSchema.methods.markAsRead = async function(userId: string) {
  const ChatMessage = mongoose.model('ChatMessage');
  
  // Mark all unread messages as read
  await ChatMessage.updateMany(
    {
      roomId: this._id,
      senderId: { $ne: new mongoose.Types.ObjectId(userId) },
      isRead: false,
    },
    {
      isRead: true,
      readAt: new Date(),
    }
  );
  
  // Reset unread count for this user
  this.unreadCount.set(userId, 0);
  await this.save();
};

ChatRoomSchema.methods.getUnreadCount = function(userId: string): number {
  return this.unreadCount.get(userId) || 0;
};

ChatRoomSchema.methods.archive = function() {
  this.status = 'archived';
  return this.save();
};

ChatRoomSchema.methods.block = function() {
  this.status = 'blocked';
  return this.save();
};

// Static methods for ChatMessage
ChatMessageSchema.statics.findByRoom = function(roomId: string, options: any = {}) {
  const { limit = 50, before } = options;
  
  const query: any = { roomId: new mongoose.Types.ObjectId(roomId) };
  if (before) {
    query.createdAt = { $lt: new Date(before) };
  }
  
  return this.find(query)
    .populate('senderId', 'profile.firstName profile.lastName profile.avatar')
    .sort({ createdAt: -1 })
    .limit(limit);
};

ChatMessageSchema.statics.getUnreadMessages = function(roomId: string, userId: string) {
  return this.find({
    roomId: new mongoose.Types.ObjectId(roomId),
    senderId: { $ne: new mongoose.Types.ObjectId(userId) },
    isRead: false,
  }).sort({ createdAt: 1 });
};

const ChatRoom = mongoose.models.ChatRoom || mongoose.model<IChatRoom & Document>('ChatRoom', ChatRoomSchema);
const ChatMessage = mongoose.models.ChatMessage || mongoose.model<IChatMessage & Document>('ChatMessage', ChatMessageSchema);

export { ChatRoom, ChatMessage };
