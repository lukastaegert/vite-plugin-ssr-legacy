# Using vite-plugin-ssr with @vite/plugin-legacy for pre-rendering

This is a rather hacky demo that shows how to do that. It actually works :)

To verify, run `npm run prod` to build and start a server on port 8080, then head over to https://developer.microsoft.com/en-us/microsoft-edge/tools/vms/ to download an appropriate VM. I am working against "MSEdge von Win10", which supports ES6 imports but no dynamic imports or `import.meta.url`.

With client routing, there is a bug that occurs when using

```js
import { navigate } from "vite-plugin-ssr/client/router";
```

That triggers a history initialization with a `history.replaceState(someObject, undefined, undefined)`. In old Edge if you pass an *explicit*  `undefined` as the third parameter here, it actively changes the url to `/undefined`. The fix would be as simple as changing https://github.com/brillout/vite-plugin-ssr/blob/aabfde988d2e427a9af78f3d8765276455947fb2/vite-plugin-ssr/client/router/history.ts#L81-L83 to

```ts
function replaceHistoryState(state: HistoryState, url: string | null = null) {
  window.history.replaceState(state, '', url)
}
```

because `null` indeed works as expected even in old Edge.

Beyond that, the solution is VERY HACKY, and I would be interested in any idea how to make it simpler.

1. We currently *need* `disableAutoFullBuild: true`. `@vite/plugin-legacy` triggers its own build which again is picked up by vite-plugin-ssr, which consequently fails because the build does not have a `manifest.json`.
2. In order to have the correct client build directory reference, I added my special post-processing (that also calls `prerender`) into the client build, which means we have to call `vite build --ssr` before `vite build` so that the generated HTML is available.
3. Then we grab the generated files from disk and *manually*  run the `transformIndexHtml` hook of `@vite/plugin-legacy` on them.