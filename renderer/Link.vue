<template>
  <a
    :class="{ active: pageContext.urlPathname === $attrs.href }"
    @click="handleClick"
  >
    <slot />
  </a>
</template>

<style scoped>
a {
  padding: 3px 10px;
}
a.active {
  background-color: #eee;
}
</style>

<script setup>
import { usePageContext } from "./usePageContext";
import { navigate } from "vite-plugin-ssr/client/router";
import { useAttrs } from "vue";

const pageContext = usePageContext();
const attrs = useAttrs();

// We are using an explicit click handler over automatic link detection to demonstrate the issue when importing "navigate"
const handleClick = (event) => {
  event.preventDefault();
  event.stopPropagation();
  navigate(attrs.href);
};
</script>
