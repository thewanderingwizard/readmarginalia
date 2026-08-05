"use server";

import { createClient as createAdminClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function deleteAccount(formData: FormData) {
  if (String(formData.get("confirmation") ?? "") !== "DELETE") {
    redirect("/app?account_error=confirmation");
  }

  const supabase = await createClient();
  const { data, error: userError } = await supabase.auth.getUser();
  if (userError || !data.user) redirect("/sign-in");

  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!secretKey) redirect("/app?account_error=unavailable");

  const admin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: imageRecords, error: imageError } = await supabase
    .from("book_images")
    .select("storage_path")
    .eq("user_id", data.user.id);
  if (imageError) redirect("/app?account_error=failed");

  const paths = imageRecords?.map((record) => record.storage_path) ?? [];
  if (paths.length) {
    const { error } = await admin.storage.from("book-images").remove(paths);
    if (error) redirect("/app?account_error=failed");
  }

  const { error: deleteError } = await admin.auth.admin.deleteUser(data.user.id);
  if (deleteError) redirect("/app?account_error=failed");

  await supabase.auth.signOut();
  redirect("/sign-in?deleted=1");
}
