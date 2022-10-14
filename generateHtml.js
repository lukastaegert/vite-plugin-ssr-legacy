import execa from "execa";
import glob from "fast-glob";
import { readFile, writeFile } from "fs/promises";
import { join } from "path";
import { applyHtmlTransforms } from "./applyHtmlTransforms.js";

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
      await transformHtml(outputDir, legacyPlugin);
    },
  };
}

async function transformHtml(outputDir, legacyPlugin) {
  const { fileNames, pageChunk, legacyPageChunk, legacyHtmlTransform } =
    await prepareHtmlTransform(outputDir, legacyPlugin);
  await Promise.all(
    fileNames.map(
      transformHtmlFile(
        outputDir,
        legacyHtmlTransform,
        pageChunk,
        legacyPageChunk
      )
    )
  );
}

async function prepareHtmlTransform(outputDir, legacyPlugin) {
  const [fileNames, pageChunks, legacyPageChunks] = await Promise.all([
    glob("./**/*.html", { cwd: outputDir }),
    glob("./**/_default.page.client.js.*.js", { cwd: outputDir }),
    glob("./**/_default.page.client.js-legacy.*.js", { cwd: outputDir }),
  ]);
  if (pageChunks.length !== 1 || legacyPageChunks.length !== 1) {
    throw new Error("Could not find page chunks");
  }
  if (!Array.isArray(legacyPlugin)) {
    throw new Error("Unexpected legacy plugin");
  }
  const legacyHtmlTransform = legacyPlugin.find(
    ({ transformIndexHtml }) => transformIndexHtml
  )?.transformIndexHtml;
  if (typeof legacyHtmlTransform !== "function") {
    throw new Error("Could not find legacy plugin transformer");
  }
  return {
    fileNames,
    pageChunk: pageChunks[0],
    legacyPageChunk: legacyPageChunks[0],
    legacyHtmlTransform,
  };
}

const transformHtmlFile =
  (outputDir, legacyHtmlTransform, pageChunk, legacyPageChunk) =>
  async (fileName) => {
    const fullFileName = join(outputDir, fileName);
    const content = await readFile(fullFileName, "utf-8");
    const facadeModuleId = join(__dirname, "renderer/_default.page.client.js");
    // We first run it for the legacy chunk, which will set internal plugin state, and then for the modern chunk.
    // That is how it works when the plugin is used with regular HTML files.
    legacyHtmlTransform(content, {
      chunk: { fileName: legacyPageChunk, facadeModuleId },
    });
    const contentWithLegacyTags = await applyHtmlTransforms(
      content,
      legacyHtmlTransform,
      {
        chunk: { fileName: pageChunk, facadeModuleId },
      }
    );
    await writeFile(fullFileName, contentWithLegacyTags);
  };
