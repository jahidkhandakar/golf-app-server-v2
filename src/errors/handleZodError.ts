import { ZodError, ZodIssue } from "zod";
import { IErrorMessage, IErrorResponse } from "./../interface/index";

const handleZodError = (error: ZodError): IErrorResponse => {
  // Map all issues to IErrorMessage
  const errorMessages: IErrorMessage[] = error.issues.map((issue: ZodIssue) => {
    // Convert path array to string path (nested support)
    const path =
      issue.path.length > 0 ? issue.path.map((p) => String(p)).join(".") : "";

    return {
      path,
      message: issue.message,
    };
  });

  return {
    success: false,
    statusCode: 400,
    message: "Validation Error",
    errorMessages,
  };
};

export default handleZodError;
