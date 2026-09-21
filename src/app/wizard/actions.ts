"use server";

import type { SupabaseClient, User } from "@supabase/supabase-js";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { isMarginaliaOwner } from "@/lib/owner";
import { resolveRequestOrigin } from "@/lib/request-origin";
import { createMarginaliaAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type AuditOutcome = "succeeded" | "failed" | "rate_limited";

async function recordAudit(
  admin: SupabaseClient,
  actor: User,
  action: string,
  targetEmail: string,
  outcome: AuditOutcome,
  details: Record<string, string> = {},
) {
  const { error } = await admin.from("admin_audit_log").insert({
    actor_id: actor.id,
    actor_email: actor.email?.toLowerCase() ?? null,
    action,
    target_email: targetEmail,
    outcome,
    details,
  });
  return !error;
}

function validEmail(value: string) {
  return /^\S+@\S+\.\S+$/.test(value) && value.length <= 320;
}

export async function sendReaderAccessEmail(formData: FormData) {
  const supabase = await createClient();
  const { data, error: userError } = await supabase.auth.getUser();
  if (userError || !data.user) redirect("/sign-in");
  if (!isMarginaliaOwner(data.user)) redirect("/app");

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const confirmed = formData.get("confirmation") === "send";
  if (!validEmail(email)) redirect("/wizard?access=invalid_email");
  if (!confirmed) redirect("/wizard?access=confirmation");

  const admin = createMarginaliaAdminClient();
  if (!admin) redirect("/wizard?access=unavailable");

  const { error: auditAvailabilityError } = await admin
    .from("admin_audit_log")
    .select("id", { head: true })
    .limit(1);
  if (auditAvailabilityError) redirect("/wizard?access=audit_unavailable");

  const { data: users, error: usersError } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  const existingUser = users?.users.find((user) => user.email?.toLowerCase() === email);
  if (usersError || !existingUser) {
    await recordAudit(admin, data.user, "access_email", email, "failed", {
      reason: usersError ? "auth_directory_unavailable" : "account_not_found",
    });
    redirect(`/wizard?access=${usersError ? "unavailable" : "not_found"}`);
  }

  const requestHeaders = await headers();
  const origin = resolveRequestOrigin(requestHeaders);
  const callback = new URL("/auth/confirm", origin);
  callback.searchParams.set("next", "/app");

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false,
      emailRedirectTo: callback.toString(),
    },
  });

  if (error) {
    const rateLimited = /rate|limit/i.test(error.message);
    await recordAudit(
      admin,
      data.user,
      "access_email",
      email,
      rateLimited ? "rate_limited" : "failed",
      { reason: rateLimited ? "rate_limit" : "delivery" },
    );
    redirect(`/wizard?access=${rateLimited ? "rate_limit" : "delivery"}`);
  }

  const auditRecorded = await recordAudit(
    admin,
    data.user,
    "access_email",
    email,
    "succeeded",
  );
  revalidatePath("/wizard");
  redirect(`/wizard?access=${auditRecorded ? "sent" : "sent_unrecorded"}`);
}
