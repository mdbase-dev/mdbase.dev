# Reader and Writer documentation

Reader documentation lives under `src/pages/apps/reader`; Writer documentation lives under
`src/pages/apps/writer`. `src/data/docs-sections.ts` supplies their navigation and the existing
SDK navigation. The Reader extension privacy page remains separate and unchanged.

The guides describe committed application behaviour. They were checked against Reader commit
`74999d1be78749f7333054007f7b5247b6a79ef9` and Writer commit
`9cb61aa5350259f87680072e93100c5e431f0fd8`. Uncommitted local reliability work is not documented
as shipped behaviour. Keep the guides in step with app changes, particularly recovery, exports,
source capture and extension permissions.

## Recordings

The five recordings and posters are served from `public/videos` on the documentation origin.
Do not depend on authenticated GitHub attachments, temporary recording directories or preview
hosting for production playback. MP4s are about 1.5–3.8 MB each. Posters are resized to 960 px.

The recording agent confirmed that all videos use in-memory sample data, with no real account,
private collection content or personal data. Reader samples use public-domain James, Thoreau
and Emerson excerpts and a fictional article. Writer samples use Darwin-themed manuscripts,
public-domain quotations and fictional authors and reviewers. The live Writer demo may use
different sample content.

These are silent recordings with captions burned into the picture. `src/data/doc-videos.json`
provides a text equivalent of each sequence; review that text whenever a video is replaced.
`DocVideo.astro` uses native controls, inline playback, no autoplay or loop, and `preload="none"`.
The page loads a poster; the MP4 is requested on playback. Links permit downloading the files.

| Recording | Placement | SHA-256 of MP4 |
| --- | --- | --- |
| `reader-markdown` | Reader getting started | `facce287ffa892083736bad3c82d83cb41e22ab97914843f6260f7e0ad57f317` |
| `extension-capture` | Reader browser extension | `c57cf032886260fed0370eb206812c52844aad76a07363f31231205c8b287573` |
| `reader-library` | Reader library and views | `81892c8efe4528ee2b6fa93d38eaa2abddde7dc938352ef90fa3b8188a765349` |
| `writer-paper` | Writer getting started | `ce34aa1b8046715dd435ff730568b980116942db10986bb6b3ab06166a62cc14` |
| `writer-book` | Writer chapters and embeds | `a587ba3ec2b23d8c12fdfbea14be2038c1e1276b3bec477728e5c91366b28bd3` |

## Checks and deployment

```sh
pnpm test:docs
pnpm check
pnpm build
MDBASE_SPEC_DIR=/absolute/path/to/mdbase-spec pnpm import:spec
pnpm check:links
```

`test:docs` checks the catalogue, documentation navigation, recording assets and text descriptions,
and opt-in accessible video controls. Site CI and the production build run it too.

Production is the repository's GitHub Pages workflow (`.github/workflows/deploy.yml`), triggered
by a merge to `main`. Cloudflare Pages is only the separate development deployment. Verify
`/apps/`, both documentation roots, all five video files and their posters after deployment.

## Screenshots

`AppShot.astro` frames the screenshots in `public/images/apps`. Each has a light and a dark
capture, 1600×1000 WebP, taken from a 1120×700 window at 2×.

The Connect and desktop app screenshots use made-up accounts from the apps' own review
fixtures, with no real account or collection content. Retake them from an mdbase-connect
checkout with `scripts/screenshots/capture-connect.mjs` (the web screens, against
`pnpm portal:review`) and `scripts/screenshots/capture-desktop.mjs` (the desktop app's
renderer in a browser). Each script's header gives the steps. Retake them when those screens
change.

On a phone each screenshot shows only the part of the window named for it in
`src/markdown/app-shot.mjs` (`crops`), and opening it shows the whole capture; set a crop when you add
a screenshot.

The social share image, `public/og-card.jpg`, is drawn from the homepage's sky by
`scripts/screenshots/capture-og-card.mjs`. Redraw it when the typefaces or the mark change.
