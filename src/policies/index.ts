import { IUser } from "../models/user/user.interface";
import getDistanceInKm from "../utils/distance.Calculate";

const isValidCoordinates = (coords: any) => {
    return (
        coords &&
        Array.isArray(coords) &&
        coords.length === 2 &&
        (coords[0] !== 0 || coords[1] !== 0)
    );
};

const getActiveLocation = (user: IUser) => {
    const currentCoords = user.currentLocation?.coordinates;
    const savedCoords = user.myLocation?.coordinates;

    if (isValidCoordinates(currentCoords)) {
        return currentCoords;
    }

    if (isValidCoordinates(savedCoords)) {
        return savedCoords;
    }

    return null;
};

export const rbacPolicy: any = {
    tournament: {
        canCreate: (user: any, tournamentType: any) => {
            const currentCoords = user.currentLocation?.coordinates;
            const myCoords = user.myLocation?.coordinates;

            if (!isValidCoordinates(myCoords)) {
                return {
                    allowed: false,
                    reason: "Your saved location (myLocation) is missing or invalid.",
                };
            }

            if (!isValidCoordinates(currentCoords)) {
                return {
                    allowed: false,
                    reason: "Your current location is missing or invalid.",
                };
            }

            const distance = getDistanceInKm(myCoords, currentCoords);

            if (distance > 60) {
                return {
                    allowed: false,
                    reason: `Cannot create tournaments if distance between myLocation and currentLocation exceeds 60 km. Current distance: ${distance.toFixed(
                        2
                    )} km.`,
                };
            }

            if (user.role === "user" || user.role === "basicUser") {
                if (tournamentType === "big") {
                    return {
                        allowed: false,
                        reason: "Users and basic users can only create small tournaments.",
                    };
                }
                return { allowed: true };
            }

            if (user.role === "supperUser") {
                return { allowed: true };
            }

            if (user.role === "admin") {
                return { allowed: true };
            }

            return { allowed: false, reason: "Unauthorized role." };
        },

        canJoin: (user: any) => {
            if (user.role === "user") {
                return {
                    allowed: false,
                    reason: "Users cannot join or request to play in tournaments.",
                };
            }

            if (
                user.role === "basicUser" ||
                user.role === "supperUser" ||
                user.role === "admin"
            ) {
                return { allowed: true };
            }

            return { allowed: false, reason: "Unauthorized role." };
        },

        geoQuery: (user: any, key: any = null) => {
            const activeCoords = getActiveLocation(user);

            if (!activeCoords) {
                throw new Error("No valid user location found");
            }

            const userLocationPoint = {
                type: "Point",
                coordinates: activeCoords,
            };

            const maxDistanceInMeters = 60000;

            const geoNearStage: any = {
                near: userLocationPoint,
                distanceField: "distance",
                spherical: true,
            };

            if (key) {
                geoNearStage.key = key;
            }

            if (user.role === "user" || user.role === "basicUser") {
                geoNearStage.maxDistance = maxDistanceInMeters;
            }

            return { $geoNear: geoNearStage };
        },
    },

    club: {
        canCreate: (user: any) => {
            if (user.role === "supperUser" || user.role === "admin") {
                return { allowed: true };
            }

            return {
                allowed: false,
                reason: "Only super users and admins can create clubs.",
            };
        },
    },
};

export { getActiveLocation, isValidCoordinates };