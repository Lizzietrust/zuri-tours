import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: "Tour",
      required: [true, "Booking must belong to a tour"],
      index: true,
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "Booking must belong to a user"],
      index: true,
    },
    price: {
      type: Number,
      required: [true, "Booking must have a price"],
      min: [0, "Price cannot be negative"],
    },
    currency: {
      type: String,
      default: "NGN",
      uppercase: true,
      maxlength: 3,
    },
    guests: {
      type: Number,
      required: [true, "Please specify number of guests"],
      min: [1, "At least 1 guest"],
      default: 1,
    },
    startDate: {
      type: Date,
      required: [true, "Please select a tour date"],
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "completed", "refunded"],
      default: "pending",
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: ["paystack", "cash"],
      default: "paystack",
    },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid", "refunded", "failed"],
      default: "unpaid",
      index: true,
    },

    /* ---------- Paystack fields ---------- */
    paystackReference: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    paystackAccessCode: String,
    paystackAuthorizationUrl: String,
    paystackChannel: String,
    paystackGatewayResponse: String,

    paidAt: Date,
    cancelledAt: Date,
    cancelReason: { type: String, maxlength: 500 },
    bookingReference: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    notes: { type: String, maxlength: 500 },
    metadata: {
      userAgent: String,
      ipAddress: String,
    },
    createdBy: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

bookingSchema.index({ user: 1, createdAt: -1 });
bookingSchema.index({ tour: 1, startDate: 1 });
bookingSchema.index({ status: 1, createdAt: -1 });
bookingSchema.index({ user: 1, status: 1 });

/* ---------- Virtuals ---------- */

bookingSchema.virtual("isActive").get(function getIsActive() {
  return this.status === "confirmed" || this.status === "pending";
});

bookingSchema.virtual("canCancel").get(function getCanCancel() {
  if (this.status !== "confirmed" && this.status !== "pending") return false;

  return new Date(this.startDate).getTime() - Date.now() > 24 * 60 * 60 * 1000;
});

/* ---------- Hooks ---------- */

bookingSchema.pre("save", function generateBookingReference() {
  if (!this.bookingReference) {
    const ts = Date.now().toString(36).toUpperCase();
    const rand = Math.random().toString(36).substring(2, 7).toUpperCase();

    this.bookingReference = `ZT-${ts}-${rand}`;
  }
});

const Booking =
  mongoose.models.Booking || mongoose.model("Booking", bookingSchema);

export default Booking;
