# Marginalia Supabase

The SQL files in `migrations/` are the source of truth for the hosted database.

The Alpha foundation creates:

- private reader profiles and reading mottos;
- owned books with durable shelf positions;
- private reflections;
- extensible book-image records;
- an admin-only invitation ledger;
- an Owner-only administrative audit record;
- a private `book-images` Storage bucket;
- Row Level Security on every reader-owned table and stored object.

Do not create parallel tables manually in the dashboard. Apply migrations in filename order through the Supabase SQL Editor or CLI.

Image objects must use the path convention:

```text
<user-id>/<book-id>/<image-id>.webp
```

The first path segment is enforced by Storage policies and must match the authenticated reader.

The Wizard portal additionally requires:

1. `202609160001_wizard_admin_audit.sql` applied after the Alpha foundation migration;
2. the Owner's immutable Supabase Auth UUID in the server-only
   `MARGINALIA_OWNER_USER_IDS` environment variable;
3. a new deployment after that environment variable is added or changed.

The audit table has no browser-facing policies or grants. Only the server-side
Supabase secret client may read or write it.
