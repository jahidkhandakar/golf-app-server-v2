import { Schema, model } from "mongoose";
import { ICountryCap } from "./country.cap.interface";

const countryCapSchema = new Schema<ICountryCap>(
  {
    countryCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    capAmount: { type: Number, required: true, min: 0 },
    currency: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
  },
  { timestamps: true },
);

export const CountryCap = model<ICountryCap>("CountryCap", countryCapSchema);

/**
 * Default caps the table ships with (spec §2): the global baseline plus the
 * major golf nations. The two explicit values from the spec are GLOBAL
 * 1000 USD and GB 700 GBP; the remaining nations default to the baseline amount
 * in their local currency and are intended to be tuned by an admin.
 */
export const DEFAULT_COUNTRY_CAPS: {
  countryCode: string;
  capAmount: number;
  currency: string;
}[] = [
  { countryCode: "GLOBAL", capAmount: 1000, currency: "USD" },
  { countryCode: "US", capAmount: 1000, currency: "USD" },
  { countryCode: "GB", capAmount: 700, currency: "GBP" },
  { countryCode: "IE", capAmount: 1000, currency: "EUR" },
  { countryCode: "AU", capAmount: 1000, currency: "AUD" },
  { countryCode: "NZ", capAmount: 1000, currency: "NZD" },
  { countryCode: "CA", capAmount: 1000, currency: "CAD" },
  { countryCode: "ZA", capAmount: 1000, currency: "ZAR" },
  { countryCode: "JP", capAmount: 1000, currency: "JPY" },
  { countryCode: "KR", capAmount: 1000, currency: "KRW" },
  { countryCode: "SE", capAmount: 1000, currency: "SEK" },
  { countryCode: "ES", capAmount: 1000, currency: "EUR" },
  { countryCode: "DE", capAmount: 1000, currency: "EUR" },
  { countryCode: "FR", capAmount: 1000, currency: "EUR" },
];
