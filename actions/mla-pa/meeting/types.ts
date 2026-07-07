import {
  InvitationSubtype,
  MlaPaMeetingType,
  UserRole,
} from "@prisma/client";

export type MlaPaRouteAuthResult = {
  ok: false;
  error: string;
};

export type MlaPaMeetingUserLite = {
  id: string;
  name: string | null;
  mobile: string;
  role: UserRole;
};

export type MlaPaMeetingUsersResult =
  | {
      ok: true;
      mlaUsers: MlaPaMeetingUserLite[];
      campHeadUsers: MlaPaMeetingUserLite[];
    }
  | MlaPaRouteAuthResult
  | {
      ok: false;
      error: string;
    };

export type CreateMlaPaMeetingInput = {
  mlaUserId: string;
  campHeadUserId: string;
  type: MlaPaMeetingType;
  invitationSubtype?: InvitationSubtype;
  invitationOtherPurpose?: string;
  purpose: string;
  scheduledAt: string;
  meetingPlace: string;
  giftToCarry?: string;
  selfDraftedLetter?: string;
};

export type MlaPaMeetingRecord = {
  id: number;
  createdByUserId: string;
  mlaUserId: string;
  campHeadUserId: string;
  type: MlaPaMeetingType;
  invitationSubtype: InvitationSubtype | null;
  invitationOtherPurpose: string | null;
  purpose: string;
  scheduledAt: string;
  meetingPlace: string;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  giftToCarry: string | null;
  selfDraftedLetter: string | null;
  createdByUser: MlaPaMeetingUserLite;
  mlaUser: MlaPaMeetingUserLite;
  campHeadUser: MlaPaMeetingUserLite;
};

export type CreateMlaPaMeetingResult =
  | {
      ok: true;
      meeting: {
        id: number;
        type: MlaPaMeetingType;
        createdAt: string;
      };
    }
  | MlaPaRouteAuthResult
  | {
      ok: false;
      error: string;
    };

export type GetMlaPaMeetingsResult =
  | {
      ok: true;
      meetings: MlaPaMeetingRecord[];
    }
  | MlaPaRouteAuthResult
  | {
      ok: false;
      error: string;
    };

export type UpdateMlaPaMeetingInput = CreateMlaPaMeetingInput & {
  meetingId: number;
};

export type UpdateMlaPaMeetingResult =
  | {
      ok: true;
    }
  | MlaPaRouteAuthResult
  | {
      ok: false;
      error: string;
    };

export type DeleteMlaPaMeetingInput = {
  meetingId: number;
};

export type DeleteMlaPaMeetingResult =
  | {
      ok: true;
    }
  | MlaPaRouteAuthResult
  | {
      ok: false;
      error: string;
    };

export type CompleteMlaPaMeetingInput = {
  meetingId: number;
};

export type CompleteMlaPaMeetingResult =
  | {
      ok: true;
    }
  | MlaPaRouteAuthResult
  | {
      ok: false;
      error: string;
    };
