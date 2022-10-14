import { createSSRApp, h, reactive, markRaw } from "vue";
import PageShell from "./PageShell.vue";
import { setPageContext } from "./usePageContext";

export { createApp };

function createApp(pageContext) {
  const { Page } = pageContext;

  let rootComponent;
  const PageWithWrapper = {
    data: () => ({
      Page: markRaw(Page),
      pageProps: markRaw(pageContext.pageProps || {}),
    }),
    created() {
      rootComponent = this;
    },
    render() {
      return h(
        PageShell,
        {},
        {
          default: () => {
            return h(this.Page, this.pageProps);
          },
        }
      );
    },
  };

  const app = createSSRApp(PageWithWrapper);

  // We use `app.changePage()` to do Client Routing, see `_default.page.client.js`
  Object.assign(app, {
    changePage: (pageContext) => {
      Object.assign(pageContextReactive, pageContext);
      rootComponent.Page = markRaw(pageContext.Page);
      rootComponent.pageProps = markRaw(pageContext.pageProps || {});
    },
  });

  // When doing Client Routing, we mutate pageContext (see usage of `app.changePage()` in `_default.page.client.js`).
  // We therefore use a reactive pageContext.
  const pageContextReactive = reactive(pageContext);

  // Make `pageContext` accessible from any Vue component
  setPageContext(app, pageContextReactive);

  return app;
}
