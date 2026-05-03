import { JwtUserPayload } from "../middlewares/auth";

declare global {
  namespace Express {
    interface Request {
      user?: JwtUserPayload;
    }
  }
}
