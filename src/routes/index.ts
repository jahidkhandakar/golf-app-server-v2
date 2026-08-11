import express from "express";
import { UserRoutes } from "../models/user/user.route";
import { AuthRoutes } from "../models/auth/auth.route";
import { SponsoredTournamentRoutes } from "../models/sponsored-tournament/sponsored.tournament.route";
import { SubscribeRoutes } from "../models/subscribe/subscribe.route";
import { SubscriptionRoutes } from "../models/subscription/subscription.route";
import { TeeSheetRoutes } from "../models/tee-sheet/tee.sheet.route";
import { TournamentRoutes } from "../models/tournament/tournament.route";
import { TournamentResultRoutes } from "../models/tournament-result/tournament.result.route";
import { RequestToPlayRoutes } from "../models/request-to-play/request.to.play.route";
import { InvitationRoutes } from "../models/invitation/invitation.route";
import { NotificationRoutes } from "../models/notification/notification.route";
import { ChatRoutes } from "../models/chat/chat.route";
import { MessageRoutes } from "../models/message/message.route";
import { ClubRoutes } from "../models/club/club.router";
import { ClubUsersRoutes } from "../models/club-users/club.users.route";
import { KpLiveRoutes } from "../models/kp-live/kp.live.route";
import { RosterRoutes } from "../models/tournament/roster.route";
import { CountryCapRoutes } from "../models/country-cap/country.cap.route";
import { TemplateRoutes } from "../models/template/template.route";
import { ChallengeMatchRoutes } from "../models/challenge-match/challenge.match.route";

const router = express.Router();

const apiRoutes: any[] = [
  {
    path: "/auth",
    route: AuthRoutes,
  },
  {
    path: "/user",
    route: UserRoutes,
  },
  {
    path: "/sponsored-tournament",
    route: SponsoredTournamentRoutes,
  },
  {
    path: "/subscribe",
    route: SubscribeRoutes,
  },
  {
    path: "/subscription",
    route: SubscriptionRoutes,
  },
  {
    path: "/notification",
    route: NotificationRoutes,
  },
  {
    path: "/invitation",
    route: InvitationRoutes,
  },
  {
    path: "/request-to-play",
    route: RequestToPlayRoutes,
  },
  {
    path: "/tee-sheet",
    route: TeeSheetRoutes,
  },
  {
    path: "/tournament",
    route: TournamentRoutes,
  },
  {
    path: "/leader-board",
    route: TournamentResultRoutes,
  },
  {
    path: "/chat-room",
    route: ChatRoutes,
  },
  {
    path: "/message",
    route: MessageRoutes,
  },
  {
    path: "/club",
    route: ClubRoutes,
  },
  {
    path: "/club-users",
    route: ClubUsersRoutes,
  },
  {
    path: "/tournaments",
    route: KpLiveRoutes,
  },
  {
    path: "/tournaments",
    route: RosterRoutes,
  },
  {
    path: "/country-cap",
    route: CountryCapRoutes,
  },
  {
    path: "/templates",
    route: TemplateRoutes,
  },
  {
    path: "/challenge-match",
    route: ChallengeMatchRoutes,
  },
];

apiRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

export default router;
