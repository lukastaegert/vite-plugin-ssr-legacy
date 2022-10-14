import { createApp } from "./app";

export { render };

export const clientRouting = true;

let app;

async function render(pageContext) {
  if (!app) {
    app = createApp(pageContext);
    app.mount("#app");
  } else {
    app.changePage(pageContext);
  }
}

/* To enable Client-side Routing:
export const clientRouting = true
// !! WARNING !! Before doing so, read https://vite-plugin-ssr.com/clientRouting */
