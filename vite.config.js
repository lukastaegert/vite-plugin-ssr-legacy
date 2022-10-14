import vue from "@vitejs/plugin-vue";
import ssr from "vite-plugin-ssr/plugin";
import legacy from "@vitejs/plugin-legacy";
import generateHtml from "./generateHtml";

const legacyPlugin = legacy({ modernPolyfills: true });

export default {
  plugins: [vue(), ssr(), legacyPlugin, generateHtml(legacyPlugin)],
};
