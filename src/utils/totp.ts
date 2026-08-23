import { createHmac, randomBytes } from "crypto";

/**
 * RFC 6238 TOTP (2FA) implemented on node:crypto — no otplib/speakeasy
 * dependency. Used for mandatory admin two-factor (spec §16).
 */

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

const base32Encode = (buf: Buffer): string => {
  let bits = 0;
  let value = 0;
  let out = "";
  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  return out;
};

const base32Decode = (input: string): Buffer => {
  const clean = input.replace(/=+$/, "").toUpperCase().replace(/\s/g, "");
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const char of clean) {
    const idx = BASE32_ALPHABET.indexOf(char);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(out);
};

/** A fresh base32 TOTP secret (160 bits). */
export const generateTotpSecret = (): string => base32Encode(randomBytes(20));

const hotp = (secret: string, counter: number): string => {
  const key = base32Decode(secret);
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64BE(BigInt(counter));
  const hmac = createHmac("sha1", key).update(buf).digest();
  const offset = hmac[hmac.length - 1] & 0xf;
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  return (code % 1_000_000).toString().padStart(6, "0");
};

/**
 * Verify a 6-digit TOTP token, allowing ±1 time-step (30s) for clock drift.
 */
export const verifyTotp = (secret: string, token: string): boolean => {
  if (!token || !/^\d{6}$/.test(token.trim())) return false;
  const counter = Math.floor(Date.now() / 1000 / 30);
  for (let w = -1; w <= 1; w++) {
    if (hotp(secret, counter + w) === token.trim()) return true;
  }
  return false;
};

/** otpauth:// provisioning URI for an authenticator-app QR code. */
export const otpauthUrl = (
  secret: string,
  account: string,
  issuer = "GGW Connect Admin",
): string => {
  const label = encodeURIComponent(`${issuer}:${account}`);
  const params = new URLSearchParams({
    secret,
    issuer,
    algorithm: "SHA1",
    digits: "6",
    period: "30",
  });
  return `otpauth://totp/${label}?${params.toString()}`;
};
