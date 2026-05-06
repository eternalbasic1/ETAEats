# Docs

Long-form documentation that doesn't belong in `CLAUDE.md` or
`design.md`.

```
docs/
├── api-contracts/    # one .md per backend domain with curl examples
├── screen-specs/     # one .md per screen — what each agent needs to build it
└── proposals/        # ADR-style proposals BEFORE adding a new lib or pattern
```

## When to add to each folder

- **api-contracts/** — when you need to document a backend endpoint in
  more detail than `@eta/api-client` types convey: example payloads,
  error cases, idempotency notes.
- **screen-specs/** — for a complex screen that needs more than what
  fits in `design.md` § 4. One file per screen. Keep `design.md` § 4
  as the index.
- **proposals/** — before adding a new third-party library, a new
  package, or a new architecture pattern. Title format:
  `YYYY-MM-DD-<short-title>.md`. Sections: Context, Decision, Trade-offs,
  Alternatives considered, Status (proposed / accepted / rejected).
