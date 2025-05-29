import express from 'express';
import { chromium } from 'playwright';

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/scrape', async (req, res) => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1080, height: 1024 } });
  const page = await context.newPage();

  try {
    const site = 'https://www.mamedica.co.uk/repeat-prescription/';
    console.log('Opening page...');
    await page.goto(site, { waitUntil: 'domcontentloaded' });

    // Wait until the title is exactly "Repeat Prescription | Mamedica"
    await page.waitForFunction(
      () => document.title === 'Repeat Prescription | Mamedica',
      { timeout: 15000 } // Optional: 15 seconds timeout
    );

    const pageTitle = await page.title();
    console.log('Page title:', pageTitle);

    const cookieBanner = page.locator('.cmplz-cookiebanner');
    if (await cookieBanner.isVisible({ timeout: 3000 }).catch(() => false)) {
      const acceptButton = cookieBanner.locator('.cmplz-btn.cmplz-accept');
      if (await acceptButton.isVisible()) {
        console.log('Clicking cookie accept button...');
        await acceptButton.click();
        await page.waitForTimeout(500);
      }
    }

    await page.locator('#label_3_32_0').click();
    await page.locator('#field_3_50 .selectric-scroll').waitFor({ state: 'visible' });

    const options = await page.locator('#field_3_50 .selectric-scroll ul li').all();
    const availableFlowers = [];

    for (let i = 1; i < options.length; i++) {
      await page.locator('#field_3_50 b.button').click();
      const option = page.locator(`#field_3_50 .selectric-scroll ul li[data-index="${i}"]`);
      const flowerName = await option.innerText();
      await option.click();

      await page.fill('#input_3_53', '1');
      await page.waitForTimeout(50);
      const cost = (await page.inputValue('#input_3_67')).replace(/\s/g, '');
      availableFlowers.push({
        item: {
          name: flowerName,
          value: cost,
        }
      });
    }

    const lastScrapeTimestamp = new Date().toISOString();
    res.json({ scrapedAt: lastScrapeTimestamp, data: availableFlowers });

  } catch (error) {
    console.error('Scrape error:', error);
    res.status(500).json({ error: 'Scraping failed', details: error.toString() });
  } finally {
    await browser.close();
    console.log('Closed browser');
  }
});

app.get('/', (req, res) => {
  res.send('✅ Mamedica Scraper is running. Use /scrape to fetch data.');
});

app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
