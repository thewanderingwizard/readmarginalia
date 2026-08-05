import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { MarginaliaApp } from "@/components/marginalia/marginalia-app";
import { isMarginaliaAdmin } from "@/lib/admin";
import { loadRemoteLibrary } from "@/lib/marginalia/load-library";
import { randomMarginaliaQuoteId } from "@/lib/marginalia/quotes";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Your Library",
  description: "Tend the books that shape you.",
  robots: { index: false, follow: false },
};

export default async function AppPage({
  searchParams,
}: {
  searchParams: Promise<{ account_error?: string }>;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) redirect("/sign-in");

  const library = await loadRemoteLibrary(supabase, data.user.id);
  const parameters = await searchParams;
  const accountError = {
    confirmation: "Type DELETE exactly before requesting account deletion.",
    unavailable: "Account deletion is not configured on this environment yet.",
    failed: "The account could not be deleted. Nothing else has been changed; please try again or contact support.",
  }[parameters.account_error ?? ""] ?? "";
  return (
    <MarginaliaApp
      userId={data.user.id}
      initialLibrary={library}
      initialQuoteId={randomMarginaliaQuoteId()}
      initialAccountError={accountError}
      isAdmin={isMarginaliaAdmin(data.user)}
    />
  );
}
