# Marginalia master product, offering, and feature roadmap

Last consolidated: 4 August 2026

This is the internal master reference for everything discussed for Marginalia.
It separates the completed Autumn Alpha from proposed paid offerings, participant
recognition, and longer-term community ideas. Proposed items are directions, not
public promises, until they receive their own scoped release plan.

## Status key

- **Alpha complete** — built and included in the Autumn Alpha release candidate
- **Release operation** — part of launching or running the Alpha rather than the reader product
- **Proposed** — discussed and aligned in principle; details may change
- **Deferred** — intentionally excluded from Alpha
- **Exploratory** — a longer-term possibility that requires validation

## Product purpose and permanent principles

- Marginalia is a literary container built by a reader for all readers.
- It helps readers remember the books that formed them and engage meaningfully
  with the books presently in their hands.
- The reader's own copy matters, not merely a generic catalogue record.
- Marginalia is private before it is public and reflective before it is social.
- The reader owns their record; their words and core exports remain theirs.
- Paid features should fund preservation, presentation, storage, organization,
  and craft—not hold a reader's writing hostage.
- Ornament should establish ritual and atmosphere without competing with reading.
- The Alpha contains no public feed, follower system, messaging, recommendation
  algorithm, engagement-performance mechanics, or paywall.

## Autumn Alpha product — Alpha complete

### Invitation-only accounts and onboarding

- Private, invitation-only account creation
- Passwordless email sign-in through Supabase Auth
- Branded Marginalia authentication and access emails
- Cross-device, cloud-backed accounts rather than browser-only local records
- Reader name and personal reading-motto onboarding
- The phrase **“I read because”** supplied as the beginning of the reader's answer
- Personal reading motto displayed ornamentally across every shelf
- Migration of compatible records from the original `marginalia.v0.1` browser prototype
- Sign out, account recovery, and permanent account deletion

### Core book record

- Book title
- Author
- Copy format: hardcover, softcover, digital, PDF, or audio
- Reading state and movement between shelf sections
- One private front-cover or personal-copy photograph per book
- Private, user-specific photograph storage
- Photograph preparation with location metadata removed
- Opening reflection when adding a book
- Additional dated reflections after the book is created
- Ability to mark a reflection as a candidate for future sharing
- Edit book details and replace or remove its photograph
- Delete a book and its associated private record

### The four-part shelf

- **Essential Reads**
- **Currently Reading**
- **On the Horizon**
- **Finished Reads**
- No more than three displayed books per row for visual continuity
- Centered, symmetrical shelf navigation
- Realistic antiquarian-bookcase atmosphere
- Empty-shelf messages and quiet confirmation notices

### Reader ownership and exports

- Complete downloadable ZIP archive
- Human-readable HTML library
- Machine-readable JSON record
- Original stored book photographs
- Browser print-to-PDF support
- Export remains available without a paid plan

### The Collective Canon

- Fifty curated, source-attributed literary quotations in the initial collection
- Public-domain primary sources used for verification
- A new quotation on a fresh shelf visit or refresh
- A new quotation when moving between shelf sections
- A new quotation after successfully adding a book or returning to the shelf
- No immediate quotation repetition
- Original work and source link retained with each quotation
- Future collections can be expanded editorially rather than through an uncontrolled live scrape

### Ceremonial and visual experience

- Marginalia archival crest and ouroboros seal
- Correct, restrained Metatron's Cube sacred geometry
- Ceremonial landing threshold
- Leather-bound book-opening ritual
- Brief display of marbled antiquarian endpaper
- Persistent, realistic turned pages during the opening animation
- Dark, legible atmospheric presentation
- Realistic library shelves and book presentation
- Dedicated Marginalia wordmark type treatment
- Cohesive brass, parchment, ink, oxblood, and dark-wood palette
- Responsive desktop and mobile layouts
- Reduced-motion accommodations and accessible semantic structure

### Administration and infrastructure

- Supabase authentication, database, row-level privacy, and photograph storage
- Vercel hosting and preview deployments
- GitHub version control and reviewable release branches
- Namecheap domain and DNS management
- Brevo-authenticated transactional email delivery
- Branded sender identity and Marginalia crest within email templates
- Admin-only Alpha stewardship area
- Private invitation form
- Invitation ledger with pending and accepted states
- Reconciliation of readers invited before the ledger existed
- Invitation records visible for operational follow-up

## Autumn Alpha program — release operations

- Target cohort: approximately fifty personally selected readers
- Healthy first-round goal: roughly half of invitees participating actively
- Proposed season: autumnal equinox through winter solstice, 2026
- Participation is free
- Two-stage invitation:
  1. personal founder correspondence and request for acceptance;
  2. separate private Marginalia access email after acceptance
- Each invitation is personal and non-transferable
- An invitee may nominate one or two thoughtful readers for consideration
- Permission should be obtained before a nominee's information is shared
- End-of-Alpha feedback survey, earnestly and honestly completed if possible
- Optional round-table discussion for Alpha Readers
- Founder-led review of usage, friction, retention, feedback, and requested features

## Alpha and Beta participant recognition — proposed

- Permanent **Founding Reader** recognition on the reader's shelf
- Exclusive Alpha-specific shelf trinket or piece of ephemera
- Beta-specific shelf trinket for Beta participants
- **Founding Alpha Reader** and **Founding Beta Reader** distinctions for future community features
- Special Founding Reader Patron pricing when paid plans are introduced
- Recognition remains attached to the reader's account after the testing period
- Round-table invitations as part of participatory product development

## Free reader offering after Alpha — proposed

- Core account and shelf functionality
- Book records and reading states
- Private reflections
- The four core shelf sections
- One photograph per book
- Private-by-default use
- Reader reading motto
- The Collective Canon
- Complete core data export
- Account recovery and deletion
- A useful permanent free experience rather than a temporary trial

Final quotas and fair-use limits remain to be determined from Alpha storage and
usage data.

## Patron offering — proposed at $5/month or $55/year

Pricing remains provisional until Alpha usage establishes real storage and
operational costs.

- Everything in the free reader offering
- Expanded private photograph storage per book, including:
  - front cover
  - back cover
  - table of contents
  - dust jacket, where applicable
- Optional shelf display with the dust jacket fitted over the book
- Optional dust-jacket removal animation revealing the underlying covers
- Advanced organization, tags, filtering, and search
- Richer and more presentation-ready exports
- Saved export editions and expanded preservation tools
- Enhanced backups and revision history
- Library scanning and structured import/export tools
- Customizable shelf options
- Book-linked trinkets, artifacts, and ephemera
- **A Year Among the Margins** annual reading recap and reflection summary
- Potential path to a printable or publishable personal book of reflections

## Founding Patron offering — proposed, limited-time

Exact price and eligibility window remain undecided.

- Everything in the free and Patron offerings
- Limited Founding Patron pricing for an initial period, potentially one year
- **Friends with the Wizard** custom distinction or tag
- Founding Member engraved-bookshelf recognition
- Special founding shelf artifact or trinket
- Invitations to optional round-table conversations about future development
- A closer participatory role in shaping early paid features

## Presentation, preservation, and publishing expansions — deferred

- Publication-quality editorial exports
- A designed personal volume assembled from a reader's reflections
- Collaboration or integration with a book printer/publisher
- Advanced PDF and print layouts
- Multiple saved editions of a reader's archive
- Long-term revision history and restoration
- Expanded media for a physical copy, including jacket, cover, contents, inscriptions, and ephemera
- More elaborate three-dimensional or animated book presentation

## Library organization and discovery tools — deferred

- Camera or barcode scanning
- Bulk library import
- External catalogue metadata assistance
- Advanced full-library search
- Custom tags and collections beyond the four core shelves
- Sort controls and additional shelf arrangements
- Reading history and year-over-year records
- Enhanced backup tools

## Shelf personalization and digital artifacts — deferred

- Custom shelf materials, finishes, and arrangements
- Trinkets and ephemera placed on shelves
- Artifacts linked to particular books or reading milestones
- Engraved shelf elements
- Founding Reader and Patron recognition objects
- Seasonal or event-specific keepsakes
- Collectible Alpha and Beta artifacts that remain with the account

These objects should reward participation and memory rather than create coercive
engagement loops or speculative scarcity.

## Future community layer — deliberately deferred until after Alpha

- Public or selectively shared reader profiles
- Reader-to-reader following
- A feed, if one can be built without displacing reflection
- Direct messaging
- Shared or published reflections
- Reader discovery and book discovery
- Recommendation tools
- Social recognition tags, including Founding Alpha/Beta Reader distinctions
- Community reading rooms or round-table spaces

Any eventual recommendation system should be transparent, optional, and designed
for readers rather than advertising or compulsive engagement. No community layer
should make existing private records public by default.

## Commercial and operational work still to define

- Final free-tier limits based on real Alpha use
- Patron storage quotas and cost model
- Final monthly and annual Patron pricing
- Founding Patron price, eligibility, and duration
- Billing provider and subscription management
- Tax, refund, cancellation, and account-entitlement policies
- Privacy policy, terms of use, and production data-retention policy
- Support and incident-response process
- Analytics limited to the minimum useful, privacy-respecting measures
- Beta cohort size and qualification
- Public launch sequence after Beta

## Brand and outreach extras discussed

- Marginalia-specific founder email address
- Branded email signature with crest and founder identification
- Personal Alpha invitation letter template
- Instagram teaser campaign during the pre-Alpha month
- Social preview artwork derived from the crest
- Future simplified Marginalia monogram
- One-color engraving version of the crest
- Transparent line-art crest derivative
- Dedicated favicon and app icon
- Consistent founder, invitation, authentication, and future product correspondence

## Explicitly not promised for the Autumn Alpha

- Multiple photographs per book
- Dust-jacket animation
- Patron billing
- Founding Reader trinkets already rendered in the interface
- Barcode scanning or bulk catalogue import
- Advanced search or custom tagging
- Annual recap
- Print-publisher integration
- Feeds, followers, messaging, or recommendations
- Public profiles or public reflections

Those ideas remain preserved here so the Alpha can stay focused without losing
the larger vision.
