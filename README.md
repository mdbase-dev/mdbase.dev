# mdbase.dev

Product website and developer documentation for mdbase, mdbase Connect, the
runtime profiles, and conforming implementations.

## Local development

```sh
pnpm install
pnpm sync:sources
pnpm dev
```

The source synchronizer reads sibling checkouts of `mdbase-spec`,
`mdbase-connect`, `mdbase-contracts`, `mdbase-rs`, and `mdbase` by default.
Override their paths with `MDBASE_SPEC_DIR`, `MDBASE_CONNECT_DIR`,
`MDBASE_CONTRACTS_DIR`, `MDBASE_RS_DIR`, and `MDBASE_TS_DIR`.

## Production build

```sh
pnpm sync:sources
pnpm check
pnpm build
(cd ../mdbase-spec/site && npm ci && npm run build)
pnpm import:spec
pnpm check:links
```

The website repository owns the ecosystem pages and deployment cadence. The
normative specification is built by `mdbase-spec` and imported under `/spec/`.
Connect schemas, theme roles, the homepage particle field, and implementation
claims are synchronized from their canonical repositories. Generated assets
remain traceable to the release artifacts they document.

The first-party contract catalog is built from the commit pinned in
`site-sources.json`, then published as static files under `/contracts/`.
