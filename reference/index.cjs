'use strict';

var exporters = require('@unlayer/exporters');
var React4 = require('react');
var defaultBuild = require('react-dom/server');
var jsxRuntime = require('react/jsx-runtime');

function _interopDefault (e) { return e && e.__esModule ? e : { default: e }; }

function _interopNamespace(e) {
  if (e && e.__esModule) return e;
  var n = Object.create(null);
  if (e) {
    Object.keys(e).forEach(function (k) {
      if (k !== 'default') {
        var d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: function () { return e[k]; }
        });
      }
    });
  }
  n.default = e;
  return Object.freeze(n);
}

var React4__default = /*#__PURE__*/_interopDefault(React4);
var defaultBuild__namespace = /*#__PURE__*/_interopNamespace(defaultBuild);

// src/components/Button.tsx
var SHARED = Symbol.for("@unlayer/react-elements/collecting");
var frames = globalThis[SHARED] ?? (globalThis[SHARED] = []);
function collecting() {
  return frames[frames.length - 1] ?? void 0;
}
function within(frame, run) {
  frames.push(frame);
  try {
    return run();
  } finally {
    frames.pop();
  }
}
var MARK = "unlayer-mark";
var RECORDS = Symbol.for("@unlayer/react-elements/records");
var COLLECTING_ID = "unlayer-collect-";
function marker(collection, at, edge) {
  return React4__default.default.createElement(MARK, { key: `${at}${edge ?? ""}`, "data-n": collection.nonce, "data-i": at, ...edge ? { "data-e": edge } : {} });
}
var SHARED2 = Symbol.for("@unlayer/react-elements/render-builds");
var using = globalThis[SHARED2] ?? (globalThis[SHARED2] = []);
var same = (a, b) => a.renderToString === b.renderToString;
function dispatcher() {
  const internals = React4__default.default;
  return internals.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE?.H ?? internals.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED?.ReactCurrentDispatcher?.current ?? null;
}
var dispatchers = /* @__PURE__ */ new Map();
function dispatcherOf(build) {
  if (!dispatchers.has(build)) {
    let seen = null;
    try {
      class Probe extends React4__default.default.Component {
        render() {
          seen = dispatcher();
          return null;
        }
      }
      build.renderToStaticMarkup(React4__default.default.createElement(Probe));
    } catch {
    }
    dispatchers.set(build, seen);
  }
  return dispatchers.get(build);
}
var second;
function secondBuild(outer) {
  if (second === void 0) {
    second = null;
    const node = globalThis.process;
    const requirers = [
      // (`module`'s, read so that a bundler doesn't take it for a require of a path worked out when it runs.)
      () => {
        const own = typeof module === "object" ? Reflect.get(module ?? {}, "require") : void 0;
        return typeof own === "function" ? (id) => own.call(module, id) : void 0;
      },
      // From this module's URL (as a stack names it: webpack 4 can't parse the syntax for it), the app's script, then
      // the folder Node started in; only where `react` is this React. Another React's isn't loaded (React 19's browser
      // build keeps Node running).
      ...[/file:\/\/\S+?(?=:\d+:\d+)/.exec(String(new Error().stack))?.[0], node?.argv?.[1], `${node?.cwd?.()}/`].map((from) => () => {
        const required = node?.getBuiltinModule?.("module")?.createRequire(from);
        return required?.("react")?.createElement === React4__default.default.createElement ? required : void 0;
      })
    ];
    const ids = ["react-dom/server.bun", ...Number.parseInt(React4__default.default.version) >= 19 ? [] : ["react-dom/server.browser"], "react-dom/server.node"];
    search: for (const id of ids) {
      for (const requirer of requirers) {
        try {
          const build = requirer()?.(id);
          if (build?.renderToStaticMarkup && !same(build, defaultBuild__namespace) && ![null, outer].includes(dispatcherOf(build))) {
            second = build;
            break search;
          }
        } catch {
        }
      }
    }
  }
  return second ?? void 0;
}
var buildOf = (outer) => outer === null ? void 0 : [defaultBuild__namespace, second].find((b) => !!b && dispatcherOf(b) === outer);
function withBuild(render, own = false) {
  const outer = own ? null : dispatcher();
  let build = current();
  const theirs = !own && (using.length === 0 || collecting() !== void 0) ? buildOf(outer) : void 0;
  const busy = [];
  if (theirs) {
    const free = (b) => !same(b, theirs) && !using.some((u) => same(u, b));
    const other = free(defaultBuild__namespace) ? defaultBuild__namespace : secondBuild(outer);
    if (other && free(other)) {
      busy.push(theirs);
      build = other;
    } else build = theirs;
  }
  using.push(...busy, build);
  try {
    return render();
  } catch (error) {
    if (build !== theirs && !rendersHere(build)) throw Object.assign(new Error("[Unlayer] react-dom can't render with this React (React Server Components', as in Next.js's edge runtime): render emails in the Node.js runtime."), { cause: error });
    throw error;
  } finally {
    using.length -= busy.length + 1;
  }
}
function rendersHere(build) {
  try {
    build.renderToStaticMarkup(React4__default.default.createElement(() => null));
    return true;
  } catch {
    return false;
  }
}
function current() {
  return using[using.length - 1] ?? defaultBuild__namespace;
}
var renderToStaticMarkup = (element2, options) => current().renderToStaticMarkup(element2, options);
var renderToString = (element2, options) => current().renderToString(element2, options);

// src/utils/unwrap-root.ts
var ROOT_NAMES = /* @__PURE__ */ new Set(["Body", "Email", "Page", "Document"]);
var CONTAINER_NAMES = /* @__PURE__ */ new Set([...ROOT_NAMES, "Row", "Column"]);
var MEMO = Symbol.for("react.memo");
var FORWARD_REF = Symbol.for("react.forward_ref");
var PROVIDER = Symbol.for("react.provider");
var CONTEXT = Symbol.for("react.context");
function getDisplayName(element2) {
  return element2.type?.displayName;
}
function componentName(element2) {
  const type = element2.type;
  return type?.displayName || type?.name;
}
function isElementsType(type) {
  return !!type?.[UNLAYER_RENDER_KEY] || CONTAINER_NAMES.has(type?.displayName);
}
function isElementsComponent(element2) {
  return isElementsType(element2.type);
}
var ASYNC_TEMPLATE = "async and suspending templates aren't supported: load the data first and pass it as props";
var isThenable = (value) => typeof value?.then === "function";
var settle = (value) => {
  if (isThenable(value)) value.then(void 0, () => {
  });
};
function isAsyncComponent(type) {
  while (type?.$$typeof === MEMO) type = type.type;
  return (type?.$$typeof === FORWARD_REF ? type.render : type)?.[Symbol.toStringTag] === "AsyncFunction";
}
function callIsolated(call, prefix, providers = []) {
  let result;
  let error;
  let ran = false;
  let threw = false;
  let calling = false;
  const Probe = () => {
    if (calling) return null;
    ran = calling = true;
    threw = false;
    try {
      result = call();
    } catch (cause) {
      threw = true;
      error = cause;
    } finally {
      calling = false;
    }
    return null;
  };
  const probe = providers.reduceRight((inside, provider) => React4__default.default.cloneElement(provider, void 0, inside), React4__default.default.createElement(Probe));
  renderToStaticMarkup(probe, prefix ? { identifierPrefix: prefix } : void 0);
  settle(error);
  settle(result);
  if (threw) throw isThenable(error) ? new Error(ASYNC_TEMPLATE) : error;
  if (!ran) throw new Error("the template wasn't rendered");
  if (isThenable(result)) throw new Error(ASYNC_TEMPLATE);
  return result;
}
function unwrapRoot(element2, why = {}) {
  let current2 = element2;
  const providers = [];
  for (let depth = 0; ; depth++) {
    if (ROOT_NAMES.has(getDisplayName(current2) ?? "")) break;
    if (elementsOwn(current2)) break;
    if (depth === 20) {
      why.unread = "it wraps more than 20 components";
      break;
    }
    const type = current2.type;
    const props = current2.props;
    if (type?.$$typeof === MEMO) {
      current2 = React4__default.default.createElement(type.type, props);
      continue;
    }
    if ((type?.$$typeof === PROVIDER || type?.$$typeof === CONTEXT) && "value" in props) {
      const inside = React4__default.default.Children.toArray(props.children);
      if (inside.length !== 1 || !React4__default.default.isValidElement(inside[0])) break;
      providers.push(current2);
      current2 = inside[0];
      continue;
    }
    if (type === React4__default.default.Fragment || type === React4__default.default.StrictMode || type === React4__default.default.Profiler) {
      const inside = React4__default.default.Children.toArray(props.children);
      if (inside.length !== 1 || !React4__default.default.isValidElement(inside[0])) break;
      current2 = inside[0];
      continue;
    }
    let produced;
    const prefix = depth ? `w${depth}-` : void 0;
    if (type?.$$typeof === FORWARD_REF) produced = callIsolated(() => type.render({ ...props }, null), prefix, providers);
    else if (typeof type === "function" && !type.prototype?.isReactComponent) produced = callIsolated(() => type({ ...props }), prefix, providers);
    else {
      if (type?.prototype?.isReactComponent) why.unread = `<${componentName(current2)}> is a class component, which isn't called to find it`;
      break;
    }
    if (!React4__default.default.isValidElement(produced)) {
      if (holdsRoot(produced)) why.unread = "it doesn't return a root element";
      break;
    }
    current2 = produced;
  }
  if (!providers.length || !ROOT_NAMES.has(getDisplayName(current2) ?? "")) return current2;
  const children = providers.reduceRight((inside, provider) => React4__default.default.cloneElement(provider, void 0, inside), current2.props.children);
  return React4__default.default.cloneElement(current2, void 0, children);
}
var elementsOwn = (element2) => {
  const type = element2.type;
  return !!(type?.[UNLAYER_RENDER_KEY] || type?.[RECORDS]);
};
function holdsRoot(node) {
  if (Array.isArray(node)) return node.some(holdsRoot);
  if (!React4__default.default.isValidElement(node)) return false;
  return ROOT_NAMES.has(getDisplayName(node) ?? "") || !elementsOwn(node) && holdsRoot(node.props.children);
}
var UNWRAP_ADVICE = "Pass the root element (<Email>\u2026</Email>), or a function component that returns one.";
function htmlRoot(element2, api) {
  if (typeof element2.type === "string" || isElementsComponent(element2)) return element2;
  let reason;
  try {
    const why = {};
    const root = unwrapRoot(element2, why);
    if (ROOT_NAMES.has(getDisplayName(root) ?? "")) return root;
    if (!why.unread && !holdsRoot(root)) return element2;
    reason = why.unread ?? "its root is inside other markup";
  } catch (cause) {
    if (cause instanceof Error && cause.message === ASYNC_TEMPLATE) throw new Error(`[Unlayer] ${api}: ${ASYNC_TEMPLATE}.`);
    reason = cause instanceof Error ? cause.message : String(cause);
  }
  console.warn(`[Unlayer] ${api}: couldn't unwrap <${componentName(element2) || "wrapper"}> (${reason}): its root's fonts, lang, dir and phone styles are ignored. ${UNWRAP_ADVICE}`);
  return element2;
}
function guard(children, collection, inContainer = false) {
  return React4__default.default.Children.toArray(children).map((child) => {
    const placed = guarded(child, collection, inContainer);
    return placed === child && React4__default.default.isValidElement(child) ? React4__default.default.cloneElement(child) : placed;
  });
}
function guarded(child, collection, inContainer) {
  if (!React4__default.default.isValidElement(child)) return child;
  if (isElementsType(child.type)) {
    if (child.type[RECORDS]) return child;
    if (!olderContainer(child.type)) return bounded(child, collection);
    return recordedForOlder(child, collection, inContainer);
  }
  if (!child.type || typeof child.type === "object" && !("$$typeof" in child.type)) return child;
  if (typeof child.type === "string") {
    const inside = child.props.children;
    const element2 = inside !== void 0 && hasComponent(inside) ? React4__default.default.cloneElement(child, void 0, guard(inside, collection, inContainer)) : child;
    return collection.markup ? bounded(element2, collection) : element2;
  }
  if (child.type === React4__default.default.Fragment) {
    return React4__default.default.createElement(React4__default.default.Fragment, { key: child.key }, guard(child.props.children, collection, inContainer));
  }
  return bounded(child, collection);
}
function bounded(child, collection) {
  const at = collection.recorded.push({ kind: "boundary", element: child }) - 1;
  if (isAsyncComponent(child.type)) return marker(collection, at, "f");
  return React4__default.default.createElement(
    React4.Suspense,
    { key: child.key ?? `b${at}`, fallback: marker(collection, at, "f") },
    marker(collection, at, "o"),
    child,
    marker(collection, at, "c")
  );
}
function olderContainer(type) {
  return !/^(Row|Column)$/.test(type?.displayName ?? "") || /\b_config\b/.test(String(type));
}
function recordedForOlder(child, collection, inContainer) {
  const type = child.type;
  const props = child.props;
  if (type.displayName === "Row" || type.displayName === "Column") {
    const at2 = collection.recorded.push({ kind: type.displayName === "Row" ? "row" : "column", props }) - 1;
    return /* @__PURE__ */ jsxRuntime.jsxs(React4__default.default.Fragment, { children: [
      marker(collection, at2, "o"),
      guard(props.children, collection, true),
      marker(collection, at2, "c")
    ] }, child.key ?? `r${at2}`);
  }
  if (!type.__unlayerRender && !inContainer) return child;
  if (!type.__unlayerRender) {
    console.warn(`[Unlayer] <${type.displayName}> is a root: it can't be placed in a Row or Column, so it's left out.`);
    return null;
  }
  const at = collection.recorded.push({ kind: "block", type: child.type, props }) - 1;
  return React4__default.default.cloneElement(marker(collection, at), { key: child.key ?? `b${at}` });
}
function hasComponent(children) {
  return React4__default.default.Children.toArray(children).some(
    (child) => React4__default.default.isValidElement(child) && (typeof child.type === "string" || child.type === React4__default.default.Fragment ? hasComponent(child.props.children) : !isElementsType(child.type))
  );
}
function Sentinel({ record, real }) {
  let collected2 = !!collecting()?.blind;
  if (!collected2) {
    try {
      collected2 = React4__default.default.useId().slice(1).startsWith(COLLECTING_ID);
    } catch {
    }
  }
  return collected2 ? record() : within(null, real);
}
var named = /* @__PURE__ */ new Map();
function whileCollecting(record, real, name) {
  let type = named.get(name);
  if (!type) named.set(name, type = Object.assign((props) => Sentinel(props), { displayName: name }));
  return React4__default.default.createElement(type, { record, real });
}
function recordContainer(kind, props) {
  const collection = collecting();
  const at = collection.recorded.push({ kind, props }) - 1;
  return /* @__PURE__ */ jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [
    marker(collection, at, "o"),
    guard(props.children, collection, true),
    marker(collection, at, "c")
  ] });
}
function recordBlock(type, props) {
  const collection = collecting();
  const at = collection.recorded.push({ kind: "block", type, props }) - 1;
  return marker(collection, at);
}

// src/utils/image-sizing.ts
function toPx(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : void 0;
  if (typeof value !== "string") return void 0;
  const m = /^(\d+(?:\.\d+)?)(?:px)?$/.exec(value.trim());
  return m ? parseFloat(m[1]) : void 0;
}
function edges(value) {
  if (value == null) return { left: 0, right: 0 };
  if (typeof value === "number") return { left: value, right: value };
  const parts2 = String(value).trim().split(/\s+/).map((p) => parseFloat(p) || 0);
  if (parts2.length === 1) return { left: parts2[0], right: parts2[0] };
  if (parts2.length === 2 || parts2.length === 3)
    return { left: parts2[1], right: parts2[1] };
  return { left: parts2[3] || 0, right: parts2[1] || 0 };
}
function borderEdges(border) {
  if (!border || typeof border !== "object") return { left: 0, right: 0 };
  const b = border;
  const width = (v) => parseFloat(`${v ?? ""}`) || 0;
  return {
    left: width(b.borderLeftWidth),
    right: width(b.borderRightWidth)
  };
}
function fixedContentWidth(contentWidth) {
  if (typeof contentWidth === "number")
    return Number.isFinite(contentWidth) ? contentWidth : void 0;
  if (typeof contentWidth === "string") {
    const m = /^(\d+(?:\.\d+)?)(?:px)?$/.exec(contentWidth.trim());
    if (m) return parseFloat(m[1]);
  }
  return void 0;
}
var FALLBACK_BODY_CONTENT_WIDTH = 500;
var DEFAULT_CONTAINER_PADDING = "10px";
function bodyContentWidthPx(contentWidth, fallback = FALLBACK_BODY_CONTENT_WIDTH) {
  return fixedContentWidth(contentWidth) ?? fallback;
}
function contentSlotWidth(ctx) {
  const { bodyValues = {}, rowValues = {}, columnValues = {} } = ctx;
  const rowCells = ctx.rowCells && ctx.rowCells.length ? ctx.rowCells : [1];
  const columnIndex = ctx.columnIndex ?? 0;
  const bodyWidth = bodyContentWidthPx(bodyValues.contentWidth);
  const bp = edges(bodyValues.padding);
  const bb = borderEdges(bodyValues.border);
  const bodyAvail = bodyWidth - bp.left - bp.right - bb.left - bb.right;
  const rp = edges(rowValues.padding);
  const rb = borderEdges(rowValues.border);
  const rowAvail = bodyAvail - rp.left - rp.right - rb.left - rb.right;
  const rowSpan = rowCells.reduce((a, b) => a + b, 0) || 1;
  const colSpan = rowCells[columnIndex] || 1;
  const colWidth = colSpan / rowSpan * rowAvail;
  const cp = edges(columnValues.padding);
  const cb = borderEdges(columnValues.border);
  const colAvail = colWidth - cp.left - cp.right - cb.left - cb.right;
  const ip = edges(ctx.containerPadding ?? DEFAULT_CONTAINER_PADDING);
  return colAvail - ip.left - ip.right;
}
var PERCENT = /^\d+(?:\.\d+)?%$/;
function round2(n) {
  return Math.round(n * 100) / 100;
}
function pinImageSrc(src, availableWidth) {
  if (!src || typeof src !== "object") return src;
  if (src.autoWidth !== false) return src;
  const maxWidth = src.maxWidth;
  if (typeof maxWidth === "string" && PERCENT.test(maxWidth.trim())) return src;
  const pinPx = toPx(maxWidth);
  if (pinPx == null) return src;
  const avail = availableWidth && availableWidth > 0 ? availableWidth : void 0;
  const pct = avail ? pinPx >= avail ? 100 : round2(pinPx / avail * 100) : 100;
  return { ...src, autoWidth: false, maxWidth: `${pct}%` };
}

// ../shared/dist/index.js
var DEFAULT_CONFIG = {
  cdnBaseUrl: "https://cdn.tools.unlayer.com",
  mode: "web"
};
var ColumnLayouts = {
  OneColumn: {
    name: "OneColumn",
    description: "One full column (100%)",
    cells: [1],
    expectedColumns: 1,
    widths: ["100%"]
  },
  TwoEqual: {
    name: "TwoEqual",
    description: "Two equal columns (50% + 50%)",
    cells: [1, 1],
    expectedColumns: 2,
    widths: ["50%", "50%"]
  },
  TwoWideNarrow: {
    name: "TwoWideNarrow",
    description: "Two columns: wide + narrow (67% + 33%)",
    cells: [2, 1],
    expectedColumns: 2,
    widths: ["66.67%", "33.33%"]
  },
  TwoNarrowWide: {
    name: "TwoNarrowWide",
    description: "Two columns: narrow + wide (33% + 67%)",
    cells: [1, 2],
    expectedColumns: 2,
    widths: ["33.33%", "66.67%"]
  },
  ThreeEqual: {
    name: "ThreeEqual",
    description: "Three equal columns (33% + 33% + 33%)",
    cells: [1, 1, 1],
    expectedColumns: 3,
    widths: ["33.33%", "33.33%", "33.33%"]
  },
  ThreeNarrowWideNarrow: {
    name: "ThreeNarrowWideNarrow",
    description: "Three columns: narrow + wide + narrow (25% + 50% + 25%)",
    cells: [1, 2, 1],
    expectedColumns: 3,
    widths: ["25%", "50%", "25%"]
  },
  FourEqual: {
    name: "FourEqual",
    description: "Four equal columns (25% + 25% + 25% + 25%)",
    cells: [1, 1, 1, 1],
    expectedColumns: 4,
    widths: ["25%", "25%", "25%", "25%"]
  },
  FiveEqual: {
    name: "FiveEqual",
    description: "Five equal columns (20% + 20% + 20% + 20% + 20%)",
    cells: [1, 1, 1, 1, 1],
    expectedColumns: 5,
    widths: ["20%", "20%", "20%", "20%", "20%"]
  }
};
function validateColumnLayout(layout, childrenCount) {
  if (layout.expectedColumns !== childrenCount) {
    throw new Error(`${layout.name} layout expects ${layout.expectedColumns} <Column> components, but got ${childrenCount}. Layout: ${layout.description}. Make sure you have exactly ${layout.expectedColumns} <Column> children.`);
  }
}
var EMPTY_TEXT_JSON = '{"root":{"children":[{"children":[],"format":"","indent":0,"type":"extended-paragraph","version":1,"textFormat":0,"textStyle":""}],"format":"","indent":0,"type":"root","version":1}}';
function textToTextJson(text) {
  if (!text) return EMPTY_TEXT_JSON;
  const escaped = JSON.stringify(text);
  return `{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":${escaped},"type":"extended-text","version":1}],"format":"","indent":0,"type":"extended-paragraph","version":1,"textFormat":0,"textStyle":""}],"format":"","indent":0,"type":"root","version":1}}`;
}
var FORMAT_TAGS = [
  [1, "<strong>", "</strong>"],
  // bold
  [2, "<em>", "</em>"],
  // italic
  [4, "<s>", "</s>"],
  // strikethrough
  [8, "<u>", "</u>"],
  // underline
  [16, "<code>", "</code>"],
  // code
  [32, "<sub>", "</sub>"],
  // subscript
  [64, "<sup>", "</sup>"]
  // superscript
];
function escapeHtml(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function textNodeToHtml(node) {
  let html = escapeHtml(node.text || "");
  const style = node.style;
  const format = node.format || 0;
  let openTags = "";
  let closeTags = "";
  for (const [bit, open, close] of FORMAT_TAGS) {
    if (format & bit) {
      openTags += open;
      closeTags = close + closeTags;
    }
  }
  html = openTags + html + closeTags;
  if (style) {
    html = `<span style="${escapeHtml(style)}">${html}</span>`;
  }
  return html;
}
var NUMERIC_ALIGN = {
  1: "left",
  2: "center",
  3: "right",
  4: "justify"
};
function dirAttribute(direction) {
  return direction === "ltr" || direction === "rtl" ? ` dir="${direction}"` : "";
}
function paragraphAlign(format) {
  if (typeof format === "string") {
    return ["left", "center", "right", "justify"].includes(format) ? format : void 0;
  }
  if (typeof format === "number") {
    return NUMERIC_ALIGN[format];
  }
  return void 0;
}
function paragraphNodeToHtml(node, childrenHtml22) {
  const isInlineTool = !!node.isInlineTool;
  const tag = isInlineTool ? "span" : "p";
  const dir = dirAttribute(node.direction);
  const styleParts = [];
  if (node.style) {
    styleParts.push(String(node.style).replace(/;+\s*$/, ""));
  }
  if (!isInlineTool) {
    styleParts.push(
      "margin: 0px",
      "margin-block-start: 0px",
      "margin-block-end: 0px"
    );
  }
  const indent = Number(node.indent) || 0;
  if (indent > 0) {
    styleParts.push(`padding-inline-start: ${indent * 40}px`);
  }
  const align = paragraphAlign(node.format);
  if (align) {
    styleParts.push(`text-align: ${align}`);
  }
  const style = styleParts.length > 0 ? ` style="${escapeHtml(styleParts.join("; ") + ";")}"` : "";
  return `<${tag}${dir}${style}>${childrenHtml22 || "<br>"}</${tag}>`;
}
function nodeToHtml(node) {
  if (!node || typeof node !== "object") return "";
  const type = node.type;
  if (type === "text" || type === "extended-text") {
    return textNodeToHtml(node);
  }
  if (type === "linebreak") {
    return "<br>";
  }
  const childrenHtml22 = (node.children || []).map(nodeToHtml).join("");
  switch (type) {
    case "root":
      return childrenHtml22;
    case "paragraph":
    case "extended-paragraph":
      return paragraphNodeToHtml(node, childrenHtml22);
    case "heading": {
      const tag = /^h[1-6]$/.test(node.tag) ? node.tag : "h1";
      const dir = dirAttribute(node.direction);
      return `<${tag}${dir}>${childrenHtml22}</${tag}>`;
    }
    case "link": {
      const href = node.url ? ` href="${escapeHtml(node.url)}"` : "";
      const target = node.target ? ` target="${escapeHtml(node.target)}"` : "";
      const rel = node.rel ? ` rel="${escapeHtml(node.rel)}"` : "";
      return `<a${href}${target}${rel}>${childrenHtml22}</a>`;
    }
    case "list": {
      const tag = node.listType === "number" ? "ol" : "ul";
      return `<${tag}>${childrenHtml22}</${tag}>`;
    }
    case "listitem":
      return `<li>${childrenHtml22}</li>`;
    default:
      return childrenHtml22;
  }
}
function generateHtmlFromTextJson(textJson) {
  if (!textJson) return "";
  try {
    const parsed = JSON.parse(textJson);
    if (parsed.__html) return parsed.__html;
    return nodeToHtml(parsed.root);
  } catch {
    return "";
  }
}
function htmlToTextJson(html) {
  if (!html) return EMPTY_TEXT_JSON;
  return JSON.stringify({ __html: html });
}
function mergeValues(defaults, userValues) {
  if (!userValues) return defaults;
  const result = { ...defaults };
  for (const key of Object.keys(userValues)) {
    const userVal = userValues[key];
    const defaultVal = defaults[key];
    if (userVal !== null && defaultVal !== null && typeof userVal === "object" && typeof defaultVal === "object" && !Array.isArray(userVal) && !Array.isArray(defaultVal)) {
      result[key] = mergeValues(defaultVal, userVal);
    } else {
      result[key] = userVal;
    }
  }
  return result;
}
var CHANNEL = /^-?(?:\d+(?:\.\d*)?|\.\d+)%?$/;
function normalizeColor(value) {
  const text = value.trim();
  const open = text.indexOf("(");
  if (!/^rgba?$/i.test(text.slice(0, open)) || !text.endsWith(")")) return value;
  const [rgb, slashed, extra] = text.slice(open + 1, -1).split("/");
  const channels = rgb.trim().split(/\s*,\s*|\s+/);
  if (slashed !== void 0) channels.push(slashed.trim());
  if (extra !== void 0 || channels.length > 4 || channels.length < (slashed === void 0 ? 3 : 4) || !channels.every((c) => CHANNEL.test(c))) return value;
  const num = (text2, full) => text2.endsWith("%") ? parseFloat(text2) / 100 * full : parseFloat(text2);
  const [r, g, b] = channels.slice(0, 3).map((text2) => Math.max(0, Math.min(255, Math.round(num(text2, 255)))));
  const alpha = channels[3] === void 0 ? 1 : num(channels[3], 1);
  if (alpha < 1) return `rgba(${r}, ${g}, ${b}, ${Math.max(0, alpha)})`;
  return `#${[r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("")}`;
}
function cssValueSafe(text) {
  if (/[<>{};]|\/\*|\*\//.test(text)) return false;
  const open = [];
  for (const c of text) {
    if (c === "(" || c === "[") open.push(c === "(" ? ")" : "]");
    else if ((c === ")" || c === "]") && open.pop() !== c) return false;
  }
  return !open.length;
}
function cssSafeValues(value) {
  if (typeof value === "string") return cssValueSafe(value) ? value : void 0;
  if (Array.isArray(value)) return value.map(cssSafeValues);
  if (!isPlainObject(value)) return value;
  const out = {};
  for (const [k, v] of Object.entries(value)) {
    const safe = cssSafeValues(v);
    if (safe !== void 0 || v === void 0) out[k] = safe;
  }
  return out;
}
function normalizeFontStack(value) {
  return value.replace(/"([^"]*)"?/g, (_, name) => `'${name.replace(/'/g, "\\'")}'`);
}
function normalizeCssValues(value, key) {
  if (typeof value === "string") return key === "fontFamily" ? normalizeFontStack(value) : key === "color" || key?.endsWith("Color") ? normalizeColor(value) : value;
  if (Array.isArray(value)) return value.map((item) => normalizeCssValues(item));
  if (!isPlainObject(value)) return value;
  const out = {};
  for (const [k, v] of Object.entries(value)) out[k] = normalizeCssValues(v, key === "fontFamily" ? key : k);
  return out;
}
function isPlainObject(value) {
  if (value === null || typeof value !== "object") return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}
var nestedStructureCache = /* @__PURE__ */ new WeakMap();
function analyzeNestedStructure(defaultValues) {
  const cached = nestedStructureCache.get(defaultValues);
  if (cached) return cached;
  const nestedGroups = /* @__PURE__ */ new Map();
  for (const [key, value] of Object.entries(defaultValues)) {
    if (key === "_meta" || key === "text" || key === "textJson" || key === "children") {
      continue;
    }
    if (value && typeof value === "object" && !Array.isArray(value) && Object.keys(value).length > 0) {
      const props = new Set(Object.keys(value));
      nestedGroups.set(key, props);
    }
  }
  nestedStructureCache.set(defaultValues, nestedGroups);
  return nestedGroups;
}
var PX_SIZE_KEYS = [
  "fontSize",
  "padding",
  "containerPadding",
  "borderRadius",
  "letterSpacing"
];
function normalizeCssProps(props) {
  if (typeof props.fontFamily === "string") {
    const v = props.fontFamily;
    props.fontFamily = { label: v, value: v };
  }
  if (typeof props.fontWeight === "string" && /^\d+$/.test(props.fontWeight.trim())) {
    props.fontWeight = Number(props.fontWeight.trim());
  }
  if (typeof props.lineHeight === "number") {
    props.lineHeight = String(props.lineHeight);
  }
  for (const key of PX_SIZE_KEYS) {
    const v = props[key];
    if (typeof v === "number") {
      props[key] = `${v}px`;
    } else if (typeof v === "string" && /^\d+$/.test(v.trim())) {
      props[key] = `${v.trim()}px`;
    }
  }
}
var ENTITIES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
function escapeText(text, quotes) {
  return text.replace(quotes ? /[&<>"']/g : /[&<>]/g, (c) => ENTITIES[c]);
}
function escapeKeepingTags(text, quotes, escape = (part) => escapeText(part, quotes)) {
  return text.split(/(<%[\w.]+%>)/).map((part, i) => i % 2 ? part : escape(part)).join("");
}
var menuText = (text) => escapeKeepingTags(text, false, (part) => part.replace(/&(?!(?:#\d+|#x[\da-f]+|[a-z][\da-z]*);)|[<>"]/gi, (c) => ENTITIES[c]));
function flattenChildrenText(node, breaks) {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map((child) => flattenChildrenText(child, breaks)).join("");
  if (typeof node === "object" && "props" in node) {
    return breaks && node.type === "br" ? "<br/>" : flattenChildrenText(node.props?.children, breaks);
  }
  return "";
}
function childrenHtml(children) {
  return flattenChildrenText(children, true).split(/(<br\s*\/?>)/i).map((part, i) => i % 2 ? "<br/>" : escapeKeepingTags(part)).join("");
}
function mapSemanticProps(props, defaultValues, componentType) {
  const { children, values, mobile, hideOnMobile: hideMobileProp, hideOnDesktop: hideDesktopProp, ...restProps } = props;
  const hideOnMobile = componentType === "Column" ? void 0 : hideMobileProp;
  const hideOnDesktop = componentType === "Column" ? void 0 : hideDesktopProp;
  const userProps = { ...restProps };
  const result = values ? { ...values } : {};
  if (children !== void 0 && !result.text && !result.textJson) {
    const textContent = typeof children === "string" ? children : flattenChildrenText(children);
    if (componentType === "Paragraph") {
      result.textJson = textToTextJson(textContent);
    } else if (componentType === "Heading" || componentType === "Button") {
      result.text = childrenHtml(children);
    } else {
      result.text = textContent;
    }
  }
  const textFromEscapeHatch = result.text;
  const textFromProp = userProps.text;
  const textProp = textFromEscapeHatch || textFromProp;
  if (componentType === "Paragraph" && textProp && !result.textJson) {
    result.textJson = textFromEscapeHatch ? htmlToTextJson(String(textProp)) : textToTextJson(String(textProp));
    delete result.text;
    delete userProps.text;
  }
  const htmlProp = userProps.html || result.html;
  if (componentType === "Paragraph" && htmlProp && !result.textJson) {
    result.textJson = htmlToTextJson(String(htmlProp));
    delete userProps.html;
    delete result.html;
  }
  const canonicalizeLink = (v) => {
    if (typeof v === "string") {
      return { name: "web", values: { href: v, target: "_blank" } };
    }
    if (v && typeof v === "object" && "name" in v && v.attrs && typeof v.attrs === "object") {
      const { href: attrsHref, target: attrsTarget, ...customAttrs } = v.attrs;
      if (attrsHref !== void 0 || attrsTarget !== void 0) {
        const linkValues = { ...v.values };
        if (!linkValues.href && attrsHref !== void 0) linkValues.href = attrsHref;
        if (!linkValues.target && attrsTarget !== void 0) linkValues.target = attrsTarget;
        const next = { ...v, values: linkValues };
        if (Object.keys(customAttrs).length) next.attrs = customAttrs;
        else delete next.attrs;
        return next;
      }
    }
    return v;
  };
  for (const key of ["href", "action"]) {
    if (userProps[key] !== void 0) userProps[key] = canonicalizeLink(userProps[key]);
    if (result[key] !== void 0) result[key] = canonicalizeLink(result[key]);
  }
  normalizeCssProps(userProps);
  const nestedGroups = analyzeNestedStructure(defaultValues);
  const nested = {};
  const flat = {};
  for (const [key, value] of Object.entries(userProps)) {
    if (value === void 0) continue;
    if (nestedGroups.has(key)) {
      nested[key] = value;
      continue;
    }
    let belongsToGroup = false;
    for (const [groupName, groupProps] of nestedGroups.entries()) {
      if (groupProps.has(key)) {
        nested[groupName] = nested[groupName] || {};
        nested[groupName][key] = value;
        belongsToGroup = true;
        break;
      }
    }
    if (!belongsToGroup) {
      flat[key] = value;
    }
  }
  const final = {
    ...result,
    ...flat
  };
  for (const [groupName, groupValues] of Object.entries(nested)) {
    if (Object.keys(groupValues).length > 0) {
      final[groupName] = {
        ...result[groupName],
        ...groupValues
      };
    }
  }
  if (defaultValues && typeof defaultValues === "object" && "border" in defaultValues) {
    const borderSideRe = /^border(Top|Right|Bottom|Left)(Width|Style|Color)$/;
    const collected2 = {};
    for (const key of Object.keys(final)) {
      if (borderSideRe.test(key)) {
        collected2[key] = final[key];
        delete final[key];
      }
    }
    if (Object.keys(collected2).length > 0) {
      final.border = { ...final.border || {}, ...collected2 };
    }
    if (final.border && typeof final.border === "object") {
      const b = { ...final.border };
      for (const key of Object.keys(b)) {
        if (!/Width$/.test(key)) continue;
        const v = b[key];
        if (typeof v === "number") b[key] = `${v}px`;
        else if (typeof v === "string" && /^\d+(?:\.\d+)?$/.test(v.trim())) b[key] = `${v.trim()}px`;
      }
      final.border = b;
    }
  }
  if (mobile || hideOnMobile !== void 0 || hideOnDesktop !== void 0) {
    const overrides = { ...final._override };
    if (mobile || hideOnMobile !== void 0) {
      const { width, maxWidth, autoWidth, ...phone } = mobile || {};
      const mapped = mapSemanticProps(phone, defaultValues, componentType);
      if (componentType === "Image" && (width !== void 0 || maxWidth !== void 0 || autoWidth !== void 0)) {
        mapped.src = {
          ...overrides.mobile?.src || {},
          ...autoWidth !== void 0 ? { autoWidth } : { autoWidth: false },
          ...width !== void 0 || maxWidth !== void 0 ? { maxWidth: width ?? maxWidth } : {}
        };
      } else if (width !== void 0 || autoWidth !== void 0) {
        const key = componentType === "Button" ? "size" : "width";
        mapped[key] = { autoWidth: autoWidth ?? false, ...width !== void 0 ? { width: typeof width === "number" ? `${width}px` : width } : {} };
      }
      overrides.mobile = { ...overrides.mobile, ...cssSafeValues(mapped), ...hideOnMobile !== void 0 ? { hideMobile: hideOnMobile } : {} };
    }
    if (hideOnDesktop !== void 0) overrides.desktop = { ...overrides.desktop, hideDesktop: hideOnDesktop };
    final._override = overrides;
  }
  if (componentType === "Row" && final.noStackMobile === true) {
    final._override = { ...final._override, mobile: { ...final._override?.mobile, noStackMobile: true } };
    final.noStackMobile = false;
  }
  return normalizeCssValues(final);
}
function normalizeLinkValue(value) {
  if (value == null) return void 0;
  if (typeof value === "string") {
    return { url: value, target: "_blank" };
  }
  if (typeof value !== "object") return void 0;
  const v = value;
  if ("url" in v) return v;
  if ("name" in v && (v.values && typeof v.values === "object" || v.attrs && typeof v.attrs === "object")) {
    const inner = v.values && typeof v.values === "object" ? v.values : {};
    const attrs = v.attrs && typeof v.attrs === "object" ? v.attrs : {};
    const { href: attrsHref, target: attrsTarget, ...customAttrs } = attrs;
    return {
      url: inner.href || attrsHref || "",
      target: inner.target || attrsTarget || "_blank",
      ...customAttrs
    };
  }
  return void 0;
}
function safeLink(link) {
  const url = link.url === void 0 || link.url === null ? link.url : String(link.url);
  return typeof url === "string" ? { ...link, url: url.replace(/<%[\w.]+%>|["<>]/g, (c) => c.length > 1 ? c : encodeURIComponent(c)) } : link;
}
function normalizeValuesForExporter(values, componentName2, mode) {
  if (values == null || typeof values !== "object") return values;
  const out = { ...values };
  for (const key of ["href", "action"]) {
    if (out[key] !== void 0) {
      const normalized = normalizeLinkValue(out[key]);
      if (normalized !== void 0) out[key] = safeLink(normalized);
    }
  }
  if (componentName2 === "Button" && typeof out.text === "string") {
    out.text = escapeKeepingTags(out.text, true);
  }
  if (componentName2 === "Menu" && out.menu && Array.isArray(out.menu.items)) {
    out.menu = {
      ...out.menu,
      items: out.menu.items.map((item) => {
        if (!item) return item;
        const next = mode === "email" && typeof item.text === "string" ? { ...item, text: menuText(item.text) } : item;
        if (next.link === void 0) return next;
        const normalized = normalizeLinkValue(next.link);
        if (normalized === void 0) return next;
        return { ...next, link: safeLink(normalized) };
      })
    };
  }
  if (componentName2 === "Social" && out.icons && Array.isArray(out.icons.icons)) {
    const named2 = (icon) => mode === "email" && typeof icon.name === "string" ? { ...icon, name: escapeText(icon.name, true) } : icon;
    out.icons = { ...out.icons, icons: out.icons.icons.map((icon) => icon && typeof icon === "object" ? named2(safeLink(icon)) : icon) };
  }
  return out;
}
var HTML_ENTITIES = {
  // Core markup + whitespace
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&apos;": "'",
  "&nbsp;": " ",
  // Dashes, quotes, and typographic punctuation
  "&mdash;": "\u2014",
  "&ndash;": "\u2013",
  "&laquo;": "\xAB",
  "&raquo;": "\xBB",
  "&lsquo;": "\u2018",
  "&rsquo;": "\u2019",
  "&ldquo;": "\u201C",
  "&rdquo;": "\u201D",
  "&bull;": "\u2022",
  "&middot;": "\xB7",
  "&hellip;": "\u2026",
  // Currency
  "&cent;": "\xA2",
  "&pound;": "\xA3",
  "&yen;": "\xA5",
  "&euro;": "\u20AC",
  // Legal / trademark
  "&copy;": "\xA9",
  "&reg;": "\xAE",
  "&trade;": "\u2122",
  "&sect;": "\xA7",
  "&para;": "\xB6",
  // Math and misc symbols
  "&deg;": "\xB0",
  "&plusmn;": "\xB1",
  "&times;": "\xD7",
  "&divide;": "\xF7",
  "&micro;": "\xB5",
  "&frac14;": "\xBC",
  "&frac12;": "\xBD",
  "&frac34;": "\xBE",
  // Latin-1 accented letters (common in European names/words)
  "&szlig;": "\xDF",
  "&agrave;": "\xE0",
  "&aacute;": "\xE1",
  "&acirc;": "\xE2",
  "&atilde;": "\xE3",
  "&auml;": "\xE4",
  "&aring;": "\xE5",
  "&aelig;": "\xE6",
  "&ccedil;": "\xE7",
  "&egrave;": "\xE8",
  "&eacute;": "\xE9",
  "&ecirc;": "\xEA",
  "&euml;": "\xEB",
  "&igrave;": "\xEC",
  "&iacute;": "\xED",
  "&icirc;": "\xEE",
  "&iuml;": "\xEF",
  "&ntilde;": "\xF1",
  "&ograve;": "\xF2",
  "&oacute;": "\xF3",
  "&ocirc;": "\xF4",
  "&otilde;": "\xF5",
  "&ouml;": "\xF6",
  "&oslash;": "\xF8",
  "&ugrave;": "\xF9",
  "&uacute;": "\xFA",
  "&ucirc;": "\xFB",
  "&uuml;": "\xFC"
};
function decodeEntities(text) {
  let result = text.replace(/&\w+;/g, (match) => HTML_ENTITIES[match] ?? match);
  result = result.replace(
    /&#(\d+);/g,
    (_, code) => String.fromCharCode(parseInt(code, 10))
  );
  result = result.replace(
    /&#x([0-9a-fA-F]+);/g,
    (_, code) => String.fromCharCode(parseInt(code, 16))
  );
  return result;
}
function htmlToPlainText(html) {
  if (!html) return "";
  let text = html;
  text = text.replace(/<[^>]+data-skip-in-text="true"[^>]*>[\s\S]*?<\/[^>]+>/gi, "");
  text = text.replace(/<head[\s\S]*?<\/head>/gi, "");
  text = text.replace(/<style[\s\S]*?<\/style>/gi, "");
  text = text.replace(/<script[\s\S]*?<\/script>/gi, "");
  text = text.replace(/<br\s*\/?>/gi, "\n");
  text = text.replace(/<h[12][^>]*>([\s\S]*?)<\/h[12]>/gi, (_, content) => {
    const clean = content.replace(/<[^>]+>/g, "").trim();
    const upper = clean.replace(/&#?\w+;|[^&]+|&/g, (part) => /^&#?\w+;$/.test(part) ? part : part.toUpperCase());
    return "\n" + upper + "\n";
  });
  text = text.replace(/<h[3-6][^>]*>([\s\S]*?)<\/h[3-6]>/gi, (_, content) => {
    const clean = content.replace(/<[^>]+>/g, "").trim();
    return "\n" + clean + "\n";
  });
  text = text.replace(/<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, (_, href, content) => {
    const clean = content.replace(/<[^>]+>/g, "").trim();
    if (clean === href || clean === decodeEntities(href)) {
      return clean;
    }
    return `${clean} (${href})`;
  });
  text = text.replace(/<img[^>]+alt=["']([^"']+)["'][^>]*\/?>/gi, (_, alt) => {
    return `[${alt}]`;
  });
  text = text.replace(/<img[^>]*\/?>/gi, "");
  text = text.replace(/<hr[^>]*\/?>/gi, "\n---\n");
  text = text.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_, content) => {
    const clean = content.replace(/<[^>]+>/g, "").trim();
    return "- " + clean + "\n";
  });
  text = text.replace(/<\/(?:p|div|tr|blockquote|section|article|header|footer|main|nav|aside)>/gi, "\n");
  text = text.replace(/<\/(?:ul|ol|table|thead|tbody|tfoot)>/gi, "\n");
  text = text.replace(/<\/(?:td|th)>/gi, "	");
  text = text.replace(/<[^>]+>/g, "");
  text = decodeEntities(text);
  text = text.replace(/\t/g, "  ");
  text = text.replace(/[^\S\n]+/g, " ");
  text = text.split("\n").map((line) => line.trim()).join("\n");
  text = text.replace(/\n{3,}/g, "\n\n");
  text = text.trim();
  return text;
}
var UNLAYER_RENDER_KEY = "__unlayerRender";
var UNLAYER_CONFIG_KEY = "__unlayerItemConfig";
var ErrorFallback = ({
  type,
  className,
  style
}) => /* @__PURE__ */ jsxRuntime.jsx("div", { className, style, children: /* @__PURE__ */ jsxRuntime.jsxs(
  "div",
  {
    style: {
      padding: "20px",
      backgroundColor: "#fee",
      border: "1px solid #fcc",
      borderRadius: "4px",
      color: "#c33",
      textAlign: "center",
      fontFamily: "system-ui, sans-serif"
    },
    children: [
      /* @__PURE__ */ jsxRuntime.jsxs("strong", { children: [
        type,
        " failed to render."
      ] }),
      /* @__PURE__ */ jsxRuntime.jsx("br", {}),
      /* @__PURE__ */ jsxRuntime.jsx("small", { children: "Check console for details." })
    ]
  }
) });
function nextHtmlId(config, prefix) {
  if (!config) return `${prefix}_1`;
  const ids = config.__ids ?? (config.__ids = {});
  ids[prefix] = (ids[prefix] || 0) + 1;
  return `${prefix}_${ids[prefix]}`;
}
function safeName(value, spaces = false) {
  const text = String(value ?? "");
  return spaces ? text.replace(/[\t\n\f\r]/g, " ").replace(/["'<>&`\u0000-\u001f\u007f]/g, "") : text.replace(/["'<>&`\s\u0000-\u001f\u007f]/g, "");
}
var safeMeta = (meta) => ({ ...meta, htmlID: safeName(meta.htmlID), htmlClassNames: safeName(meta.htmlClassNames, true) });
function textDirectionOf(value) {
  const dir = typeof value === "string" ? value.trim().toLowerCase() : "";
  return dir === "ltr" || dir === "rtl" || dir === "auto" ? dir : void 0;
}
function renderComponent(config) {
  const { type, values, className, style, args = [], innerHTML, _config, exporter, metaContext } = config;
  try {
    const cfg = _config ?? DEFAULT_CONFIG;
    const exporterConfig = {
      generateHtmlFromTextJson,
      toSafeHtml: cfg.toSafeHtml,
      textDirection: textDirectionOf(cfg.textDirection),
      cdnBaseUrl: cfg.cdnBaseUrl
    };
    let html;
    if (innerHTML !== void 0) {
      html = exporter(innerHTML, values, ...args);
    } else {
      const meta = {
        exporterConfig,
        mergeTagState: cfg.mergeTagState,
        ...metaContext ?? {}
      };
      html = exporter(values, ...args, void 0, meta);
    }
    html = typeof html === "string" ? html : String(html);
    return /* @__PURE__ */ jsxRuntime.jsx(
      "div",
      {
        className,
        style,
        dangerouslySetInnerHTML: { __html: html }
      }
    );
  } catch (error) {
    console.error(`${type} rendering failed:`, error);
    return /* @__PURE__ */ jsxRuntime.jsx(
      ErrorFallback,
      {
        type,
        error,
        className,
        style
      }
    );
  }
}
function createItemComponent(config) {
  function renderFn(props) {
    const {
      // Base props
      mode: modeProp,
      className,
      style,
      // Internal props
      index = 0,
      _metaHtmlId,
      colIndex = 0,
      cells = [],
      bodyValues = {},
      rowValues = {},
      columnValues = {},
      _config,
      // Children
      children,
      // Rest are semantic props
      ...restProps
    } = props;
    const mode = modeProp ?? _config?.mode ?? "web";
    const mappedValues = config.propMapper({
      children,
      ...restProps
    });
    const finalValues = mergeValues(config.defaultValues, mappedValues);
    const metaName = config.metaName ?? config.name.toLowerCase();
    const meta = {
      htmlID: _metaHtmlId ?? `u_content_${metaName}_${index + 1}`,
      htmlClassNames: `u_content_${metaName}`,
      ...finalValues._meta || {}
    };
    const valuesWithMeta = { ...finalValues, _meta: safeMeta(meta) };
    const safeBodyValues = {
      contentWidth: "500px",
      ...bodyValues
    };
    const valuesForExporter = normalizeValuesForExporter(
      valuesWithMeta,
      config.name,
      mode
    );
    const exportSrc = valuesForExporter.src;
    if (exportSrc && typeof exportSrc === "object" && exportSrc.autoWidth === false) {
      const availableWidth = contentSlotWidth({
        bodyValues: safeBodyValues,
        rowValues,
        rowCells: cells,
        columnIndex: colIndex,
        columnValues,
        containerPadding: props.containerPadding ?? props.values?.containerPadding
      });
      valuesForExporter.src = pinImageSrc(exportSrc, availableWidth);
    }
    const exporter = config.exporters[mode] || config.exporters.web;
    return renderComponent({
      type: config.name,
      values: valuesForExporter,
      className,
      style,
      args: [index, colIndex, cells, safeBodyValues, rowValues],
      // The 8th arg the exporters actually read: column/body context for
      // width-aware rendering (Image's available-width calc), mirroring the editor.
      metaContext: {
        columnIndex: colIndex,
        columnValues,
        rowCells: cells,
        rowValues,
        bodyValues: safeBodyValues
      },
      _config,
      exporter
    });
  }
  const ItemComponent = (props) => {
    if (collecting()) return whileCollecting(() => recordBlock(ItemComponent, props), () => renderFn(props), ItemComponent.displayName ?? "Block");
    return renderFn(props);
  };
  ItemComponent.displayName = config.displayName || config.name;
  ItemComponent[UNLAYER_RENDER_KEY] = renderFn;
  ItemComponent[RECORDS] = true;
  ItemComponent[UNLAYER_CONFIG_KEY] = {
    name: config.name,
    defaultValues: config.defaultValues,
    propMapper: config.propMapper,
    contentType: config.contentType,
    slug: config.slug,
    metaName: config.metaName,
    head: config.head,
    omitEmptyOutput: config.omitEmptyOutput
  };
  return ItemComponent;
}

// src/components/Button.tsx
var DEFAULT_VALUES = {
  ...exporters.ButtonDefaults,
  text: "Button"
  // React convenience — not in schema
};
var Button = createItemComponent({
  name: "Button",
  defaultValues: DEFAULT_VALUES,
  propMapper: (props) => {
    const mapped = mapSemanticProps(
      props,
      DEFAULT_VALUES,
      "Button"
    );
    const size2 = mapped.size;
    if (size2 && typeof size2 === "object" && !Array.isArray(size2)) {
      const s = size2;
      if (typeof s.width === "number") {
        s.width = `${s.width}px`;
      } else if (typeof s.width === "string" && /^\d+(?:\.\d+)?$/.test(s.width.trim())) {
        s.width = `${s.width.trim()}px`;
      }
      if (s.width !== void 0 && s.autoWidth === void 0) {
        s.autoWidth = false;
      }
    }
    return mapped;
  },
  displayName: "Button",
  exporters: exporters.ButtonExporters
});
var Button_default = Button;
var DEFAULT_VALUES2 = {
  ...exporters.DividerDefaults
};
var Divider = createItemComponent({
  name: "Divider",
  defaultValues: DEFAULT_VALUES2,
  propMapper: (props) => mapSemanticProps(props, DEFAULT_VALUES2, "Divider"),
  displayName: "Divider",
  exporters: exporters.DividerExporters
});
var Divider_default = Divider;
var DEFAULT_VALUES3 = {
  ...exporters.HeadingDefaults,
  color: "#000000",
  // Not in schema options but used by renderer
  fontWeight: 400,
  // Not in schema options but used by renderer
  text: "Heading"
  // React convenience — not in schema
};
var Heading = createItemComponent({
  name: "Heading",
  defaultValues: DEFAULT_VALUES3,
  propMapper: (props) => {
    const { level, ...rest } = props;
    const result = mapSemanticProps(rest, DEFAULT_VALUES3, "Heading");
    if (level && !result.headingType) {
      result.headingType = level;
    }
    return result;
  },
  displayName: "Heading",
  exporters: exporters.HeadingExporters
});
var Heading_default = Heading;
var DEFAULT_VALUES4 = {
  ...exporters.HtmlDefaults
};
var Html = createItemComponent({
  name: "Html",
  defaultValues: DEFAULT_VALUES4,
  propMapper: (props) => mapSemanticProps(props, DEFAULT_VALUES4, "Html"),
  displayName: "Html",
  exporters: exporters.HtmlExporters
});
var Html_default = Html;
var { height: _placeholderHeight, ...defaultSrc } = exporters.ImageDefaults.src;
var DEFAULT_VALUES5 = {
  ...exporters.ImageDefaults,
  src: {
    ...defaultSrc,
    autoWidth: true,
    maxWidth: "100%"
  }
};
var Image = createItemComponent({
  name: "Image",
  defaultValues: DEFAULT_VALUES5,
  propMapper: (props) => {
    const { alt, src, width: widthProp, maxWidth: maxWidthProp, ...rest } = props;
    const restValues = rest.values;
    const normalizedRest = restValues && typeof restValues.src === "string" ? { ...rest, values: { ...restValues, src: { url: restValues.src } } } : rest;
    const base = mapSemanticProps(
      normalizedRest,
      DEFAULT_VALUES5,
      "Image"
    );
    if (alt !== void 0) {
      base.altText = alt;
    }
    const baseSrc = base.src;
    const fromValues = baseSrc && typeof baseSrc === "object" && !Array.isArray(baseSrc) ? baseSrc : typeof baseSrc === "string" ? { url: baseSrc } : {};
    const fromProp = typeof src === "string" ? { url: src } : src ?? {};
    const userSrc = { ...fromValues, ...fromProp };
    if (src !== void 0 || baseSrc !== void 0) {
      const isStringUrl = typeof src === "string" || src === void 0 && typeof baseSrc === "string";
      const start = isStringUrl ? { autoWidth: true, maxWidth: "100%" } : { ...DEFAULT_VALUES5.src };
      const merged = { ...start, ...userSrc };
      const pctRe = /^\d+(?:\.\d+)?%$/;
      const asPercent = (v) => typeof v === "string" && pctRe.test(v.trim()) ? v.trim() : void 0;
      const asPx = (v) => {
        if (typeof v === "number" && Number.isFinite(v)) return v;
        if (typeof v === "string") {
          const t = v.trim();
          if (pctRe.test(t)) return void 0;
          const m = /^(\d+(?:\.\d+)?)(?:px)?$/.exec(t);
          if (m) return parseFloat(m[1]);
        }
        return void 0;
      };
      let displayPct;
      let displayPx;
      for (const candidate of [widthProp, maxWidthProp, userSrc.maxWidth, userSrc.width]) {
        if (candidate === void 0) continue;
        const pct = asPercent(candidate);
        if (pct) {
          displayPct = pct;
          break;
        }
        const px = asPx(candidate);
        if (px != null) {
          displayPx = px;
          break;
        }
      }
      if (userSrc.autoWidth === void 0) {
        if (displayPct && displayPct !== "100%") {
          merged.autoWidth = false;
          merged.maxWidth = displayPct;
        } else if (displayPx != null) {
          merged.autoWidth = false;
          merged.maxWidth = displayPx;
        } else {
          merged.autoWidth = true;
          merged.maxWidth = "100%";
        }
      }
      base.src = merged;
    }
    return base;
  },
  displayName: "Image",
  exporters: exporters.ImageExporters
});
var Image_default = Image;
exporters.MenuDefaults.menu ?? { };
var DEFAULT_VALUES6 = {
  ...exporters.MenuDefaults
};
var Menu = createItemComponent({
  name: "Menu",
  defaultValues: DEFAULT_VALUES6,
  propMapper: (props) => {
    const { items, ...rest } = props;
    if (Array.isArray(items)) {
      const mapped = items.map((item, i) => ({
        key: String(i + 1),
        text: item.text,
        link: {
          name: "web",
          values: { href: item.href, target: item.target ?? "_blank" }
        }
      }));
      const base = mapSemanticProps(
        rest,
        DEFAULT_VALUES6,
        "Menu"
      );
      base.menu = { items: mapped };
      return base;
    }
    return mapSemanticProps(
      props,
      DEFAULT_VALUES6,
      "Menu"
    );
  },
  displayName: "Menu",
  exporters: exporters.MenuExporters
});
var Menu_default = Menu;
var DEFAULT_VALUES7 = {
  ...exporters.ParagraphDefaults,
  color: "#000000"
  // Not in schema options but used by renderer
};
var Paragraph = createItemComponent({
  name: "Paragraph",
  defaultValues: DEFAULT_VALUES7,
  propMapper: (props) => mapSemanticProps(props, DEFAULT_VALUES7, "Paragraph"),
  displayName: "Paragraph",
  exporters: exporters.ParagraphExporters
});
var Paragraph_default = Paragraph;

// src/components/PageBreak.tsx
var DEFAULT_VALUES8 = {
  color: "#6b7280"
};
var pageBreakExporters = {
  // Page breaks are a document-only concept. Keep the unsupported renderers
  // inert so a component rendered outside <Document> does not throw.
  web: () => "",
  email: () => "",
  document: () => '<div class="u-content-page-break" aria-hidden="true"></div>'
};
var pageBreakHead = {
  css: (_values, _bodyValues, meta) => meta.displayMode === "document" ? `
      .u-content-page-break {
        break-after: page;
        page-break-after: always;
      }
    ` : void 0
};
var PageBreak = createItemComponent({
  name: "PageBreak",
  contentType: "page_break",
  metaName: "page_break",
  defaultValues: DEFAULT_VALUES8,
  propMapper: (props) => mapSemanticProps(props, DEFAULT_VALUES8, "PageBreak"),
  displayName: "PageBreak",
  exporters: pageBreakExporters,
  head: pageBreakHead,
  omitEmptyOutput: true
});
var PageBreak_default = PageBreak;
var DEFAULT_ICONS = exporters.SocialDefaults.icons ?? { iconType: "circle", icons: [] };
var DEFAULT_VALUES9 = {
  ...exporters.SocialDefaults
};
var Social = createItemComponent({
  name: "Social",
  defaultValues: DEFAULT_VALUES9,
  propMapper: (props) => {
    const { icons, iconType, ...rest } = props;
    const coerceSizes = (base) => {
      for (const key of ["iconSize", "spacing"]) {
        const v = base[key];
        if (typeof v === "string") {
          const m = /^(\d+(?:\.\d+)?)(?:px)?$/.exec(v.trim());
          if (m) base[key] = parseFloat(m[1]);
          else delete base[key];
        }
      }
      return base;
    };
    if (Array.isArray(icons)) {
      const mapped = icons.map((icon) => ({
        name: icon.name,
        url: icon.url
      }));
      const base = mapSemanticProps(
        rest,
        DEFAULT_VALUES9,
        "Social"
      );
      base.icons = {
        iconType: iconType ?? base.icons?.iconType ?? "circle",
        icons: mapped
      };
      return coerceSizes(base);
    }
    if (iconType !== void 0) {
      const base = mapSemanticProps(
        rest,
        DEFAULT_VALUES9,
        "Social"
      );
      base.icons = { ...DEFAULT_ICONS, ...base.icons, iconType };
      return coerceSizes(base);
    }
    return coerceSizes(
      mapSemanticProps(props, DEFAULT_VALUES9, "Social")
    );
  },
  displayName: "Social",
  exporters: exporters.SocialExporters
});
var Social_default = Social;
var DEFAULT_TABLE = { headers: [], rows: [], footers: [] };
var DEFAULT_VALUES10 = {
  ...exporters.TableDefaults,
  table: DEFAULT_TABLE
  // Schema doesn't include table data structure
};
var Table = createItemComponent({
  name: "Table",
  defaultValues: DEFAULT_VALUES10,
  propMapper: (props) => {
    const { headers, data, columns, rows, ...rest } = props;
    if (headers || data || typeof columns === "number" || typeof rows === "number") {
      const base = mapSemanticProps(
        rest,
        DEFAULT_VALUES10,
        "Table"
      );
      const colCount = headers ? headers.length : typeof columns === "number" ? columns : data?.[0]?.length ?? 0;
      const blankCells = (n) => Array.from({ length: n }, () => ({ text: "", width: 0 }));
      const tableHeaders = headers ? [{ cells: headers.map((text) => ({ text, width: 0 })), height: 0 }] : [];
      const tableRows = data ? data.map((row) => ({
        cells: row.map((text) => ({ text, width: 0 })),
        height: 0
      })) : typeof rows === "number" ? (
        // No data: build an empty grid sized by `columns` × `rows`.
        Array.from({ length: rows }, () => ({
          cells: blankCells(colCount),
          height: 0
        }))
      ) : [];
      base.table = { headers: tableHeaders, rows: tableRows, footers: [] };
      if (headers || typeof columns === "number") {
        base.columns = colCount;
      }
      if (headers) {
        base.enableHeader = true;
      }
      if (data) {
        base.rows = data.length;
      } else if (typeof rows === "number") {
        base.rows = rows;
      }
      return base;
    }
    return mapSemanticProps(
      props,
      DEFAULT_VALUES10,
      "Table"
    );
  },
  displayName: "Table",
  exporters: exporters.TableExporters
});
var Table_default = Table;
var DEFAULT_VIDEO = {
  type: "youtube",
  videoId: "",
  thumbnail: "",
  loading: false,
  ...exporters.VideoDefaults.video
};
var DEFAULT_VALUES11 = {
  ...exporters.VideoDefaults,
  video: DEFAULT_VIDEO
};
function parseVideoUrl(url) {
  const ytMatch = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  if (ytMatch) {
    const videoId = ytMatch[1];
    return {
      type: "youtube",
      videoId,
      thumbnail: `https://img.youtube.com/vi/${videoId}/0.jpg`
    };
  }
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) {
    return {
      type: "vimeo",
      videoId: vimeoMatch[1],
      thumbnail: ""
    };
  }
  return null;
}
var Video = createItemComponent({
  name: "Video",
  defaultValues: DEFAULT_VALUES11,
  propMapper: (props) => {
    const { videoUrl, ...rest } = props;
    if (typeof videoUrl === "string") {
      const parsed = parseVideoUrl(videoUrl);
      const base = mapSemanticProps(
        rest,
        DEFAULT_VALUES11,
        "Video"
      );
      if (parsed) {
        base.video = { ...DEFAULT_VIDEO, ...parsed };
      }
      return base;
    }
    return mapSemanticProps(
      props,
      DEFAULT_VALUES11,
      "Video"
    );
  },
  displayName: "Video",
  exporters: exporters.VideoExporters
});
var Video_default = Video;
var allBodyDefaults = exporters.BodyDefaults;
var {
  popupPosition: _p1,
  popupDisplayDelay: _p2,
  popupWidth: _p3,
  popupHeight: _p4,
  popupBackgroundColor: _p5,
  popupBackgroundImage: _p6,
  popupOverlay_backgroundColor: _p7,
  popupCloseButton_position: _p8,
  popupCloseButton_backgroundColor: _p9,
  popupCloseButton_iconColor: _p10,
  popupCloseButton_borderRadius: _p11,
  popupCloseButton_margin: _p12,
  popupCloseButton_action: _p13,
  ...bodyRest
} = allBodyDefaults;
var BODY_DEFAULTS = bodyRest;
var ROW_DEFAULTS = { ...exporters.RowDefaults };
var COLUMN_DEFAULTS = { ...exporters.ColumnDefaults };

// src/utils/render-scope.ts
var scoped;
function scopeCache(key, make) {
  if (!scoped) return make();
  if (!scoped.has(key)) scoped.set(key, make());
  return scoped.get(key);
}
function withRenderScope(render, own = false) {
  const scope = () => {
    if (scoped) return render();
    scoped = /* @__PURE__ */ new WeakMap();
    try {
      return render();
    } finally {
      scoped = void 0;
    }
  };
  return withBuild(() => within(null, scope), own);
}
var warnedLoose = /* @__PURE__ */ new Set();
function looseText(child, container) {
  const text = String(child);
  if (text.trim() && !warnedLoose.has(container)) {
    warnedLoose.add(container);
    console.warn(`${container}: text placed straight in a ${container} shows as text and isn't kept in the editor's design. Put it in a <Paragraph>, or HTML in an <Html> block.`);
  }
  return escapeKeepingTags(text, true);
}
var DEFAULT_VALUES12 = ROW_DEFAULTS;
var DEFAULT_BODY_VALUES = BODY_DEFAULTS;
function getWidthPercentages(cells) {
  if (cells.length === 0) return [];
  const total = cells.reduce((a, b) => a + b, 0);
  if (total <= 0) return [];
  return cells.map((span) => {
    const value = Math.round(span / total * 100 * 100) / 100;
    const className = `${value}`.replace(/\./g, "p");
    return { value, className };
  });
}
function generateGridCSS(cells, mode, contentWidth = 600, mobileBreakpoint = 480) {
  const widths = getWidthPercentages(cells);
  if (mode === "email") {
    const minQuery = `@media only screen and (min-width: ${contentWidth + 20}px)`;
    const maxQuery = `@media only screen and (max-width: ${contentWidth + 20}px)`;
    return `
${minQuery} {
  .u-row { width: ${contentWidth}px !important; }
  .u-row .u-col { vertical-align: top; }
${widths.map(({ value, className }) => `  .u-row .u-col-${className} { width: ${Math.round(contentWidth * value / 100)}px !important; }`).join("\n")}
}

${maxQuery} {
  .u-row-container { max-width: 100% !important; padding-left: 0px !important; padding-right: 0px !important; }
  .u-row { width: 100% !important; }
  .u-row .u-col { display: block !important; width: 100% !important; min-width: 320px !important; max-width: 100% !important; }
  .u-row .u-col > div { margin: 0 auto; }
  .u-row.no-stack .u-col { min-width: 0 !important; display: table-cell !important; }
${widths.map(({ value, className }) => `  .u-row.no-stack .u-col-${className} { width: ${value}% !important; }`).join("\n")}
}`;
  }
  const baseCSS = `
.u-row {
  display: flex;
  flex-wrap: nowrap;
  margin-left: 0;
  margin-right: 0;
}
.u-row .u-col {
  position: relative;
  width: 100%;
  padding-right: 0;
  padding-left: 0;
}`;
  const columnCSS = widths.map(
    ({ value, className }) => `.u-row .u-col.u-col-${className} { flex: 0 0 ${value}%; max-width: ${value}%; }`
  ).join("\n");
  const responsiveCSS = mode === "document" ? "" : `
@media (max-width: ${mobileBreakpoint}px) {
  .u_row .container { max-width: 100% !important; }
  .u-row:not(.no-stack) { flex-wrap: wrap; }
  .u-row:not(.no-stack) .u-col {
    flex: 0 0 100% !important;
    max-width: 100% !important;
  }
}`;
  return baseCSS + "\n" + columnCSS + "\n" + responsiveCSS;
}
function toContentWidthPx(bodyValues, fallback = 500) {
  return bodyContentWidthPx(bodyValues?.contentWidth, fallback);
}
function renderRowToHtml(innerHTML, values, bodyValues, mode, cells, collection = "rows") {
  const rowExporter = exporters.RowExporters[mode] || exporters.RowExporters.web;
  const html = rowExporter(innerHTML, values, bodyValues, {
    collection,
    variant: mode
  });
  const contentWidth = toContentWidthPx(bodyValues);
  const css2 = generateGridCSS(cells, mode, contentWidth);
  return css2 ? `<style>${css2}</style>${html}` : html;
}
function processChildren(children, cells, bodyValues, rowValues, mode, _config) {
  if (!children) return "";
  let innerHTML = "";
  const childrenArray = React4__default.default.Children.toArray(children);
  let index = 0;
  childrenArray.forEach((child) => {
    if (!React4__default.default.isValidElement(child)) {
      if (typeof child === "string" || typeof child === "number") {
        innerHTML += looseText(child, "Row");
      }
      return;
    }
    const componentType = child.type;
    const isColumn = componentType?.displayName === "Column" || componentType?.name === "Column";
    if (isColumn && typeof child.type === "function") {
      const rendered = child.type({
        ...child.props,
        index: index++,
        cells,
        bodyValues,
        rowValues,
        mode,
        _config
      });
      if (rendered?.props?.dangerouslySetInnerHTML?.__html) {
        innerHTML += rendered.props.dangerouslySetInnerHTML.__html;
      }
    } else if (React4__default.default.isValidElement(child)) {
      const name = child.type?.displayName || child.type?.name || "Unknown";
      console.warn(
        `Row: <${name}> is not a valid Row child. Only <Column> components can be direct children of <Row>. Wrap it in a <Column>: <Row><Column><${name} /></Column></Row>`
      );
    }
  });
  return innerHTML;
}
function renderRow(props) {
  const {
    layout,
    cells: propsCells,
    children,
    mode: modeProp,
    className,
    style,
    index = 0,
    bodyValues = {},
    collection = "rows",
    _config,
    ...semanticProps
  } = props;
  const mode = modeProp ?? _config?.mode ?? "web";
  const columnCount = React4__default.default.Children.toArray(children).filter(
    (c) => React4__default.default.isValidElement(c) && /^Column$/.test(c.type?.displayName || c.type?.name || "")
  ).length;
  let cells;
  if (layout) {
    if (columnCount !== layout.expectedColumns) validateColumnLayout(layout, React4__default.default.Children.count(children));
    cells = layout.cells;
  } else if (propsCells) {
    cells = propsCells;
  } else {
    cells = Array(Math.max(1, columnCount)).fill(1);
  }
  const safeBodyValues = { ...DEFAULT_BODY_VALUES, ...bodyValues };
  const values = mapSemanticProps(
    semanticProps,
    DEFAULT_VALUES12,
    "Row"
  );
  const valuesWithMeta = { ...values, cells, _meta: safeMeta({ htmlID: nextHtmlId(_config, "u_row"), htmlClassNames: "u_row", ...values._meta || {} }) };
  const innerHTML = processChildren(
    children,
    cells,
    safeBodyValues,
    valuesWithMeta,
    mode,
    _config
  );
  try {
    const html = renderRowToHtml(innerHTML, valuesWithMeta, safeBodyValues, mode, cells, collection);
    return /* @__PURE__ */ jsxRuntime.jsx(
      "div",
      {
        dangerouslySetInnerHTML: { __html: html },
        className,
        style
      }
    );
  } catch (error) {
    console.error("Row rendering failed:", error);
    return /* @__PURE__ */ jsxRuntime.jsx("div", { className, style, children });
  }
}
var Row = (props) => collecting() ? whileCollecting(() => recordContainer("row", props), () => renderRow(props), "Row") : renderRow(props);
Row.displayName = "Row";
Row[RECORDS] = true;
var Row_default = Row;
var DEFAULT_VALUES13 = COLUMN_DEFAULTS;
function renderColumnToHtml(innerHTML, values, index, cells, bodyValues, rowValues, mode) {
  const columnExporter = exporters.ColumnExporters[mode] || exporters.ColumnExporters.web;
  return columnExporter(innerHTML, values, index, cells, bodyValues, rowValues);
}
function renderContentToHtml(innerHTML, values, bodyValues, mode) {
  const contentExporter = exporters.ContentExporters[mode] || exporters.ContentExporters.web;
  return contentExporter(innerHTML, values, bodyValues, {});
}
var Column = (props) => {
  if (collecting()) return whileCollecting(() => recordContainer("column", props), () => Column(props), "Column");
  const {
    children,
    index = 0,
    cells = [1],
    bodyValues = {},
    rowValues = {},
    mode: modeProp,
    className,
    style,
    _config,
    ...semanticProps
  } = props;
  const mode = modeProp ?? _config?.mode ?? "web";
  const values = mapSemanticProps(
    semanticProps,
    DEFAULT_VALUES13,
    "Column"
  );
  const valuesWithMeta = { ...values, _meta: safeMeta({ htmlID: nextHtmlId(_config, "u_column"), htmlClassNames: "u_column", ...values._meta || {} }) };
  let innerHTML = "";
  if (children) {
    try {
      const childrenArray = React4__default.default.Children.toArray(children);
      childrenArray.forEach((child, childIndex) => {
        if (typeof child === "string" || typeof child === "number") {
          innerHTML += looseText(child, "Column");
        } else if (React4__default.default.isValidElement(child)) {
          if (typeof child.type === "function") {
            const ComponentType = child.type;
            const renderFn = ComponentType[UNLAYER_RENDER_KEY] || ComponentType;
            const componentName2 = ComponentType?.[UNLAYER_CONFIG_KEY]?.metaName ?? (ComponentType?.displayName || ComponentType?.name || "component").toLowerCase();
            const contentHtmlId = nextHtmlId(_config, `u_content_${componentName2}`);
            const rendered = renderFn({
              ...child.props,
              _config,
              _metaHtmlId: contentHtmlId,
              colIndex: index,
              cells,
              bodyValues,
              rowValues,
              columnValues: valuesWithMeta
            });
            if (rendered && typeof rendered === "object" && rendered.props && rendered.props.dangerouslySetInnerHTML) {
              const componentHTML = rendered.props.dangerouslySetInnerHTML.__html;
              if (!componentHTML && ComponentType?.[UNLAYER_CONFIG_KEY]?.omitEmptyOutput) return;
              const childProps = child.props;
              const rawContainerPadding = childProps.containerPadding ?? childProps.values?.containerPadding ?? DEFAULT_CONTAINER_PADDING;
              const containerPadding = typeof rawContainerPadding === "number" ? `${rawContainerPadding}px` : rawContainerPadding;
              const device = ComponentType?.[UNLAYER_CONFIG_KEY]?.contentType === "custom" ? {} : childProps;
              const contentValues = {
                containerPadding,
                _override: {
                  ...childProps.values?._override,
                  mobile: {
                    ...childProps.values?._override?.mobile,
                    ...device.hideOnMobile !== void 0 ? { hideMobile: device.hideOnMobile } : {}
                  },
                  desktop: {
                    ...childProps.values?._override?.desktop,
                    ...device.hideOnDesktop !== void 0 ? { hideDesktop: device.hideOnDesktop } : {}
                  }
                },
                _meta: {
                  htmlID: contentHtmlId,
                  htmlClassNames: `u_content_${componentName2}`,
                  ...childProps.values?._meta?.htmlID ? { htmlID: safeName(childProps.values._meta.htmlID) } : {}
                }
              };
              innerHTML += renderContentToHtml(
                componentHTML,
                contentValues,
                bodyValues,
                mode
              );
            } else if (rendered) {
              const name = child.type?.displayName || child.type?.name || "Unknown";
              console.warn(
                `Column: <${name}> did not produce renderable HTML. Ensure it is an Unlayer component (Button, Text, Image, etc.).`
              );
            }
          }
        }
      });
    } catch (error) {
      console.error("Column: Failed to render children:", error);
      innerHTML = "";
    }
  }
  try {
    const html = renderColumnToHtml(innerHTML, valuesWithMeta, index, cells, bodyValues, rowValues, mode);
    return /* @__PURE__ */ jsxRuntime.jsx(
      "div",
      {
        dangerouslySetInnerHTML: { __html: html },
        className,
        style
      }
    );
  } catch (error) {
    console.error("Column rendering failed:", error);
    return /* @__PURE__ */ jsxRuntime.jsx("div", { className, style, children });
  }
};
Column.displayName = "Column";
Column[RECORDS] = true;
var Column_default = Column;
var KEPT = Symbol.for("@unlayer/react-elements/kept");
function parse(html, collection) {
  const root = [];
  const open = [root];
  const pattern = new RegExp(`<${MARK} data-n="${collection.nonce}" data-i="(\\d+)"(?: data-e="([ocf])")?></${MARK}>`, "g");
  let last = 0;
  for (const match of html.matchAll(pattern)) {
    const into = open[open.length - 1];
    if (match.index > last) into.push({ kind: "raw", html: html.slice(last, match.index) });
    last = match.index + match[0].length;
    const at = Number(match[1]);
    const edge = match[2];
    if (edge === "o") {
      const children = [];
      into.push({ kind: collection.recorded[at].kind, at, children });
      open.push(children);
    } else if (edge === "c") open.pop();
    else into.push({ kind: edge === "f" ? "failed" : "block", at });
  }
  if (last < html.length) open[open.length - 1].push({ kind: "raw", html: html.slice(last) });
  if (open.length !== 1) throw new Error("[Unlayer] a collected render's markers don't pair up");
  return root;
}
var TEXT_ENTITIES = { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#x27;": "'" };
var VOID = /^(area|base|br|col|embed|hr|img|input|link|meta|source|track|wbr)$/i;
function parts(html) {
  const out = [];
  let at = 0;
  const text = (s) => s && out.push({ text: s.replace(/&amp;|&lt;|&gt;|&quot;|&#x27;/g, (e) => TEXT_ENTITIES[e]) });
  while (at < html.length) {
    const start = html.indexOf("<", at);
    if (start < 0) {
      text(html.slice(at));
      break;
    }
    text(html.slice(at, start));
    const name = /^<([a-zA-Z][\w:-]*)/.exec(html.slice(start))?.[1];
    if (!name) {
      out.push({ tag: "#", html: html.slice(start) });
      break;
    }
    const openEnd = html.indexOf(">", start);
    if (VOID.test(name) || html[openEnd - 1] === "/") {
      out.push({ tag: name, html: html.slice(start, openEnd + 1) });
      at = openEnd + 1;
      continue;
    }
    const tags = new RegExp(`<(/?)${name}(?=[\\s>/])`, "gi");
    tags.lastIndex = openEnd + 1;
    let depth = 1;
    let end = -1;
    for (let m = tags.exec(html); m; m = tags.exec(html)) {
      depth += m[1] ? -1 : 1;
      if (depth === 0) {
        end = m.index;
        break;
      }
    }
    if (end < 0) {
      out.push({ tag: "#", html: html.slice(start) });
      break;
    }
    const close = html.indexOf(">", end) + 1;
    out.push({ tag: name, html: html.slice(start, close), inner: html.slice(openEnd + 1, end) });
    at = close;
  }
  return out;
}
function innerType(type) {
  while (type?.$$typeof === MEMO) type = type.type;
  return type;
}
var recorded = (c, node) => c.collection.recorded[node.at];
var nameOf = (element2) => {
  if (typeof element2.type === "string") return element2.type;
  const type = innerType(element2.type);
  return type?.displayName || type?.name || "component";
};
function leftOut(c, node) {
  if (c.fatal) throw c.fatal;
  if (!c.told.has(node.at)) {
    c.told.add(node.at);
    try {
      tell(recorded(c, node).element);
    } catch (error) {
      c.fatal = error;
      throw error;
    }
  }
  return [];
}
function calledAgain(element2) {
  const type = innerType(element2.type);
  if (type?.$$typeof !== FORWARD_REF && (typeof type !== "function" || type.prototype?.isReactComponent)) return void 0;
  const props = { ...element2.props };
  for (const key in type.defaultProps) if (props[key] === void 0) props[key] = type.defaultProps[key];
  return { out: callIsolated(() => type.$$typeof === FORWARD_REF ? type.render(props, null) : type(props)) };
}
function tell(element2) {
  const type = innerType(element2.type);
  const name = nameOf(element2);
  const async = () => console.warn(`[Unlayer] <${name}> is async or suspends: Elements renders synchronously, so it's left out. Load its data first and pass it as props.`);
  if (isAsyncComponent(type)) return async();
  try {
    const again = calledAgain(element2);
    const inner = again ? collected(again.out) : collected(element2, false);
    const failed = (nodes) => nodes.flatMap((n) => n.kind === "failed" ? [n] : "children" in n ? failed(n.children) : []);
    const found = failed(inner.nodes);
    for (const node of found) tell(recorded(inner, node).element);
    if (!found.length) console.error(`[Unlayer] <${name}> failed while rendering, so it's left out.`);
  } catch (error) {
    const message = String(error?.message);
    if (/Element type is invalid|Objects are not valid as a React child|Minified React error #(130|31)\b/.test(message)) throw error;
    if (isThenable(error) || /async and suspending|suspended|Minified React error #426\b/.test(message)) async();
    else console.error(`[Unlayer] <${name}> threw while rendering, so it's left out:`, error);
  }
}
function markupOnly(c, nodes) {
  let out = "";
  for (const node of nodes) {
    if (node.kind === "raw") out += node.html;
    else if (node.kind === "failed") leftOut(c, node);
    else if (node.kind !== "boundary") return void 0;
    else {
      const inner = markupOnly(c, node.children);
      if (inner === void 0) return void 0;
      out += inner;
    }
  }
  return out;
}
function keptMarkup(c, node) {
  c.kept ?? (c.kept = /* @__PURE__ */ new Map());
  if (!c.kept.has(node.at)) c.kept.set(node.at, keptMarkupOnce(c, node));
  return c.kept.get(node.at);
}
function keptMarkupOnce(c, node) {
  const raw = markupOnly(c, node.children);
  if (raw === void 0) return void 0;
  const list = parts(raw);
  if (!list.some((p) => "tag" in p)) return void 0;
  const element2 = recorded(c, node).element;
  const one = list.length === 1 || list.some((p) => "tag" in p && p.tag === "#") ? /^<([a-zA-Z][\w:-]*)\b[^>]*>([\s\S]*)<\/\1>$/.exec(raw) : null;
  let given = false;
  if (one) {
    try {
      const out = calledAgain(element2)?.out;
      given = React4__default.default.isValidElement(out) && typeof out.type === "string" && out.props.dangerouslySetInnerHTML != null;
    } catch {
      given = one[1].toLowerCase() === "div";
    }
  }
  const html = one && given ? one[2] : raw;
  const Rendered = () => React4__default.default.createElement("div", { dangerouslySetInnerHTML: { __html: html } });
  Rendered.displayName = nameOf(element2);
  const { containerPadding, hideOnMobile, hideOnDesktop } = element2.props ?? {};
  Rendered[KEPT] = React4__default.default.createElement(Html_default, {
    html,
    ...containerPadding !== void 0 ? { containerPadding } : {},
    ...hideOnMobile !== void 0 ? { hideOnMobile } : {},
    ...hideOnDesktop !== void 0 ? { hideOnDesktop } : {}
  });
  return React4__default.default.createElement(Rendered, { ...element2.props });
}
function resolvedProps(c, props) {
  let out = props;
  for (const [key, value] of Object.entries(props)) {
    if (typeof value !== "string" || !value.includes(MARK)) continue;
    let html = value;
    try {
      if (value.includes(c.collection.nonce)) html = markup(c, parse(value, c.collection), (block) => within(null, () => renderToStaticMarkup(block)));
    } catch {
    }
    out = out === props ? { ...props } : out;
    out[key] = withoutMarkers(html, c.collection.nonce);
  }
  return out;
}
function withoutMarkers(html, nonce2) {
  const left = new RegExp(`<${MARK} data-n="${nonce2}" data-i="\\d+"(?: data-e="[ocf]")?></${MARK}>`, "g");
  if (!html.includes(nonce2) || !html.match(left)) return html;
  console.error(`[Unlayer] an Elements block rendered inside a component left a marker behind; it's taken out, and the block it stood for is missing.`);
  return html.replace(left, "");
}
function markup(c, nodes, render) {
  return nodes.map((node) => {
    switch (node.kind) {
      case "raw":
        return node.html;
      case "boundary":
        return markup(c, node.children, render);
      case "failed":
        leftOut(c, node);
        return "";
      default:
        return render(element(c, node));
    }
  }).join("");
}
var keyed = (list) => list.map((child, i) => React4__default.default.isValidElement(child) && child.key == null ? React4__default.default.cloneElement(child, { key: `k${i}` }) : child);
function element(c, node) {
  const r = recorded(c, node);
  if (node.kind === "block") return React4__default.default.createElement(r.type, resolvedProps(c, r.props));
  if (node.kind === "column") return React4__default.default.createElement(Column_default, { ...r.props, children: keyed(elements(c, node.children, "column")) });
  const props = { ...r.props };
  const children = keyed(elements(c, node.children, "row"));
  if (props.layout) {
    const columns = children.filter((child) => React4__default.default.isValidElement(child) && child.type === Column_default).length;
    if (columns === props.layout.expectedColumns || React4__default.default.Children.count(props.children) === props.layout.expectedColumns) {
      props.cells = props.layout.cells;
      delete props.layout;
    }
  }
  return React4__default.default.createElement(Row_default, { ...props, children });
}
function spanned(nodes) {
  const out = [];
  const spans = [];
  for (const node of nodes) {
    if (node.kind !== "raw") {
      out.push({ node, inside: spans.length > 0 });
      continue;
    }
    const html = node.html;
    const open = [];
    let closed = spans.length ? -1 : 0;
    for (const m of html.matchAll(/<!--[\s\S]*?(?:-->|$)|<(\/?)([a-zA-Z][\w:-]*)\b[^>]*>/g)) {
      if (!m[2]) continue;
      const name = m[2].toLowerCase();
      if (m[1]) {
        const i = open.map((o) => o.name).lastIndexOf(name);
        const across = spans.lastIndexOf(name);
        if (i >= 0) open.length = i;
        else if (across >= 0) {
          spans.length = across;
          open.length = 0;
          if (!spans.length) closed = m.index + m[0].length;
        }
      } else if (!VOID.test(name) && !m[0].endsWith("/>")) open.push({ name, at: m.index });
    }
    const piece = (from, to, inside) => {
      if (to > from) out.push({ node: { kind: "raw", html: html.slice(from, to) }, inside });
    };
    if (closed < 0) piece(0, html.length, true);
    else {
      piece(0, closed, true);
      piece(closed, open[0]?.at ?? html.length, false);
      if (open.length) piece(open[0].at, html.length, true);
    }
    spans.push(...open.map((o) => o.name));
  }
  return out;
}
function elements(c, nodes, place, owner, inMarkup = false) {
  const inColumn = place === "column";
  return (place === "root" || inMarkup ? nodes.map((node) => ({ node, inside: inMarkup })) : spanned(nodes)).flatMap(({ node, inside }) => {
    switch (node.kind) {
      case "failed":
        return leftOut(c, node);
      case "boundary": {
        const kept = inColumn && !inside ? keptMarkup(c, node) : void 0;
        if (kept) return [kept];
        const Named = () => null;
        Named.displayName = nameOf(recorded(c, node).element);
        if (inColumn && !inside && !c.told.has(node.at) && node.children.some((n) => n.kind === "raw" && parts(n.html).some((p) => "tag" in p))) {
          c.told.add(node.at);
          console.warn(`Column: <${Named.displayName}> rendered markup that isn't a block, so it's left out. Put HTML in an <Html> block.`);
        }
        return elements(c, node.children, place, Named, inside);
      }
      case "raw":
        if (inside) {
          const name = /^<([a-zA-Z][\w:-]*)/.exec(node.html)?.[1];
          return place === "row" && name && !inMarkup ? [React4__default.default.createElement(owner ?? name)] : [];
        }
        return parts(node.html).flatMap((p) => "text" in p ? [p.text] : inColumn ? [] : [React4__default.default.createElement(owner ?? (p.tag === "#" ? "div" : p.tag))]);
      default:
        return [element(c, node)];
    }
  });
}
function collected(children, guarded2 = true) {
  const once = (markup2) => {
    const collection = { nonce: nonce(), recorded: [], ...markup2 ? { markup: markup2 } : {}, ...idsSeen() ? {} : { blind: true } };
    const html = within(collection, () => renderToStaticMarkup(/* @__PURE__ */ jsxRuntime.jsx(jsxRuntime.Fragment, { children: guarded2 ? guard(children, collection) : children }), { identifierPrefix: COLLECTING_ID }));
    return { nodes: parse(html, collection), collection, told: /* @__PURE__ */ new Set() };
  };
  try {
    return once(false);
  } catch (error) {
    if (!guarded2) throw error;
    return once(true);
  }
}
function idsSeen() {
  let seen = false;
  const Probe = () => {
    try {
      seen = React4__default.default.useId().slice(1).startsWith(COLLECTING_ID);
    } catch {
    }
    return null;
  };
  renderToStaticMarkup(/* @__PURE__ */ jsxRuntime.jsx(Probe, {}), { identifierPrefix: COLLECTING_ID });
  return seen;
}
var RENDERS = Symbol.for("@unlayer/react-elements/renders");
function nonce() {
  const shared = globalThis;
  const clock = globalThis.performance;
  return [shared[RENDERS] = (shared[RENDERS] ?? 0) + 1, (clock?.timeOrigin ?? 0) * 1e3, (clock?.now() ?? 0) * 1e6].map((n) => Math.floor(n).toString(36)).join("_");
}
var collect = (children) => children !== null && typeof children === "object" ? scopeCache(children, () => collected(children)) : collected(children);
function childrenHtml2(children, place) {
  const c = collect(children);
  return withoutMarkers(markup(c, c.nodes, (child) => within(null, () => renderToString(place(child)))), c.collection.nonce);
}
function normalizedChildren(children) {
  const c = collect(children);
  return elements(c, c.nodes, "root");
}
function normalizedRoot(root) {
  return React4__default.default.cloneElement(root, void 0, ...normalizedChildren(root.props.children));
}
var DEFAULT_VALUES14 = BODY_DEFAULTS;
var MAX_PREVIEW_LENGTH = 150;
var PADDING_CHARS = [
  "\xA0",
  "\u200C",
  "\u200B",
  "\u200D",
  "\u200E",
  "\u200F",
  "\uFEFF"
];
function escapePreviewText(text) {
  return text.split(/(<%[\w.]+%>)/).map((part, i) => i % 2 ? part : part.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")).join("");
}
function generatePreviewHtml(text) {
  if (!text || text.trim().length === 0) return "";
  const truncated = text.length > MAX_PREVIEW_LENGTH ? text.slice(0, MAX_PREVIEW_LENGTH) : text;
  const paddingLength = Math.max(0, MAX_PREVIEW_LENGTH - truncated.length);
  let padding = "";
  for (let i = 0; i < paddingLength; i++) {
    padding += PADDING_CHARS[i % PADDING_CHARS.length];
  }
  return `<div data-skip-in-text="true" style="display:none;font-size:1px;color:#ffffff;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">` + escapePreviewText(truncated) + padding + `</div>`;
}
function renderBodyToHtml(innerHTML, values, mode, previewText) {
  let finalInnerHtml = innerHTML;
  if (mode === "email" && previewText) {
    const previewHtml = generatePreviewHtml(previewText);
    if (previewHtml) {
      finalInnerHtml = previewHtml + innerHTML;
    }
  }
  const bodyExporter = exporters.BodyExporters[mode] || exporters.BodyExporters.web;
  const raw = mode === "document" ? bodyExporter(finalInnerHtml, values, { type: "" }) : mode === "email" ? (
    // The email body exporter reads body context (contentWidth,
    // contentAlign) from the `bodyValues` field of its 3rd argument.
    // Passing `values` directly left it undefined, so the Outlook (MSO)
    // table fell back to 600px regardless of contentWidth.
    bodyExporter(finalInnerHtml, values, { bodyValues: values })
  ) : bodyExporter(finalInnerHtml, values, values);
  return raw.replace("min-height: 100vh; ", "").replace("min-height: 100vh;", "");
}
var Body = (props) => {
  const { children, mode: modeProp, className, style, index = 0, config: configProp, previewText, fonts: _fonts, lang: _lang, ...semanticProps } = props;
  const resolvedConfig = { ...DEFAULT_CONFIG, ...configProp };
  const mode = modeProp ?? resolvedConfig.mode ?? "web";
  const _config = { ...resolvedConfig, mode };
  _config.__ids = {};
  const values = mergeValues(
    DEFAULT_VALUES14,
    mapSemanticProps(semanticProps, DEFAULT_VALUES14, "Body")
  );
  const valuesWithMeta = {
    ...values,
    _meta: {
      htmlID: nextHtmlId(_config, "u_body"),
      htmlClassNames: "u_body",
      ...values._meta || {}
    }
  };
  let innerHTML = "";
  if (children) {
    try {
      innerHTML = withRenderScope(() => {
        return childrenHtml2(children, (child) => React4__default.default.cloneElement(child, { _config, bodyValues: values }));
      }, true);
    } catch (error) {
      console.error("Body: Failed to render children:", error);
      innerHTML = "";
    }
  }
  try {
    const html = renderBodyToHtml(innerHTML, valuesWithMeta, mode, previewText);
    return /* @__PURE__ */ jsxRuntime.jsx(
      "div",
      {
        dangerouslySetInnerHTML: { __html: html },
        className,
        style
      }
    );
  } catch (error) {
    console.error("Body rendering failed:", error);
    return /* @__PURE__ */ jsxRuntime.jsx("div", { className, style, children });
  }
};
Body.displayName = "Body";
var Body_default = Body;
function Email(props) {
  return /* @__PURE__ */ jsxRuntime.jsx(Body_default, { ...props, mode: "email" });
}
Email.displayName = "Email";
function Page(props) {
  return /* @__PURE__ */ jsxRuntime.jsx(Body_default, { ...props, mode: "web" });
}
Page.displayName = "Page";
function Document(props) {
  return /* @__PURE__ */ jsxRuntime.jsx(Body_default, { ...props, mode: "document" });
}
Document.displayName = "Document";
var PROVIDER_ACTIVE_KEY = "__unlayerProviderActive";
var _UnlayerContext = null;
function getUnlayerContext() {
  if (!_UnlayerContext) {
    _UnlayerContext = React4.createContext(DEFAULT_CONFIG);
  }
  return _UnlayerContext;
}
var UnlayerProvider = ({
  config,
  children
}) => {
  const merged = React4.useMemo(
    () => ({ ...DEFAULT_CONFIG, ...config, [PROVIDER_ACTIVE_KEY]: true }),
    [config]
  );
  const Context = getUnlayerContext();
  return /* @__PURE__ */ jsxRuntime.jsx(Context.Provider, { value: merged, children });
};
UnlayerProvider.displayName = "UnlayerProvider";
function useUnlayerConfig() {
  return React4.useContext(getUnlayerContext());
}

// src/utils/device-overrides.ts
var contentOptions = {
  Button: ["size", "fontSize", "lineHeight", "textAlign", "padding"],
  Image: ["src", "textAlign"],
  Heading: ["fontSize", "textAlign", "lineHeight"],
  Paragraph: ["fontSize", "textAlign", "lineHeight"],
  Menu: ["fontSize", "padding"],
  Divider: ["width", "textAlign"]
};
function css(value) {
  const text = String(value).trim();
  return text && !/[!\\"'\n\r]/.test(text) && cssValueSafe(text) ? text : void 0;
}
function ident(id) {
  return id.replace(/^-?\d|^-$|[^\w\u0080-\uffff-]/g, (c) => /\d/.test(c.slice(-1)) ? `${c.slice(0, -1)}\\${c.slice(-1).charCodeAt(0).toString(16)} ` : `\\${c}`);
}
function size(value) {
  const number = parseFloat(String(value));
  if (!Number.isFinite(number)) return;
  const rounded = parseFloat(number.toFixed(2));
  if (typeof value === "number" || String(value).endsWith("px")) return `${rounded}px`;
  if (String(value).endsWith("%")) return `${rounded}%`;
}
function collectDeviceStyles(values, collection, name, mode, styles) {
  const given = safeName(values._meta?.htmlID);
  if (!given) return;
  const id = ident(given);
  const options = collection === "contents" ? ["containerPadding", ...contentOptions[name] || []] : collection === "columns" ? ["padding", "border"] : ["padding"];
  for (const device of mode === "document" ? ["desktop"] : ["desktop", "mobile"]) {
    const overrides = values._override?.[device];
    if (!overrides) continue;
    for (const option of options) {
      if (!(option in overrides)) continue;
      const value = overrides[option];
      const property = option.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
      const prefix = collection === "rows" ? "row-" : collection === "columns" ? "col-" : "";
      const selector = (attribute) => `#${id} .v-${prefix}${property === attribute ? property : `${property}-${attribute}`}`;
      const push = (rule) => (styles[device] || (styles[device] = [])).push(rule);
      if (option === "padding" || option === "containerPadding") {
        if (!(value || value === 0) || css(value) === void 0) continue;
        const direct = collection === "rows" || mode === "web" && collection === "contents" && option === "containerPadding";
        const target = direct ? selector("padding").replace(`#${id} `, `#${id}`) : selector("padding");
        push(`${target} { padding: ${css(value)} !important; }`);
        if (mode === "email" && collection === "rows") {
          const parts2 = String(value).trim().split(/\s+/);
          const [top, bottom] = [parts2[0], parts2[2] || parts2[0]].map((part) => size(part) ?? css(part));
          if (top !== void 0 && bottom !== void 0) push(`${target}--vertical { padding-top: ${top} !important; padding-bottom: ${bottom} !important; }`);
        }
      } else if (option === "border") {
        if (value) push(`${selector("border")} { ${["Top", "Left", "Right", "Bottom"].map((d) => {
          const w = css(value[`border${d}Width`] || "0px") ?? "0px";
          return `border-${d.toLowerCase()}: ${w} ${css(value[`border${d}Style`] || "solid") ?? "solid"} ${parseInt(w) > 0 && css(value[`border${d}Color`]) || "transparent"} !important;`;
        }).join("")} }`);
      } else if (option === "src") {
        if (!value) continue;
        const merged = { ...values.src, ...value };
        const maximum = merged.autoWidth === false ? size(merged.maxWidth) : void 0;
        push(`${selector("width")} { width: ${maximum || "100%"} !important; }`);
        push(`${selector("max-width")} { max-width: ${size(maximum || merged.width || "100%")} !important; }`);
      } else if (option === "size" || option === "width") {
        if (!value) continue;
        push(`${selector("width")} { width: ${size(value.width) && !value.autoWidth ? size(value.width) : "auto"} !important; }`);
        push(`${selector("max-width")} { max-width: 100% !important; }`);
      } else {
        if (!(value || option === "lineHeight" && `${value}` === "0")) continue;
        const rendered = css(option === "fontSize" && typeof value === "number" ? `${value}px` : value);
        if (rendered === void 0) continue;
        push(`${selector(property)} { ${property}: ${rendered} !important; }`);
      }
    }
  }
}
function deviceStylesCss(styles, mode) {
  return Object.entries(styles).filter(([, rules]) => rules.length).map(([device, rules]) => {
    const query = device === "mobile" ? "@media (max-width: 480px)" : `@media (min-width: ${mode === "document" ? 1 : 481}px)`;
    return `${query} { ${rules.join(" ")} }`;
  }).join("\n");
}
function deviceVisibilityCss(mode) {
  if (mode === "document") return "";
  const extra = mode === "email" ? "max-height: 0px; overflow: hidden; " : "";
  const reset = mode === "email" ? "@media (min-width: 0px) { .hide-default__display-block { display: block !important; mso-hide: unset !important; } .hide-default__display-table { display: table !important; mso-hide: unset !important; } }\n" : "";
  return reset + `@media (max-width: 480px) { .hide-mobile { ${extra}display: none !important; } }
@media (min-width: 481px) { .hide-desktop { ${extra}display: none !important; } }`;
}
var schemaVersion = exporters.schemaVersion ?? 24;
function unwrapForJson(element2) {
  try {
    return unwrapRoot(element2);
  } catch (cause) {
    const detail = cause instanceof Error ? cause.message : String(cause);
    throw new Error(
      `[Unlayer] renderToJson: could not unwrap <${componentName(element2) || "wrapper"}>. ${UNWRAP_ADVICE} (${detail})`
    );
  }
}
var collectChildren = (node) => React4__default.default.Children.toArray(node).filter(React4__default.default.isValidElement);
function extractSemanticProps(props, extraKeys = []) {
  const internalKeys = /* @__PURE__ */ new Set([
    "children",
    "mode",
    "className",
    "style",
    "index",
    "colIndex",
    "cells",
    "bodyValues",
    "rowValues",
    "_config",
    "config",
    "previewText",
    "fonts",
    "lang",
    "layout",
    "collection",
    ...extraKeys
  ]);
  const result = {};
  for (const [key, value] of Object.entries(props)) {
    if (!internalKeys.has(key) && value !== void 0) {
      result[key] = value;
    }
  }
  return result;
}
function nextCounter(counters, key) {
  counters[key] = (counters[key] || 0) + 1;
  return counters[key];
}
function toContentType(displayName) {
  if (displayName === "Paragraph") return "text";
  return displayName.toLowerCase();
}
function makeId(prefix, counter) {
  return `${prefix}_${counter}`;
}
function extractTextFromTextJson(textJson) {
  try {
    const parsed = JSON.parse(textJson);
    if (parsed.__html) return parsed.__html;
    const root = parsed?.root;
    if (!root?.children) return "";
    const paragraphs = [];
    for (const paragraph of root.children) {
      if (!paragraph?.children) continue;
      const parts2 = [];
      for (const node of paragraph.children) {
        if (node?.text) parts2.push(node.text);
      }
      paragraphs.push(parts2.join(""));
    }
    return paragraphs.join("\n");
  } catch {
    return "";
  }
}
function processItem(element2, counters, layout = {}, metaName) {
  const componentType = element2.type;
  const config = componentType[UNLAYER_CONFIG_KEY];
  if (!config && componentType?.[KEPT]) {
    return processItem(componentType[KEPT], counters, layout, (componentType.displayName || componentType.name || "component").toLowerCase());
  }
  if (!config) {
    const name2 = componentName(element2) || "Unknown";
    throw new Error(
      `[Unlayer] renderToJson: <${name2}> is not a recognized Unlayer item component. Only components created with createItemComponent are supported.`
    );
  }
  const { name, defaultValues, propMapper, slug } = config;
  const contentType = config.contentType ?? toContentType(name);
  const metaBase = `u_content_${metaName ?? config.metaName ?? contentType}`;
  const count = nextCounter(counters, metaBase);
  const id = makeId(metaBase, count);
  const { children, ...restProps } = element2.props;
  const mappedValues = propMapper({ children, ...restProps });
  const finalValues = mergeValues(defaultValues, mappedValues);
  if (contentType === "text" && finalValues.textJson) {
    finalValues.text = extractTextFromTextJson(finalValues.textJson);
    delete finalValues.textJson;
  }
  const values = {
    containerPadding: "10px",
    ...finalValues,
    _meta: {
      htmlID: id,
      htmlClassNames: metaBase,
      ...finalValues._meta || {}
    },
    selectable: true,
    draggable: true,
    duplicatable: true,
    deletable: true,
    hideable: true
  };
  const itemSrc = values.src;
  if (itemSrc && typeof itemSrc === "object" && itemSrc.autoWidth === false) {
    const availableWidth = contentSlotWidth({
      ...layout,
      containerPadding: values.containerPadding
    });
    values.src = pinImageSrc(itemSrc, availableWidth);
  }
  return slug ? { type: contentType, slug, values } : { type: contentType, values };
}
function processColumn(element2, counters, layout = {}) {
  const count = nextCounter(counters, "u_column");
  const id = makeId("u_column", count);
  const semanticProps = extractSemanticProps(element2.props);
  const mapped = mapSemanticProps(semanticProps, COLUMN_DEFAULTS, "Column");
  const values = mergeValues(COLUMN_DEFAULTS, mapped);
  const valuesWithMeta = {
    ...values,
    _meta: {
      htmlID: id,
      htmlClassNames: "u_column",
      ...values._meta || {}
    }
  };
  const contents = [];
  const children = collectChildren(element2.props.children);
  const itemLayout = { ...layout, columnValues: valuesWithMeta };
  for (const child of children) {
    contents.push(processItem(child, counters, itemLayout));
  }
  return { contents, values: valuesWithMeta };
}
function processRow(element2, counters, parentLayout = {}) {
  const count = nextCounter(counters, "u_row");
  const id = makeId("u_row", count);
  const { layout, cells: propsCells } = element2.props;
  let cells;
  if (layout) {
    cells = layout.cells;
  } else if (propsCells) {
    cells = propsCells;
  } else {
    const columnCount = Math.max(
      1,
      collectChildren(element2.props.children).filter(
        (child) => getDisplayName(child) === "Column"
      ).length
    );
    cells = Array(columnCount).fill(1);
  }
  const semanticProps = extractSemanticProps(element2.props, ["layout"]);
  const mapped = mapSemanticProps(semanticProps, ROW_DEFAULTS, "Row");
  const values = mergeValues(ROW_DEFAULTS, mapped);
  const valuesWithMeta = {
    ...values,
    columns: values.columns ?? false,
    cells,
    _meta: {
      htmlID: id,
      htmlClassNames: "u_row",
      ...values._meta || {}
    },
    selectable: true,
    draggable: true,
    duplicatable: true,
    deletable: true,
    hideable: true
  };
  const columns = [];
  const children = collectChildren(element2.props.children);
  const columnLayout = {
    bodyValues: parentLayout.bodyValues,
    rowValues: valuesWithMeta,
    rowCells: cells
  };
  let columnIndex = 0;
  for (const child of children) {
    const name = getDisplayName(child);
    if (name === "Column") {
      columns.push(
        processColumn(child, counters, { ...columnLayout, columnIndex })
      );
      columnIndex += 1;
    } else {
      console.warn(
        `[Unlayer] renderToJson: <${componentName(child) ?? String(child.type)}> is not a valid Row child. Only <Column> is allowed.`
      );
    }
  }
  return { cells, columns, values: valuesWithMeta };
}
function processBody(element2, counters) {
  const id = "u_body";
  const semanticProps = extractSemanticProps(element2.props);
  const mapped = mapSemanticProps(semanticProps, BODY_DEFAULTS, "Body");
  const values = mergeValues(BODY_DEFAULTS, mapped);
  if ("textDirection" in values) {
    const direction = textDirectionOf(values.textDirection);
    if (direction) values.textDirection = direction;
    else delete values.textDirection;
  }
  const previewText = element2.props.previewText;
  if (previewText !== void 0) {
    values.preheaderText = previewText;
  }
  const valuesWithMeta = {
    ...values,
    _meta: {
      htmlID: id,
      htmlClassNames: "u_body",
      ...values._meta || {}
    }
  };
  const rows = [];
  const children = collectChildren(element2.props.children);
  for (const child of children) {
    const name = getDisplayName(child);
    if (name === "Row") {
      rows.push(processRow(child, counters, { bodyValues: valuesWithMeta }));
    } else {
      console.warn(
        `[Unlayer] renderToJson: <${componentName(child) ?? String(child.type)}> is not a valid Body child. Only <Row> is allowed.`
      );
    }
  }
  return {
    rows,
    values: valuesWithMeta
  };
}
function renderRowToJson(element2) {
  const displayName = getDisplayName(element2);
  if (displayName !== "Row") {
    throw new Error(
      `[Unlayer] renderRowToJson: Element must be <Row>, but got <${componentName(element2) || "unknown"}>. For full designs, use renderToJson instead.`
    );
  }
  const counters = {};
  return withRenderScope(() => processRow(normalizedChildren(element2).find((c) => React4__default.default.isValidElement(c)) ?? element2, counters));
}
function renderToJson(element2) {
  return withRenderScope(() => designJson(element2));
}
function designJson(element2) {
  element2 = unwrapForJson(element2);
  const displayName = getDisplayName(element2);
  if (displayName && ROOT_NAMES.has(displayName)) element2 = normalizedRoot(element2);
  if (!displayName || !ROOT_NAMES.has(displayName)) {
    throw new Error(
      `[Unlayer] renderToJson: Root element must be <Body>, <Email>, <Page>, or <Document>, but got <${componentName(element2) || "unknown"}>. Wrap your content: <Body><Row><Column>...</Column></Row></Body>`
    );
  }
  const counters = {};
  const body = processBody(element2, counters);
  return {
    counters,
    body,
    schemaVersion
  };
}

// src/utils/extract-head.ts
function ensureMeta(values, type, index = 0) {
  return {
    ...values,
    _meta: {
      htmlID: `${["row", "column"].includes(type) ? "u" : "u_content"}_${type.toLowerCase()}_${index + 1}`,
      htmlClassNames: `u_content_${type.toLowerCase()}`,
      ...values._meta || {}
    }
  };
}
var collectChildren2 = (node) => React4__default.default.Children.toArray(node).filter(React4__default.default.isValidElement);
function callHead(head, values, bodyValues, displayMode, headConfig, styles, scripts, tags) {
  if (!head) return;
  const headArgs = [
    values,
    bodyValues,
    {
      displayMode,
      isViewer: false,
      variant: null,
      type: "rows",
      headConfig
    }
  ];
  const css2 = head.css?.(...headArgs);
  if (css2) styles.push(css2);
  const js = head.js?.(...headArgs);
  if (js) scripts.push(js);
  const headTags = head.tags?.(...headArgs);
  if (headTags) tags.push(...headTags);
}
function walkItem(element2, bodyValues, displayMode, headConfig, counters, styles, scripts, tags, deviceStyles) {
  const componentType = element2.type;
  const config = componentType[UNLAYER_CONFIG_KEY];
  if (!config) {
    if (componentType?.[KEPT]) nextCounter(counters, `u_content_${(componentType.displayName || componentType.name || "component").toLowerCase()}`);
    return;
  }
  const { name, defaultValues, propMapper } = config;
  const { children, ...restProps } = element2.props;
  const mappedValues = propMapper({ children, ...restProps });
  const finalValues = mergeValues(defaultValues, mappedValues);
  const contentType = config.metaName ?? name.toLowerCase();
  const count = nextCounter(counters, `u_content_${contentType}`);
  const valuesWithMeta = ensureMeta(finalValues, contentType, count - 1);
  collectDeviceStyles(valuesWithMeta, "contents", name, displayMode, deviceStyles);
  const head = config.head ?? exporters.heads[name];
  callHead(head, valuesWithMeta, bodyValues, displayMode, headConfig, styles, scripts, tags);
}
function walkColumn(element2, bodyValues, rowValues, displayMode, headConfig, counters, styles, scripts, tags, deviceStyles) {
  const semanticProps = extractSemanticProps(element2.props);
  const mapped = mapSemanticProps(semanticProps, COLUMN_DEFAULTS, "Column");
  const count = nextCounter(counters, "u_column");
  const columnValues = ensureMeta(mergeValues(COLUMN_DEFAULTS, mapped), "column", count - 1);
  collectDeviceStyles(columnValues, "columns", "Column", displayMode, deviceStyles);
  const columnHead = exporters.heads["Column"];
  callHead(columnHead, columnValues, bodyValues, displayMode, headConfig, styles, scripts, tags);
  const children = collectChildren2(element2.props.children);
  for (const child of children) {
    walkItem(child, bodyValues, displayMode, headConfig, counters, styles, scripts, tags, deviceStyles);
  }
}
function walkRow(element2, bodyValues, displayMode, headConfig, counters, styles, scripts, tags, deviceStyles) {
  const semanticProps = extractSemanticProps(element2.props, ["layout"]);
  const mapped = mapSemanticProps(semanticProps, ROW_DEFAULTS, "Row");
  const count = nextCounter(counters, "u_row");
  const rowValues = ensureMeta(mergeValues(ROW_DEFAULTS, mapped), "row", count - 1);
  collectDeviceStyles(rowValues, "rows", "Row", displayMode, deviceStyles);
  const rowHead = exporters.heads["Row"];
  callHead(rowHead, rowValues, bodyValues, displayMode, headConfig, styles, scripts, tags);
  const children = collectChildren2(element2.props.children);
  for (const child of children) {
    const name = getDisplayName(child);
    if (name === "Column") {
      walkColumn(child, bodyValues, rowValues, displayMode, headConfig, counters, styles, scripts, tags, deviceStyles);
    }
  }
}
function extractHeadFromTree(element2, options) {
  element2 = normalizedRoot(element2);
  const { displayMode } = options;
  const headConfig = {
    hasFeature: options.headConfig?.hasFeature ?? (() => false),
    getInitialValues: options.headConfig?.getInitialValues ?? (() => ({}))
  };
  const styles = [];
  const scripts = [];
  const tags = [];
  const counters = {};
  const deviceStyles = {};
  const semanticProps = extractSemanticProps(element2.props);
  const mapped = mapSemanticProps(semanticProps, BODY_DEFAULTS, "Body");
  const bodyValues = ensureMeta(mergeValues(BODY_DEFAULTS, mapped), "body", 0);
  const bodyHead = exporters.heads["Body"];
  callHead(bodyHead, bodyValues, bodyValues, displayMode, headConfig, styles, scripts, tags);
  const children = collectChildren2(element2.props.children);
  for (const child of children) {
    const name = getDisplayName(child);
    if (name === "Row") {
      walkRow(child, bodyValues, displayMode, headConfig, counters, styles, scripts, tags, deviceStyles);
    }
  }
  styles.unshift(deviceVisibilityCss(displayMode));
  const overrides = deviceStylesCss(deviceStyles, displayMode);
  if (overrides) styles.push(overrides);
  const uniqueTags = [...new Set(tags.filter(Boolean))];
  return {
    css: styles.filter(Boolean).join("\n"),
    js: scripts.filter(Boolean).join("\n"),
    tags: uniqueTags
  };
}

// src/utils/document-layouts.ts
function emailLayout(args) {
  const { dir, titleTag, tagLines, styleTag, scriptTag, fontLinks, body } = args;
  const head = [
    titleTag,
    tagLines,
    styleTag,
    scriptTag,
    fontLinks && `<!--[if !mso]><!-->${fontLinks}<!--<![endif]-->`
  ].filter(Boolean).join("\n  ");
  return `<!DOCTYPE HTML PUBLIC "-//W3C//DTD XHTML 1.0 Transitional //EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html${dir}${args.lang || ""} xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<!--[if gte mso 9]>
<xml>
  <o:OfficeDocumentSettings>
    <o:AllowPNG/>
    <o:PixelsPerInch>96</o:PixelsPerInch>
  </o:OfficeDocumentSettings>
</xml>
<![endif]-->
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <!--[if !mso]><!--><meta http-equiv="X-UA-Compatible" content="IE=edge"><!--<![endif]-->
  ${head}
</head>
${body}
</html>
`;
}
function documentLayout(args) {
  const { dir, titleTag, tagLines, styleTag, scriptTag, fontLinks, body } = args;
  const head = [titleTag, tagLines, styleTag, scriptTag, fontLinks].filter(Boolean).join("\n  ");
  return `<!DOCTYPE HTML PUBLIC "-//W3C//DTD XHTML 1.0 Transitional //EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html${dir}${args.lang || ""} xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  ${head}
</head>
${body}
</html>
`;
}
function webLayout(args) {
  const { dir, titleTag, tagLines, styleTag, scriptTag, fontLinks, body } = args;
  const head = [titleTag, fontLinks, tagLines, styleTag, scriptTag].filter(Boolean).join("\n    ");
  return `<!doctype html>
<html${dir}${args.lang || ""}>
  <head>
    <meta charset="utf-8">
    <meta http-equiv="x-ua-compatible" content="ie=edge">
    <meta name="description" content="">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    ${head}
  </head>
  <body>
${body}
  </body>
</html>
`;
}

// src/utils/render-to-html.tsx
var MODE_BY_WRAPPER = {
  Email: "email",
  Page: "web",
  Document: "document"
};
function resolveConfig(element2, config) {
  const props = element2.props;
  const textDirection = textDirectionOf(props.textDirection ?? props.values?.textDirection);
  return { ...DEFAULT_CONFIG, ...textDirection !== void 0 ? { textDirection } : {}, ...config };
}
function resolveDisplayMode(element2, mergedConfig) {
  const displayName = element2.type?.displayName;
  const wrapperMode = displayName ? MODE_BY_WRAPPER[displayName] : void 0;
  return wrapperMode ?? element2.props.mode ?? mergedConfig.mode ?? "web";
}
function renderBody(element2, config, name = "renderToHtml") {
  const mergedConfig = resolveConfig(element2, config);
  try {
    const enriched = React4__default.default.cloneElement(element2, { config: mergedConfig });
    return renderToStaticMarkup(enriched);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(
      `[Unlayer] ${name} failed: ${message}
Tip: Ensure your tree uses Body > Row > Column > Item structure.`
    );
  }
}
function stripOuterDiv(html) {
  const match = html.match(/^\s*<div[^>]*>([\s\S]*)<\/div>\s*$/);
  return match ? match[1] : html;
}
function escapeForHtml(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function renderToHtml(element2, options) {
  return withRenderScope(() => htmlDocument(element2, options));
}
function styleText(css2) {
  return css2.replace(/<\/(style)/gi, "<\\/$1");
}
function htmlDocument(element2, options) {
  const { title, lang: optionLang, fonts: optionFonts = [], ...config } = options ?? {};
  element2 = htmlRoot(element2, "renderToHtml");
  const rootFonts = element2.props?.fonts ?? [];
  const fonts = [...rootFonts, ...optionFonts].filter((font, i, all) => font?.url && all.findIndex((f) => f?.url === font.url) === i);
  const lang = optionLang ?? element2.props.lang;
  const mergedConfig = resolveConfig(element2, config);
  const displayMode = resolveDisplayMode(element2, mergedConfig);
  const wrapperName = element2.type?.displayName;
  const isUnlayerWrapper = wrapperName === "Body" || (wrapperName ? wrapperName in MODE_BY_WRAPPER : false);
  const rawBody = renderBody(element2, config);
  const body = isUnlayerWrapper ? stripOuterDiv(rawBody) : rawBody;
  const { css: css2, js, tags } = extractHeadFromTree(element2, {
    displayMode,
    headConfig: mergedConfig.headConfig
  });
  const layoutArgs = {
    lang: lang ? ` lang="${escapeForHtml(String(lang))}"` : "",
    dir: mergedConfig.textDirection ? ` dir="${escapeForHtml(String(mergedConfig.textDirection))}"` : "",
    titleTag: title ? `<title>${escapeForHtml(title.trim())}</title>` : "",
    styleTag: css2 ? `<style type="text/css">
${styleText(css2)}
</style>` : "",
    scriptTag: js ? `<script type="application/javascript">
${js}
</script>` : "",
    tagLines: tags.join("\n"),
    fontLinks: fonts.filter((font) => font?.url).map(
      (font) => `<link href="${escapeForHtml(String(font.url))}" rel="stylesheet" type="text/css">`
    ).join(""),
    body
  };
  if (displayMode === "email") return emailLayout(layoutArgs);
  if (displayMode === "document") return documentLayout(layoutArgs);
  return webLayout(layoutArgs);
}
function renderToPlainText(element2, config) {
  const html = withRenderScope(() => {
    const root = htmlRoot(element2, "renderToPlainText");
    normalizedRoot(root);
    return renderBody(root, config, "renderToPlainText");
  });
  return htmlToPlainText(html);
}
function renderToHtmlParts(element2, config) {
  return withRenderScope(() => htmlParts(element2, config));
}
function htmlParts(element2, config) {
  element2 = htmlRoot(element2, "renderToHtmlParts");
  const body = renderBody(element2, config, "renderToHtmlParts");
  const mergedConfig = resolveConfig(element2, config);
  const displayMode = resolveDisplayMode(element2, mergedConfig);
  const { css: css2, js, tags } = extractHeadFromTree(element2, {
    displayMode,
    headConfig: mergedConfig.headConfig
  });
  const headParts = [];
  if (css2) {
    headParts.push(`<style>${styleText(css2)}</style>`);
  }
  if (js) {
    headParts.push(`<script>${js}</script>`);
  }
  if (tags.length > 0) {
    headParts.push(...tags);
  }
  return {
    head: headParts.join("\n"),
    body,
    css: css2,
    js,
    tags
  };
}

// src/utils/register-tool.tsx
function initialValuesFromOptions(options) {
  const result = {};
  for (const group of Object.values(options ?? {})) {
    for (const [property, option] of Object.entries(group?.options ?? {})) {
      if (!option || option.enabled === false) continue;
      if (typeof option.defaultValue !== "undefined") {
        result[property] = option.defaultValue;
      }
    }
  }
  return result;
}
function withSanitizer(exporter) {
  return (values, ...args) => {
    const html = String(exporter(values, ...args) ?? "");
    const meta = args[args.length - 1];
    const toSafeHtml = meta?.exporterConfig?.toSafeHtml;
    return typeof toSafeHtml === "function" ? toSafeHtml(html) : html;
  };
}
function withLinkNormalization(exporter, linkKeys) {
  if (linkKeys.length === 0) return exporter;
  return (values, ...args) => {
    const out = { ...values };
    for (const key of linkKeys) {
      const normalized = normalizeLinkValue(out[key]);
      if (normalized !== void 0) out[key] = normalized;
    }
    return exporter(out, ...args);
  };
}
function linkWidgetKeys(options) {
  const keys = [];
  for (const group of Object.values(options ?? {})) {
    for (const [key, option] of Object.entries(group?.options ?? {})) {
      if (option && option.widget === "link") keys.push(key);
    }
  }
  return keys;
}
function registerTool(tool) {
  if (!tool?.name || typeof tool.name !== "string") {
    throw new Error("[Unlayer] registerTool: `name` is required");
  }
  const exporters = tool.renderer?.exporters;
  if (!exporters || !exporters.web && !exporters.email) {
    throw new Error(
      `[Unlayer] registerTool("${tool.name}"): \`renderer.exporters\` needs at least a \`web\` or \`email\` exporter`
    );
  }
  const linkKeys = linkWidgetKeys(tool.options);
  const sanitized = {};
  for (const mode of ["web", "email", "document"]) {
    const exporter = exporters[mode];
    if (exporter) {
      sanitized[mode] = withSanitizer(withLinkNormalization(exporter, linkKeys));
    }
  }
  if (!sanitized.web && sanitized.email) sanitized.web = sanitized.email;
  return createItemComponent({
    name: tool.name,
    displayName: tool.displayName ?? tool.name,
    // Option-group widget defaults seed the values; tool-level `values`
    // win — the editor's precedence.
    defaultValues: {
      ...initialValuesFromOptions(tool.options),
      ...tool.values ?? {}
    },
    // Flat props are the tool's values; `values` is the escape hatch.
    propMapper: ({ children: _children, values, ...rest }) => ({
      ...values ?? {},
      ...rest
    }),
    exporters: sanitized,
    contentType: "custom",
    slug: tool.name,
    metaName: `custom_${tool.name}`,
    head: tool.renderer.head
  });
}
var registerElementsTool = registerTool;

exports.Body = Body_default;
exports.Button = Button_default;
exports.Column = Column_default;
exports.ColumnLayouts = ColumnLayouts;
exports.DEFAULT_CONFIG = DEFAULT_CONFIG;
exports.Divider = Divider_default;
exports.Document = Document;
exports.Email = Email;
exports.Heading = Heading_default;
exports.Html = Html_default;
exports.Image = Image_default;
exports.Menu = Menu_default;
exports.Page = Page;
exports.PageBreak = PageBreak_default;
exports.Paragraph = Paragraph_default;
exports.Row = Row_default;
exports.Social = Social_default;
exports.Table = Table_default;
exports.UnlayerProvider = UnlayerProvider;
exports.Video = Video_default;
exports.htmlToTextJson = htmlToTextJson;
exports.registerElementsTool = registerElementsTool;
exports.registerTool = registerTool;
exports.renderRowToJson = renderRowToJson;
exports.renderToHtml = renderToHtml;
exports.renderToHtmlParts = renderToHtmlParts;
exports.renderToJson = renderToJson;
exports.renderToPlainText = renderToPlainText;
exports.useUnlayerConfig = useUnlayerConfig;
exports.validateColumnLayout = validateColumnLayout;
//# sourceMappingURL=index.cjs.map
//# sourceMappingURL=index.cjs.map