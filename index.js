import fs from "node:fs/promises";
import puppeteer from "puppeteer";
import { marked } from "marked";

const md = await fs.readFile("fixtures/example.md", "utf-8");
const { html, title } = getHtml(md);
const pdfContent = await generatePdfViaPuppeteer(html, title);

await fs.writeFile("page.pdf", pdfContent);

//----------

async function generatePdfViaPuppeteer(html, title = "") {
  // GitHub Actions上だと--no-sandboxが必要。ローカルではセキュリティ面を考慮して無効化しない。
  const chromeNoSandbox = process.env.CI ? "--no-sandbox" : null;

  // Launch the browser and open a new blank page.
  const browser = await puppeteer.launch({
    channel: "chrome",
    headless: true,
    args: [chromeNoSandbox].filter(Boolean),
  });

  const page = await browser.newPage();

  await page.setContent(html);
  await page.evaluate((t) => (document.title = t), title);
  await page.addStyleTag({
    content: `
    @import url("https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;700&display=swap");

    body {
      font-family: "Noto Sans JP", sans-serif;
      font-size: 4mm;
      }
      `,
  });

  const pdfContent = await page.pdf({
    format: "A4",
    margin: convertCSSMarginStringToTRBL("15mm"),
    printBackground: true,
  });

  await browser.close();

  return pdfContent;
}

function getHtml(md) {
  const tokens = marked.lexer(md);
  const parser = new marked.Parser();
  const firstHeading = tokens.find((t) => t.type === "heading");
  const title = firstHeading
    ? parser.parseInline(firstHeading.tokens, parser.textRenderer)
    : "";
  const html = marked.parser(tokens);
  return { html, title };
}

/**
 * Convert a CSS-like margin string into an object with top, right, bottom, and left properties.
 * @param {string} marginStr - The margin string (e.g., "10px 20px 30px 40px").
 * @returns {{top: string, right: string, bottom: string, left: string}} An object representing the margins.
 */
function convertCSSMarginStringToTRBL(marginStr) {
  if (!marginStr || typeof marginStr !== "string") {
    return undefined;
  }
  const [t, r = t, b = t, l = r] = marginStr.trim().split(/[\s,]+/);
  return { top: t, right: r, bottom: b, left: l };
}
