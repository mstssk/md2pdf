import fs from "node:fs/promises";
import puppeteer, { type PDFMargin } from "puppeteer";
import type { LaunchOptions, PDFOptions } from "puppeteer-core";
import { marked, type Tokens } from "marked";

export interface Md2PdfConfig {
  dest: string;
  launch_options: LaunchOptions;
  pdf_options: PDFOptions;
  stylesheet: string[];
}

export async function md2pdf(mdPath: string, config: Md2PdfConfig) {
  const md = await fs.readFile(mdPath, "utf-8");
  const { html, title } = getHtml(md);
  const pdfContent = await generatePdfViaPuppeteer(html, title, config);
  await fs.writeFile(config.dest, pdfContent);
  return pdfContent;
}

//----------

async function generatePdfViaPuppeteer(
  html: string,
  title = "",
  config: Md2PdfConfig,
) {
  const launchOptions = config.launch_options;
  const pdfOptions = config.pdf_options;
  const styleSheets = config.stylesheet ?? [];

  // Launch the browser and open a new blank page.
  const browser = await puppeteer.launch(launchOptions);

  const page = await browser.newPage();

  await page.setContent(html);
  await page.evaluate((t) => (document.title = t), title);
  for (const styleSheet of styleSheets) {
    await page.addStyleTag({ path: styleSheet });
  }

  const pdfContent = await page.pdf(pdfOptions);

  await browser.close();

  return pdfContent;
}

function getHtml(md: string) {
  const tokens = marked.lexer(md);
  const parser = new marked.Parser();
  const firstHeading = tokens.find(
    (t): t is Tokens.Heading => t.type === "heading",
  );
  const title = firstHeading
    ? parser.parseInline(firstHeading.tokens, parser.textRenderer)
    : "";
  const html = marked.parser(tokens);
  return { html, title };
}
