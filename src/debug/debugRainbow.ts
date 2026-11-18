/**
 * Loads the vendored rainbow CSS debugger (`public/rainbow.js`), which outlines
 * every element in rainbow colours. Toggle it with Alt+Shift+R once loaded.
 */
export function initDebugRainbow(): void {
  if (document.getElementById("rainbow-debugger")) return;

  const script = document.createElement("script");
  script.id = "rainbow-debugger";
  // BASE_URL keeps it working under the GitHub Pages subpath.
  script.src = `${import.meta.env.BASE_URL}rainbow.js`;
  document.body.append(script);
}
