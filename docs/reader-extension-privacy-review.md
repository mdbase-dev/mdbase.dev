# Reader extension privacy page — publication gate

Proposed URL: `https://mdbase.dev/apps/reader/extension/privacy/`.

This page is a **draft**, not an approved policy. Do not merge/deploy or enter the URL in the Chrome Web Store until the publisher approves the final wording. It describes the 0.2.0 candidate uploaded from `mdbase-reader` commit `adc9d27f86d0040320f5f26f2d96c176c33aa92b`; if the submitted ZIP changes, re-audit it. The source audit, data-category mapping and candidate hash are in `mdbase-reader/docs/chrome-web-store/` on `fix/extension-store-hardening`.

## Repository findings used in the draft

- **Operator/contact:** The owner confirmed both are Callum Alpass. `mdbase-cloud-ops/docs/account-and-service-inventory.md` lists `callum@mdbase.dev` as the Google OAuth support and product email; this draft proposes that publicly reachable address for privacy requests. Confirm the actual mailbox receives requests before publication.
- **Topology:** `mdbase-cloud-ops/docs/render-production.md` describes Render Connect, hosted provider, relay broker and separate PostgreSQL databases. The hosted provider handles records/files; the control plane does not persist record payloads. `docs/r2-storage.md` describes Cloudflare R2 file objects and deferred deletion after retained references are gone. The existing `/privacy/` page already distinguishes local connector data, encrypted relay payloads and provider-readable hosted data.
- **Backups/logs:** `mdbase-cloud-ops/docs/disaster-recovery.md` and `.github/workflows/backups.yml` document Render PITR and encrypted logical exports retained for 90 days as GitHub artifacts on the database-only path. A complete AWS S3 archive is designed but gated by `RECOVERY_ARCHIVE_ENABLED`; do not claim it is live without checking that setting. `docs/render-production.md` and `docs/observability.md` describe privacy-bounded Render application logs, but do not establish a public, exact log-retention interval. Do not promise instant erasure from backups.
- **Usage/retention:** `mdbase-connect/docs/usage-report.md` describes aggregate operator reports from existing account/grant/token/usage rows and daily deletion of expired authorization/protocol-usage rows no longer needed after 395 days. This does not set a 395-day retention period for all account, audit, provider or backup data.
- **Revocation/deletion:** `mdbase-connect/apps/editor/src/ConnectApp.tsx` has application-grant revocation controls; local/hosted authority confirmation may be pending. `apps/editor/src/AccountManagement.tsx` conditionally disables account deletion when the service reports it unavailable. The ops desired `render.yaml` enables it, but a live check is required before claiming it is currently available. Browser-local extension reset is not server-side revocation. Hosted record/file deletion can leave retained versions or backups.
- **Email:** `mdbase-cloud-ops/docs/account-and-service-inventory.md` identifies Resend for account-related delivery. DOI lookups and original-site PDF requests are documented in the extension-store-hardening audit, not Connect.

## Confirm before publication

- Test `callum@mdbase.dev` as a privacy contact, and set the effective date to the actual publication date. Confirm operator wording and the public handling process for privacy/deletion requests.
- Check live production settings for backup archive activation, log retention and account deletion. The repositories provide desired state and implementation but cannot prove all live provider settings or data already retained there.
- Confirm no sale/impermissible transfer, unrelated use, lending/creditworthiness use and Chrome Limited Use compliance as operator practices. Do not check the Web Store's three certifications merely because source code has no ad SDK.
- Reconcile Web Store data categories with the actual submitted build and backend: website content, visited URLs, authorization credentials, account identifiers, IP/location and activity/usage reporting. Recheck optional HTTPS permission and DOI traffic before claiming they stop or omit data.
- Check the published page against the production ZIP and the other Reader/Connect pages. The site's in-progress Reader documentation currently exists as untracked work in the canonical `mdbase.dev` checkout, not on this branch; coordinate separately rather than copying or overwriting it.
- After approval and deployment, fetch the public URL without authentication and verify its content, canonical URL and links before entering it in the Chrome Web Store. Save the draft, re-open “Why can't I submit?”, and submit only with explicit publisher approval.

## Validation

`pnpm check` and `pnpm build` pass. `pnpm check:links` reports an unrelated existing `/sdk/` → `/spec/#section-14` fragment problem on `origin/main`; new policy links and inline-code checks pass.
