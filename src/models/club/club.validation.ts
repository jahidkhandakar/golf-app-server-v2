import { z } from "zod";

const createClub = z.object({
  name: z.string({
    message: "Club name is required",
  }),
  city: z.string({
    message: "City is required",
  }),
  description: z.string({
    message: "Description is required",
  }),
});

export const ClubValidation = {
  createClub,
};
