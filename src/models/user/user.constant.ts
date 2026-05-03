export const USER_UPLOADS_FOLDER = "uploads/users";

const TUserStatus = [
  "pending",
  "active",
  "inactive",
  "suspended",
  "deleted",
] as const;
export type UserStatus = (typeof TUserStatus)[number];
