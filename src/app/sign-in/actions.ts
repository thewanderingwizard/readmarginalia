"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function requestMagicLink(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!/^\S+@\S+\.\S+$/.test(email)) {
    redirect("/sign-in?error=email");
  }

  const requestHeaders = await headers();
  const origin = requestHeaders.get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const callback = new URL("/auth/confirm", origin);
  callback.searchParams.set("next", "/app");

  const supabase = await createClient();
  await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false,
      emailRedirectTo: callback.toString(),
    },
  });

  // Always return the same message so this page never reveals which emails were invited.
  redirect("/sign-in?sent=1");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/sign-in");
}
