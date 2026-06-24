import { z } from "zod";

const changeUserStatus = z.object({
  status: z.enum([
    "pending",
    "active",
    "inactive",
    "suspended",
    "deleted",
  ] as const),
});

export const userValidation = {
  changeUserStatus,
};
