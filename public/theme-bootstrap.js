try {
  const theme = /^\/authorize\/[0-9a-f-]+$/i.test(location.pathname)
    ? null
    : localStorage.getItem("mdbase:theme");
  if (theme === "light" || theme === "dark") {
    document.documentElement.dataset.theme = theme;
  }
  const dark = theme === "dark"
    || (theme !== "light" && matchMedia("(prefers-color-scheme: dark)").matches);
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", dark ? "#121212" : "#ffffff");
} catch {
  // The system preference remains available when local storage is unavailable.
}
