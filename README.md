# Marginalia

Marginalia is a private-first sanctuary for readers to tend the books that
shape them and preserve what moved them along the way.

The current production prototype remains available as the original static HTML
files. The maintainable Alpha application is being developed on the
`codex/alpha-foundation` branch.

## Local development

1. Install Node.js and pnpm.
2. Copy `.env.example` to `.env.local` when service credentials are available.
3. Run `pnpm install`.
4. Run `pnpm dev`.

Do not expose the Supabase service-role key to the browser or commit any real
environment values.

## Product documents

- [`docs/PRODUCT_PRINCIPLES.md`](docs/PRODUCT_PRINCIPLES.md)
- [`docs/ALPHA_SCOPE.md`](docs/ALPHA_SCOPE.md)
- [`docs/BRAND_PROVENANCE.md`](docs/BRAND_PROVENANCE.md)
