import { User } from "../user/user.model";
import { ISponserTournament } from "./sponsored.tournament.interface";
import { SponserTournament } from "./sponsored.tournament.model";

const createSponserTournament = async (
  userId: string,
  data: ISponserTournament,
) => {
  const datas = {
    ...data,
    sponserCreator: userId,
    location: {
      type: "Point" as const,
      coordinates: [
        Number(data.longitude || 0),
        Number(data.latitude || 0),
      ] as [number, number],
    },
  };

  const result = await SponserTournament.create(datas);
  return result;
};

const updateSponserTournament = async (
  sponserId: string,
  data: ISponserTournament,
  _userId: string,
) => {
  const updateData = { ...data };

  // If coordinates are provided, update location
  if (data.longitude !== undefined && data.latitude !== undefined) {
    updateData.location = {
      type: "Point" as const,
      coordinates: [Number(data.longitude), Number(data.latitude)] as [
        number,
        number,
      ],
    };
  }

  // Find and update the tournament
  const updatedTournament = await SponserTournament.findByIdAndUpdate(
    sponserId,
    updateData,
    { new: true, runValidators: true },
  );

  return updatedTournament;
};

const showAllsponserTournament = async (userId: string) => {
  const user = await User.findById(userId);

  if (!user || !user.currentLocation || !user.currentLocation.coordinates) {
    throw new Error("User location not found");
  }

  const maxDistanceInMeters = 60000; // 60 km (in meters)

  console.log(
    "User Location:",
    user.currentLocation.coordinates,
    "Max Distance:",
    maxDistanceInMeters,
  );

  // GeoSpatial query to find tournaments within 60 km
  const allTournaments = await SponserTournament.aggregate([
    {
      $geoNear: {
        near: {
          type: "Point",
          coordinates: user.currentLocation.coordinates as [number, number],
        },
        distanceField: "distance",
        maxDistance: maxDistanceInMeters, // Limit to 60 km
        spherical: true, // Enables spherical calculations for distance
      },
    },
    {
      $sort: { distance: 1 },
    },
    {
      $limit: 10,
    },
  ]);

  return allTournaments;
};

export const SponsoredTournamentService = {
  createSponserTournament,
  updateSponserTournament,
  showAllsponserTournament,
};
