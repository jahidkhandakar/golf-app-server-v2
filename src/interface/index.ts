export interface IErrorMessage {
  path: string;
  message: string;
}

export interface IErrorResponse {
  success: false;
  statusCode: number;
  message: string;
  errorMessages: IErrorMessage[];
}
