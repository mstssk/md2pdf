/**
 * @type {import("../src/index").Md2PdfConfig}
 */
const config = {
  dest: "output.pdf",
  launch_options: {
    channel: "chrome",
    headless: true,
    // GitHub Actions上だと--no-sandboxが必要。ローカルではセキュリティ面を考慮して無効化しない。
    args: process.env.CI ? ["--no-sandbox"] : [],
  },
  pdf_options: {
    format: "A4",
    margin: { top: "15mm", right: "15mm", bottom: "15mm", left: "15mm" },
    printBackground: true,
  },
  stylesheet: ["fixtures/example.css"],
};

export default config;
