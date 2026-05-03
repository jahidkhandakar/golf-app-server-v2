import { z } from "zod";

const createEvent = z.object({
  title: z.string({ message: "Title is required" }),
  description: z.string({ message: "Description is required" }),
  categoryId: z.string({ message: "Category ID is required" }),
  date: z.string({ message: "Date is required" }),
  location: z.string({ message: "Location is required" }),
  isPremium: z.boolean().optional(),
  price: z.preprocess((val) => (typeof val === "string" ? parseFloat(val) : val), z.number().optional()),
  totalTickets: z.preprocess((val) => (typeof val === "string" ? parseInt(val, 10) : val), z.number({ message: "Total tickets is required" }).min(1)),
}).refine((data) => !data.isPremium || (data.price && data.price > 0), {
  message: "Price is required and must be greater than 0 for premium events",
  path: ["price"],
});

const updateEvent = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  categoryId: z.string().optional(),
  date: z.string().optional(),
  location: z.string().optional(),
  isPremium: z.boolean().optional(),
  price: z.preprocess((val) => (typeof val === "string" ? parseFloat(val) : val), z.number().optional()),
  totalTickets: z.preprocess((val) => (typeof val === "string" ? parseInt(val, 10) : val), z.number().min(1).optional()),
});

export const eventValidation = {
  createEvent,
  updateEvent,
};
