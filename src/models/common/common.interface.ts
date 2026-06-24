export type ICommonSettings = {
  title?: string;
  description: string;
  content: string;
  createdAt?: Date;
  updatedAt?: Date;
} & Document;

export type ISupport = {
  email: string;
  phoneNumber: string;
  address: string;
  createdAt?: Date;
  updatedAt?: Date;
} & Document;
