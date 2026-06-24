import { z } from "zod";

// const objectId = z.string({
//     required_error: "ObjectId is required",
//     invalid_type_error: "Invalid ObjectId format",
// }).regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId");

const objectId = z
  .string({
    message: "ObjectId is required",
  })
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId format");

const createTournament = z.object({
  body: z
    .object({
      tournamentCreator: objectId.optional(),

      typeName: z.enum(["big", "small"], {
        message: "typeName is required",
      }),

      tournamentName: z
        .string({
          message: "tournamentName is required",
        })
        .optional(),

      tournamentType: z
        .string({
          message: "tournamentType is required",
        })
        .optional(),

      date: z.string({
        message: "date is required",
      }),

      time: z.string({
        message: "time is required",
      }),

      city: z.string({
        message: "city is required",
      }),

      courseName: z.string({
        message: "courseName is required",
      }),

      courseRating: z
        .number()
        .min(60, "courseRating must be at least 60")
        .max(80, "courseRating must be at most 80"),

      slopeRating: z
        .number()
        .min(55, "slopeRating must be at least 55")
        .max(155, "slopeRating must be at most 155"),

      numberOfPlayers: z.number({
        message: "numberOfPlayers is required",
      }),

      tournamentPlayersList: z
        .array(objectId, {
          message: "tournamentPlayersList is required",
        })
        .optional(),

      status: z
        .enum(["active", "closed", "completed"], {
          message:
            "Status is required and status must be active, closed, or completed",
        })
        .optional(),

      isWinnerDeclared: z.boolean().optional(),

      gaggleLength: z.number().optional(),

      handicapFromRange: z.number().optional(),

      handicapToRange: z.number().optional(),

      playingConditionAdjustment: z.number().optional(),
    })
    .superRefine((data, ctx) => {
      // BIG tournament rules
      if (data.typeName === "big") {
        if (data.gaggleLength === undefined) {
          ctx.addIssue({
            code: "custom",
            path: ["gaggleLength"],
            message: "gaggleLength is required for big tournament",
          });
        }
      }

      // SMALL tournament rules
      if (data.typeName === "small") {
        if (!data.tournamentName) {
          ctx.addIssue({
            code: "custom",
            path: ["tournamentName"],
            message: "tournamentName is required for small tournament",
          });
        }

        if (!data.tournamentType) {
          ctx.addIssue({
            code: "custom",
            path: ["tournamentType"],
            message: "tournamentType is required for small tournament",
          });
        }

        if (data.handicapFromRange === undefined) {
          ctx.addIssue({
            code: "custom",
            path: ["handicapFromRange"],
            message: "handicapFromRange is required for small tournament",
          });
        }

        if (data.handicapToRange === undefined) {
          ctx.addIssue({
            code: "custom",
            path: ["handicapToRange"],
            message: "handicapToRange is required for small tournament",
          });
        }
      }
    }),
});

export const TournamentValidation = {
  createTournament,
};
