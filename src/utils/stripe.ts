import { StatusCodes } from "http-status-codes";
import AppError from "../errors/AppError";
import { STRIPE_SECRET_KEY } from "../config";
import { logger } from "../logger/logger";

/**
 * Minimal Stripe client over the REST API using global fetch — no SDK
 * dependency (mirrors the FCM approach). Enough for the private-club per-member
 * charge (spec §12): confirm an off-session PaymentIntent on the creator's
 * saved payment method.
 */

const STRIPE_API = "https://api.stripe.com/v1";

export const isStripeConfigured = (): boolean => Boolean(STRIPE_SECRET_KEY);

const form = (obj: Record<string, string | number | undefined>): string => {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined && v !== null) params.append(k, String(v));
  }
  return params.toString();
};

export interface ChargeResult {
  id: string;
  status: string;
}

/**
 * Charge a saved payment method off-session (payment first, code second). The
 * amount is in the currency's minor unit (cents). Throws unless the intent
 * succeeds, so the caller only proceeds on a confirmed payment.
 */
export const chargeOffSession = async (params: {
  customerId: string;
  paymentMethodId: string;
  amount: number;
  currency: string;
  description?: string;
  metadata?: Record<string, string>;
}): Promise<ChargeResult> => {
  if (!isStripeConfigured()) {
    throw new AppError(
      StatusCodes.SERVICE_UNAVAILABLE,
      "Payments are not configured",
    );
  }

  const body: Record<string, string | number | undefined> = {
    amount: params.amount,
    currency: params.currency.toLowerCase(),
    customer: params.customerId,
    payment_method: params.paymentMethodId,
    off_session: "true",
    confirm: "true",
    description: params.description,
  };
  for (const [k, v] of Object.entries(params.metadata ?? {})) {
    body[`metadata[${k}]`] = v;
  }

  const res = await fetch(`${STRIPE_API}/payment_intents`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form(body),
  });

  const data = (await res.json()) as {
    id?: string;
    status?: string;
    error?: { message?: string };
  };

  if (!res.ok || !data.id || data.status !== "succeeded") {
    const message = data.error?.message ?? "Payment failed";
    logger.warn(`Stripe charge failed: ${message}`);
    throw new AppError(StatusCodes.PAYMENT_REQUIRED, message);
  }

  return { id: data.id, status: data.status };
};

/**
 * Mint a Stripe coupon (spec §16) for Stripe-billed items (private-club slots,
 * sponsored banners). Either percentOff or amountOff (minor units) — not both.
 * Returns the coupon id to store on the DiscountCode.
 */
export const createCoupon = async (params: {
  percentOff?: number;
  amountOff?: number;
  currency?: string;
  duration?: "once" | "repeating" | "forever";
  durationInMonths?: number;
  maxRedemptions?: number;
  redeemBy?: Date;
  name?: string;
}): Promise<{ id: string }> => {
  if (!isStripeConfigured()) {
    throw new AppError(
      StatusCodes.SERVICE_UNAVAILABLE,
      "Payments are not configured",
    );
  }

  const body: Record<string, string | number | undefined> = {
    duration: params.duration ?? "once",
    name: params.name,
    max_redemptions: params.maxRedemptions,
    percent_off: params.percentOff,
    amount_off: params.amountOff,
    currency: params.amountOff
      ? (params.currency ?? "usd").toLowerCase()
      : undefined,
    duration_in_months:
      params.duration === "repeating" ? params.durationInMonths : undefined,
    redeem_by: params.redeemBy
      ? Math.floor(params.redeemBy.getTime() / 1000)
      : undefined,
  };

  const res = await fetch(`${STRIPE_API}/coupons`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form(body),
  });

  const data = (await res.json()) as {
    id?: string;
    error?: { message?: string };
  };
  if (!res.ok || !data.id) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      data.error?.message ?? "Could not create coupon",
    );
  }
  return { id: data.id };
};
