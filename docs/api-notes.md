# Hyper Elements API notes

Package: `@unlayer/react-elements`, installed version `0.2.1` (checked by the project author against `dist/index.d.ts`).
Playwright: `1.65.1`. License: MIT.

## Rendering functions (from the installed declarations)

- `renderToHtml(element, options?): string` — complete HTML document
- `renderToHtmlParts(element, config?): HtmlParts` — head/body parts and chunks
- `renderToPlainText(element, config?): string`
- `renderToJson(element): DesignJSON`

NEXORA uses `renderToHtml` and `renderToPlainText`.

## Roots

- `Email` — email-safe tables
- `Page` — responsive web
- `Document` — print-optimized (`DocumentProps` has `documentSize` and `documentOrientation`)

`EmailProps` and `PageProps` inherit `BodyProps`. NEXORA passes `backgroundColor` and `contentWidth` to all three roots; `contentWidth` and `backgroundColor` were shown for `Email` in the official README and are assumed to be `BodyProps`. **Re-check against `dist/index.d.ts`.**

## Layout and content

`Row` (`layout` or `cells`), `Column`, `ColumnLayouts` (OneColumn, TwoEqual, TwoWideNarrow, TwoNarrowWide, ThreeEqual, ThreeNarrowWideNarrow, FourEqual, FiveEqual).
Content: Button, Heading, Paragraph, Image, Divider, Social, Menu, Table, PageBreak, Video, Html.

Props NEXORA relies on (from the official README example): `Row.layout`, `Row.backgroundColor`, `Row.padding`, `Heading.fontSize`, `Heading.fontFamily={{label, value}}`, `Paragraph.html`, `Button.href/backgroundColor/color`.

## Not used, deliberately

`Image`, `Table`, `PageBreak`, `Divider`: prop shapes were not recorded, so NEXORA builds those visuals as HTML inside `Paragraph`.

## PDF and PNG

Hyper Elements outputs HTML only. The package README points to an official Playwright guide (`packages/react/docs/react-to-pdf.md`); NEXORA's `server/export.js` follows the same idea (HTML -> Chromium -> PDF) but was written without reading that guide. PNG is a Playwright full-page screenshot.

## Security

Never put untrusted text into raw HTML. All user text in NEXORA goes through `escapeHtml` before it reaches `Paragraph html=...`. Do not assume the library sanitizes the `html` prop.

## Open verification items

- [ ] Read `react-to-pdf.md` and compare with `server/export.js`
- [ ] Confirm `BodyProps` includes `backgroundColor` and `contentWidth`
- [ ] Confirm `Column`/`Row` accept the props used
- [ ] Visually check email, web, PDF and PNG output
