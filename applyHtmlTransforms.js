// Everything below has been blatantly copied from the Vite sources, see https://github.com/vitejs/vite/blob/ba43c29a7920ab8356b3fcb16ca3a11dc7e5713e/packages/vite/src/node/plugins/html.ts
// I hope we can remove this legacy stuff in a not too distant future
export const applyHtmlTransforms = async (html, hook, ctx) => {
  const headTags = [];
  const headPrependTags = [];
  const bodyTags = [];
  const bodyPrependTags = [];
  const res = await hook(html, ctx);
  if (!res) {
    throw new Error("HTML Transformer did not transform");
  }
  if (typeof res === "string") {
    html = res;
  } else {
    let tags;
    if (Array.isArray(res)) {
      tags = res;
    } else {
      html = res.html || html;
      tags = res.tags;
    }
    for (const tag of tags) {
      if (tag.injectTo === "body") {
        bodyTags.push(tag);
      } else if (tag.injectTo === "body-prepend") {
        bodyPrependTags.push(tag);
      } else if (tag.injectTo === "head") {
        headTags.push(tag);
      } else {
        headPrependTags.push(tag);
      }
    }
  }
  // inject tags
  if (headPrependTags.length) {
    html = injectToHead(html, headPrependTags, true);
  }
  if (headTags.length) {
    html = injectToHead(html, headTags);
  }
  if (bodyPrependTags.length) {
    html = injectToBody(html, bodyPrependTags, true);
  }
  if (bodyTags.length) {
    html = injectToBody(html, bodyTags);
  }
  return html;
};

const headInjectRE = /([ \t]*)<\/head>/i;
const headPrependInjectRE = /([ \t]*)<head[^>]*>/i;
const htmlInjectRE = /<\/html>/i;
const htmlPrependInjectRE = /([ \t]*)<html[^>]*>/i;
const bodyInjectRE = /([ \t]*)<\/body>/i;
const bodyPrependInjectRE = /([ \t]*)<body[^>]*>/i;
const doctypePrependInjectRE = /<!doctype html>/i;
const unaryTags = new Set(["link", "meta", "base"]);

function injectToHead(html, tags, prepend = false) {
  if (prepend) {
    // inject as the first element of head
    if (headPrependInjectRE.test(html)) {
      return html.replace(
        headPrependInjectRE,
        (match, p1) => `${match}\n${serializeTags(tags, incrementIndent(p1))}`
      );
    }
  } else {
    // inject before head close
    if (headInjectRE.test(html)) {
      // respect indentation of head tag
      return html.replace(
        headInjectRE,
        (match, p1) => `${serializeTags(tags, incrementIndent(p1))}${match}`
      );
    }
    // try to inject before the body tag
    if (bodyPrependInjectRE.test(html)) {
      return html.replace(
        bodyPrependInjectRE,
        (match, p1) => `${serializeTags(tags, p1)}\n${match}`
      );
    }
  }
  // if no head tag is present, we prepend the tag for both prepend and append
  return prependInjectFallback(html, tags);
}
function injectToBody(html, tags, prepend = false) {
  if (prepend) {
    // inject after body open
    if (bodyPrependInjectRE.test(html)) {
      return html.replace(
        bodyPrependInjectRE,
        (match, p1) => `${match}\n${serializeTags(tags, incrementIndent(p1))}`
      );
    }
    // if no there is no body tag, inject after head or fallback to prepend in html
    if (headInjectRE.test(html)) {
      return html.replace(
        headInjectRE,
        (match, p1) => `${match}\n${serializeTags(tags, p1)}`
      );
    }
    return prependInjectFallback(html, tags);
  } else {
    // inject before body close
    if (bodyInjectRE.test(html)) {
      return html.replace(
        bodyInjectRE,
        (match, p1) => `${serializeTags(tags, incrementIndent(p1))}${match}`
      );
    }
    // if no body tag is present, append to the html tag, or at the end of the file
    if (htmlInjectRE.test(html)) {
      return html.replace(htmlInjectRE, `${serializeTags(tags)}\n$&`);
    }
    return html + `\n` + serializeTags(tags);
  }
}

function serializeTag({ tag, attrs, children }, indent = "") {
  if (unaryTags.has(tag)) {
    return `<${tag}${serializeAttrs(attrs)}>`;
  } else {
    return `<${tag}${serializeAttrs(attrs)}>${serializeTags(
      children,
      incrementIndent(indent)
    )}</${tag}>`;
  }
}

function serializeTags(tags, indent = "") {
  if (typeof tags === "string") {
    return tags;
  } else if (tags && tags.length) {
    return tags
      .map((tag) => `${indent}${serializeTag(tag, indent)}\n`)
      .join("");
  }
  return "";
}

function incrementIndent(indent = "") {
  return `${indent}${indent[0] === "\t" ? "\t" : "  "}`;
}

function prependInjectFallback(html, tags) {
  // prepend to the html tag, append after doctype, or the document start
  if (htmlPrependInjectRE.test(html)) {
    return html.replace(htmlPrependInjectRE, `$&\n${serializeTags(tags)}`);
  }
  if (doctypePrependInjectRE.test(html)) {
    return html.replace(doctypePrependInjectRE, `$&\n${serializeTags(tags)}`);
  }
  return serializeTags(tags) + html;
}

function serializeAttrs(attrs) {
  let res = "";
  for (const key in attrs) {
    if (typeof attrs[key] === "boolean") {
      res += attrs[key] ? ` ${key}` : ``;
    } else {
      res += ` ${key}=${JSON.stringify(attrs[key])}`;
    }
  }
  return res;
}
