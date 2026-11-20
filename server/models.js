const mongoose = require('mongoose');
const { Schema } = mongoose;

const userSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  registerNumber: String,
  employeeId: String,
  department: String,
  year: String,
  role: { type: String, enum: ['STUDENT', 'ADMIN', 'MAINTENANCE', 'MANAGEMENT'], default: 'STUDENT' },
  phone: String,
  resetPasswordToken: String,
  resetPasswordExpires: Date
}, { timestamps: true });

const complaintSchema = new Schema({
  ticketId: { type: String, unique: true, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  priority: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Medium' },
  location: String,
  building: String,
  floor: String,
  roomNumber: String,
  images: [String],
  studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['Submitted', 'Under Review', 'Assigned', 'In Progress', 'Resolved', 'Closed', 'Rejected', 'Reopened'], default: 'Submitted' },
  expectedResolutionDate: Date,
  resolutionNotes: String,
  resolutionImages: [String],
  rejectionReason: String,
  resolvedAt: Date,
  closedAt: Date
}, { timestamps: true });

const historySchema = new Schema({
  complaintId: { type: Schema.Types.ObjectId, ref: 'Complaint', required: true },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  previousStatus: String,
  newStatus: { type: String, required: true },
  comment: String
}, { timestamps: true });

const notificationSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  complaintId: { type: Schema.Types.ObjectId, ref: 'Complaint' },
  title: { type: String, required: true },
  message: { type: String, required: true },
  isRead: { type: Boolean, default: false }
}, { timestamps: true });

const departmentSchema = new Schema({
  departmentName: { type: String, required: true },
  departmentCode: { type: String, required: true, unique: true },
  description: String
}, { timestamps: true });

const feedbackSchema = new Schema({
  complaintId: { type: Schema.Types.ObjectId, ref: 'Complaint', required: true, unique: true },
  studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  feedback: String
}, { timestamps: true });

module.exports = {
  User: mongoose.model('User', userSchema),
  Complaint: mongoose.model('Complaint', complaintSchema),
  ComplaintHistory: mongoose.model('ComplaintHistory', historySchema),
  Notification: mongoose.model('Notification', notificationSchema),
  Department: mongoose.model('Department', departmentSchema),
  Feedback: mongoose.model('Feedback', feedbackSchema)
};
