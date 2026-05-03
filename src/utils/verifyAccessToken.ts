import jwt from "jsonwebtoken";

export interface DecodedAccessToken {
  userId: string;
  email: string;
  role: string;
}

// Ensure the secret exists
if (!process.env.JWT_SECRET_KEY) {
  throw new Error("JWT_SECRET_KEY is not defined in environment variables");
}
export const JWT_SECRET_KEY: string = process.env.JWT_SECRET_KEY;

export const verifyAccessToken = (token: string): DecodedAccessToken | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET_KEY) as any;

    // Support tokens with 'id' as userId
    const userId = decoded.userId || decoded.id;

    if (userId && decoded.email && decoded.role) {
      return {
        userId,
        email: decoded.email,
        role: decoded.role,
      };
    }

    return null;
  } catch (error) {
    console.error("Invalid token:", error);
    return null;
  }
};
