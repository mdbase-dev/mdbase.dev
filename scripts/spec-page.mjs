export function renderSpecPage(shell, source, archive) {
  const navigation = source.match(/<nav class="spec-sidebar"[^>]*>([\s\S]*?)<\/nav>/)?.[1];
  const content = source.match(/<main class="spec-content">([\s\S]*?)<\/main>/)?.[1];
  if (!navigation || !content) throw new Error("Specification build is missing its navigation or content");

  for (const slot of ["navigation", "content"]) {
    if (!shell.includes(`<!-- spec-${slot}:start -->`) || !shell.includes(`<!-- spec-${slot}:end -->`)) {
      throw new Error(`Specification shell is missing the ${slot} slot`);
    }
  }
  return shell
    .replace(/<!-- spec-navigation:start -->[\s\S]*?<!-- spec-navigation:end -->/, () =>
      `<!-- spec-navigation:start -->${navigation.replace(/<div class="spec-mobile-links"[^>]*>[\s\S]*?<\/div>/, "")}<!-- spec-navigation:end -->`)
    .replace(/<!-- spec-content:start -->[\s\S]*?<!-- spec-content:end -->/, () =>
      `<!-- spec-content:start -->${content}<!-- spec-content:end -->`)
    .replace(/<meta name="mdbase-spec-channel"[^>]*>/g, "")
    .replace("</head>", `<meta name="mdbase-spec-channel" content="${archive ? "v0.2-archive" : "v0.3-current"}"></head>`);
}
