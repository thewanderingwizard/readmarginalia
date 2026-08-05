import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createMarginaliaAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

function safeNextPath(value: string | null) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/app";
}

export async function GET(request: NextRequest) {
  const parameters = request.nextUrl.searchParams;
  const code = parameters.get("code");
  const tokenHash = parameters.get("token_hash");
  const type = parameters.get("type") as EmailOtpType | null;
  const destination = safeNextPath(parameters.get("next"));
  const supabase = await createClient();

  const result = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : tokenHash && type
      ? await supabase.auth.verifyOtp({ type, token_hash: tokenHash })
      : { data: { user: null }, error: new Error("The confirmation link is incomplete.") };

  if (!result.error) {
    const user = result.data.user;
    const admin = createMarginaliaAdminClient();
    if (admin && user?.email) {
      await admin
        .from("invitations")
        .update({
          status: "accepted",
          claimed_by: user.id,
          accepted_at: new Date().toISOString(),
        })
        .eq("email", user.email.toLowerCase())
        .eq("status", "pending");
    }
    return NextResponse.redirect(new URL(destination, request.url));
  }

  return NextResponse.redirect(new URL("/sign-in?error=link", request.url));
}
