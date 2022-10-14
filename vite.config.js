import vue from "@vitejs/plugin-vue";
import ssr from "vite-plugin-ssr/plugin";
import legacy from "@vitejs/plugin-legacy";
import generateHtml from "./generateHtml";

const legacyPlugin = legacy({
  modernPolyfills: true,
  targets: [
    "> 0.5%",
    "last 1 version",
    "Edge >= 16",
    "Opera >= 58",
    "Safari >= 10.1",
    "Firefox >= 52",
    "Chrome >= 57",
    "iOS >= 11",
    "Samsung >= 8",
    "ChromeAndroid >= 71",
    "Android >= 4.3",
    "not dead",
  ],
});

export default {
  plugins: [
    vue(),
    ssr({ prerender: true, disableAutoFullBuild: true }),
    legacyPlugin,
    generateHtml(legacyPlugin),
  ],
  ssr: {
    format: "cjs",
  },
};
