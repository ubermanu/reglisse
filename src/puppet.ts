import puppeteer, { Browser, Page, Viewport } from 'puppeteer'

// Create a new puppeteer instance and inject css + html
// TODO: Remove CSS and script tags from the document
export async function createPuppet(
  html: string,
  css: string,
  viewport?: Viewport
): Promise<{ page: Page; browser: Browser }> {
  const browser = await puppeteer.launch({
    headless: true,
    devtools: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--no-zygote'],
  })

  const page = await browser.newPage()

  await page.setContent(html || '<html lang></html>')

  if (typeof css === 'string' && css.length > 0) {
    await page.addStyleTag({ content: css })
  }

  if (viewport) {
    await page.setViewport(viewport)
  }

  return { page, browser }
}
