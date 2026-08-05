import { createClient } from "@/lib/supabase/client";
import type { LibraryBook, MarginaliaLibrary, ReaderProfile, Reflection } from "./types";

function raise(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

function bookRecord(userId: string, book: LibraryBook, position = 1000) {
  return {
    id: book.id,
    user_id: userId,
    title: book.title,
    author: book.author,
    format: book.format,
    status: book.status,
    shelf_position: position,
    added_at: new Date(book.addedAt).toISOString(),
    essential_why: book.essentialWhy,
    essential_when: book.essentialWhen,
  };
}

function reflectionRecord(userId: string, bookId: string, reflection: Reflection) {
  return {
    id: reflection.id,
    user_id: userId,
    book_id: bookId,
    body: reflection.text,
    shareable: reflection.shareable,
    written_at: new Date(reflection.ts).toISOString(),
  };
}

function dataUrlToBlob(dataUrl: string) {
  const [header, body] = dataUrl.split(",", 2);
  if (!header || !body) throw new Error("The prepared photograph is incomplete.");
  const mime = header.match(/^data:([^;]+);base64$/)?.[1] ?? "image/webp";
  const bytes = Uint8Array.from(atob(body), (character) => character.charCodeAt(0));
  return new Blob([bytes], { type: mime });
}

export async function saveReaderProfile(
  userId: string,
  profile: ReaderProfile,
  completeOnboarding = false,
) {
  const supabase = createClient();
  const values: Record<string, string> = {
    display_name: profile.name,
    reading_motto: profile.why,
  };
  if (completeOnboarding) values.onboarding_completed_at = new Date().toISOString();
  const { error } = await supabase.from("profiles").update(values).eq("id", userId);
  raise(error);
}

export async function saveBookCover(userId: string, book: LibraryBook) {
  if (!book.photo?.startsWith("data:image/")) return book.photoPath;
  const supabase = createClient();
  const path = `${userId}/${book.id}/cover.webp`;
  const { error: uploadError } = await supabase.storage
    .from("book-images")
    .upload(path, dataUrlToBlob(book.photo), { contentType: "image/webp", upsert: true });
  raise(uploadError);
  const { error: recordError } = await supabase.from("book_images").upsert(
    {
      book_id: book.id,
      user_id: userId,
      storage_path: path,
      kind: "cover",
      sort_position: 0,
    },
    { onConflict: "book_id,kind,sort_position" },
  );
  raise(recordError);
  return path;
}

export async function removeBookCover(book: LibraryBook) {
  if (!book.photoPath) return;
  const supabase = createClient();
  const { error: storageError } = await supabase.storage.from("book-images").remove([book.photoPath]);
  raise(storageError);
  const { error: recordError } = await supabase
    .from("book_images")
    .delete()
    .eq("book_id", book.id)
    .eq("kind", "cover");
  raise(recordError);
}

export async function createRemoteBook(userId: string, book: LibraryBook) {
  const supabase = createClient();
  const { error: bookError } = await supabase.from("books").insert(bookRecord(userId, book));
  raise(bookError);
  if (book.reflections.length) {
    const { error: reflectionError } = await supabase
      .from("reflections")
      .insert(book.reflections.map((reflection) => reflectionRecord(userId, book.id, reflection)));
    raise(reflectionError);
  }
  return saveBookCover(userId, book);
}

export async function updateRemoteBook(userId: string, book: LibraryBook) {
  const supabase = createClient();
  const { user_id: _userId, id: _id, ...values } = bookRecord(userId, book);
  void _userId;
  void _id;
  const { error } = await supabase.from("books").update(values).eq("id", book.id);
  raise(error);
}

export async function updateRemoteBookFields(
  bookId: string,
  values: Partial<{
    status: LibraryBook["status"];
    essential_why: string;
    essential_when: string;
  }>,
) {
  const supabase = createClient();
  const { error } = await supabase.from("books").update(values).eq("id", bookId);
  raise(error);
}

export async function deleteRemoteBook(book: LibraryBook) {
  const supabase = createClient();
  if (book.photoPath) {
    const { error: storageError } = await supabase.storage.from("book-images").remove([book.photoPath]);
    raise(storageError);
  }
  const { error } = await supabase.from("books").delete().eq("id", book.id);
  raise(error);
}

export async function createRemoteReflection(userId: string, bookId: string, reflection: Reflection) {
  const supabase = createClient();
  const { error } = await supabase
    .from("reflections")
    .insert(reflectionRecord(userId, bookId, reflection));
  raise(error);
}

export async function setRemoteReflectionSharing(reflectionId: string, shareable: boolean) {
  const supabase = createClient();
  const { error } = await supabase.from("reflections").update({ shareable }).eq("id", reflectionId);
  raise(error);
}

export async function importLocalLibrary(userId: string, library: MarginaliaLibrary) {
  const supabase = createClient();
  const { error: profileError } = await supabase.from("profiles").update({
    display_name: library.profile.name,
    reading_motto: library.profile.why,
    onboarding_completed_at: new Date().toISOString(),
  }).eq("id", userId);
  raise(profileError);

  if (library.books.length) {
    const { error: bookError } = await supabase.from("books").upsert(
      library.books.map((book, index) => bookRecord(userId, book, (index + 1) * 1000)),
    );
    raise(bookError);
    const reflections = library.books.flatMap((book) =>
      book.reflections.map((reflection) => reflectionRecord(userId, book.id, reflection)),
    );
    if (reflections.length) {
      const { error } = await supabase.from("reflections").upsert(reflections);
      raise(error);
    }
    for (const book of library.books) await saveBookCover(userId, book);
  }
}
