import axios from "axios"; // eslint-disable-line import/no-extraneous-dependencies
import dotenv from "dotenv";
import { AppError } from "../utils/appError.js";

dotenv.config();

const PAYSTACK_BASE = "https://api.paystack.co";

const PAYSTACK_SECRET_KEY = (process.env.PAYSTACK_SECRET_KEY || "").trim();

if (!PAYSTACK_SECRET_KEY) {
  console.error(
    "❌ PAYSTACK_SECRET_KEY is missing! Check server/.env — no quotes, no spaces.",
  );
} else {
  console.log(
    `✅ Paystack key loaded: ${PAYSTACK_SECRET_KEY.slice(0, 12)}…${PAYSTACK_SECRET_KEY.slice(-4)} (len=${PAYSTACK_SECRET_KEY.length})`,
  );
}

const client = axios.create({
  baseURL: PAYSTACK_BASE,
  headers: {
    Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
    "Content-Type": "application/json",
  },
  timeout: 20000,
});

/**
 * Initialize a Paystack transaction.
 */
export async function initializePayment({
  email,
  amountNGN,
  reference,
  callbackUrl,
  metadata = {},
}) {
  if (!PAYSTACK_SECRET_KEY) {
    throw new AppError("Paystack is not configured on the server", 500);
  }

  const amountInKobo = Math.round(Number(amountNGN) * 100);

  if (!Number.isFinite(amountInKobo) || amountInKobo < 100) {
    throw new AppError("Amount must be at least ₦1", 400);
  }

  try {
    const { data } = await client.post("/transaction/initialize", {
      email,
      amount: amountInKobo,
      reference,
      currency: "NGN",
      callback_url:
        callbackUrl ||
        process.env.PAYSTACK_CALLBACK_URL ||
        "http://localhost:3002/bookings/callback",
      channels: ["card", "bank", "ussd", "mobile_money", "bank_transfer"],
      metadata,
    });

    if (!data.status) {
      throw new AppError(
        data.message || "Failed to initialize Paystack payment",
        502,
      );
    }

    return {
      authorizationUrl: data.data.authorization_url,
      accessCode: data.data.access_code,
      reference: data.data.reference,
    };
  } catch (err) {
    if (err.response) {
      const message =
        err.response.data?.message || "Paystack initialization failed";

      throw new AppError(message, err.response.status);
    }
    if (err instanceof AppError) throw err;
    throw new AppError(err.message || "Paystack request failed", 502);
  }
}

/**
 * Verify a Paystack transaction by reference.
 */
export async function verifyPayment(reference) {
  if (!PAYSTACK_SECRET_KEY) {
    throw new AppError("Paystack is not configured on the server", 500);
  }

  try {
    const { data } = await client.get(
      `/transaction/verify/${encodeURIComponent(reference)}`,
    );

    if (!data.status) {
      throw new AppError(
        data.message || "Failed to verify Paystack payment",
        502,
      );
    }

    const tx = data.data;

    return {
      status: tx.status,
      amountNGN: tx.amount / 100,
      channel: tx.channel,
      gatewayResponse: tx.gateway_response,
      paidAt: tx.paid_at,
      customerEmail: tx.customer?.email,
    };
  } catch (err) {
    if (err.response) {
      throw new AppError(
        err.response.data?.message || "Paystack verification failed",
        err.response.status,
      );
    }
    if (err instanceof AppError) throw err;
    throw new AppError(err.message || "Paystack request failed", 502);
  }
}
