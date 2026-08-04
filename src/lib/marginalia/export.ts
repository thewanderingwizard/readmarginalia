import { strToU8, zipSync, type Zippable } from "fflate";
import { STATUS_LABELS, type LibraryBook, type MarginaliaLibrary } from "./types";

const EXPORT_VERSION = 1;

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function safeFilePart(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()
    .slice(0, 70) || "book";
}

function photographFilename(book: LibraryBook) {
  return book.photo ? `photographs/${safeFilePart(book.title)}-${book.id}.webp` : null;
}

export function buildExportRecord(library: MarginaliaLibrary, exportedAt = new Date()) {
  return {
    format: "Marginalia reader archive",
    version: EXPORT_VERSION,
    exportedAt: exportedAt.toISOString(),
    profile: {
      displayName: library.profile.name,
      readingMotto: library.profile.why,
    },
    books: library.books.map((book) => ({
      id: book.id,
      title: book.title,
      author: book.author,
      format: book.format,
      shelf: book.status,
      shelfLabel: STATUS_LABELS[book.status],
      addedAt: new Date(book.addedAt).toISOString(),
      photograph: photographFilename(book),
      essentialWhy: book.essentialWhy,
      essentialWhen: book.essentialWhen,
      reflections: [...book.reflections]
        .sort((a, b) => a.ts - b.ts)
        .map((reflection) => ({
          id: reflection.id,
          writtenAt: new Date(reflection.ts).toISOString(),
          text: reflection.text,
          markedForFutureSharing: reflection.shareable,
        })),
    })),
  };
}

export function buildExportHtml(library: MarginaliaLibrary, exportedAt = new Date()) {
  const books = library.books.map((book) => {
    const image = photographFilename(book);
    const reflections = [...book.reflections]
      .sort((a, b) => a.ts - b.ts)
      .map((reflection) => `
        <article class="reflection">
          <time>${escapeHtml(new Date(reflection.ts).toLocaleDateString("en-US", { dateStyle: "long" }))}</time>
          <p>${escapeHtml(reflection.text).replaceAll("\n", "<br>")}</p>
        </article>`)
      .join("");
    return `
      <article class="book">
        ${image ? `<img src="${escapeHtml(image)}" alt="Cover of ${escapeHtml(book.title)}">` : ""}
        <div class="book-copy">
          <p class="shelf">${escapeHtml(STATUS_LABELS[book.status])}</p>
          <h2>${escapeHtml(book.title)}</h2>
          <p class="author">${escapeHtml(book.author)} · ${escapeHtml(book.format)}</p>
          ${book.essentialWhy ? `<h3>Why it is essential</h3><p>${escapeHtml(book.essentialWhy).replaceAll("\n", "<br>")}</p>` : ""}
          ${book.essentialWhen ? `<p><strong>When it found me:</strong> ${escapeHtml(book.essentialWhen)}</p>` : ""}
          ${reflections ? `<section class="reflections"><h3>In the margins</h3>${reflections}</section>` : ""}
        </div>
      </article>`;
  }).join("");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>My Marginalia Library</title>
  <style>
    :root { color-scheme: light; font-family: Georgia, "Times New Roman", serif; color: #251d16; background: #f4ecd9; }
    * { box-sizing: border-box; }
    body { max-width: 850px; margin: 0 auto; padding: 6vw; line-height: 1.55; }
    header { padding-bottom: 2.5rem; border-bottom: 1px solid #ad9569; text-align: center; }
    h1, h2, h3, p { margin-top: 0; }
    h1 { margin-bottom: .3rem; font-size: clamp(3rem, 10vw, 5.5rem); font-style: italic; font-weight: 400; }
    .motto { max-width: 40rem; margin: 2rem auto 0; font-size: 1.45rem; font-style: italic; }
    .book { display: grid; grid-template-columns: 10rem 1fr; gap: 2rem; padding: 3rem 0; border-bottom: 1px solid #c8b58f; break-inside: avoid; }
    .book img { width: 100%; max-height: 15rem; object-fit: cover; box-shadow: 0 .6rem 1.4rem #806d4a40; }
    .book h2 { margin-bottom: .25rem; font-size: 2.2rem; line-height: 1.05; }
    .shelf, time { color: #765d32; font-size: .72rem; font-weight: bold; letter-spacing: .16em; text-transform: uppercase; }
    .author { font-style: italic; }
    .reflections { margin-top: 2rem; }
    .reflection { padding: 1rem 0; border-top: 1px solid #dacba9; }
    footer { padding-top: 2rem; color: #765d32; font-size: .8rem; text-align: center; }
    @media (max-width: 600px) { .book { grid-template-columns: 1fr; } .book img { width: 9rem; } }
    @media print { body { max-width: none; padding: 0; background: white; } .book { page-break-inside: avoid; } }
  </style>
</head>
<body>
  <header>
    <h1>Marginalia</h1>
    <p>For all the readers</p>
    ${library.profile.why ? `<blockquote class="motto">“${escapeHtml(library.profile.why)}”</blockquote>` : ""}
    ${library.profile.name ? `<p>— ${escapeHtml(library.profile.name)}</p>` : ""}
  </header>
  <main>${books || "<p>Your shelf was empty when this archive was made.</p>"}</main>
  <footer>Private reader archive · Exported ${escapeHtml(exportedAt.toLocaleString("en-US", { dateStyle: "long", timeStyle: "short" }))}</footer>
</body>
</html>`;
}

async function photographBytes(book: LibraryBook) {
  if (!book.photo) return null;
  const response = await fetch(book.photo);
  if (!response.ok) throw new Error(`The photograph for “${book.title}” could not be included.`);
  return new Uint8Array(await response.arrayBuffer());
}

export async function buildLibraryArchive(library: MarginaliaLibrary, exportedAt = new Date()) {
  const files: Zippable = {
    "marginalia-library.json": strToU8(JSON.stringify(buildExportRecord(library, exportedAt), null, 2)),
    "marginalia-library.html": strToU8(buildExportHtml(library, exportedAt)),
    "README.txt": strToU8(
      "Your Marginalia archive\n\nOpen marginalia-library.html in any browser. Use the browser’s Print command to save or print a PDF. marginalia-library.json is a complete machine-readable copy of your reader record. Photographs remain yours and are stored in the photographs folder.\n",
    ),
  };

  for (const book of library.books) {
    const filename = photographFilename(book);
    if (!filename) continue;
    const bytes = await photographBytes(book);
    if (bytes) files[filename] = bytes;
  }

  return zipSync(files, { level: 6 });
}

export async function downloadLibraryArchive(library: MarginaliaLibrary) {
  const exportedAt = new Date();
  const archive = await buildLibraryArchive(library, exportedAt);
  const url = URL.createObjectURL(new Blob([archive], { type: "application/zip" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `marginalia-export-${exportedAt.toISOString().slice(0, 10)}.zip`;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
