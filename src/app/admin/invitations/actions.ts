"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { isMarginaliaAdmin } from "@/lib/admin";
import { resolveRequestOrigin } from "@/lib/request-origin";
import { createMarginaliaAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

function invitationError(error: { message?: string } | null) {
  const message = error?.message?.toLowerCase() ?? "";
  if (message.includes("already") || message.includes("registered") || message.includes("exists")) {
    return "existing";
  }
  if (message.includes("rate") || message.includes("limit")) return "rate_limit";
  return "delivery";
}

export async function inviteReader(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email) || email.length > 320) {
    redirect("/admin/invitations?error=email");
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) redirect("/sign-in");
  if (!isMarginaliaAdmin(data.user)) redirect("/app");

  const admin = createMarginaliaAdminClient();
  if (!admin) redirect("/admin/invitations?error=unavailable");

  const { data: recordedInvitation, error: ledgerLookupError } = await admin
    .from("invitations")
    .select("id")
    .eq("email", email)
    .limit(1)
    .maybeSingle();
  if (ledgerLookupError) redirect("/admin/invitations?error=unavailable");
  if (recordedInvitation) redirect("/admin/invitations?error=existing");

  const requestHeaders = await headers();
  const origin = resolveRequestOrigin(requestHeaders);
  const callback = new URL("/auth/confirm", origin);
  callback.searchParams.set("next", "/app");

  const { error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: callback.toString(),
  });
  if (inviteError) {
    const reason = invitationError(inviteError);
    if (reason !== "existing") redirect(`/admin/invitations?error=${reason}`);

    const { data: users, error: usersError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const existingUser = users.users.find((user) => user.email?.toLowerCase() === email);
    if (usersError || !existingUser) redirect("/admin/invitations?error=existing");

    const acceptedAt = existingUser.last_sign_in_at ?? null;
    const { error: reconciliationError } = await admin.from("invitations").insert({
      email,
      invited_by: data.user.id,
      status: acceptedAt ? "accepted" : "pending",
      claimed_by: acceptedAt ? existingUser.id : null,
      accepted_at: acceptedAt,
    });
    if (reconciliationError) redirect("/admin/invitations?error=unavailable");

    redirect(`/admin/invitations?reconciled=${acceptedAt ? "accepted" : "pending"}`);
  }

  const { error: ledgerError } = await admin.from("invitations").insert({
    email,
    invited_by: data.user.id,
  });

  redirect(ledgerError ? "/admin/invitations?sent=unrecorded" : "/admin/invitations?sent=1");
}
