import mongoose from "mongoose";
import Booking from "../models/Booking.js";
import Tour from "../models/Tour.js";
import User from "../models/User.js";
import { catchAsync } from "../utils/catchAsync.js";
import { AppError } from "../utils/appError.js";
import {
  initializePayment,
  verifyPayment,
} from "../services/paystackService.js";

/* ============================================================
   HELPERS
   ============================================================ */

const NGN_RATE = Number(process.env.NGN_USD_RATE) || 1600;

function tourUnitPrice(tour) {
  return typeof tour.priceDiscount === "number" &&
    tour.priceDiscount > 0 &&
    tour.priceDiscount < tour.price
    ? tour.priceDiscount
    : tour.price;
}

function usdToNgn(usd) {
  return Math.round(usd * NGN_RATE);
}

/* ============================================================
   INITIALIZE BOOKING + PAYMENT
   ============================================================ */
export const initializeBooking = catchAsync(async (req, res) => {
  const {
    tourId,
    guests,
    startDate,
    paymentMethod = "paystack",
    notes,
  } = req.body;

  if (!tourId) throw new AppError("Tour ID is required", 400);
  if (!startDate) throw new AppError("Start date is required", 400);
  if (!guests || guests < 1) {
    throw new AppError("At least 1 guest required", 400);
  }

  const tour = await Tour.findById(tourId);

  if (!tour) throw new AppError("Tour not found", 404);

  if (guests > tour.maxGroupSize) {
    throw new AppError(
      `This tour allows up to ${tour.maxGroupSize} guests`,
      400,
    );
  }

  const chosenDate = new Date(startDate);

  if (Number.isNaN(chosenDate.getTime())) {
    throw new AppError("Invalid start date", 400);
  }
  if (chosenDate < new Date()) {
    throw new AppError("Start date cannot be in the past", 400);
  }

  const isValidDate = (tour.startDates || []).some(
    (d) => new Date(d).toDateString() === chosenDate.toDateString(),
  );

  if (tour.startDates?.length > 0 && !isValidDate) {
    throw new AppError("Selected date is not available for this tour", 400);
  }

  const unitPrice = tourUnitPrice(tour);
  const totalUsd = unitPrice * guests;
  const totalNgn = usdToNgn(totalUsd);

  /* ---------- Cash on arrival: skip Paystack ---------- */
  if (paymentMethod === "cash") {
    const booking = await Booking.create({
      tour: tour._id,
      user: req.user._id,
      price: totalUsd,
      currency: "USD",
      guests,
      startDate: chosenDate,
      paymentMethod: "cash",
      status: "pending",
      paymentStatus: "unpaid",
      notes: notes || "",
      createdBy: req.user._id,
      metadata: {
        userAgent: req.headers["user-agent"],
        ipAddress: req.ip || req.connection?.remoteAddress,
      },
    });

    await User.findByIdAndUpdate(req.user._id, {
      $push: { bookings: booking._id },
    });

    const populated = await Booking.findById(booking._id)
      .populate({
        path: "tour",
        select: "name slug imageCover price priceDiscount duration difficulty",
      })
      .lean();

    return res.status(201).json({
      status: "success",
      message: "Booking created — pay on arrival",
      data: { booking: populated, requiresPayment: false },
    });
  }

  /* ---------- Paystack flow ---------- */

  const booking = await Booking.create({
    tour: tour._id,
    user: req.user._id,
    price: totalUsd,
    currency: "NGN",
    guests,
    startDate: chosenDate,
    paymentMethod: "paystack",
    status: "pending",
    paymentStatus: "unpaid",
    notes: notes || "",
    createdBy: req.user._id,
    metadata: {
      userAgent: req.headers["user-agent"],
      ipAddress: req.ip || req.connection?.remoteAddress,
    },
  });

  const reference = `ZT-PS-${booking._id}-${Date.now().toString(36)}`;

  let paystack;

  try {
    paystack = await initializePayment({
      email: req.user.email,
      amountNGN: totalNgn,
      reference,
      metadata: {
        bookingId: String(booking._id),
        tourId: String(tour._id),
        tourName: tour.name,
        guests,
        startDate: chosenDate.toISOString(),
        userId: String(req.user._id),
      },
    });
  } catch (err) {
    await Booking.findByIdAndDelete(booking._id);
    throw err;
  }

  booking.paystackReference = paystack.reference;
  booking.paystackAccessCode = paystack.accessCode;
  booking.paystackAuthorizationUrl = paystack.authorizationUrl;
  await booking.save();

  await User.findByIdAndUpdate(req.user._id, {
    $push: { bookings: booking._id },
  });

  const populated = await Booking.findById(booking._id)
    .populate({
      path: "tour",
      select: "name slug imageCover price priceDiscount duration difficulty",
    })
    .lean();

  res.status(201).json({
    status: "success",
    message: "Payment initialized",
    data: {
      booking: populated,
      requiresPayment: true,
      payment: {
        authorizationUrl: paystack.authorizationUrl,
        accessCode: paystack.accessCode,
        reference: paystack.reference,
        amountNGN: totalNgn,
        amountUSD: totalUsd,
      },
    },
  });
});

/* ============================================================
   VERIFY PAYMENT (called from frontend after redirect)
   ============================================================ */
export const verifyBookingPayment = catchAsync(async (req, res) => {
  const { reference } = req.params;

  if (!reference) throw new AppError("Payment reference is required", 400);

  const booking = await Booking.findOne({
    paystackReference: reference,
  });

  if (!booking) throw new AppError("Booking not found for this reference", 404);

  const isOwner = booking.user.toString() === req.user._id.toString();
  const isAdmin = req.user.role === "admin";

  if (!isOwner && !isAdmin) {
    throw new AppError("You are not authorized to verify this payment", 403);
  }

  if (booking.status === "confirmed" && booking.paymentStatus === "paid") {
    const populated = await Booking.findById(booking._id)
      .populate({
        path: "tour",
        select: "name slug imageCover price priceDiscount duration difficulty",
      })
      .lean();

    return res.status(200).json({
      status: "success",
      message: "Payment already verified",
      data: { booking: populated },
    });
  }

  const result = await verifyPayment(reference);

  booking.paystackChannel = result.channel;
  booking.paystackGatewayResponse = result.gatewayResponse;

  if (result.status === "success") {
    booking.status = "confirmed";
    booking.paymentStatus = "paid";
    booking.paidAt = result.paidAt ? new Date(result.paidAt) : new Date();
    await booking.save();
  } else {
    booking.status = "cancelled";
    booking.paymentStatus = "failed";
    await booking.save();

    const populated = await Booking.findById(booking._id)
      .populate({
        path: "tour",
        select: "name slug imageCover price priceDiscount duration difficulty",
      })
      .lean();

    return res.status(200).json({
      status: "success",
      message: `Payment ${result.status}. Booking cancelled.`,
      data: { booking: populated },
    });
  }

  const populated = await Booking.findById(booking._id)
    .populate({
      path: "tour",
      select: "name slug imageCover price priceDiscount duration difficulty",
    })
    .lean();

  res.status(200).json({
    status: "success",
    message: "Payment verified — booking confirmed",
    data: { booking: populated },
  });
});

/* ============================================================
   PAYSTACK WEBHOOK (optional but recommended for production)
   ============================================================ */
export const paystackWebhook = catchAsync(async (req, res) => {
  const crypto = await import("node:crypto");

  const signature = req.headers["x-paystack-signature"];

  if (!signature) {
    return res.status(400).json({ status: "fail", message: "No signature" });
  }

  const hash = crypto
    .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY)
    .update(JSON.stringify(req.body))
    .digest("hex");

  if (hash !== signature) {
    return res
      .status(401)
      .json({ status: "fail", message: "Invalid signature" });
  }

  const event = req.body;

  if (event.event === "charge.success") {
    const reference = event.data?.reference;

    if (!reference) return res.sendStatus(200);

    const booking = await Booking.findOne({ paystackReference: reference });

    if (booking && booking.paymentStatus !== "paid") {
      booking.status = "confirmed";
      booking.paymentStatus = "paid";
      booking.paidAt = new Date();
      booking.paystackChannel = event.data.channel;
      booking.paystackGatewayResponse = event.data.gateway_response;
      await booking.save();
    }
  }

  res.sendStatus(200);
});

/* ============================================================
   MY BOOKINGS
   ============================================================ */
export const getMyBookings = catchAsync(async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;

  const filter = { user: req.user._id };

  if (status && status !== "all") filter.status = status;

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));

  const [bookings, total] = await Promise.all([
    Booking.find(filter)
      .sort("-createdAt")
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .populate({
        path: "tour",
        select: "name slug imageCover price priceDiscount duration difficulty",
      })
      .lean(),
    Booking.countDocuments(filter),
  ]);

  /* -------- Compute canCancel on the server -------- */
  const now = Date.now();
  const enrichedBookings = bookings.map((b) => ({
    ...b,
    canCancel:
      (b.status === "confirmed" || b.status === "pending") &&
      new Date(b.startDate).getTime() - now > 24 * 60 * 60 * 1000,
  }));

  res.status(200).json({
    status: "success",
    results: enrichedBookings.length,
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum),
    data: { bookings: enrichedBookings },
  });
});

/* ============================================================
   SINGLE BOOKING
   ============================================================ */
export const getBooking = catchAsync(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid booking ID", 400);
  }

  const booking = await Booking.findById(id)
    .populate({
      path: "tour",
      select: "name slug imageCover price priceDiscount duration difficulty",
    })
    .populate({ path: "user", select: "name email profileImage" })
    .lean();

  if (!booking) throw new AppError("Booking not found", 404);

  const isOwner = booking.user._id.toString() === req.user._id.toString();
  const isAdmin = req.user.role === "admin";

  if (!isOwner && !isAdmin) {
    throw new AppError("You are not authorized to view this booking", 403);
  }

  res.status(200).json({ status: "success", data: { booking } });
});

/* ============================================================
   CANCEL BOOKING
   ============================================================ */
export const cancelBooking = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid booking ID", 400);
  }

  const booking = await Booking.findById(id);

  if (!booking) throw new AppError("Booking not found", 404);

  const isOwner = booking.user.toString() === req.user._id.toString();
  const isAdmin = req.user.role === "admin";

  if (!isOwner && !isAdmin) {
    throw new AppError("You are not authorized to cancel this booking", 403);
  }

  if (booking.status === "cancelled") {
    throw new AppError("Booking is already cancelled", 400);
  }
  if (booking.status === "completed") {
    throw new AppError("Cannot cancel a completed booking", 400);
  }

  if (!isAdmin) {
    const hoursUntilTour =
      (new Date(booking.startDate).getTime() - Date.now()) / (1000 * 60 * 60);

    if (hoursUntilTour < 24) {
      throw new AppError(
        "Free cancellation ends 24h before the tour starts",
        400,
      );
    }
  }

  booking.status = "cancelled";
  booking.cancelledAt = new Date();
  booking.cancelReason = reason || "";
  if (booking.paymentStatus === "paid") {
    booking.paymentStatus = "refunded";
  }
  await booking.save();

  const populated = await Booking.findById(booking._id)
    .populate({
      path: "tour",
      select: "name slug imageCover price priceDiscount duration difficulty",
    })
    .lean();

  res.status(200).json({
    status: "success",
    message: "Booking cancelled",
    data: { booking: populated },
  });
});

/* ============================================================
   ADMIN — all bookings
   ============================================================ */
export const getAllBookings = catchAsync(async (req, res) => {
  if (req.user.role !== "admin") {
    throw new AppError("Only admins can list all bookings", 403);
  }

  const { page = 1, limit = 20, status, tourId } = req.query;

  const filter = {};

  if (status && status !== "all") filter.status = status;
  if (tourId) filter.tour = tourId;

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));

  const [bookings, total] = await Promise.all([
    Booking.find(filter)
      .sort("-createdAt")
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .populate({ path: "tour", select: "name slug imageCover" })
      .populate({ path: "user", select: "name email profileImage" })
      .lean(),
    Booking.countDocuments(filter),
  ]);

  res.status(200).json({
    status: "success",
    results: bookings.length,
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum),
    data: { bookings },
  });
});
