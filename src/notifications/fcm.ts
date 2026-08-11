import jwt from "jsonwebtoken";
import {
  FIREBASE_PROJECT_ID,
  FIREBASE_CLIENT_EMAIL,
  FIREBASE_PRIVATE_KEY,
} from "../config";
import { logger } from "../logger/logger";

/**
 * Minimal FCM HTTP v1 sender (spec §7). Uses the existing jsonwebtoken dep to
 * mint a Google OAuth2 access token from the Firebase service account, then
 * POSTs to the FCM v1 endpoint via global fetch. No firebase-admin dependency.
 *
 * Fully optional: if the service account env vars are unset, this no-ops so the
 * rest of the app is unaffected.
 */

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const FCM_SCOPE = "https://www.googleapis.com/auth/firebase.messaging";

export const isFcmConfigured = (): boolean =>
  Boolean(FIREBASE_PROJECT_ID && FIREBASE_CLIENT_EMAIL && FIREBASE_PRIVATE_KEY);

// Cache the access token until shortly before it expires.
let cachedToken: { token: string; expiresAt: number } | null = null;

const getAccessToken = async (): Promise<string | null> => {
  if (!isFcmConfigured()) return null;
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && cachedToken.expiresAt - 60 > now) {
    return cachedToken.token;
  }

  // Service-account private keys often arrive with escaped newlines.
  const privateKey = (FIREBASE_PRIVATE_KEY as string).replace(/\\n/g, "\n");
  const assertion = jwt.sign(
    {
      iss: FIREBASE_CLIENT_EMAIL,
      scope: FCM_SCOPE,
      aud: GOOGLE_TOKEN_URL,
      iat: now,
      exp: now + 3600,
    },
    privateKey,
    { algorithm: "RS256" },
  );

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });

  if (!res.ok) {
    logger.error(`FCM token exchange failed: ${res.status}`);
    return null;
  }
  const data = (await res.json()) as {
    access_token: string;
    expires_in: number;
  };
  cachedToken = {
    token: data.access_token,
    expiresAt: now + (data.expires_in ?? 3600),
  };
  return cachedToken.token;
};

/**
 * Send a push to a single device token. Returns true on success. Values in
 * `data` must be strings per the FCM v1 contract.
 */
export const sendFcm = async (
  deviceToken: string,
  title: string,
  body: string,
  data: Record<string, string> = {},
): Promise<boolean> => {
  if (!isFcmConfigured() || !deviceToken) return false;

  const accessToken = await getAccessToken();
  if (!accessToken) return false;

  const res = await fetch(
    `https://fcm.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/messages:send`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: {
          token: deviceToken,
          notification: { title, body },
          data,
        },
      }),
    },
  );

  if (!res.ok) {
    logger.warn(`FCM send failed (${res.status}) for a device token`);
    return false;
  }
  return true;
};
