import { z } from "zod";

const createCategory = z.object({
  name: z.string({
    message: "Name is required",
  }),
});

export const categoryValidation = {
  createCategory,
};
