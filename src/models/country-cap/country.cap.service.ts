import { StatusCodes } from "http-status-codes";
import AppError from "../../errors/AppError";
import { CountryCap, DEFAULT_COUNTRY_CAPS } from "./country.cap.model";

/** Idempotently ensure the default caps exist (safe to call repeatedly). */
export const ensureSeeded = async (): Promise<void> => {
  await Promise.all(
    DEFAULT_COUNTRY_CAPS.map((cap) =>
      CountryCap.updateOne(
        { countryCode: cap.countryCode },
        { $setOnInsert: cap },
        { upsert: true },
      ),
    ),
  );
};

const getAll = async () => {
  await ensureSeeded();
  return CountryCap.find().sort({ countryCode: 1 });
};

/**
 * Resolve the cap that applies to a tournament's country, falling back to the
 * GLOBAL baseline. Self-seeds so the table is never empty in a fresh install.
 */
export const getCapForCountry = async (
  country?: string,
): Promise<{ countryCode: string; capAmount: number; currency: string }> => {
  await ensureSeeded();
  const code = (country ?? "").toUpperCase();
  const specific = code
    ? await CountryCap.findOne({ countryCode: code })
    : null;
  const cap = specific ?? (await CountryCap.findOne({ countryCode: "GLOBAL" }));
  if (!cap) {
    // Defensive: seeding guarantees GLOBAL exists.
    return { countryCode: "GLOBAL", capAmount: 1000, currency: "USD" };
  }
  return {
    countryCode: cap.countryCode,
    capAmount: cap.capAmount,
    currency: cap.currency,
  };
};

/** Admin: create or update a country's cap (no code deploy needed). */
const upsertCap = async (payload: {
  countryCode: string;
  capAmount: number;
  currency: string;
}) => {
  if (!payload.countryCode || payload.capAmount == null || !payload.currency) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "countryCode, capAmount and currency are required",
    );
  }
  return CountryCap.findOneAndUpdate(
    { countryCode: payload.countryCode.toUpperCase() },
    {
      countryCode: payload.countryCode.toUpperCase(),
      capAmount: payload.capAmount,
      currency: payload.currency.toUpperCase(),
    },
    { new: true, upsert: true },
  );
};

/** Admin: delete a country's cap. GLOBAL cannot be removed. */
const deleteCap = async (countryCode: string) => {
  const code = countryCode.toUpperCase();
  if (code === "GLOBAL") {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "The GLOBAL baseline cap cannot be deleted",
    );
  }
  const deleted = await CountryCap.findOneAndDelete({ countryCode: code });
  if (!deleted) {
    throw new AppError(StatusCodes.NOT_FOUND, "Country cap not found");
  }
  return { deleted: true };
};

export const CountryCapService = {
  ensureSeeded,
  getAll,
  getCapForCountry,
  upsertCap,
  deleteCap,
};
