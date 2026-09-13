const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

// ============================================================
// 1. Mongoose Schema Definition
// ============================================================
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: function () {
        return !this.googleId;
      },
    },
    googleId: { type: String, sparse: true, unique: true },
    avatar: { type: String, default: '' },
    authProvider: {
      type: String,
      enum: ['local', 'google'],
      default: 'local',
    },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    isEmailVerified: { type: Boolean, default: false },

    // Fields owned by module: forgot-password
    otpHash: { type: String, select: false },
    otpExpires: { type: Date, select: false },
    otpAttempts: { type: Number, default: 0, select: false },

    // Fields owned by module: deactivate-account
    isActive: { type: Boolean, default: true, index: true },
    deactivatedAt: { type: Date, default: null },
    reactivationTokenHash: { type: String, select: false },
    reactivationTokenExpires: { type: Date, select: false },
  },
  { timestamps: true }
);

const MongoUser = mongoose.model('User', userSchema);

// ============================================================
// 2. Local Fallback JSON Store (when MongoDB is offline)
// ============================================================
const DATA_FILE = path.join(__dirname, '../data/users.json');

const readLocalUsers = () => {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, '[]', 'utf8');
      return [];
    }
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data || '[]');
  } catch (err) {
    console.error('Error reading users.json:', err.message);
    return [];
  }
};

const writeLocalUsers = (users) => {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(users, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing users.json:', err.message);
  }
};

class LocalUserDocument {
  constructor(data) {
    Object.assign(this, data);
    if (!this._id) {
      this._id = 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
    }
    if (this.isActive === undefined) this.isActive = true;
    if (this.isEmailVerified === undefined) this.isEmailVerified = false;
    if (this.role === undefined) this.role = 'user';
    if (!this.createdAt) this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  async save() {
    this.updatedAt = new Date();
    const users = readLocalUsers();
    const index = users.findIndex((u) => u._id === this._id || u.email === this.email);
    const plainObj = { ...this };
    if (index >= 0) {
      users[index] = plainObj;
    } else {
      users.push(plainObj);
    }
    writeLocalUsers(users);
    return this;
  }
}

// ============================================================
// 3. Hybrid Exported Model
// ============================================================
const isDbConnected = () => mongoose.connection.readyState === 1;

const User = function (data) {
  if (isDbConnected()) {
    return new MongoUser(data);
  }
  return new LocalUserDocument(data);
};

User.findOne = function (query) {
  if (isDbConnected()) {
    return MongoUser.findOne(query);
  }

  // Local fallback query
  const runQuery = async () => {
    const users = readLocalUsers();
    const match = users.find((u) => {
      if (query.email && u.email.toLowerCase() === query.email.toLowerCase().trim()) return true;
      if (query._id && u._id === query._id) return true;
      if (query.googleId && u.googleId === query.googleId) return true;
      if (query.reactivationTokenHash && u.reactivationTokenHash === query.reactivationTokenHash) {
        if (query.reactivationTokenExpires && query.reactivationTokenExpires.$gt) {
          return new Date(u.reactivationTokenExpires) > new Date(query.reactivationTokenExpires.$gt);
        }
        return true;
      }
      if (query.$or) {
        return query.$or.some((subQuery) => {
          if (subQuery.googleId && u.googleId === subQuery.googleId) return true;
          if (subQuery.email && u.email.toLowerCase() === subQuery.email.toLowerCase().trim()) return true;
          return false;
        });
      }
      return false;
    });

    return match ? new LocalUserDocument(match) : null;
  };

  const promise = runQuery();
  promise.select = () => promise;
  return promise;
};

User.findById = function (id) {
  if (isDbConnected()) {
    return MongoUser.findById(id);
  }
  return User.findOne({ _id: id });
};

User.create = async function (data) {
  if (isDbConnected()) {
    return MongoUser.create(data);
  }
  const user = new LocalUserDocument(data);
  await user.save();
  return user;
};

module.exports = User;
