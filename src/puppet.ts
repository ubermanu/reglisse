import puppeteer, { Browser, Page } from 'puppeteer'

// Create a new puppeteer instance and inject css + html
export async function createPuppet(
  css: string,
  html: string
): Promise<{ page: Page; browser: Browser }> {
  const browser = await puppeteer.launch({ headless: 'new' })
  const page = await browser.newPage()

  if (!html) {
    html = '<html><head></head><body></body></html>'
  }

  await page.setContent(html)

  if (css) {
    await page.addStyleTag({ content: css })
  }

  return { page, browser }
}
