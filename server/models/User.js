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
    photo: String,
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
      enum: ["user", "admin"],
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
    accountDeleted: {
      type: Boolean,
      default: false,
      select: false,
    },
    accountDeletedAt: {
      type: Date,
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
  },
  {
    timestamps: true,
  },
);

userSchema
  .virtual("passwordConfirm")
  .get(function getPasswordConfirm() {
    return this._passwordConfirm;
  })
  .set(function setPasswordConfirm(value) {
    this._passwordConfirm = value;
  });

userSchema.pre("validate", function validatePasswordConfirm(next) {
  if (this._passwordConfirm !== undefined) {
    if (this.password !== this._passwordConfirm) {
      this.invalidate("passwordConfirm", "Passwords do not match");
    }
  }
  next();
});

userSchema.pre("save", async function hashPassword(next) {
  if (!this.isModified("password")) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);

  this.password = await bcrypt.hash(this.password, salt);

  this.passwordChangedAt = new Date();
  this.tokenVersion = (this.tokenVersion || 0) + 1;

  next();
});

userSchema.methods.changedPasswordAfter = function changedPasswordAfter(
  JWTTimestamp,
) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10,
    );

    return JWTTimestamp < changedTimestamp;
  }

  return false;
};

userSchema.methods.isAccountDeleted = function isAccountDeleted() {
  return this.accountDeleted === true;
};

userSchema.methods.isAccountLocked = function isAccountLocked() {
  return this.lockUntil && this.lockUntil > new Date();
};

userSchema.methods.handleFailedLogin = async function handleFailedLogin() {
  this.loginAttempts = (this.loginAttempts || 0) + 1;

  const MAX_ATTEMPTS = 5;
  const LOCK_TIME = 30 * 60 * 1000;

  if (this.loginAttempts >= MAX_ATTEMPTS) {
    this.lockUntil = new Date(Date.now() + LOCK_TIME);
  }

  await this.save({ validateBeforeSave: false });
};

userSchema.methods.resetLoginAttempts = async function resetLoginAttempts() {
  this.loginAttempts = 0;
  this.lockUntil = undefined;
  this.lastLogin = new Date();
  await this.save({ validateBeforeSave: false });
};

userSchema.methods.softDelete = async function softDelete() {
  this.accountDeleted = true;
  this.accountDeletedAt = new Date();
  this.tokenVersion = (this.tokenVersion || 0) + 1;
  await this.save({ validateBeforeSave: false });
};

userSchema.methods.reactivate = async function reactivate() {
  this.accountDeleted = false;
  this.accountDeletedAt = undefined;
  await this.save({ validateBeforeSave: false });
};

userSchema.methods.getSignedJwtToken = function getSignedJwtToken() {
  const payload = {
    id: this._id,
    tokenVersion: this.tokenVersion || 0,
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "7d",
  });
};

userSchema.methods.matchPassword = function matchPassword(enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

userSchema.statics.findAndVerifyUser = async function findAndVerifyUser(id) {
  const user = await this.findById(id)
    .select("+passwordChangedAt +accountDeleted +tokenVersion")
    .select("+loginAttempts +lockUntil");

  if (!user) return null;

  if (user.accountDeleted) return null;

  if (user.lockUntil && user.lockUntil > new Date()) return null;

  return user;
};

userSchema.index({ accountDeleted: 1 });
userSchema.index({ tokenVersion: 1 });
userSchema.index({ lockUntil: 1 });

const User = mongoose.model("User", userSchema);

export default User;
