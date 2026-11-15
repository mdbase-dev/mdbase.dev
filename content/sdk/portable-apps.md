---
title: Browser bundle
description: Use the SDK from a plain script tag, without a bundler.
section: sdk
---

Most apps import `@mdbase-dev/sdk` through a bundler. If yours doesn’t use one, the package also ships a classic-script build.

## Classic-script bundle {#bundle}

The package includes `dist/browser/mdbase-sdk.js` and a minified `mdbase-sdk.min.js`. Copy one into your app and serve it from your own origin. mdbase does not publish it on a CDN.

```sh title="Terminal"
npm install @mdbase-dev/sdk
cp node_modules/@mdbase-dev/sdk/dist/browser/mdbase-sdk.min.js public/vendor/
```

```html title="index.html"
<script src="./vendor/mdbase-sdk.min.js"></script>
<script>
  const { connect, Client, AppHost } = window.MdbaseSDK;
  // connect and the other root exports match @mdbase-dev/sdk.
  // Client groups the client classes; AppHost matches @mdbase-dev/sdk/app-host.
</script>
```

Loading the bundle does nothing on its own. It doesn’t open a session, touch storage or grant access. Module code can import the same surface from `@mdbase-dev/sdk/browser`.

## Downloaded HTML files {#status}

The manifest format has a `"portable"` distribution for a single HTML file that runs without a web origin. The launch SDK has no sign-in flow for portable files, so this guide doesn’t cover one. Build a web app with an HTTPS origin instead.
