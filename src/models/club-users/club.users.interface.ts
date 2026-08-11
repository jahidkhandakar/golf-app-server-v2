import { Document, Types } from "mongoose";

/** Role a member holds *within a single club* (distinct from the global
 *  User.role). The club creator is identified by Club.createdBy, not stored
 *  here; club-scoped staff powers (score entry, side-game toggles, private
 *  member-slot management) come from "creator" or "subAdmin". */
export type ClubMemberRole = "member" | "subAdmin";

/** Resolved club-scoped role including the creator and non-member cases.
 *  Mirrors the frontend's roleIn(): creator > subAdmin > member > nonMember. */
export type ResolvedClubRole = "creator" | "subAdmin" | "member" | "nonMember";

export interface IClubUser extends Document {
  club: Types.ObjectId;
  user: Types.ObjectId;
  status: "pending" | "accepted" | "rejected";
  role: ClubMemberRole;

  /** Alias shown only inside private clubs. Public surfaces always use the
   *  account name. Null for public-club members. (Spec §12.) */
  displayName?: string;

  /** Club leaderboard opt-in (off by default). Ranked = opted in AND an
   *  established handicap. (spec §9) */
  leaderboardOptedIn: boolean;

  /** Stored ladder position, seeded from handicap order at opt-in and then
   *  moved only by challenges — never re-sorted by handicap. Null when not
   *  ranked. (spec §9) */
  leaderboardPosition?: number | null;

  createdAt?: Date;
  updatedAt?: Date;
}
