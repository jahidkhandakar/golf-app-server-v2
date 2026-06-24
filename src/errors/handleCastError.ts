import mongoose from "mongoose";
import { IErrorResponse } from "./../interface/index";

const handleCastError = (err: mongoose.Error.CastError): IErrorResponse => {
  return {
    success: false,
    statusCode: 400,
    message: "Invalid ID",
    errorMessages: [
      {
        path: err.path,
        message: `${err.value} is not a valid ID`,
      },
    ],
  };
};

export default handleCastError;
