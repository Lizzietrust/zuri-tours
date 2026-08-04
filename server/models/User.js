import mongoose from "mongoose"; // eslint-disable-line import/no-extraneous-dependencies
import bcrypt from "bcryptjs"; // eslint-disable-line import/no-extraneous-dependencies
import jwt from "jsonwebtoken"; // eslint-disable-line import/no-extraneous-dependencies
import validator from "validator"; // eslint-disable-line import/no-extraneous-dependencies

function validateNameLength(value) {
  return validator.isLength(value, { min: 2, max: 50 });
}

function validateEmail(value) {
  return validator.isEmail(value);
}

function validatePasswordStrength(value) {
  return validator.isStrongPassword(value, {
    minLength: 6,
    minLowercase: 0,
    minUppercase: 0,
    minNumbers: 0,
    minSymbols: 0,
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

  next();
});

userSchema.methods.getSignedJwtToken = function getSignedJwtToken() {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

userSchema.methods.matchPassword = function matchPassword(enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);

export default User;
