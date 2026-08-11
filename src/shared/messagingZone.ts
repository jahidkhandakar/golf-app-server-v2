import { StatusCodes } from "http-status-codes";
import AppError from "../errors/AppError";
import { User } from "../models/user/user.model";
import { getDistanceInKm } from "../utils/distance.Calculate";

/** Home-zone radius for free-user messaging (spec §11). Tunable. */
export const HOME_ZONE_KM = 80; // ~50 miles

const hasCoords = (c?: number[]): c is number[] =>
  Array.isArray(c) && c.length === 2 && !(c[0] === 0 && c[1] === 0);

/**
 * Gate on *starting a new conversation* (spec §11). A conversation once started
 * stays open regardless of location — this only guards creation:
 *   - paid users and superusers can start anywhere;
 *   - a free user can start inside their home zone freely, and outside it only
 *     while on a travel trial.
 * Fails open when location is unknown, so legitimate users are never blocked by
 * missing coordinates.
 */
export const assertCanStartConversation = async (
  userId: string,
): Promise<void> => {
  const user = await User.findById(userId).select(
    "isSubscribe isAprovedAsSupperUser role myLocation currentLocation travelTrialsRemaining",
  );
  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found");
  }

  if (
    user.isSubscribe ||
    user.isAprovedAsSupperUser ||
    user.role === "admin" ||
    user.role === "superUser"
  ) {
    return;
  }

  const home = user.myLocation?.coordinates;
  const current = user.currentLocation?.coordinates;
  if (!hasCoords(home) || !hasCoords(current)) return; // unknown → allow

  const inHomeZone =
    getDistanceInKm(home as [number, number], current as [number, number]) <=
    HOME_ZONE_KM;
  if (inHomeZone) return;

  if ((user.travelTrialsRemaining ?? 0) > 0) return;

  throw new AppError(
    StatusCodes.FORBIDDEN,
    "Free users can only start new conversations in their home zone. Upgrade, or use a travel trial to message while traveling.",
  );
};
