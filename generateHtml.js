import execa from "execa";

export default function generateHtml(legacyPlugin) {
  let isClient = false;
  let outputDir = "";

  return {
    name: "add-legacy-html-transform",
    apply: "build",

    async configResolved({ build: { ssr } }) {
      isClient = !ssr;
    },

    writeBundle({ dir = "" }) {
      if (isClient) {
        outputDir = dir;
      }
    },

    // We assume that the SSR build has happened before
    async closeBundle() {
      if (!isClient) return;
      console.log(`ℹ️ [Generate HTML] Start HTML prerendering`);
      const { stderr } = await execa("vite-plugin-ssr", ["prerender"]);
      console.log(stderr);
      console.log(`ℹ️ [Generate HTML] HTML Prerendering finished`);
      // await transformHtml(outputDir, legacyPlugin);
    },
  };
}
