"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { deleteAccount } from "@/app/account/actions";
import { signOut } from "@/app/sign-in/actions";
import { Crest } from "@/components/brand/crest";
import { MetatronsCube } from "@/components/brand/metatrons-cube";
import { downloadLibraryArchive } from "@/lib/marginalia/export";
import { prepareBookPhoto } from "@/lib/marginalia/photo";
import { findMarginaliaQuote, nextMarginaliaQuoteId } from "@/lib/marginalia/quotes";
import {
  createRemoteBook,
  createRemoteReflection,
  deleteRemoteBook,
  importLocalLibrary,
  removeBookCover,
  saveBookCover,
  saveReaderProfile,
  setRemoteReflectionSharing,
  updateRemoteBook,
  updateRemoteBookFields,
} from "@/lib/marginalia/remote";
import { completeLocalMigration, prepareLocalMigration } from "@/lib/marginalia/storage";
import {
  BOOK_FORMATS,
  BOOK_STATUSES,
  EMPTY_SHELF_MESSAGES,
  STATUS_LABELS,
  createId,
  type BookFormat,
  type BookStatus,
  type LibraryBook,
  type MarginaliaLibrary,
  type ShelfFilter,
} from "@/lib/marginalia/types";
import styles from "./marginalia-app.module.css";

type Screen = "welcome" | "why" | "firstBook" | "library" | "addBook" | "editBook" | "detail" | "account";

type BookDraft = {
  title: string;
  author: string;
  format: BookFormat;
  status: BookStatus;
  photo: string | null;
  reflection: string;
};

const EMPTY_DRAFT: BookDraft = {
  title: "",
  author: "",
  format: "Softcover",
  status: "horizon",
  photo: null,
  reflection: "",
};

const FILTER_ORDER: ShelfFilter[] = ["essential", "reading", "horizon", "finished"];

function countLabel(count: number) {
  if (count === 0) return "A shelf waiting";
  if (count === 1) return "One book tended";
  return `${count} books tended`;
}

function formatDate(timestamp: number) {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(timestamp));
}

function AppAtmosphere({ ceremonial = false }: { ceremonial?: boolean }) {
  return (
    <div className={styles.atmosphere} aria-hidden="true">
      <div className={`${styles.shelves} ${styles.shelvesLeft}`} />
      <div className={`${styles.shelves} ${styles.shelvesRight}`} />
      <MetatronsCube
        className={`${styles.geometry} ${ceremonial ? styles.geometryCeremonial : ""}`}
      />
    </div>
  );
}

function ChoiceGroup<T extends string>({
  label,
  values,
  current,
  labels,
  onChange,
}: {
  label: string;
  values: readonly T[];
  current: T;
  labels?: Partial<Record<T, string>>;
  onChange: (value: T) => void;
}) {
  return (
    <fieldset className={styles.choiceFieldset}>
      <legend className={styles.fieldLabel}>{label}</legend>
      <div className={styles.choices}>
        {values.map((value) => (
          <button
            key={value}
            className={`${styles.choice} ${current === value ? styles.choiceActive : ""}`}
            type="button"
            aria-pressed={current === value}
            onClick={() => onChange(value)}
          >
            {labels?.[value] ?? value}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function PhotoField({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (photo: string | null) => void;
}) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function selectPhoto(file?: File) {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      onChange(await prepareBookPhoto(file));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The photograph could not be prepared.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={styles.photoField}>
      {value ? (
        <div className={styles.photoPreview}>
          <Image src={value} alt="Selected copy of the book" width={480} height={640} unoptimized />
        </div>
      ) : null}
      <div className={styles.photoActions}>
        <label className={styles.fileButton}>
          {busy ? "Preparing photograph…" : value ? "Choose another" : "Choose a photograph"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={busy}
            onChange={(event) => void selectPhoto(event.target.files?.[0])}
          />
        </label>
        {value ? (
          <button className={styles.textButton} type="button" onClick={() => onChange(null)}>
            Remove
          </button>
        ) : null}
      </div>
      <p className={styles.fieldHint}>One private photograph. Location metadata is removed.</p>
      {error ? <p className={styles.error}>{error}</p> : null}
    </div>
  );
}

function BookForm({
  mode,
  draft,
  setDraft,
  onSubmit,
  onBack,
  saveError,
}: {
  mode: "first" | "add" | "edit";
  draft: BookDraft;
  setDraft: (draft: BookDraft) => void;
  onSubmit: () => void;
  onBack?: () => void;
  saveError?: string;
}) {
  const [error, setError] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!draft.title.trim()) {
      setError("Give the book a title before placing it on the shelf.");
      return;
    }
    setError("");
    onSubmit();
  }

  return (
    <main className={styles.formPage}>
      <AppAtmosphere />
      <section className={styles.formPanel} aria-labelledby={`${mode}-book-title`}>
        {onBack ? (
          <button className={styles.backButton} type="button" onClick={onBack}>
            {mode === "edit" ? "← Return to the book" : "← Return to the shelf"}
          </button>
        ) : null}
        <p className={styles.eyebrow}>
          {mode === "first" ? "Walk to your shelf" : mode === "edit" ? "Tend this volume" : "Another volume"}
        </p>
        <h1 id={`${mode}-book-title`} className={styles.formTitle}>
          {mode === "first"
            ? "Choose one book you can touch."
            : mode === "edit"
              ? "Revise this book’s record."
              : "Place another book in your keeping."}
        </h1>
        <p className={styles.formIntroduction}>
          {mode === "first"
            ? "Not your favorite. Not the most important. Just one that calls to you. Place it here by hand."
            : mode === "edit"
              ? "Change what no longer reflects the copy in your keeping."
              : "A shelf should grow at a reader’s pace. Add only what you wish to tend."}
        </p>

        <form onSubmit={submit} className={styles.bookForm}>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Title</span>
            <input
              className={styles.lineInput}
              value={draft.title}
              autoComplete="off"
              onChange={(event) => setDraft({ ...draft, title: event.target.value })}
            />
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Author</span>
            <input
              className={styles.lineInput}
              value={draft.author}
              autoComplete="off"
              onChange={(event) => setDraft({ ...draft, author: event.target.value })}
            />
          </label>
          <ChoiceGroup
            label="The copy in your hands"
            values={BOOK_FORMATS}
            current={draft.format}
            onChange={(format) => setDraft({ ...draft, format })}
          />
          {mode !== "first" ? (
            <ChoiceGroup
              label="Where it rests"
              values={BOOK_STATUSES}
              current={draft.status}
              labels={STATUS_LABELS}
              onChange={(status) => setDraft({ ...draft, status })}
            />
          ) : null}
          <div className={styles.field}>
            <p className={styles.fieldLabel}>A photograph of your copy, if you like</p>
            <PhotoField value={draft.photo} onChange={(photo) => setDraft({ ...draft, photo })} />
          </div>
          {mode !== "edit" ? (
            <label className={styles.field}>
              <span className={styles.fieldLabel}>An opening reflection</span>
              <textarea
                className={styles.lineTextarea}
                rows={3}
                value={draft.reflection}
                placeholder="Why this book, today?"
                onChange={(event) => setDraft({ ...draft, reflection: event.target.value })}
              />
            </label>
          ) : null}
          {error || saveError ? <p className={styles.error}>{error || saveError}</p> : null}
          <button className={styles.primaryButton} type="submit">
            {mode === "edit" ? "Save changes" : "Place this book"}
          </button>
        </form>
      </section>
    </main>
  );
}

function BookCover({ book, large = false }: { book: LibraryBook; large?: boolean }) {
  const className = `${styles.bookCover} ${large ? styles.bookCoverLarge : ""}`;
  if (book.photo) {
    return (
      <div className={`${className} ${styles.photographedCover}`}>
        <Image src={book.photo} alt={`The reader’s copy of ${book.title}`} width={600} height={800} unoptimized />
      </div>
    );
  }

  return (
    <div className={`${className} ${styles.placeholderCover}`} aria-hidden="true">
      <span className={styles.coverTitle}>{book.title}</span>
      <span className={styles.coverRule} />
      <span className={styles.coverAuthor}>{book.author}</span>
    </div>
  );
}

export function MarginaliaApp({
  userId,
  initialLibrary,
  initialQuoteId,
  initialAccountError = "",
  isAdmin = false,
}: {
  userId: string;
  initialLibrary: MarginaliaLibrary;
  initialQuoteId: string;
  initialAccountError?: string;
  isAdmin?: boolean;
}) {
  const [hydrated, setHydrated] = useState(false);
  const [screen, setScreen] = useState<Screen>(initialLibrary.onboarded ? "library" : "welcome");
  const [library, setLibrary] = useState<MarginaliaLibrary>(initialLibrary);
  const [why, setWhy] = useState(initialLibrary.profile.why);
  const [name, setName] = useState(initialLibrary.profile.name);
  const [draft, setDraft] = useState<BookDraft>(EMPTY_DRAFT);
  const [filter, setFilter] = useState<ShelfFilter>("reading");
  const [quoteId, setQuoteId] = useState(initialQuoteId);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [justPlaced, setJustPlaced] = useState(false);
  const [newReflection, setNewReflection] = useState("");
  const [shareReflection, setShareReflection] = useState(false);
  const [openingBook, setOpeningBook] = useState(false);
  const [detailMenuOpen, setDetailMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saveError, setSaveError] = useState(initialAccountError);
  const [exportBusy, setExportBusy] = useState(false);
  const [exportMessage, setExportMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function begin() {
      if (initialLibrary.books.length) {
        completeLocalMigration(userId);
        setHydrated(true);
        return;
      }
      const local = prepareLocalMigration(userId);
      if (!local) {
        setHydrated(true);
        return;
      }
      try {
        await importLocalLibrary(userId, local);
        if (cancelled) return;
        completeLocalMigration(userId);
        setLibrary(local);
        setWhy(local.profile.why);
        setName(local.profile.name);
        setScreen("library");
      } catch (reason) {
        if (cancelled) return;
        setSaveError(reason instanceof Error ? reason.message : "Your existing shelf could not yet be carried into this account.");
      } finally {
        if (!cancelled) setHydrated(true);
      }
    }
    const frame = window.requestAnimationFrame(() => {
      void begin();
    });
    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frame);
    };
  }, [initialLibrary.books.length, userId]);

  function reportSaveError(reason: unknown) {
    setSaveError(
      reason instanceof Error
        ? reason.message
        : "Marginalia could not save that change. Your shelf has not been altered.",
    );
  }

  function clearSaveError() {
    if (saveError) setSaveError("");
  }

  function rotateQuote() {
    setQuoteId((current) => nextMarginaliaQuoteId(current));
  }

  function returnToLibrary() {
    rotateQuote();
    setScreen("library");
    window.scrollTo(0, 0);
  }

  useEffect(() => {
    if (!detailMenuOpen && !confirmDelete) return;

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setDetailMenuOpen(false);
      setConfirmDelete(false);
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [confirmDelete, detailMenuOpen]);

  const selectedBook = useMemo(
    () => library.books.find((book) => book.id === selectedId) ?? null,
    [library.books, selectedId],
  );

  async function finishWhy(event: FormEvent) {
    event.preventDefault();
    const profile = { name: name.trim(), why: why.trim() };
    clearSaveError();
    try {
      await saveReaderProfile(userId, profile);
      setLibrary((current) => ({ ...current, profile }));
      setDraft({ ...EMPTY_DRAFT, status: "reading" });
      setScreen("firstBook");
      window.scrollTo(0, 0);
    } catch (reason) {
      reportSaveError(reason);
    }
  }

  function beginCeremony() {
    if (openingBook) return;
    setOpeningBook(true);
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.setTimeout(() => {
      setScreen("why");
      setOpeningBook(false);
    }, reducedMotion ? 80 : 2200);
  }

  function bookFromDraft(bookDraft: BookDraft): LibraryBook {
    const reflection = bookDraft.reflection.trim();
    return {
      id: createId("book"),
      title: bookDraft.title.trim(),
      author: bookDraft.author.trim() || "Unknown hand",
      format: bookDraft.format,
      photo: bookDraft.photo,
      photoPath: null,
      status: bookDraft.status,
      addedAt: Date.now(),
      reflections: reflection
        ? [{ id: createId("note"), text: reflection, ts: Date.now(), shareable: false }]
        : [],
      essentialWhy: "",
      essentialWhen: "",
    };
  }

  async function placeFirstBook() {
    const book = bookFromDraft({ ...draft, status: "reading" });
    clearSaveError();
    try {
      book.photoPath = await createRemoteBook(userId, book) ?? null;
      await saveReaderProfile(userId, library.profile, true);
      setLibrary((current) => ({ ...current, books: [book], onboarded: true }));
      setFilter("reading");
      rotateQuote();
      setJustPlaced(true);
      setScreen("library");
      window.scrollTo(0, 0);
    } catch (reason) {
      reportSaveError(reason);
    }
  }

  async function placeAdditionalBook() {
    const book = bookFromDraft(draft);
    clearSaveError();
    try {
      book.photoPath = await createRemoteBook(userId, book) ?? null;
      setLibrary((current) => ({ ...current, books: [book, ...current.books] }));
      setFilter(book.status);
      rotateQuote();
      setJustPlaced(true);
      setDraft(EMPTY_DRAFT);
      setScreen("library");
      window.scrollTo(0, 0);
    } catch (reason) {
      reportSaveError(reason);
    }
  }

  function openBook(id: string) {
    setSelectedId(id);
    setNewReflection("");
    setShareReflection(false);
    setDetailMenuOpen(false);
    setConfirmDelete(false);
    setScreen("detail");
    window.scrollTo(0, 0);
  }

  function updateBook(id: string, updater: (book: LibraryBook) => LibraryBook) {
    setLibrary((current) => ({
      ...current,
      books: current.books.map((book) => (book.id === id ? updater(book) : book)),
    }));
  }

  function beginEditBook() {
    if (!selectedBook) return;
    setDraft({
      title: selectedBook.title,
      author: selectedBook.author === "Unknown hand" ? "" : selectedBook.author,
      format: selectedBook.format,
      status: selectedBook.status,
      photo: selectedBook.photo,
      reflection: "",
    });
    setDetailMenuOpen(false);
    setScreen("editBook");
    window.scrollTo(0, 0);
  }

  async function saveEditedBook() {
    if (!selectedBook) return;
    const revised: LibraryBook = {
      ...selectedBook,
      title: draft.title.trim(),
      author: draft.author.trim() || "Unknown hand",
      format: draft.format,
      status: draft.status,
      photo: draft.photo,
    };
    clearSaveError();
    try {
      await updateRemoteBook(userId, revised);
      if (!draft.photo && selectedBook.photoPath) {
        await removeBookCover(selectedBook);
        revised.photoPath = null;
      } else if (draft.photo !== selectedBook.photo && draft.photo?.startsWith("data:image/")) {
        revised.photoPath = await saveBookCover(userId, revised) ?? null;
      }
      updateBook(selectedBook.id, () => revised);
      setDraft(EMPTY_DRAFT);
      setScreen("detail");
      window.scrollTo(0, 0);
    } catch (reason) {
      reportSaveError(reason);
    }
  }

  async function deleteSelectedBook() {
    if (!selectedBook) return;
    clearSaveError();
    try {
      await deleteRemoteBook(selectedBook);
      setLibrary((current) => ({
        ...current,
        books: current.books.filter((book) => book.id !== selectedBook.id),
      }));
      setDetailMenuOpen(false);
      setConfirmDelete(false);
      setSelectedId(null);
      rotateQuote();
      setScreen("library");
      window.scrollTo(0, 0);
    } catch (reason) {
      reportSaveError(reason);
    }
  }

  async function inscribeReflection(event: FormEvent) {
    event.preventDefault();
    const text = newReflection.trim();
    if (!text || !selectedBook) return;
    const reflection = { id: createId("note"), text, ts: Date.now(), shareable: shareReflection };
    clearSaveError();
    try {
      await createRemoteReflection(userId, selectedBook.id, reflection);
      updateBook(selectedBook.id, (book) => ({
        ...book,
        reflections: [...book.reflections, reflection],
      }));
      setNewReflection("");
      setShareReflection(false);
    } catch (reason) {
      reportSaveError(reason);
    }
  }

  async function changeBookStatus(book: LibraryBook, status: BookStatus) {
    clearSaveError();
    try {
      await updateRemoteBookFields(book.id, { status });
      updateBook(book.id, (current) => ({ ...current, status }));
    } catch (reason) {
      reportSaveError(reason);
    }
  }

  async function persistEssentialFields(book: LibraryBook) {
    clearSaveError();
    try {
      await updateRemoteBookFields(book.id, {
        essential_why: book.essentialWhy,
        essential_when: book.essentialWhen,
      });
    } catch (reason) {
      reportSaveError(reason);
    }
  }

  async function toggleReflectionSharing(bookId: string, reflectionId: string, shareable: boolean) {
    clearSaveError();
    try {
      await setRemoteReflectionSharing(reflectionId, shareable);
      updateBook(bookId, (book) => ({
        ...book,
        reflections: book.reflections.map((note) =>
          note.id === reflectionId ? { ...note, shareable } : note,
        ),
      }));
    } catch (reason) {
      reportSaveError(reason);
    }
  }

  async function exportLibrary() {
    clearSaveError();
    setExportBusy(true);
    setExportMessage("");
    try {
      await downloadLibraryArchive(library);
      setExportMessage("Your private archive has been prepared and downloaded.");
    } catch (reason) {
      reportSaveError(reason);
    } finally {
      setExportBusy(false);
    }
  }

  if (!hydrated) {
    return (
      <main className={`${styles.screen} ${styles.centeredScreen}`}>
        <AppAtmosphere />
        <p className={styles.loading}>Opening the library…</p>
      </main>
    );
  }

  if (screen === "welcome") {
    return (
      <main className={`${styles.screen} ${styles.centeredScreen}`}>
        <AppAtmosphere ceremonial />
        <section className={styles.welcome} aria-labelledby="welcome-wordmark">
          <Crest className={styles.welcomeCrest} priority />
          <h1 id="welcome-wordmark" className={styles.wordmark}>
            Marginalia
          </h1>
          <div className={styles.rule} aria-hidden="true" />
          <p className={styles.welcomeText}>A quiet place to tend the books that shape you.</p>
          <p className={styles.welcomeText}>Built by a reader for fellow readers.</p>
          <button
            className={`${styles.bookStage} ${openingBook ? styles.bookOpening : ""}`}
            type="button"
            onClick={beginCeremony}
            disabled={openingBook}
            aria-label="Open the book and begin"
          >
            <span className={styles.bookObject} aria-hidden="true">
              <span className={styles.bookShadow} />
              <span className={styles.bookBackCover} />
              <span className={styles.bookPageBlock}>
                <span className={`${styles.turningPage} ${styles.turningPageOne}`} />
                <span className={`${styles.turningPage} ${styles.turningPageTwo}`} />
              </span>
              <span className={styles.bookSpine} />
              <span className={styles.bookFrontCover}>
                <span className={styles.bookCoverFace}>
                  <span className={styles.coverFiligree}>✦</span>
                  <span className={styles.beginLabel}>Begin</span>
                  <span className={styles.coverFlourish}>For all the readers</span>
                </span>
                <span className={styles.bookEndpaper} />
              </span>
            </span>
          </button>
          {saveError ? <p className={styles.error}>{saveError}</p> : null}
        </section>
      </main>
    );
  }

  if (screen === "why") {
    return (
      <main className={`${styles.screen} ${styles.centeredScreen}`}>
        <AppAtmosphere />
        <section className={styles.whyPanel} aria-labelledby="why-title">
          <p className={styles.eyebrow}>Before anything else</p>
          <h1 id="why-title" className={styles.ritualTitle}>
            Why do you read?
          </h1>
          <form onSubmit={finishWhy}>
            <label className={styles.field}>
              <span className={styles.visuallyHidden}>Why do you read?</span>
              <textarea
                className={styles.ritualTextarea}
                rows={4}
                value={why}
                placeholder="Take as long as you need. There is no correct answer."
                onFocus={(event) => {
                  if (why.trim()) return;
                  const field = event.currentTarget;
                  const opening = "I read because ";
                  setWhy(opening);
                  window.requestAnimationFrame(() => field.setSelectionRange(opening.length, opening.length));
                }}
                onChange={(event) => setWhy(event.target.value)}
              />
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>A name to be known by, if you wish</span>
              <input
                className={styles.lineInput}
                value={name}
                placeholder="optional"
                autoComplete="name"
                onChange={(event) => setName(event.target.value)}
              />
            </label>
            <div className={styles.whyFooter}>
              <p>This answer is yours alone. It will remain private.</p>
              <button className={styles.continueButton} type="submit">
                Continue
              </button>
            </div>
            {saveError ? <p className={styles.error}>{saveError}</p> : null}
          </form>
        </section>
      </main>
    );
  }

  if (screen === "firstBook") {
    return (
      <BookForm
        mode="first"
        draft={draft}
        setDraft={setDraft}
        onSubmit={placeFirstBook}
        saveError={saveError}
      />
    );
  }

  if (screen === "addBook") {
    return (
      <BookForm
        mode="add"
        draft={draft}
        setDraft={setDraft}
        onSubmit={placeAdditionalBook}
        onBack={returnToLibrary}
        saveError={saveError}
      />
    );
  }

  if (screen === "editBook" && selectedBook) {
    return (
      <BookForm
        mode="edit"
        draft={draft}
        setDraft={setDraft}
        onSubmit={saveEditedBook}
        onBack={() => setScreen("detail")}
        saveError={saveError}
      />
    );
  }

  if (screen === "account") {
    return (
      <main className={styles.accountPage}>
        <AppAtmosphere />
        <section className={styles.accountPanel} aria-labelledby="account-title">
          <button className={styles.backButton} type="button" onClick={returnToLibrary}>← Return to the shelf</button>
          <p className={styles.eyebrow}>Your private keeping</p>
          <h1 id="account-title" className={styles.accountTitle}>Account & archive</h1>
          <p className={styles.accountIntroduction}>
            Your shelf belongs to you. Carry it away whenever you wish, or close the account completely.
          </p>

          {saveError ? <p className={styles.error} role="alert">{saveError}</p> : null}

          {isAdmin ? (
            <section className={styles.accountSection} aria-labelledby="invitations-title">
              <p className={styles.eyebrow}>Alpha stewardship</p>
              <h2 id="invitations-title">Welcome another reader.</h2>
              <p>Send private invitations and tend the Alpha invitation ledger.</p>
              <Link className={styles.secondaryButton} href="/admin/invitations">Manage reader invitations</Link>
            </section>
          ) : null}

          <section className={styles.accountSection} aria-labelledby="archive-title">
            <p className={styles.eyebrow}>Reader ownership</p>
            <h2 id="archive-title">Take your Marginalia with you.</h2>
            <p>
              Download one ZIP containing a readable HTML library, a complete JSON record, and every photograph. Open the HTML file in a browser to print or save it as a PDF.
            </p>
            <button className={styles.primaryButton} type="button" disabled={exportBusy} onClick={() => void exportLibrary()}>
              {exportBusy ? "Preparing your archive…" : "Export my complete library"}
            </button>
            {exportMessage ? <p className={styles.savedNote} role="status">{exportMessage}</p> : null}
          </section>

          <section className={styles.accountSection} aria-labelledby="passage-title">
            <p className={styles.eyebrow}>This session</p>
            <h2 id="passage-title">Leave the library.</h2>
            <p>Your books remain safely kept for your next passwordless return.</p>
            <form action={signOut}>
              <button className={styles.secondaryButton} type="submit">Sign out</button>
            </form>
          </section>

          <section className={`${styles.accountSection} ${styles.dangerSection}`} aria-labelledby="delete-account-title">
            <p className={styles.eyebrow}>Permanent closure</p>
            <h2 id="delete-account-title">Delete this account and its contents.</h2>
            <p id="delete-account-warning">
              This permanently removes your profile, motto, books, reflections, and photographs. Export first if you want to keep a copy. This cannot be undone.
            </p>
            <form
              action={deleteAccount}
              className={styles.deleteAccountForm}
              onSubmit={(event) => {
                if (!window.confirm("Permanently delete this Marginalia account and every private record within it?")) {
                  event.preventDefault();
                }
              }}
            >
              <label className={styles.field}>
                <span className={styles.fieldLabel}>Type DELETE to confirm</span>
                <input className={styles.lineInput} name="confirmation" autoComplete="off" required aria-describedby="delete-account-warning" />
              </label>
              <button className={styles.destructiveButton} type="submit">Permanently delete my account</button>
            </form>
          </section>
        </section>
      </main>
    );
  }

  if (screen === "detail" && selectedBook) {
    return (
      <main className={styles.detailPage}>
        <AppAtmosphere />
        <article className={styles.detailPanel}>
          <div className={styles.detailTopbar}>
            <button className={styles.backButton} type="button" onClick={returnToLibrary}>
              ← Return to the shelf
            </button>
            <div className={styles.bookActions}>
              <button
                className={styles.menuButton}
                type="button"
                aria-label="Book actions"
                aria-haspopup="menu"
                aria-expanded={detailMenuOpen}
                onClick={() => setDetailMenuOpen((current) => !current)}
              >
                <span aria-hidden="true">•••</span>
              </button>
              {detailMenuOpen ? (
                <div className={styles.bookMenu} role="menu" aria-label="Book actions">
                  <button type="button" role="menuitem" onClick={beginEditBook}>
                    Edit book
                  </button>
                  <button
                    className={styles.deleteMenuItem}
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setDetailMenuOpen(false);
                      setConfirmDelete(true);
                    }}
                  >
                    Delete book
                  </button>
                </div>
              ) : null}
            </div>
          </div>
          <div className={styles.detailHeader}>
            <BookCover book={selectedBook} large />
            <div className={styles.detailMetadata}>
              <h1 className={styles.detailTitle}>{selectedBook.title}</h1>
              <p className={styles.detailAuthor}>{selectedBook.author}</p>
              <p className={styles.detailFormat}>{selectedBook.format}</p>
            </div>
          </div>

          <div className={styles.detailSection}>
            <ChoiceGroup
              label="Where it rests"
              values={BOOK_STATUSES}
              current={selectedBook.status}
              labels={STATUS_LABELS}
              onChange={(status) => void changeBookStatus(selectedBook, status)}
            />
          </div>

          {selectedBook.status === "essential" ? (
            <section className={styles.essentialBox} aria-labelledby="essential-title">
              <p className={styles.eyebrow}>Kept close</p>
              <h2 id="essential-title">Why is this book essential?</h2>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>What does it hold for you?</span>
                <textarea
                  className={styles.lineTextarea}
                  rows={3}
                  value={selectedBook.essentialWhy}
                  onChange={(event) =>
                    updateBook(selectedBook.id, (book) => ({ ...book, essentialWhy: event.target.value }))
                  }
                  onBlur={() => void persistEssentialFields(selectedBook)}
                />
              </label>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>When did it find you?</span>
                <input
                  className={styles.lineInput}
                  value={selectedBook.essentialWhen}
                  onChange={(event) =>
                    updateBook(selectedBook.id, (book) => ({ ...book, essentialWhen: event.target.value }))
                  }
                  onBlur={() => void persistEssentialFields(selectedBook)}
                />
              </label>
              <p className={styles.savedNote}>Saved quietly as you write.</p>
            </section>
          ) : null}

          <section className={styles.margins} aria-labelledby="margins-title">
            <h2 id="margins-title" className={styles.sectionTitle}>
              In the margins
            </h2>
            {saveError ? <p className={styles.error}>{saveError}</p> : null}
            <p className={styles.sectionIntroduction}>
              Reflections are private by default. You may mark a note to be offered for sharing once the book is finished.
            </p>
            <form onSubmit={inscribeReflection} className={styles.reflectionComposer}>
              <label>
                <span className={styles.visuallyHidden}>New reflection</span>
                <textarea
                  className={styles.reflectionTextarea}
                  rows={4}
                  value={newReflection}
                  placeholder="What is stirring as you read?"
                  onChange={(event) => setNewReflection(event.target.value)}
                />
              </label>
              <div className={styles.composerActions}>
                <button
                  className={`${styles.shareToggle} ${shareReflection ? styles.shareToggleActive : ""}`}
                  type="button"
                  aria-pressed={shareReflection}
                  onClick={() => setShareReflection((current) => !current)}
                >
                  {shareReflection
                    ? "This note may be shared when finished"
                    : "Mark to share when finished"}
                </button>
                <button className={styles.primaryButton} type="submit">
                  Inscribe
                </button>
              </div>
            </form>
            <div className={styles.reflectionList}>
              {[...selectedBook.reflections]
                .sort((a, b) => b.ts - a.ts)
                .map((reflection) => (
                  <article className={styles.reflection} key={reflection.id}>
                    <p className={styles.reflectionDate}>{formatDate(reflection.ts)}</p>
                    <p>{reflection.text}</p>
                    <button
                      className={`${styles.shareToggle} ${reflection.shareable ? styles.shareToggleActive : ""}`}
                      type="button"
                      aria-pressed={reflection.shareable}
                      onClick={() =>
                        void toggleReflectionSharing(
                          selectedBook.id,
                          reflection.id,
                          !reflection.shareable,
                        )
                      }
                    >
                      {reflection.shareable ? "Marked for future sharing" : "Mark to share when finished"}
                    </button>
                  </article>
                ))}
              {selectedBook.reflections.length === 0 ? (
                <p className={styles.emptyReflection}>No marginalia yet. The first thought is always the quietest.</p>
              ) : null}
            </div>
          </section>

          {confirmDelete ? (
            <div className={styles.dialogBackdrop} onMouseDown={() => setConfirmDelete(false)}>
              <section
                className={styles.deleteDialog}
                role="dialog"
                aria-modal="true"
                aria-labelledby="delete-book-title"
                onMouseDown={(event) => event.stopPropagation()}
              >
                <p className={styles.eyebrow}>Remove from your keeping</p>
                <h2 id="delete-book-title">Delete “{selectedBook.title}”?</h2>
                <p>
                  This removes the book, its photograph, and its reflections from this browser. This cannot be undone.
                </p>
                <div className={styles.dialogActions}>
                  <button className={styles.cancelButton} type="button" onClick={() => setConfirmDelete(false)}>
                    Keep this book
                  </button>
                  <button className={styles.destructiveButton} type="button" onClick={deleteSelectedBook}>
                    Delete book
                  </button>
                </div>
              </section>
            </div>
          ) : null}
        </article>
      </main>
    );
  }

  const visibleBooks = library.books.filter((book) => book.status === filter);
  const shelfQuote = findMarginaliaQuote(quoteId);

  return (
    <main className={styles.libraryPage}>
      <AppAtmosphere />
      <section className={styles.libraryPanel} aria-labelledby="library-title">
        <header className={styles.libraryHeader}>
          <h1 id="library-title" className={styles.libraryWordmark}>
            Marginalia
          </h1>
          <p>{countLabel(library.books.length)}</p>
          <button className={styles.accountButton} type="button" onClick={() => setScreen("account")}>
            Account & archive
          </button>
        </header>

        {justPlaced ? (
          <div className={styles.banner} role="status">
            <p>Your shelf has grown. Tend it slowly.</p>
            <button type="button" onClick={() => setJustPlaced(false)}>
              Dismiss
            </button>
          </div>
        ) : null}

        {saveError ? <p className={styles.error}>{saveError}</p> : null}

        <nav className={styles.filters} aria-label="Shelf sections">
          {FILTER_ORDER.map((status) => (
            <button
              className={filter === status ? styles.filterActive : ""}
              key={status}
              type="button"
              data-filter={status}
              aria-current={filter === status ? "page" : undefined}
              onClick={() => {
                setFilter(status);
                rotateQuote();
                setJustPlaced(false);
              }}
            >
              {STATUS_LABELS[status]}
            </button>
          ))}
        </nav>

        {visibleBooks.length ? (
          <div className={styles.bookGrid}>
            {visibleBooks.map((book) => (
              <button className={styles.bookCard} type="button" key={book.id} onClick={() => openBook(book.id)}>
                <BookCover book={book} />
                <span className={styles.cardTitle}>{book.title}</span>
                <span className={styles.cardMeta}>
                  {STATUS_LABELS[book.status]} · {book.format}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <p className={styles.emptyShelf}>{EMPTY_SHELF_MESSAGES[filter]}</p>
        )}

        <div className={styles.addBookWrap}>
          <button
            className={styles.secondaryButton}
            type="button"
            onClick={() => {
              setDraft(EMPTY_DRAFT);
              setScreen("addBook");
              window.scrollTo(0, 0);
            }}
          >
            Add to your library
          </button>
        </div>

        <figure key={quoteId} className={styles.shelfQuotation} aria-live="polite">
          <span className={styles.quoteOrnament} aria-hidden="true">✦</span>
          <p className={styles.quoteLabel}>From the collective canon</p>
          <blockquote>“{shelfQuote.text}”</blockquote>
          <figcaption>
            <span>— {shelfQuote.author}</span>
            <a href={shelfQuote.sourceUrl} target="_blank" rel="noreferrer">
              {shelfQuote.source}
            </a>
          </figcaption>
        </figure>

        {library.profile.why ? (
          <footer className={styles.whyMemory}>
            <span className={styles.whyOrnament} aria-hidden="true">✦</span>
            <p className={styles.eyebrow}>The reason beneath your shelves</p>
            <blockquote>“{library.profile.why}”</blockquote>
            {library.profile.name ? <cite>— {library.profile.name}</cite> : null}
          </footer>
        ) : null}
      </section>
    </main>
  );
}
