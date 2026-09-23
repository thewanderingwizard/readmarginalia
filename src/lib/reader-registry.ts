import type { User } from "@supabase/supabase-js";

export type RegistryInvitation = {
  id: string;
  email: string;
  status: "pending" | "accepted" | "revoked";
  created_at: string;
  accepted_at: string | null;
};

export type ReaderRegistryStatus = "pending" | "activated" | "revoked" | "account";

export type ReaderRegistryRow = {
  email: string;
  status: ReaderRegistryStatus;
  invitedAt: string | null;
  activatedAt: string | null;
  createdAt: string | null;
  lastSignInAt: string | null;
};

type RegistryUser = Pick<
  User,
  "id" | "email" | "created_at" | "email_confirmed_at" | "last_sign_in_at"
>;

function invitationStatus(status: RegistryInvitation["status"]): ReaderRegistryStatus {
  return status === "accepted" ? "activated" : status;
}

export function buildReaderRegistry(
  users: RegistryUser[],
  invitations: RegistryInvitation[],
  ownerIds: Set<string>,
  ownerEmails: Set<string>,
) {
  const records = new Map<string, ReaderRegistryRow>();

  for (const invitation of invitations) {
    if (ownerEmails.has(invitation.email.toLowerCase())) continue;
    records.set(invitation.email.toLowerCase(), {
      email: invitation.email,
      status: invitationStatus(invitation.status),
      invitedAt: invitation.created_at,
      activatedAt: invitation.accepted_at,
      createdAt: null,
      lastSignInAt: null,
    });
  }

  for (const user of users) {
    if (!user.email || ownerIds.has(user.id.toLowerCase())) continue;
    const email = user.email.toLowerCase();
    const existing = records.get(email);
    const status = existing?.status === "revoked"
      ? "revoked"
      : user.last_sign_in_at || existing?.status === "activated"
        ? "activated"
        : existing?.status ?? "account";

    records.set(email, {
      email,
      status,
      invitedAt: existing?.invitedAt ?? null,
      activatedAt:
        existing?.activatedAt ??
        (status === "activated" ? user.last_sign_in_at ?? user.email_confirmed_at ?? null : null),
      createdAt: user.created_at,
      lastSignInAt: user.last_sign_in_at ?? null,
    });
  }

  return [...records.values()].sort((left, right) => {
    const leftDate = left.invitedAt ?? left.createdAt ?? "";
    const rightDate = right.invitedAt ?? right.createdAt ?? "";
    return rightDate.localeCompare(leftDate);
  });
}
