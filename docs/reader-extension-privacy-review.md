# Reader extension privacy page — publication gate

Proposed URL: `https://mdbase.dev/apps/reader/extension/privacy/`.

This page is a **draft**, not an approved policy. Do not merge/deploy or enter the URL in the Chrome Web Store until the publisher and service operator approve the facts below. It describes the 0.2.0 candidate uploaded from `mdbase-reader` commit `adc9d27f86d0040320f5f26f2d96c176c33aa92b`; if the submitted ZIP changes, re-audit it. The source audit, data-category mapping and candidate hash are in `mdbase-reader/docs/chrome-web-store/` on `fix/extension-store-hardening`.

## Confirm before publication

- Name the legal/person operator, effective date and a tested public contact channel for privacy/deletion requests. The Reader repository's public GitHub issue URL currently returns 404; do not use it as support contact.
- Verify production Connect, hosted-collection and relay providers/subprocessors; network metadata, logs, backups, retention and deletion. The general Connect policy covers part of this but does not establish extension-specific practices. Link to it without implying all traffic is local or end-to-end encrypted.
- Verify Connect grant revocation, collection record/file deletion and account deletion instructions. Local extension cleanup does **not** revoke a server grant or remove saved collection data.
- Confirm purposes and sharing with the operator, including no sale, unrelated use, creditworthiness/lending use and Chrome Limited Use compliance. Do not check the Web Store's three certifications merely because source code has no ad SDK.
- Reconcile Web Store data categories with the actual submitted build and backend: website content, visited URLs, authorization credentials, account identifiers, IP/location and activity/usage reporting. Recheck optional HTTPS permission and DOI traffic before claiming they stop or omit data.
- Check the published page against the production ZIP and the other Reader/Connect pages. The site's in-progress Reader documentation currently exists as untracked work in the canonical `mdbase.dev` checkout, not on this branch; coordinate separately rather than copying or overwriting it.
- After approval and deployment, fetch the public URL without authentication and verify its content, canonical URL and links before entering it in the Chrome Web Store. Save the draft, re-open “Why can't I submit?”, and submit only with explicit publisher approval.

## Validation

`pnpm check` and `pnpm build` pass. `pnpm check:links` currently reports an unrelated existing `/sdk/` → `/spec/#section-14` fragment problem on `origin/main`; the new policy's local link and inline-code checks pass after the spacing fix.
