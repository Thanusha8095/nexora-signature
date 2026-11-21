import * as React$1 from 'react';
import React__default from 'react';
import { ColumnValues } from '@unlayer/types/containers/column';
export { ColumnValues } from '@unlayer/types/containers/column';
import { ButtonValues } from '@unlayer/types/tools/button';
export { ButtonValues } from '@unlayer/types/tools/button';
import { DividerValues } from '@unlayer/types/tools/divider';
export { DividerValues } from '@unlayer/types/tools/divider';
import { HeadingValues } from '@unlayer/types/tools/heading';
export { HeadingValues } from '@unlayer/types/tools/heading';
import { HtmlValues } from '@unlayer/types/tools/html';
export { HtmlValues } from '@unlayer/types/tools/html';
import { ImageValues } from '@unlayer/types/tools/image';
export { ImageValues } from '@unlayer/types/tools/image';
import { MenuValues } from '@unlayer/types/tools/menu';
export { MenuValues } from '@unlayer/types/tools/menu';
import { ParagraphValues } from '@unlayer/types/tools/paragraph';
export { ParagraphValues } from '@unlayer/types/tools/paragraph';
import { PageBreakValues } from '@unlayer/types/tools/page-break';
export { PageBreakValues } from '@unlayer/types/tools/page-break';
import { SocialValues } from '@unlayer/types/tools/social';
export { SocialValues } from '@unlayer/types/tools/social';
import { TableValues } from '@unlayer/types/tools/table';
export { TableValues } from '@unlayer/types/tools/table';
import { VideoValues } from '@unlayer/types/tools/video';
export { VideoValues } from '@unlayer/types/tools/video';
import { RowValues } from '@unlayer/types/containers/row';
export { RowValues } from '@unlayer/types/containers/row';
import { BodyValues } from '@unlayer/types/containers/body';
export { BodyValues } from '@unlayer/types/containers/body';
import * as react_jsx_runtime from 'react/jsx-runtime';
export { ContentValues } from '@unlayer/types/containers/content';

/**
 * Shared Type Definitions
 *
 * Framework-agnostic types used across all Unlayer Elements packages.
 * Value types use Record<string, any> since the runtime semantic-props mapper
 * determines nesting from default-values objects, not from static types.
 * Shared sub-types (Href, Icons, etc.) are inlined here.
 */
interface Href {
    name: string;
    attrs?: {
        href?: string;
        target?: string;
        onClick?: unknown;
        class?: string;
        download?: boolean;
        [k: string]: unknown;
    };
    values?: {
        [k: string]: string | number | {
            label?: string;
            value: string | number;
        }[];
    };
}
interface Icons {
    iconType: string;
    icons: {
        name: string;
        url: string;
        imgUrl?: string;
    }[];
    editor?: {
        data?: {
            customIcons?: {
                name: string;
                url: string;
                icons: {
                    [k: string]: string;
                };
            }[];
            customOptions?: {
                value: string;
                label: string;
            }[];
            showDefaultIcons?: boolean;
            showDefaultOptions?: boolean;
        };
    };
}
interface VideoSource {
    loading?: boolean;
    playIconColor?: string;
    playIconSize?: number;
    playIconType?: string;
    thumbnail?: string | null;
    type?: "youtube" | "vimeo";
    url?: string;
    videoId?: string;
}
type TextAlign = "left" | "center" | "right" | "justify";
interface LinkStyle {
    body?: boolean;
    inherit?: boolean;
    linkColor?: string;
    linkHoverColor?: string;
    linkUnderline?: boolean;
    linkHoverUnderline?: boolean;
}

/** A social-media icon entry for the `icons` shorthand prop. */
interface SocialIcon {
    /** Platform name (e.g., "Facebook", "X", "Instagram") */
    name: string;
    /** Profile or share URL */
    url: string;
}
/** A menu item entry for the `items` shorthand prop. */
interface MenuItem {
    /** Display text */
    text: string;
    /** Link URL */
    href: string;
    /** Link target (default: "_blank") */
    target?: string;
}
type RenderMode = "web" | "email" | "document";
interface DesignContent {
    type: string;
    /** Custom tool name — present when `type` is "custom" */
    slug?: string;
    values: Record<string, any>;
}
interface DesignColumn {
    contents: DesignContent[];
    values: Record<string, any>;
}
interface DesignRow {
    cells: number[];
    columns: DesignColumn[];
    values: Record<string, any>;
}
interface DesignBody {
    rows: DesignRow[];
    values: Record<string, any>;
}
interface DesignJSON {
    counters: Record<string, number>;
    body: DesignBody;
    schemaVersion: number;
}
/** Phone settings use the same flat CSS inputs as desktop props. */
interface MobileProps {
    padding?: number | string;
    containerPadding?: number | string;
    fontSize?: number | string;
    lineHeight?: number | string;
    textAlign?: TextAlign;
    width?: number | string;
    maxWidth?: number | string;
    autoWidth?: boolean;
    /** Column border on this device (per side, as the desktop `border`). */
    border?: Partial<Record<`border${"Top" | "Right" | "Bottom" | "Left"}${"Width" | "Style" | "Color"}`, number | string>>;
}
interface DeviceProps {
    mobile?: MobileProps;
    hideOnMobile?: boolean;
    hideOnDesktop?: boolean;
}

interface HeadConfig {
    hasFeature?: (featureName: string) => boolean;
    getInitialValues?: (containerType: string) => Record<string, any>;
}
interface UnlayerConfig {
    cdnBaseUrl: string;
    toSafeHtml?: (text: string, options?: any) => string;
    textDirection?: string;
    mergeTagState?: Record<string, any>;
    mode?: RenderMode;
    headConfig?: HeadConfig;
}
declare const DEFAULT_CONFIG: UnlayerConfig;

/**
 * Column Layouts - All 8 supported column combinations from Unlayer Editor
 *
 * These layouts provide a structured and type-safe way to specify column
 * configurations that match exactly what the Unlayer editor supports.
 *
 * Usage:
 * import { ColumnLayouts } from '@unlayer/react-elements';
 * <Row layout={ColumnLayouts.TwoEqual}>
 *   <Column>...</Column>
 *   <Column>...</Column>
 * </Row>
 */
interface ColumnLayout {
    name: string;
    description: string;
    cells: number[];
    expectedColumns: number;
    widths: string[];
}
declare const ColumnLayouts: {
    OneColumn: ColumnLayout;
    TwoEqual: ColumnLayout;
    TwoWideNarrow: ColumnLayout;
    TwoNarrowWide: ColumnLayout;
    ThreeEqual: ColumnLayout;
    ThreeNarrowWideNarrow: ColumnLayout;
    FourEqual: ColumnLayout;
    FiveEqual: ColumnLayout;
};
type ValidColumnLayout = (typeof ColumnLayouts)[keyof typeof ColumnLayouts];
/**
 * Validates that a layout has the correct number of Column components
 */
declare function validateColumnLayout(layout: ColumnLayout, childrenCount: number): void;
/**
 * Convert an HTML string to a textJson-compatible value.
 *
 * Wraps the HTML in a passthrough format that `generateHtmlFromTextJson`
 * detects and returns directly — avoiding the Lexical headless editor
 * round-trip (HTML → Lexical JSON → HTML) which doesn't work reliably
 * in browser environments.
 *
 * Supports any HTML formatting: bold, italic, underline, strikethrough,
 * code, links, lists, etc.
 *
 * @param html - HTML string with formatting (e.g. `"Hello <b>bold</b>"`)
 * @returns JSON string compatible with Paragraph's `textJson` prop
 *
 * @example
 * ```ts
 * const json = htmlToTextJson('Hello <b>world</b> and <a href="https://example.com">link</a>');
 * ```
 */
declare function htmlToTextJson(html: string): string;

/**
 * Universal Semantic Props System
 *
 * Automatically flattens nested properties for ALL components
 * No build-time generation needed - pure TypeScript + runtime detection
 *
 * Example:
 * - ButtonValues has: { buttonColors: { color, backgroundColor }, fontSize }
 * - Users can pass: { color: "red", backgroundColor: "blue" } OR { buttonColors: { color: "red" } }
 * - TypeScript provides autocomplete for ALL properties (flat and nested)
 */

/**
 * Type utility: Extracts all properties from nested objects
 * This provides TypeScript autocomplete for flat props!
 */
type FlattenObjectProps<T> = T extends object ? {
    [K in keyof T]?: T[K] extends object ? T[K] | FlattenObjectProps<T[K]> : T[K];
} & {
    [K in keyof T as T[K] extends object ? keyof T[K] extends string ? keyof T[K] : never : never]?: any;
} : T;
/**
 * Semantic props type for any component.
 * Generic TChildren parameter allows each framework to supply its own child type.
 */
type SemanticProps$1<T, TChildren = any> = Omit<FlattenObjectProps<T>, keyof DeviceProps> & DeviceProps & {
    children?: TChildren;
    values?: T;
    /** HTML string with inline formatting for Paragraph (e.g. `'Hello <b>bold</b>'`) */
    html?: string;
};

/**
 * Type Definitions
 *
 * Re-exports the canonical value types from @unlayer-internal/shared-elements
 * and defines the agent-friendly input types components build their props from.
 *
 * Each component's prop type (ButtonProps, HeadingProps, …) lives next to its
 * component — these are just the shared building blocks they share.
 */

/** fontFamily accepts a ready stack object or a bare family-name string. */
type FontFamilyInput = {
    label: string;
    value: string;
} | string;
/** fontWeight accepts a number, a numeric string, or a CSS keyword. */
type FontWeightInput = number | `${number}` | "normal" | "bold" | "lighter" | "bolder";
/** A CSS size: a number (treated as px) or a string ("24px", "50%", "1.5em"). */
type SizeInput = number | (string & {});
/**
 * The `border` object, agent-friendly. The canonical type pins each per-side
 * `*Width` to `${number}px`, so a literal like "1px" type-checks inline but a
 * factored-out object widens "1px" to `string` and stops compiling — exactly the
 * reusable-divider pattern authors reach for. Relax the `*Width` fields to
 * SizeInput (the runtime accepts any CSS string), derived from the canonical
 * shape so it tracks the schema instead of duplicating it.
 */
type BorderInput = {
    [K in keyof NonNullable<ColumnValues["border"]>]?: K extends `${string}Width` ? SizeInput : NonNullable<ColumnValues["border"]>[K];
};
/** Heading levels (h1–h6). */
type HeadingLevel = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
/** Shared text/style inputs, agent-friendly. */
type TextStyleProps = {
    fontFamily?: FontFamilyInput;
    fontWeight?: FontWeightInput;
    fontSize?: SizeInput;
    lineHeight?: SizeInput;
    /** Letter spacing — a CSS string ("0.5px", "-0.01em") or a number (px). */
    letterSpacing?: SizeInput;
    color?: string;
};
/** Image `src` accepts a plain URL string or the value object (loosened sizing). */
type ImageSrcInput = string | {
    url: string;
    width?: SizeInput;
    height?: number;
    autoWidth?: boolean;
    maxWidth?: SizeInput;
    [key: string]: unknown;
};

/**
 * Universal Component Factory
 *
 * Eliminates boilerplate by creating components from configuration.
 * This factory handles all the repetitive logic that was duplicated
 * across Button, Heading, Paragraph, etc.
 */

/**
 * Base props that all item components support
 */
interface BaseItemComponentProps extends DeviceProps {
    children?: React__default.ReactNode;
    className?: string;
    style?: React__default.CSSProperties;
    mode?: RenderMode;
    /** Padding of the content wrapper around this item — a number (→ px) or a CSS
     *  string ("10px", "16px 24px"). Applied by the containing Column. */
    containerPadding?: SizeInput;
    index?: number;
    /** @internal — content id allocated by the containing Column; keeps the
     *  value-level _meta.htmlID unique per instance and aligned with the
     *  wrapper id and head/json numbering. */
    _metaHtmlId?: string;
    colIndex?: number;
    cells?: any[];
    bodyValues?: any;
    rowValues?: any;
    /** @internal - this column's values, threaded by Column for width-aware exporters */
    columnValues?: any;
    /** @internal - Unlayer config threaded from UnlayerProvider */
    _config?: UnlayerConfig;
}
/**
 * Props type that combines base props with semantic props
 */
type ItemComponentProps<TSemanticProps> = BaseItemComponentProps & Omit<TSemanticProps, keyof DeviceProps>;

/**
 * React Semantic Props
 *
 * Re-exports the shared semantic props system with React.ReactNode
 * as the default children type.
 */

/**
 * React-specific SemanticProps — pins TChildren to React.ReactNode
 */
type SemanticProps<T> = SemanticProps$1<T, React.ReactNode>;

/**
 * Button semantic props — agent-friendly text/style types (replacing the loose
 * `any` flat props) plus a CSS-style `width` (number/px pins; "100%" full-width).
 */
type ButtonSemanticProps = Omit<SemanticProps<ButtonValues>, keyof TextStyleProps | "width" | "padding" | "borderRadius" | "border"> & TextStyleProps & {
    /** Display width — a number/px pins the button; "100%" makes it full-width. */
    width?: SizeInput;
    /** Inner padding — a number (→ px) or CSS string ("14px 28px"). */
    padding?: SizeInput;
    /** Corner radius — a number (→ px) or CSS string ("8px", "500px"). */
    borderRadius?: SizeInput;
    /** Per-side border object (width fields accept a number/px string). */
    border?: BorderInput;
};
/**
 * Button Component Props
 * Automatically provides autocomplete for ALL properties (flat and nested)
 */
interface ButtonProps extends ItemComponentProps<ButtonSemanticProps> {
}
/**
 * Button - Universal SSR/Client Component with Automatic Semantic Props
 *
 * ✅ TypeScript provides autocomplete for ALL props (flat and nested)
 * ✅ Works for any nested structure - no configuration needed
 * ✅ Escape hatch: values prop for full control
 * ✅ Works on both server and client
 *
 * @example Flat Props (Simple - most common)
 * ```tsx
 * // `href` accepts a plain URL string (the ergonomic form).
 * <Button href="https://example.com" color="white" backgroundColor="#3b82f6" fontSize="16px">
 *   Click me
 * </Button>
 * ```
 *
 * @example Advanced (per-side borders)
 * ```tsx
 * <Button
 *   backgroundColor="blue"
 *   borderTopColor="red"
 *   borderTopWidth="2px"
 *   borderBottomWidth="0px"
 * >
 *   Click me
 * </Button>
 * ```
 *
 * @example Nested Objects (full control)
 * ```tsx
 * <Button
 *   buttonColors={{ backgroundColor: "#3b82f6", hoverBackgroundColor: "#2563eb" }}
 *   border={{ borderTopWidth: "2px" }}
 * >
 *   Click me
 * </Button>
 * ```
 */
declare const Button: React$1.FC<ItemComponentProps<ButtonSemanticProps>>;

type DividerSemanticProps = Omit<SemanticProps<DividerValues>, "border"> & {
    /** Per-side border object (width fields accept a number/px string). */
    border?: BorderInput;
};
interface DividerProps extends ItemComponentProps<DividerSemanticProps> {
}
/**
 * Divider - Universal SSR/Client Component with Automatic Semantic Props
 *
 * @example Flat Props
 * ```tsx
 * <Divider borderTopWidth="2px" borderTopColor="#ccc" width="80%" />
 * ```
 *
 * @example Full Control
 * ```tsx
 * <Divider values={{
 *   border: { borderTopWidth: "2px", borderTopColor: "#ccc" },
 *   width: "80%"
 * }} />
 * ```
 */
declare const Divider: React$1.FC<ItemComponentProps<DividerSemanticProps>>;

/**
 * Heading semantic props — agent-friendly text/style types (replacing the loose
 * `any` flat props) plus the `level` alias and h1–h6 levels.
 */
type HeadingSemanticProps = Omit<SemanticProps<HeadingValues>, keyof TextStyleProps | "headingType"> & TextStyleProps & {
    /** Heading level h1–h6. */
    headingType?: HeadingLevel;
    /** Alias for `headingType`. */
    level?: HeadingLevel;
    /** Heading text (or use children). */
    text?: string;
};
/**
 * Heading Component Props
 * Automatically provides autocomplete for ALL properties (flat and nested)
 */
interface HeadingProps extends ItemComponentProps<HeadingSemanticProps> {
}
/**
 * Heading - Universal SSR/Client Component with Semantic Props API
 *
 * ✅ Semantic flat props (level, color, fontSize, etc.)
 * ✅ Escape hatch: values prop for full control
 * ✅ Works on both server and client
 * ✅ Minimal boilerplate using component factory
 *
 * @example Semantic Props (Recommended)
 * ```tsx
 * <Heading level="h1" color="#222" fontSize="32px">
 *   Welcome
 * </Heading>
 * ```
 *
 * @example Full Control via Values
 * ```tsx
 * <Heading values={{ headingType: "h1", color: "#222" }}>Welcome</Heading>
 * ```
 */
declare const Heading: React$1.FC<ItemComponentProps<HeadingSemanticProps>>;

interface HtmlProps extends ItemComponentProps<SemanticProps<HtmlValues>> {
}
/**
 * Html - Universal SSR/Client Component for custom HTML with Automatic Semantic Props
 *
 * ⚠️ Renders the HTML verbatim — it is NOT sanitized by default. Only pass HTML
 * you trust, and make sure it is valid: notably, an inline SVG inside a `url(...)`
 * must be URL-encoded, because a raw `"` inside a double-quoted `style="…"`
 * closes the attribute and the rest leaks out as text. To sanitize (matching the
 * editor's HTML block, which strips scripts/event handlers), pass a `toSafeHtml`
 * function via the `UnlayerProvider` config.
 *
 * @example Flat Props
 * ```tsx
 * <Html html="<div>Custom HTML</div>" />
 * ```
 *
 * @example Full Control
 * ```tsx
 * <Html values={{ html: "<div>Custom HTML</div>" }} />
 * ```
 */
declare const Html: React$1.FC<ItemComponentProps<SemanticProps<HtmlValues>>>;

/**
 * Image semantic props — agent-friendly `src` (plain URL string or value object)
 * and CSS-style sizing (number/px pins, "50%" sets a percentage), replacing the
 * loose `any` flat props.
 */
type ImageSemanticProps = Omit<SemanticProps<ImageValues>, "src" | "width" | "maxWidth"> & {
    /** Alt text (alias for altText) */
    alt?: string;
    /** Image URL string, or the value object `{ url, width?, maxWidth?, ... }`. */
    src?: ImageSrcInput;
    /** Display width — number/px pins the image; "50%" sets a percentage width. */
    width?: SizeInput;
    /** Display width as a CSS value ("50%", "300px"). */
    maxWidth?: SizeInput;
};
interface ImageProps extends ItemComponentProps<ImageSemanticProps> {
}
/**
 * Image - Renders an image element.
 *
 * @example Shorthand
 * ```tsx
 * <Image src="https://example.com/photo.jpg" alt="A photo" />
 * ```
 *
 * @example Full Control
 * ```tsx
 * <Image values={{
 *   src: { url: "https://example.com/image.jpg", width: 600 },
 *   altText: "Description"
 * }} />
 * ```
 */
declare const Image: React$1.FC<ItemComponentProps<ImageSemanticProps>>;

type MenuSemanticProps = Omit<SemanticProps<MenuValues>, "padding" | "fontFamily" | "fontWeight" | "fontSize" | "letterSpacing"> & Omit<TextStyleProps, "color" | "lineHeight"> & {
    /** Menu items shorthand */
    items?: MenuItem[];
    /** Inner padding — a number (→ px) or CSS string. */
    padding?: SizeInput;
};
interface MenuProps extends ItemComponentProps<MenuSemanticProps> {
}
/**
 * Menu - Renders a navigation menu.
 *
 * @example Shorthand
 * ```tsx
 * <Menu items={[{ text: "Home", href: "/" }, { text: "About", href: "/about" }]} />
 * ```
 *
 * @example Full Control
 * ```tsx
 * <Menu values={{
 *   menu: {
 *     items: [
 *       { key: "home", text: "Home", link: { name: "web", values: { href: "/" } } }
 *     ]
 *   }
 * }} />
 * ```
 */
declare const Menu: React$1.FC<ItemComponentProps<MenuSemanticProps>>;

/**
 * Paragraph semantic props — agent-friendly text/style types (replacing the
 * loose `any` flat props) plus the `text` shorthand (converted to textJson).
 */
type ParagraphSemanticProps = Omit<SemanticProps<ParagraphValues>, keyof TextStyleProps> & TextStyleProps & {
    /** Plain-text content (or use `html` for inline formatting, or children). */
    text?: string;
};
/**
 * Paragraph Component Props
 * Automatically provides autocomplete for ALL properties (flat and nested)
 */
interface ParagraphProps extends ItemComponentProps<ParagraphSemanticProps> {
}
/**
 * Paragraph - Universal SSR/Client Component with Semantic Props API
 *
 * ✅ Semantic flat props (color, fontSize, textAlign, etc.)
 * ✅ Escape hatch: values prop for full control
 * ✅ Works on both server and client
 * ✅ Minimal boilerplate using component factory
 *
 * @example Semantic Props (Recommended)
 * ```tsx
 * <Paragraph color="#555" fontSize="14px" lineHeight="1.6">
 *   Your paragraph content here with <strong>rich text</strong> support
 * </Paragraph>
 * ```
 *
 * @example Full Control via Values
 * ```tsx
 * <Paragraph values={{ textJson: "...", color: "#555" }} />
 * ```
 */
declare const Paragraph: React$1.FC<ItemComponentProps<ParagraphSemanticProps>>;

type PageBreakProps = ItemComponentProps<SemanticProps<PageBreakValues>>;
/**
 * PageBreak - Forces subsequent document content onto a new PDF page.
 *
 * Page breaks render only in document mode. In email and web output they are
 * intentionally inert.
 */
declare const PageBreak: React$1.FC<ItemComponentProps<SemanticProps<PageBreakValues>>>;

type SocialSemanticProps = Omit<SemanticProps<SocialValues>, "iconSize" | "spacing"> & {
    /** Social icons shorthand (array of {name, url}) */
    icons?: SocialIcon[];
    /** Icon shape */
    iconType?: "circle" | "rounded" | "squared";
    /** Icon size in px — a number (34) or px string ("34px"). */
    iconSize?: SizeInput;
    /** Gap between icons in px — a number or px string. */
    spacing?: SizeInput;
};
interface SocialProps extends Omit<ItemComponentProps<SemanticProps<SocialValues>>, "icons" | "iconSize" | "spacing"> {
    icons?: SocialIcon[] | SocialValues["icons"];
    iconType?: "circle" | "rounded" | "squared";
    iconSize?: SizeInput;
    spacing?: SizeInput;
}
/**
 * Social - Renders social-media icon links.
 *
 * @example Shorthand
 * ```tsx
 * <Social icons={[{ name: "Facebook", url: "https://facebook.com" }]} iconType="rounded" />
 * ```
 *
 * @example Full Control
 * ```tsx
 * <Social values={{
 *   icons: { icons: [
 *     { name: "Facebook", url: "https://facebook.com/..." },
 *     { name: "Twitter", url: "https://twitter.com/..." }
 *   ]}
 * }} />
 * ```
 */
declare const Social: React$1.FC<ItemComponentProps<SocialSemanticProps>>;

type TableSemanticProps = Omit<SemanticProps<TableValues>, "padding" | "border"> & {
    /** Column headers as string[] */
    headers?: string[];
    /** Row data as 2D string array */
    data?: string[][];
    /** Inner padding — a number (→ px) or CSS string. */
    padding?: SizeInput;
    /** Per-side border object (width fields accept a number/px string). */
    border?: BorderInput;
};
interface TableProps extends Omit<ItemComponentProps<Omit<SemanticProps<TableValues>, "padding" | "border">>, "headers" | "data"> {
    headers?: string[];
    data?: string[][];
    /** Inner padding — a number (→ px) or CSS string. */
    padding?: SizeInput;
    /** Per-side border object (width fields accept a number/px string). */
    border?: BorderInput;
}
/**
 * Table - Renders a data table.
 *
 * @example Shorthand
 * ```tsx
 * <Table
 *   headers={["Name", "Email", "Role"]}
 *   data={[["Alice", "alice@co.com", "Admin"], ["Bob", "bob@co.com", "User"]]}
 * />
 * ```
 *
 * @example Full Control
 * ```tsx
 * <Table values={{
 *   table: {
 *     headers: [{ cells: [{ text: "Name" }, { text: "Email" }] }],
 *     rows: [{ cells: [{ text: "John" }, { text: "john@example.com" }] }]
 *   },
 *   enableHeader: true
 * }} />
 * ```
 */
declare const Table: React$1.FC<ItemComponentProps<TableSemanticProps>>;

type VideoSemanticProps = SemanticProps<VideoValues> & {
    /** YouTube/Vimeo URL (auto-parsed) */
    videoUrl?: string;
};
interface VideoProps extends ItemComponentProps<SemanticProps<VideoValues>> {
    videoUrl?: string;
}
/**
 * Video - Renders an embedded video player (YouTube/Vimeo).
 *
 * @example Shorthand
 * ```tsx
 * <Video videoUrl="https://www.youtube.com/watch?v=dQw4w9WgXcQ" />
 * ```
 *
 * @example Full Control
 * ```tsx
 * <Video values={{
 *   video: { type: "youtube", videoId: "dQw4w9WgXcQ", thumbnail: "..." }
 * }} />
 * ```
 */
declare const Video: React$1.FC<ItemComponentProps<VideoSemanticProps>>;

type RowProps = Omit<SemanticProps<RowValues>, "padding" | keyof DeviceProps> & DeviceProps & {
    children?: React__default.ReactNode;
    layout?: ColumnLayout;
    cells?: number[];
    mode?: RenderMode;
    className?: string;
    style?: React__default.CSSProperties;
    index?: number;
    bodyValues?: any;
    collection?: string;
    /** Padding — a CSS string ("0 48px", "20px 40px") or a number (px). */
    padding?: SizeInput;
    /** @internal - Unlayer config threaded from UnlayerProvider via Body */
    _config?: UnlayerConfig;
};
declare const Row: React__default.FC<RowProps>;

type ColumnProps = Omit<SemanticProps<ColumnValues>, "padding" | "border" | "borderRadius" | keyof DeviceProps> & Omit<DeviceProps, "hideOnMobile" | "hideOnDesktop"> & {
    children?: React__default.ReactNode;
    index?: number;
    cells?: number[];
    bodyValues?: any;
    rowValues?: any;
    mode?: RenderMode;
    className?: string;
    style?: React__default.CSSProperties;
    /** Padding — a CSS string ("0 24px", "10px") or a number (px). */
    padding?: SizeInput;
    /** Corner radius — a number (→ px) or CSS string ("8px"). */
    borderRadius?: SizeInput;
    /** Per-side border object (great for hairline dividers). Width fields accept
     *  a number/px string; reuse it as a factored-out const without `as const`. */
    border?: BorderInput;
    /** @internal - Unlayer config threaded from UnlayerProvider via Body/Row */
    _config?: UnlayerConfig;
};
declare const Column: React__default.FC<ColumnProps>;

type BodyProps = Omit<SemanticProps<BodyValues>, "padding" | "borderRadius"> & {
    children?: React__default.ReactNode;
    mode?: RenderMode;
    className?: string;
    style?: React__default.CSSProperties;
    index?: number;
    /** Optional config (replaces context-based config for Server Component usage) */
    config?: Partial<UnlayerConfig>;
    /** Preview text shown in email client inboxes (email mode only) */
    previewText?: string;
    /** Document text direction, also kept in the design JSON. Renderer options can override it. */
    textDirection?: string;
    /** Language of the rendered document (for example, "ar"). */
    lang?: string;
    /**
     * Web font stylesheets the content uses (e.g. a Google Fonts CSS URL).
     * renderToHtml links them in the document head, with any `fonts` option.
     */
    fonts?: Array<{
        url: string;
    }>;
    /** Padding — a CSS string ("0 48px", "20px") or a number (px). */
    padding?: SizeInput;
    /** Corner radius — a number (→ px) or CSS string ("8px"). */
    borderRadius?: SizeInput;
};
/**
 * Body - Universal Server/Client Component
 *
 * Works in both Server Components and Client Components.
 * In Server Components, pass config as a prop.
 * In Client Components, config can come from UnlayerProvider context or props.
 *
 * @example Server Component
 * ```tsx
 * <Body backgroundColor="#F7F8F9" contentWidth="600px" mode="web">
 *   <Row><Column><Paragraph values={{...}} mode="web" /></Column></Row>
 * </Body>
 * ```
 *
 * @example Client Component with Provider
 * ```tsx
 * <UnlayerProvider config={{ mode: "email" }}>
 *   <Body>...</Body>
 * </UnlayerProvider>
 * ```
 */
declare const Body: React__default.FC<BodyProps>;

type EmailProps = Omit<BodyProps, "mode">;
/**
 * Email - Renders email-client safe HTML (tables for Outlook, Gmail, Yahoo).
 *
 * Thin wrapper around Body with mode locked to "email".
 *
 * @example
 * ```tsx
 * <Email backgroundColor="#f4f4f5" contentWidth="560px" previewText="Welcome!">
 *   <Row><Column><Paragraph text="Hello" /></Column></Row>
 * </Email>
 * ```
 */
declare function Email(props: EmailProps): react_jsx_runtime.JSX.Element;
declare namespace Email {
    var displayName: string;
}

type PageProps = Omit<BodyProps, "mode">;
/**
 * Page - Renders with div/flexbox for responsive web display.
 *
 * Thin wrapper around Body with mode locked to "web".
 *
 * @example
 * ```tsx
 * <Page backgroundColor="#ffffff" contentWidth="960px">
 *   <Row><Column><Paragraph text="Hello" /></Column></Row>
 * </Page>
 * ```
 */
declare function Page(props: PageProps): react_jsx_runtime.JSX.Element;
declare namespace Page {
    var displayName: string;
}

type DocumentPageSize = "A3" | "A4" | "A5" | "Legal" | "Letter" | "Tabloid";
type DocumentOrientation = "portrait" | "landscape";
type DocumentProps = Omit<BodyProps, "mode" | "documentSize" | "documentOrientation" | "documentMargin"> & {
    documentSize?: DocumentPageSize;
    documentOrientation?: DocumentOrientation;
};
/**
 * Document - Print-optimized rendering for PDF generation.
 *
 * Thin wrapper around Body with mode locked to "document".
 *
 * @example
 * ```tsx
 * <Document
 *   backgroundColor="#ffffff"
 *   contentWidth="700px"
 *   documentSize="A4"
 *   documentOrientation="portrait"
 * >
 *   <Row><Column><Paragraph text="Hello" /></Column></Row>
 * </Document>
 * ```
 */
declare function Document(props: DocumentProps): react_jsx_runtime.JSX.Element;
declare namespace Document {
    var displayName: string;
}

interface UnlayerProviderProps {
    config: Partial<UnlayerConfig>;
    children: React__default.ReactNode;
}
declare const UnlayerProvider: React__default.FC<UnlayerProviderProps>;
declare function useUnlayerConfig(): UnlayerConfig;

/**
 * Options for renderToHtml — config overrides plus document-level extras.
 */
interface RenderToHtmlOptions extends Partial<UnlayerConfig> {
    /** Document language; overrides the root's `lang` prop. */
    lang?: string;
    /** Document `<title>` */
    title?: string;
    /**
     * Web-font stylesheets to load via `<link rel="stylesheet">` tags.
     * Elements has no font registry, so pass the URLs for any non-system
     * fonts your design uses (e.g. Google Fonts CSS URLs).
     */
    fonts?: Array<{
        url: string;
    }>;
}
/**
 * Renders an Unlayer element tree to a complete HTML document — from
 * `<!DOCTYPE ...>` to `</html>` — matching the editor's exportHtml layouts.
 *
 * Per-mode document shells (mirroring the editor's layout templates):
 * - `email`: XHTML transitional doctype, VML/Office namespaces, and the MSO
 *   conditional comments Outlook needs
 * - `web`: HTML5 doctype with standard viewport/charset meta tags
 * - `document`: XHTML transitional doctype for print/PDF pipelines
 *
 * Use {@link renderToHtmlParts} instead when your app owns the document
 * shell and only needs the head/body chunks.
 *
 * @param element - A React element tree (e.g. `<Email><Row>...</Row></Email>`), or a
 *   template component that returns one (`<Welcome name="Ada" />`, also `memo`/`forwardRef`).
 *   A template is called in a render of its own to reach its root (its hooks work); a class
 *   component, or one that doesn't return an element, renders without its root's settings,
 *   with a warning.
 * @param options - Config overrides (mode, cdnBaseUrl, etc.) plus `title` and `fonts`
 * @returns Complete HTML document string
 * @throws {Error} If rendering fails, with a helpful message
 *
 * @example
 * ```tsx
 * import { renderToHtml, Email, Row, Column, Paragraph } from "@unlayer/react-elements";
 *
 * const html = renderToHtml(
 *   <Email><Row><Column><Paragraph>Hello</Paragraph></Column></Row></Email>,
 *   { title: "Welcome" }
 * );
 * // "<!DOCTYPE HTML PUBLIC ...><html ...>...</html>"
 * ```
 */
declare function renderToHtml(element: React__default.ReactElement, options?: RenderToHtmlOptions): string;
/**
 * Renders an Unlayer element tree to a plain text string.
 *
 * Renders the body markup then converts to plain text using
 * `htmlToPlainText`. Useful for generating the text/plain MIME part
 * of multipart emails (critical for deliverability).
 *
 * @param element - A React element tree (e.g. `<Body><Row>...</Row></Body>`)
 * @param config  - Optional config overrides (mode, cdnBaseUrl, etc.)
 * @returns Plain text representation of the email
 *
 * @example
 * ```tsx
 * import { renderToPlainText, Body, Row, Column, Paragraph } from "@unlayer/react-elements";
 *
 * const text = renderToPlainText(
 *   <Body mode="email"><Row><Column><Paragraph>Hello World</Paragraph></Column></Row></Body>
 * );
 * // "Hello World"
 * ```
 */
declare function renderToPlainText(element: React__default.ReactElement, config?: Partial<UnlayerConfig>): string;
/**
 * Result of renderToHtmlParts — head and body as separate strings.
 */
interface HtmlParts {
    /**
     * Pre-assembled `<head>` content: the css in a `<style>` tag, the js in a
     * `<script>` tag, and the tags — joined and ready to drop into a document.
     * Equivalent to composing the granular fields below yourself.
     */
    head: string;
    /**
     * The rendered body markup, wrapped in the renderer's host `<div>`. In
     * email/document mode it contains the `<body>` tag itself; web mode has
     * none. No doctype/html/head shell — embeddable as-is, or extract the
     * `<body>` tag when composing a full document.
     */
    body: string;
    /** Raw component CSS (no `<style>` wrapper) — e.g. for inlining pipelines */
    css: string;
    /** Raw component JS (no `<script>` wrapper); empty for most email designs */
    js: string;
    /**
     * Individual head tags (`<meta>`, `<link>`, ...) contributed by components.
     * Not part of the editor's documented chunk parameters, but exposed here
     * because `head` can contain them — without this field, reassembling the
     * head from `css` + `js` would silently drop them. Usually empty.
     *
     * There is deliberately no `fonts` chunk: Elements has no font registry to
     * resolve font URLs from — pass stylesheet URLs via renderToHtml's `fonts`
     * option instead.
     */
    tags: string[];
}
/**
 * Renders an Unlayer element tree to separate head and body HTML strings.
 *
 * Use this when your app owns the document shell — an existing page
 * template, an ESP template with its own meta tags, an iframe srcdoc —
 * and you want to place the `<style>` block and body markup yourself.
 * For a complete ready-to-send document in one call, use
 * {@link renderToHtml}.
 *
 * - `head` contains `<style>` tags with CSS generated by each component's
 *   head function (button hover colors, body fonts, link styles, etc.)
 * - `body` is the rendered body markup without any document shell
 *
 * @param element - A React element tree (e.g. `<Email><Row>...</Row></Email>`)
 * @param config  - Optional config overrides (mode, cdnBaseUrl, etc.)
 * @returns `{ head, body }` — drop these into your HTML document template
 *
 * @example
 * ```tsx
 * import { renderToHtmlParts, Email, Row, Column, Button } from "@unlayer/react-elements";
 *
 * const { head, body } = renderToHtmlParts(
 *   <Email>
 *     <Row><Column><Button>Click</Button></Column></Row>
 *   </Email>
 * );
 *
 * const html = `<!DOCTYPE html>
 * <html><head>${head}</head>${body}</html>`;
 * ```
 */
declare function renderToHtmlParts(element: React__default.ReactElement, config?: Partial<UnlayerConfig>): HtmlParts;

/**
 * renderToJson — Convert a React element tree to Unlayer's DesignJSON format.
 *
 * Walks the React element tree statically via React.Children and extracts
 * values at each level. No HTML rendering is performed.
 *
 * Produces the { body: { rows, values }, counters, schemaVersion } structure
 * that the Unlayer editor uses, enabling round-tripping: build with React
 * components → export as JSON → load into the Unlayer editor.
 */

/**
 * Convert a React element tree to Unlayer's DesignJSON format.
 *
 * The root element must be a `<Body>`, `<Email>`, `<Page>`, or `<Document>`.
 * The tree is walked statically — no HTML rendering is performed.
 *
 * @param element - A React element tree with Body > Row > Column > Item structure
 * @returns DesignJSON object compatible with the Unlayer editor
 * @throws {Error} If the root element is not a recognized container component
 *
 * @example
 * ```tsx
 * import { renderToJson, Body, Row, Column, Paragraph } from "@unlayer/react-elements";
 *
 * const design = renderToJson(
 *   <Body backgroundColor="#ffffff" contentWidth="600px">
 *     <Row>
 *       <Column>
 *         <Paragraph>Hello World</Paragraph>
 *       </Column>
 *     </Row>
 *   </Body>
 * );
 * ```
 */
/**
 * Convert a single `<Row>` element to Unlayer's row JSON format.
 *
 * Use this when targeting a Block Editor, which works with individual rows
 * rather than full design JSON. For full designs, use `renderToJson` instead.
 *
 * @param element - A React element tree with Row > Column > Item structure
 * @returns A DesignRow object compatible with the Unlayer block editor
 * @throws {Error} If the element is not a `<Row>`
 *
 * @example
 * ```tsx
 * import { renderRowToJson, Row, Column, Paragraph } from "@unlayer/react-elements";
 *
 * const row = renderRowToJson(
 *   <Row>
 *     <Column>
 *       <Paragraph>Hello World</Paragraph>
 *     </Column>
 *   </Row>
 * );
 * ```
 */
declare function renderRowToJson(element: React__default.ReactElement): DesignRow;
declare function renderToJson(element: React__default.ReactElement): DesignJSON;

/**
 * registerTool — render the editor's custom tools from code.
 *
 * Accepts the same tool definition object embedders already write for
 * `unlayer.registerTool` (see docs.unlayer.com › Custom Tools) and returns a
 * React component. One definition powers both runtimes:
 *
 * - The Builder uses `label`/`icon`/`options`/`renderer.Viewer`/`validator`
 *   for its panel, canvas, and audit — Elements ignores those.
 * - Elements calls `renderer.exporters[mode](values)` to produce HTML and
 *   collects `renderer.head` css/js like any built-in component, so code
 *   output matches editor exports by construction — it is the same function.
 * - `renderToJson` emits `{ type: "custom", slug: <name>, values }`, the
 *   shape the editor stores, so designs round-trip into the Builder where
 *   the same tool is registered.
 *
 * Sanitization: like editor exports, the tool's HTML output is passed
 * through `toSafeHtml` when one is configured. The default config has NO
 * sanitizer — with untrusted values, configure `toSafeHtml` (same caveat
 * as the `<Html>` component).
 */

/** Exporter: `(values) => html`. Extra args mirror built-in exporters and can be ignored. */
type ToolExporter = (values: any, ...args: any[]) => string;
/** One property in an options group — Elements reads only the default. */
interface ToolOptionConfig {
    defaultValue?: unknown;
    /** Disabled options contribute no default */
    enabled?: boolean;
    [editorOnly: string]: unknown;
}
/** A property group: `options.<group>.options.<property>` */
interface ToolOptionGroup {
    options?: Record<string, ToolOptionConfig | undefined>;
    [editorOnly: string]: unknown;
}
/**
 * The subset of the `unlayer.registerTool` config Elements reads. Extra
 * editor-only fields (label, icon, Viewer, validator, transformer, ...)
 * are accepted and ignored, so the same object can be passed to both APIs.
 */
interface ElementsToolConfig {
    /** Unique tool name — becomes the design JSON `slug` */
    name: string;
    /** Initial values for the tool's properties (win over option defaults) */
    values?: Record<string, any>;
    /**
     * Property groups. Real-world tools usually define their defaults here,
     * as each property's `defaultValue` — those seed the initial values,
     * with tool-level `values` taking precedence (the editor's order).
     */
    options?: Record<string, ToolOptionGroup | undefined>;
    renderer: {
        /** Per-mode HTML exporters. `document` falls back to `web`. */
        exporters: Partial<Record<RenderMode, ToolExporter>>;
        /** Optional head contributions collected into the document `<head>` */
        head?: {
            css?: (values: any, ...args: any[]) => string | undefined;
            js?: (values: any, ...args: any[]) => string | undefined;
            tags?: (values: any, ...args: any[]) => string[] | undefined;
        };
        /** Editor-only canvas renderer — ignored by Elements */
        Viewer?: unknown;
    };
    /** React DevTools name (defaults to the tool name) */
    displayName?: string;
    /** Editor-only fields (label, icon, options, validator, ...) — ignored */
    [editorOnly: string]: unknown;
}
/**
 * Props: the tool's values as flat props, plus a `values` escape hatch. Every prop is the tool's own, as in 0.1.22:
 * a `mobile` or `hideOnMobile` value isn't a device setting (`values._override` sets those).
 */
type ElementsToolProps = Omit<BaseItemComponentProps, keyof DeviceProps> & Record<string, any> & {
    values?: Record<string, any>;
};
/**
 * Create a React component from a custom tool definition — a custom tool
 * is the custom component you create: the same term (and the same config)
 * as the editor's `unlayer.registerTool`, so one definition serves both.
 *
 * @example
 * ```tsx
 * const Countdown = registerTool({
 *   name: "countdown",
 *   values: { endTime: "", digitColor: "#404040" },
 *   renderer: {
 *     exporters: {
 *       web:   (values) => `<div style="color:${values.digitColor}">…</div>`,
 *       email: (values) => `<table role="presentation">…</table>`,
 *     },
 *   },
 * });
 *
 * <Email><Row><Column>
 *   <Countdown endTime="2026-08-01T00:00:00Z" digitColor="#e11d48" />
 * </Column></Row></Email>
 * ```
 */
declare function registerTool(tool: ElementsToolConfig): React__default.FC<ElementsToolProps>;
/** Alias of {@link registerTool}. */
declare const registerElementsTool: typeof registerTool;

export { Body, type BorderInput, Button, type ButtonProps, Column, type ColumnLayout, ColumnLayouts, DEFAULT_CONFIG, type DesignBody, type DesignColumn, type DesignContent, type DesignJSON, type DesignRow, type DeviceProps, Divider, type DividerProps, Document, type DocumentOrientation, type DocumentPageSize, type DocumentProps, type ElementsToolConfig, type ElementsToolProps, Email, type EmailProps, type FontFamilyInput, type FontWeightInput, Heading, type HeadingLevel, type HeadingProps, type Href, Html, type HtmlParts, type HtmlProps, type Icons, Image, type ImageProps, type ImageSrcInput, type LinkStyle, Menu, type MenuItem, type MenuProps, type MobileProps, Page, PageBreak, type PageBreakProps, type PageProps, Paragraph, type ParagraphProps, type RenderToHtmlOptions, Row, type RowProps, type SizeInput, Social, type SocialIcon, type SocialProps, Table, type TableProps, type TextAlign, type TextStyleProps, type ToolExporter, type UnlayerConfig, UnlayerProvider, type UnlayerProviderProps, type ValidColumnLayout, Video, type VideoProps, type VideoSource, htmlToTextJson, registerElementsTool, registerTool, renderRowToJson, renderToHtml, renderToHtmlParts, renderToJson, renderToPlainText, useUnlayerConfig, validateColumnLayout };
