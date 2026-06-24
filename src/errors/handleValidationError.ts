import mongoose from "mongoose";
import { IErrorMessage, IErrorResponse } from "./../interface/index";

const handleValidationError = (
  error: mongoose.Error.ValidationError,
): IErrorResponse => {
  const errorMessages: IErrorMessage[] = Object.values(error.errors).map(
    (err: mongoose.Error.ValidatorError | mongoose.Error.CastError) => {
      // CastError has a slightly different structure
      if (err.name === "CastError") {
        return {
          path: err.path,
          message: `Invalid value for ${err.path}`,
        };
      }

      return {
        path: err.path,
        message: err.message,
      };
    },
  );

  return {
    success: false,
    statusCode: 400,
    message: "Validation Error",
    errorMessages,
  };
};

export default handleValidationError;
