require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const mongoose = require('mongoose');
const { User, Complaint, ComplaintHistory, Notification, Department, Feedback } = require('./models');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('JWT_SECRET is required. Set it in server/.env.');
  process.exit(1);
}
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '5mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: 'draft-7' }));

fs.mkdirSync(path.join(__dirname, 'uploads'), { recursive: true });
const upload = multer({ storage: multer.diskStorage({
  destination: path.join(__dirname, 'uploads'),
  filename: (_req, file, cb) => cb(null, Date.now() + '-' + file.originalname.replace(/\s/g, '-'))
}), limits: { fileSize: 5 * 1024 * 1024 } });

const sign = user => jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
async function auth(req, res, next) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'Authentication required' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(payload.id).select('_id role');
    if (!user) return res.status(401).json({ message: 'Account no longer exists' });
    req.user = { id: String(user._id), role: user.role };
    next();
  }
  catch { res.status(401).json({ message: 'Invalid or expired token' }); }
}
function allow(...roles) { return (req, res, next) => roles.includes(req.user.role) ? next() : res.status(403).json({ message: 'Forbidden' }); }
async function notify(userId, complaintId, title, message) {
  if (userId) await Notification.create({ userId, complaintId, title, message });
}
async function addHistory(complaint, updatedBy, previousStatus, newStatus, comment) {
  await ComplaintHistory.create({ complaintId: complaint._id, updatedBy, previousStatus, newStatus, comment });
}

app.post('/api/auth/register', async (req, res, next) => {
  try {
    const { name, email, password, registerNumber, department, year, phone } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'Name, email and password are required' });
    if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });
    if (await User.findOne({ email: email.toLowerCase() })) return res.status(409).json({ message: 'Email already registered' });
    const user = await User.create({ name, email, password: await bcrypt.hash(password, 12), registerNumber, department, year, phone, role: 'STUDENT' });
    res.status(201).json({ token: sign(user), user: { id: user._id, name, email: user.email, role: user.role, department: user.department } });
  } catch (e) { next(e); }
});
app.post('/api/auth/login', async (req, res, next) => {
  try {
    const user = await User.findOne({ email: (req.body.email || '').toLowerCase() });
    if (!user || !(await bcrypt.compare(req.body.password || '', user.password))) return res.status(401).json({ message: 'Invalid email or password' });
    res.json({ token: sign(user), user: { id: user._id, name: user.name, email: user.email, role: user.role, department: user.department } });
  } catch (e) { next(e); }
});
app.get('/api/auth/me', auth, async (req, res, next) => {
  try { const user = await User.findById(req.user.id).select('-password'); res.json(user); } catch (e) { next(e); }
});
app.post('/api/auth/forgot-password', async (req, res, next) => {
  try {
    const user = await User.findOne({ email: (req.body.email || '').toLowerCase() });
    if (user) {
      const token = crypto.randomBytes(32).toString('hex');
      user.resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');
      user.resetPasswordExpires = new Date(Date.now() + 30 * 60 * 1000);
      await user.save();
      if (process.env.NODE_ENV === 'development' || !process.env.MONGO_URI) {
        return res.json({ message: 'Password reset token generated.', devResetToken: token });
      }
    }
    res.json({ message: 'If that account exists, password reset instructions will be sent.' });
  } catch (e) { next(e); }
});
app.post('/api/auth/reset-password', async (req, res, next) => {
  try {
    const token = crypto.createHash('sha256').update(req.body.token || '').digest('hex');
    const user = await User.findOne({ resetPasswordToken: token, resetPasswordExpires: { $gt: new Date() } });
    if (!user) return res.status(400).json({ message: 'Reset token is invalid or expired' });
    if (!req.body.password || req.body.password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });
    user.password = await bcrypt.hash(req.body.password, 12);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    res.json({ message: 'Password reset successfully' });
  } catch (e) { next(e); }
});

app.post('/api/complaints', auth, allow('STUDENT'), upload.array('images', 5), async (req, res, next) => {
  try {
    const b = req.body;
    if (!b.title || !b.description || !b.category) return res.status(400).json({ message: 'Title, description and category are required' });
    const locationClauses = [];
    if (b.location) locationClauses.push({ location: b.location });
    if (b.building) locationClauses.push({ building: b.building });
    if (b.roomNumber) locationClauses.push({ roomNumber: b.roomNumber });
    const duplicateQuery = { studentId: req.user.id, status: { $nin: ['Resolved', 'Closed', 'Rejected'] }, category: b.category };
    if (locationClauses.length) duplicateQuery.$or = locationClauses;
    const active = await Complaint.find(duplicateQuery);
    const duplicate = active[0];
    if (b.confirmDuplicate !== 'true' && duplicate) return res.status(409).json({ message: 'Possible duplicate complaint found', duplicateId: duplicate.ticketId, complaintId: duplicate._id });
    const ticketId = 'CMP-' + new Date().getFullYear() + '-' + String(Date.now()).slice(-6);
    const slaHours = { Critical: 4, High: 24, Medium: 72, Low: 168 }[b.priority || 'Medium'];
    const complaint = await Complaint.create({
      ticketId, title: b.title, description: b.description, category: b.category, priority: b.priority || 'Medium',
      location: b.location, building: b.building, floor: b.floor, roomNumber: b.roomNumber,
      studentId: req.user.id,
      images: (req.files || []).map(f => '/uploads/' + path.basename(f.path)),
      expectedResolutionDate: new Date(Date.now() + slaHours * 3600000)
    });
    await addHistory(complaint, req.user.id, null, 'Submitted', 'Complaint submitted');
    const admins = await User.find({ role: 'ADMIN' }).select('_id');
    await Promise.all(admins.map(a => notify(a._id, complaint._id, 'New complaint submitted', `${complaint.ticketId}: ${complaint.title}`)));
    await notify(req.user.id, complaint._id, 'Complaint submitted', `Your complaint ${complaint.ticketId} was submitted.`);
    res.status(201).json(complaint);
  } catch (e) { next(e); }
});
app.get('/api/complaints/my', auth, allow('STUDENT'), async (req, res, next) => {
  try { res.json(await Complaint.find({ studentId: req.user.id }).populate('assignedTo', 'name employeeId').sort({ createdAt: -1 })); } catch (e) { next(e); }
});
app.get('/api/complaints', auth, allow('ADMIN', 'MANAGEMENT'), async (req, res, next) => {
  try {
    const q = {};
    if (req.query.status) q.status = req.query.status;
    if (req.query.priority) q.priority = req.query.priority;
    if (req.query.category) q.category = req.query.category;
    if (req.query.search) q.$or = [{ title: new RegExp(req.query.search, 'i') }, { ticketId: new RegExp(req.query.search, 'i') }];
    const page = Math.max(1, Number(req.query.page) || 1), limit = Math.min(100, Number(req.query.limit) || 20);
    const [items, total] = await Promise.all([Complaint.find(q).populate('studentId', 'name email department registerNumber').populate('assignedTo', 'name employeeId').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit), Complaint.countDocuments(q)]);
    res.json({ items, total, page, pages: Math.ceil(total / limit) });
  } catch (e) { next(e); }
});
app.get('/api/complaints/:id', auth, async (req, res, next) => {
  try {
    const c = await Complaint.findById(req.params.id).populate('studentId', 'name email department registerNumber').populate('assignedTo', 'name employeeId');
    if (!c) return res.status(404).json({ message: 'Complaint not found' });
    if (req.user.role === 'STUDENT' && (!c.studentId || String(c.studentId._id) !== req.user.id)) return res.status(403).json({ message: 'Forbidden' });
    if (req.user.role === 'MAINTENANCE' && (!c.assignedTo || String(c.assignedTo._id) !== req.user.id)) return res.status(403).json({ message: 'Task is not assigned to you' });
    res.json(c);
  } catch (e) { next(e); }
});
app.put('/api/complaints/:id', auth, allow('STUDENT', 'ADMIN'), async (req, res, next) => {
  try {
    const c = await Complaint.findById(req.params.id);
    if (!c) return res.status(404).json({ message: 'Complaint not found' });
    if (req.user.role === 'STUDENT' && (String(c.studentId) !== req.user.id || c.status !== 'Submitted')) {
      return res.status(400).json({ message: 'Only submitted complaints owned by you can be edited' });
    }
    const allowed = ['title', 'description', 'category', 'priority', 'location', 'building', 'floor', 'roomNumber'];
    allowed.forEach(field => {
      if (req.body[field] !== undefined) c[field] = req.body[field];
    });
    await c.save();
    res.json(c);
  } catch (e) { next(e); }
});
app.post('/api/complaints/:id/assign', auth, allow('ADMIN'), async (req, res, next) => {
  try {
    const c = await Complaint.findById(req.params.id);
    if (!c) return res.status(404).json({ message: 'Complaint not found' });
    if (!['Submitted', 'Under Review'].includes(c.status)) return res.status(400).json({ message: 'Complaint cannot be assigned in this status' });
    const staff = await User.findOne({ _id: req.body.staffId, role: 'MAINTENANCE' });
    if (!staff) return res.status(400).json({ message: 'Valid maintenance staff is required' });
    const old = c.status;
    c.assignedTo = staff._id; c.status = 'Assigned'; await c.save();
    await addHistory(c, req.user.id, old, 'Assigned', 'Complaint assigned to maintenance');
    await notify(staff._id, c._id, 'New task assigned', `${c.ticketId} is assigned to you`);
    res.json(c);
  } catch (e) { next(e); }
});
app.patch('/api/complaints/:id/status', auth, allow('ADMIN'), async (req, res, next) => {
  try {
    const c = await Complaint.findById(req.params.id);
    if (!c) return res.status(404).json({ message: 'Complaint not found' });
    const old = c.status, status = req.body.status;
    const allowedTransitions = {
      'Submitted': ['Under Review', 'Rejected'],
      'Under Review': ['Rejected', 'Assigned'],
      'Assigned': ['In Progress'],
      'In Progress': ['Resolved'],
      'Resolved': ['Closed', 'Reopened'],
      'Reopened': ['Under Review', 'Assigned', 'In Progress'],
      'Closed': [],
      'Rejected': []
    };
    if (!allowedTransitions[old]?.includes(status)) return res.status(400).json({ message: `Invalid status transition from ${old} to ${status}` });
    if (status === 'Rejected') c.rejectionReason = req.body.reason;
    if (status === 'Resolved') c.resolvedAt = new Date();
    if (status === 'Closed') c.closedAt = new Date();
    c.status = status; await c.save();
    await addHistory(c, req.user.id, old, status, req.body.comment || '');
    await notify(c.studentId, c._id, 'Complaint status updated', `${c.ticketId} is now ${status}`);
    res.json(c);
  } catch (e) { next(e); }
});
app.post('/api/complaints/:id/reopen', auth, allow('STUDENT'), async (req, res, next) => {
  try {
    const c = await Complaint.findOne({ _id: req.params.id, studentId: req.user.id });
    if (!c || !['Resolved', 'Closed'].includes(c.status)) return res.status(400).json({ message: 'Only resolved or closed complaints can be reopened' });
    const old = c.status; c.status = 'Reopened'; c.resolvedAt = undefined; c.closedAt = undefined; await c.save();
    await addHistory(c, req.user.id, old, 'Reopened', req.body.comment || 'Issue persists');
    res.json(c);
  } catch (e) { next(e); }
});
app.post('/api/complaints/:id/close', auth, allow('STUDENT'), async (req, res, next) => {
  try {
    const c = await Complaint.findOne({ _id: req.params.id, studentId: req.user.id });
    if (!c || c.status !== 'Resolved') return res.status(400).json({ message: 'Only resolved complaints can be confirmed' });
    const old = c.status;
    c.status = 'Closed';
    c.closedAt = new Date();
    await c.save();
    await addHistory(c, req.user.id, old, 'Closed', 'Resolution confirmed by student');
    await notify(c.assignedTo, c._id, 'Resolution confirmed', `${c.ticketId} was closed by the student`);
    res.json(c);
  } catch (e) { next(e); }
});
app.post('/api/complaints/:id/feedback', auth, allow('STUDENT'), async (req, res, next) => {
  try {
    const c = await Complaint.findOne({ _id: req.params.id, studentId: req.user.id });
    if (!c || !['Resolved', 'Closed'].includes(c.status)) return res.status(400).json({ message: 'Feedback is available after resolution' });
    const rating = Number(req.body.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    const feedback = await Feedback.findOneAndUpdate({ complaintId: c._id }, { studentId: req.user.id, rating, feedback: req.body.feedback }, { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true });
    res.json(feedback);
  } catch (e) { next(e); }
});
app.get('/api/complaints/:id/history', auth, async (req, res, next) => {
  try {
    const c = await Complaint.findById(req.params.id).select('studentId assignedTo');
    if (!c) return res.status(404).json({ message: 'Complaint not found' });
    const canView = ['ADMIN', 'MANAGEMENT'].includes(req.user.role)
      || (req.user.role === 'STUDENT' && String(c.studentId) === req.user.id)
      || (req.user.role === 'MAINTENANCE' && c.assignedTo && String(c.assignedTo) === req.user.id);
    if (!canView) return res.status(403).json({ message: 'Forbidden' });
    res.json(await ComplaintHistory.find({ complaintId: req.params.id }).populate('updatedBy', 'name role').sort({ createdAt: 1 }).lean());
  } catch (e) { next(e); }
});

app.get('/api/maintenance/tasks', auth, allow('MAINTENANCE'), async (req, res, next) => {
  try { res.json(await Complaint.find({ assignedTo: req.user.id }).populate('studentId', 'name department').sort({ createdAt: -1 })); } catch (e) { next(e); }
});
app.patch('/api/maintenance/tasks/:id/progress', auth, allow('MAINTENANCE'), async (req, res, next) => {
  try {
    const c = await Complaint.findOne({ _id: req.params.id, assignedTo: req.user.id });
    if (!c) return res.status(404).json({ message: 'Assigned task not found' });
    if (!['Assigned', 'In Progress', 'Reopened'].includes(c.status)) return res.status(400).json({ message: 'Work has already reached a terminal state' });
    const old = c.status; c.status = 'In Progress'; c.resolutionNotes = req.body.note || c.resolutionNotes; await c.save();
    await addHistory(c, req.user.id, old, 'In Progress', req.body.note || 'Work in progress');
    res.json(c);
  } catch (e) { next(e); }
});
app.post('/api/maintenance/tasks/:id/resolve', auth, allow('MAINTENANCE'), upload.array('resolutionImages', 5), async (req, res, next) => {
  try {
    const c = await Complaint.findOne({ _id: req.params.id, assignedTo: req.user.id });
    if (!c) return res.status(404).json({ message: 'Assigned task not found' });
    if (!['Assigned', 'In Progress', 'Reopened'].includes(c.status)) return res.status(400).json({ message: 'This task cannot be resolved in its current state' });
    const old = c.status;
    c.status = 'Resolved'; c.resolutionNotes = req.body.resolutionNotes || c.resolutionNotes; c.resolutionImages = (req.files || []).map(f => '/uploads/' + path.basename(f.path)); c.resolvedAt = new Date(); await c.save();
    await addHistory(c, req.user.id, old, 'Resolved', c.resolutionNotes);
    await notify(c.studentId, c._id, 'Complaint resolved', `${c.ticketId} has been resolved`);
    res.json(c);
  } catch (e) { next(e); }
});

app.get('/api/dashboard/student', auth, allow('STUDENT'), async (req, res, next) => {
  try {
    const all = await Complaint.find({ studentId: req.user.id });
    const count = s => all.filter(c => c.status === s).length;
    res.json({ total: all.length, pending: count('Submitted') + count('Under Review'), inProgress: count('Assigned') + count('In Progress'), resolved: count('Resolved') + count('Closed'), reopened: count('Reopened'), recent: all.sort((a,b) => b.createdAt-a.createdAt).slice(0,6), trend: [] });
  } catch (e) { next(e); }
});
app.get('/api/dashboard/admin', auth, allow('ADMIN'), async (req, res, next) => {
  try {
    const all = await Complaint.find().populate('studentId', 'name department');
    const count = s => all.filter(c => c.status === s).length;
    const categories = {};
    all.forEach(c => categories[c.category] = (categories[c.category] || 0) + 1);
    res.json({
      total: all.length, newComplaints: count('Submitted'), pending: count('Submitted') + count('Under Review'), inProgress: count('Assigned') + count('In Progress'),
      resolved: count('Resolved') + count('Closed'), reopened: count('Reopened'), overdue: all.filter(c => c.expectedResolutionDate && c.expectedResolutionDate < new Date() && !['Resolved','Closed'].includes(c.status)).length,
      resolutionPercent: all.length ? Math.round(((count('Resolved') + count('Closed')) / all.length) * 100) : 0,
      categories, recent: all.sort((a,b) => b.createdAt-a.createdAt).slice(0,8)
    });
  } catch (e) { next(e); }
});
app.get('/api/dashboard/maintenance', auth, allow('MAINTENANCE'), async (req, res, next) => {
  try {
    const all = await Complaint.find({ assignedTo: req.user.id });
    res.json({ total: all.length, pending: all.filter(c => c.status === 'Assigned').length, inProgress: all.filter(c => c.status === 'In Progress').length,
      completed: all.filter(c => c.status === 'Resolved' || c.status === 'Closed').length,
      overdue: all.filter(c => c.expectedResolutionDate && c.expectedResolutionDate < new Date() && !['Resolved','Closed'].includes(c.status)).length,
      recent: all.sort((a,b) => b.createdAt-a.createdAt).slice(0,8) });
  } catch (e) { next(e); }
});
app.get('/api/dashboard/management', auth, allow('MANAGEMENT', 'ADMIN'), async (_req, res, next) => {
  try {
    const all = await Complaint.find();
    const resolved = all.filter(c => ['Resolved','Closed'].includes(c.status));
    const times = resolved.map(c => c.resolvedAt ? (c.resolvedAt - c.createdAt) / 3600000 : null).filter(Boolean);
    res.json({ volume: all.length, resolutionRate: all.length ? Math.round(resolved.length/all.length*100) : 0,
      averageResolutionHours: times.length ? Math.round(times.reduce((a,b)=>a+b,0)/times.length) : 0,
      slaCompliance: all.length ? Math.round(all.filter(c => !c.expectedResolutionDate || !c.resolvedAt || c.resolvedAt <= c.expectedResolutionDate).length/all.length*100) : 100,
      categories: all.reduce((m,c) => ({...m,[c.category]: (m[c.category]||0)+1}), {}) });
  } catch (e) { next(e); }
});

app.get('/api/notifications', auth, async (req, res, next) => {
  try { res.json(await Notification.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(50)); } catch (e) { next(e); }
});
app.patch('/api/notifications/:id/read', auth, async (req, res, next) => {
  try { await Notification.findOneAndUpdate({ _id: req.params.id, userId: req.user.id }, { isRead: true }); res.json({ success: true }); } catch (e) { next(e); }
});
app.patch('/api/notifications/read-all', auth, async (req, res, next) => {
  try { await Notification.updateMany({ userId: req.user.id }, { isRead: true }); res.json({ success: true }); } catch (e) { next(e); }
});

app.get('/api/users', auth, allow('ADMIN'), async (req, res, next) => {
  try { const q = req.query.role ? { role: req.query.role } : {}; res.json(await User.find(q).select('-password').sort({ createdAt: -1 })); } catch (e) { next(e); }
});
app.get('/api/users/:id', auth, allow('ADMIN'), async (req, res, next) => {
  try { const u = await User.findById(req.params.id).select('-password'); u ? res.json(u) : res.status(404).json({ message: 'User not found' }); } catch (e) { next(e); }
});
app.post('/api/users', auth, allow('ADMIN'), async (req, res, next) => {
  try {
    const { name, email, password, role, department, employeeId, phone } = req.body;
    if (!['MAINTENANCE','MANAGEMENT','ADMIN'].includes(role)) return res.status(400).json({ message: 'Invalid account role' });
    if (await User.findOne({ email })) return res.status(409).json({ message: 'Email already exists' });
    const u = await User.create({ name, email, password: await bcrypt.hash(password || 'Campus@123', 12), role, department, employeeId, phone });
    res.status(201).json(u);
  } catch (e) { next(e); }
});
app.put('/api/users/:id', auth, allow('ADMIN'), async (req, res, next) => {
  try {
    const allowed = ['name','email','registerNumber','employeeId','department','year','role','phone'];
    const updates = {};
    allowed.forEach(field => { if (req.body[field] !== undefined) updates[field] = req.body[field]; });
    if (req.body.password) updates.password = await bcrypt.hash(req.body.password, 12);
    const u = await User.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true }).select('-password');
    u ? res.json(u) : res.status(404).json({ message: 'User not found' });
  } catch (e) { next(e); }
});
app.delete('/api/users/:id', auth, allow('ADMIN'), async (req, res, next) => {
  try { await User.findByIdAndDelete(req.params.id); res.json({ success: true }); } catch (e) { next(e); }
});

app.get('/api/departments', auth, async (_req, res, next) => {
  try { res.json(await Department.find().sort({ departmentName: 1 })); } catch (e) { next(e); }
});
app.post('/api/departments', auth, allow('ADMIN'), async (req, res, next) => { try { res.status(201).json(await Department.create(req.body)); } catch (e) { next(e); } });
app.put('/api/departments/:id', auth, allow('ADMIN'), async (req, res, next) => { try { res.json(await Department.findByIdAndUpdate(req.params.id, req.body, { new: true })); } catch (e) { next(e); } });
app.delete('/api/departments/:id', auth, allow('ADMIN'), async (req, res, next) => { try { await Department.findByIdAndDelete(req.params.id); res.json({ success: true }); } catch (e) { next(e); } });

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Server error' });
});

async function seed() {
  const password = await bcrypt.hash('Campus@123', 12);
  const demoUsers = [
    { name: 'Aarav Student', email: 'student@campus.edu', password, role: 'STUDENT', registerNumber: 'CS2024001', department: 'Computer Science', year: '3', phone: '9876543210' },
    { name: 'Priya Admin', email: 'admin@campus.edu', password, role: 'ADMIN', employeeId: 'ADM001', department: 'Administration' },
    { name: 'Rohan Technician', email: 'maintenance@campus.edu', password, role: 'MAINTENANCE', employeeId: 'MNT001', department: 'Facilities' },
    { name: 'Meera Management', email: 'management@campus.edu', password, role: 'MANAGEMENT', employeeId: 'MGT001', department: 'Campus Management' }
  ];
  for (const demo of demoUsers) {
    await User.updateOne({ email: demo.email }, { $setOnInsert: demo }, { upsert: true });
  }
  const users = await Promise.all(demoUsers.map(d => User.findOne({ email: d.email })));
  for (const department of [
    { departmentName: 'Computer Science', departmentCode: 'CSE', description: 'Computing and software engineering' },
    { departmentName: 'Electrical Engineering', departmentCode: 'EEE', description: 'Electrical systems' },
    { departmentName: 'Mechanical Engineering', departmentCode: 'MECH', description: 'Mechanical systems' }
  ]) await Department.updateOne({ departmentCode: department.departmentCode }, { $setOnInsert: department }, { upsert: true });
  const student = users[0], staff = users[2];
  const demoComplaints = [
    { ticketId:'CMP-2026-100001', title:'Projector not working', description:'The classroom projector switches off repeatedly.', category:'Classroom maintenance', priority:'High', location:'Main Academic Block', building:'Block A', floor:'2', roomNumber:'A-204', studentId:student._id, status:'In Progress', assignedTo:staff._id, expectedResolutionDate:new Date(Date.now()+86400000) },
    { ticketId:'CMP-2026-100002', title:'Water leakage near washroom', description:'Continuous water leakage from the washroom pipe.', category:'Plumbing and water supply', priority:'Critical', location:'Engineering Hostel', building:'Hostel B', floor:'1', roomNumber:'B-118', studentId:student._id, status:'Submitted', expectedResolutionDate:new Date(Date.now()+4*3600000) },
    { ticketId:'CMP-2026-100003', title:'Wi-Fi signal is weak', description:'The lab Wi-Fi disconnects frequently.', category:'Internet and Wi-Fi', priority:'Medium', location:'Computer Science Block', building:'Block C', floor:'3', roomNumber:'C-301', studentId:student._id, status:'Resolved', resolvedAt:new Date(Date.now()-86400000), assignedTo:staff._id, expectedResolutionDate:new Date(Date.now()+2*86400000) }
  ];
  const complaints = [];
  for (const demo of demoComplaints) {
    complaints.push(await Complaint.findOneAndUpdate({ ticketId: demo.ticketId }, { $setOnInsert: demo }, { upsert: true, new: true }));
  }
  for (const c of complaints) {
    const existingHistory = await ComplaintHistory.findOne({ complaintId: c._id });
    if (!existingHistory) await ComplaintHistory.create({ complaintId:c._id, updatedBy:users[1]._id, previousStatus:null, newStatus:c.status, comment:'Demo record created' });
  }
}

async function start() {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/campuscare';
  await mongoose.connect(uri);
  console.log(`Connected to MongoDB database "${mongoose.connection.name}" at ${mongoose.connection.host}`);
  await seed();
  app.listen(PORT, () => console.log(`CampusCare server running at http://localhost:${PORT}`));
  const close = async () => { await mongoose.disconnect(); process.exit(0); };
  process.on('SIGINT', close); process.on('SIGTERM', close);
}
start().catch(err => { console.error('Failed to start server:', err); process.exit(1); });
