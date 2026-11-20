# Challenge submission draft

Edit before posting. Replace the bracketed parts with real results from your own runs.

**Project:** NEXORA — Universal Business Report Studio
**Repository:** [link after you publish]
**One-line pitch:** One report, rendered as email, web page, PDF and PNG from a single set of Unlayer Elements components.

## What it does

NEXORA keeps one validated report object and exports it in four formats. A dashboard lets you edit the numbers, switch between two themes and preview each layout live before downloading.

## How it uses Hyper Elements

- One shared list of `Row`/`Column` sections built with `Heading`, `Paragraph` and `Button`.
- The same sections are mounted under `<Email>`, `<Page>` and `<Document>`.
- `renderToHtml` and `renderToPlainText` produce the email, web and print HTML.
- Playwright turns the `<Document>` HTML into a PDF and the `<Page>` HTML into a PNG. (This part is our code, not a Hyper Elements feature.)

## What was tested

[List what you actually ran, for example: unit tests, the five downloads opened and checked, the PDF page count, the mobile layout.]

## Known limitations

No logo upload; email-client rendering not tested in real inboxes; data stays in the browser.
