import { MongoServerError } from "mongodb";
import { IErrorMessage, IErrorResponse } from "./../interface/index";

const handleDuplicateError = (error: unknown): IErrorResponse => {
  if (!(error instanceof MongoServerError) || error.code !== 11000) {
    return {
      success: false,
      statusCode: 500,
      message: "Internal Server Error",
      errorMessages: [
        {
          path: "",
          message: "An unexpected error occurred",
        },
      ],
    };
  }

  const keyValue = error.keyValue as Record<string, string> | undefined;

  if (!keyValue || Object.keys(keyValue).length === 0) {
    return {
      success: false,
      statusCode: 409,
      message: "Duplicate Resource",
      errorMessages: [
        {
          path: "",
          message: "Duplicate value already exists",
        },
      ],
    };
  }

  const field = Object.keys(keyValue)[0];
  const value = keyValue[field];

  const formattedField = field
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (c) => c.toUpperCase())
    .trim();

  const errorMessages: IErrorMessage[] = [
    {
      path: field,
      message: `${formattedField} '${value}' already exists`,
    },
  ];

  return {
    success: false,
    statusCode: 409,
    message: "Duplicate Resource",
    errorMessages,
  };
};

export default handleDuplicateError;
