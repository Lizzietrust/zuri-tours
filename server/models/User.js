import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import validator from "validator";

function validateNameLength(value) {
  return validator.isLength(value, { min: 2, max: 50 });
}

function validateEmail(value) {
  return validator.isEmail(value);
}

function validatePasswordStrength(value) {
  return validator.isStrongPassword(value, {
    minLength: 6,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1,
  });
}

function getEmailErrorMessage(props) {
  return `${props.value} is not a valid email address!`;
}

function sanitizeString(value) {
  if (typeof value !== "string") {
    return value;
  }

  let sanitized = value.replace(/<[^>]*>/g, "");

  sanitized = sanitized
    .split("")
    .filter(function isPrintableChar(char) {
      const code = char.charCodeAt(0);

      return (code > 31 && code < 127) || code > 159;
    })
    .join("");

  sanitized = sanitized.replace(
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    "",
  );

  sanitized = sanitized.replace(/ on\w+=/gi, " ");

  sanitized = sanitized.replace(/javascript:/gi, "");

  sanitized = sanitized.replace(/data:/gi, "");

  sanitized = sanitized.trim();

  return sanitized;
}

function sanitizeObject(obj) {
  if (!obj || typeof obj !== "object") {
    return obj;
  }

  const sanitized = {};

  for (const [key, value] of Object.entries(obj)) {
    if (key.startsWith("$") || key.includes(".")) {
      // eslint-disable-next-line no-continue
      continue;
    }

    if (typeof value === "string") {
      sanitized[key] = sanitizeString(value);
    } else if (Array.isArray(value)) {
      // eslint-disable-next-line no-use-before-define
      sanitized[key] = sanitizeArray(value);
    } else if (typeof value === "object" && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

function sanitizeArray(arr) {
  if (!Array.isArray(arr)) {
    return arr;
  }

  return arr.map(function sanitizeArrayItem(item) {
    if (typeof item === "string") {
      return sanitizeString(item);
    }
    if (typeof item === "object" && item !== null) {
      return sanitizeObject(item);
    }

    return item;
  });
}

function sanitizeDocument(doc) {
  if (doc.name) {
    doc.name = sanitizeString(doc.name);
  }

  if (doc.bio) {
    doc.bio = sanitizeString(doc.bio);
  }

  if (doc.phoneNumber) {
    doc.phoneNumber = sanitizeString(doc.phoneNumber).replace(/[^\d+]/g, "");
  }

  if (doc.languages && Array.isArray(doc.languages)) {
    doc.languages = doc.languages.map(function sanitizeLanguage(lang) {
      return sanitizeString(lang);
    });
  }

  if (doc.certifications && Array.isArray(doc.certifications)) {
    doc.certifications = doc.certifications.map(function sanitizeCert(cert) {
      return sanitizeString(cert);
    });
  }

  if (doc.guideSpecialties && Array.isArray(doc.guideSpecialties)) {
    doc.guideSpecialties = doc.guideSpecialties.map(
      function sanitizeSpecialty(specialty) {
        return sanitizeString(specialty);
      },
    );
  }

  if (doc.emergencyContact) {
    if (doc.emergencyContact.name) {
      doc.emergencyContact.name = sanitizeString(doc.emergencyContact.name);
    }
    if (doc.emergencyContact.phone) {
      doc.emergencyContact.phone = sanitizeString(
        doc.emergencyContact.phone,
      ).replace(/[^\d+]/g, "");
    }
    if (doc.emergencyContact.relationship) {
      doc.emergencyContact.relationship = sanitizeString(
        doc.emergencyContact.relationship,
      );
    }
  }
}

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please add a name"],
      trim: true,
      maxlength: [50, "Name cannot be more than 50 characters"],
      validate: {
        validator: validateNameLength,
        message: "Name must be between 2 and 50 characters",
      },
    },
    email: {
      type: String,
      required: [true, "Please add an email"],
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: validateEmail,
        message: getEmailErrorMessage,
      },
    },
    photo: {
      type: String,
      default: "default.jpg",
    },
    password: {
      type: String,
      required: [true, "Please add a password"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
      validate: {
        validator: validatePasswordStrength,
        message:
          "Password is not strong enough. Use at least 6 characters with a mix of letters, numbers, and symbols.",
      },
    },
    role: {
      type: String,
      enum: {
        values: ["user", "guide", "lead-guide", "admin"],
        message: "Role must be user, guide, lead-guide, or admin",
      },
      default: "user",
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    createdAt: {
      type: Date,
      default: Date.now,
    },
    passwordChangedAt: {
      type: Date,
      select: false,
    },
    lastLogin: {
      type: Date,
      select: false,
    },
    loginAttempts: {
      type: Number,
      default: 0,
      select: false,
    },
    lockUntil: {
      type: Date,
      select: false,
    },
    active: {
      type: Boolean,
      default: true,
      select: false,
    },
    tokenVersion: {
      type: Number,
      default: 0,
      select: false,
    },
    activeSessions: {
      type: [String],
      default: [],
      select: false,
    },
    assignedTours: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "Tour",
      },
    ],
    guideSpecialties: {
      type: [String],
      enum: ["adventure", "cultural", "nature", "city", "beach", "mountain"],
      default: [],
    },
    languages: {
      type: [String],
      default: [],
    },
    bio: {
      type: String,
      maxlength: [500, "Bio cannot be more than 500 characters"],
    },
    experienceYears: {
      type: Number,
      min: 0,
      max: 50,
    },
    certifications: [String],
    phoneNumber: {
      type: String,
    },
    emergencyContact: {
      name: String,
      phone: String,
      relationship: String,
    },
    availability: {
      monday: { type: Boolean, default: true },
      tuesday: { type: Boolean, default: true },
      wednesday: { type: Boolean, default: true },
      thursday: { type: Boolean, default: true },
      friday: { type: Boolean, default: true },
      saturday: { type: Boolean, default: false },
      sunday: { type: Boolean, default: false },
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
    hireDate: {
      type: Date,
    },
    salary: {
      type: Number,
      min: 0,
    },
    performanceMetrics: {
      toursLed: { type: Number, default: 0 },
      customerSatisfaction: { type: Number, default: 0, min: 0, max: 100 },
      completionRate: { type: Number, default: 0, min: 0, max: 100 },
      averageRating: { type: Number, default: 0, min: 0, max: 5 },
    },
  },
  {
    timestamps: true,
  },
);

userSchema.pre("validate", function sanitizeBeforeValidate(next) {
  sanitizeDocument(this);
  next();
});

function getPasswordConfirm() {
  return this._passwordConfirm;
}

function setPasswordConfirm(value) {
  this._passwordConfirm = value;
}

userSchema
  .virtual("passwordConfirm")
  .get(getPasswordConfirm)
  .set(setPasswordConfirm);

function validatePasswordConfirmMiddleware(next) {
  if (this._passwordConfirm !== undefined) {
    if (this.password !== this._passwordConfirm) {
      this.invalidate("passwordConfirm", "Passwords do not match");
    }
  }
  next();
}

userSchema.pre("validate", validatePasswordConfirmMiddleware);

async function hashPasswordMiddleware(next) {
  if (!this.isModified("password")) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);

  this.password = await bcrypt.hash(this.password, salt);
  this.passwordChangedAt = new Date();
  this.tokenVersion = (this.tokenVersion || 0) + 1;

  this.active = true;

  next();
}

userSchema.pre("save", hashPasswordMiddleware);

function filterActiveUsersMiddleware(next) {
  this.find({ active: { $ne: false } });
  next();
}

userSchema.pre(/^find/, filterActiveUsersMiddleware);

function changedPasswordAfter(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10,
    );

    return JWTTimestamp < changedTimestamp;
  }

  return false;
}

userSchema.methods.changedPasswordAfter = changedPasswordAfter;

function isAccountLocked() {
  return this.lockUntil && this.lockUntil > new Date();
}

userSchema.methods.isAccountLocked = isAccountLocked;

async function handleFailedLogin() {
  this.loginAttempts = (this.loginAttempts || 0) + 1;
  const MAX_ATTEMPTS = 5;
  const LOCK_TIME = 30 * 60 * 1000;

  if (this.loginAttempts >= MAX_ATTEMPTS) {
    this.lockUntil = new Date(Date.now() + LOCK_TIME);
  }

  await this.save({ validateBeforeSave: false });
}

userSchema.methods.handleFailedLogin = handleFailedLogin;

async function resetLoginAttempts() {
  this.loginAttempts = 0;
  this.lockUntil = undefined;
  this.lastLogin = new Date();
  await this.save({ validateBeforeSave: false });
}

userSchema.methods.resetLoginAttempts = resetLoginAttempts;

function getSignedJwtToken() {
  const payload = {
    id: this._id,
    tokenVersion: this.tokenVersion || 0,
    role: this.role,
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "7d",
  });
}

userSchema.methods.getSignedJwtToken = getSignedJwtToken;

function matchPassword(enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
}

userSchema.methods.matchPassword = matchPassword;

function isGuide() {
  return this.role === "guide" || this.role === "lead-guide";
}

function isLeadGuide() {
  return this.role === "lead-guide";
}

function isAdmin() {
  return this.role === "admin";
}

function canManageTours() {
  return this.role === "lead-guide" || this.role === "admin";
}

function canManageGuides() {
  return this.role === "lead-guide" || this.role === "admin";
}

function canAssignTours() {
  return this.role === "lead-guide" || this.role === "admin";
}

function hasTourAccess(tourId) {
  if (this.role === "admin" || this.role === "lead-guide") {
    return true;
  }

  return this.assignedTours && this.assignedTours.includes(tourId);
}

userSchema.methods.isGuide = isGuide;
userSchema.methods.isLeadGuide = isLeadGuide;
userSchema.methods.isAdmin = isAdmin;
userSchema.methods.canManageTours = canManageTours;
userSchema.methods.canManageGuides = canManageGuides;
userSchema.methods.canAssignTours = canAssignTours;
userSchema.methods.hasTourAccess = hasTourAccess;

async function findAndVerifyUser(id) {
  const user = await this.findById(id)
    .select("+passwordChangedAt +tokenVersion")
    .select("+loginAttempts +lockUntil +active");

  if (!user) {
    return null;
  }
  if (!user.active) {
    return null;
  }
  if (user.lockUntil && user.lockUntil > new Date()) {
    return null;
  }

  return user;
}

userSchema.statics.findAndVerifyUser = findAndVerifyUser;

userSchema.index({ active: 1 });
userSchema.index({ tokenVersion: 1 });
userSchema.index({ lockUntil: 1 });
userSchema.index({ role: 1 });
userSchema.index({ assignedTours: 1 });

const User = mongoose.model("User", userSchema);

export default User;
