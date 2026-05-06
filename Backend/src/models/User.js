const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const ROLES = {
  READER: 'reader',
  AUTHOR: 'author',
  ADMIN: 'admin',
  MASTER_ADMIN: 'master_admin',
};

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true, // This already creates an index
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Never return password in queries by default
    },
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.READER,
    },
    avatar: {
      type: String,
      default: null,
    },
    bio: {
      type: String,
      maxlength: [300, 'Bio cannot exceed 300 characters'],
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Index for faster email lookups (email already has unique index from schema)
userSchema.index({ role: 1 });

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Virtual: posts count (populated separately)
userSchema.virtual('postsCount', {
  ref: 'Post',
  localField: '_id',
  foreignField: 'author',
  count: true,
});

// Prevent deletion/editing of master admin via findOneAndUpdate/findOneAndDelete
userSchema.pre('findOneAndUpdate', async function () {
  const doc = await this.model.findOne(this.getQuery());
  if (doc && doc.role === ROLES.MASTER_ADMIN) {
    const update = this.getUpdate();
    if (update && update.role && update.role !== ROLES.MASTER_ADMIN) {
      throw new Error('Master Admin role cannot be changed');
    }
  }
});

userSchema.pre('findOneAndDelete', async function () {
  const doc = await this.model.findOne(this.getQuery());
  if (doc && doc.role === ROLES.MASTER_ADMIN) {
    throw new Error('Master Admin cannot be deleted');
  }
});

const User = mongoose.model('User', userSchema);

module.exports = { User, ROLES };
