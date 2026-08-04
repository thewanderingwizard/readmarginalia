import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { EMPTY_LIBRARY, type BookFormat, type BookStatus, type MarginaliaLibrary } from "./types";

function ensure(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

export async function loadRemoteLibrary(
  supabase: SupabaseClient,
  userId: string,
): Promise<MarginaliaLibrary> {
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("display_name,reading_motto,onboarding_completed_at")
    .eq("id", userId)
    .maybeSingle();
  ensure(profileError);

  const { data: books, error: booksError } = await supabase
    .from("books")
    .select("id,title,author,format,status,added_at,essential_why,essential_when,shelf_position")
    .eq("user_id", userId)
    .order("shelf_position", { ascending: true })
    .order("added_at", { ascending: false });
  ensure(booksError);

  if (!books?.length) {
    return {
      ...EMPTY_LIBRARY,
      profile: {
        name: profile?.display_name ?? "",
        why: profile?.reading_motto ?? "",
      },
      onboarded: Boolean(profile?.onboarding_completed_at),
    };
  }

  const bookIds = books.map((book) => book.id);
  const [{ data: reflections, error: reflectionsError }, { data: images, error: imagesError }] =
    await Promise.all([
      supabase
        .from("reflections")
        .select("id,book_id,body,shareable,written_at")
        .in("book_id", bookIds)
        .order("written_at", { ascending: true }),
      supabase
        .from("book_images")
        .select("book_id,storage_path,kind,sort_position")
        .in("book_id", bookIds)
        .eq("kind", "cover")
        .order("sort_position", { ascending: true }),
    ]);
  ensure(reflectionsError);
  ensure(imagesError);

  const paths = images?.map((image) => image.storage_path) ?? [];
  const signedByPath = new Map<string, string>();
  if (paths.length) {
    const { data: signed, error } = await supabase.storage
      .from("book-images")
      .createSignedUrls(paths, 60 * 60);
    ensure(error);
    signed?.forEach((item) => {
      if (item.path && item.signedUrl) signedByPath.set(item.path, item.signedUrl);
    });
  }

  return {
    profile: {
      name: profile?.display_name ?? "",
      why: profile?.reading_motto ?? "",
    },
    onboarded: Boolean(profile?.onboarding_completed_at),
    books: books.map((book) => {
      const cover = images?.find((image) => image.book_id === book.id) ?? null;
      return {
        id: book.id,
        title: book.title,
        author: book.author,
        format: book.format as BookFormat,
        status: book.status as BookStatus,
        addedAt: new Date(book.added_at).getTime(),
        essentialWhy: book.essential_why,
        essentialWhen: book.essential_when,
        photoPath: cover?.storage_path ?? null,
        photo: cover ? signedByPath.get(cover.storage_path) ?? null : null,
        reflections: (reflections ?? [])
          .filter((reflection) => reflection.book_id === book.id)
          .map((reflection) => ({
            id: reflection.id,
            text: reflection.body,
            shareable: reflection.shareable,
            ts: new Date(reflection.written_at).getTime(),
          })),
      };
    }),
  };
}
