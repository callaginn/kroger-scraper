# Kroger Receipt Sweeper
Downloads itemized receipts from a Kroger account with Puppeteer and categorizes them using the Kroger API and custom data cleanup scripts.

```
brew install 1password-cli
yarn install
```

## How to Use

### 1. Scrape Kroger Data (Two Methods)
> _At the moment, both methods have to be manually copied/pasted into a json file, such as `src/data/receipts.json`._

#### a. Scrape with `yarn sweep`
This experimental script logs into Kroger and scrapes all the receipt data automatically.

#### b. Scrape with console scripts
If you run into issues with the automated scripts above, you can revert to a more manual process to collect the same data. This process includes logging in, navigating to the "/mypurchases" page, opening up the Chrome Console, and pasting in code from the "scrape*.md" files.

Since this process involves you controlling a regular version of Chrome, it's the least likely to be flagged as a bot. And unlike the automated scripts, it allows you to intervene if it runs into issues. We'll use **scrape2b.md** as an example.

This script is able to get a list of all the purchases, but often fails after collecting a few itemized receipts. I believe this is because bot protection is being triggered, but haven't found an automated way to bypass that.

If it fails when fetching a batch of receipts, you can do the following:
- Scroll/click around the Kroger interface a bit so that they reflag you as a human. Make sure you stay on the "/mypurchases" page though. There's some tabs at top that stay on the same page.
- In the console, manually rerun the batch that failed and the ones afterwards. For example, if it fails while grabbing the fourth batch, you'll need to run `processBatch(batches, 3)` and subsequent batches.
- Repeat the steps above if additional batches fail.

### 2. Cleanup with `yarn cleanup`

This script grabs a simplified array of products from `receipts.json` and exports them to `products.json`.

### 3. Get product categories with `yarn lookup`
This script loads `products.json` and uses the Kroger api to request information about all the products. These categorized products are saved to `src/data/categories.json`.

### 4. Categorize items with `yarn categorize`
This script matches the products from `products.json` to `receipts.json`. Easiest course of action would be looping through categories.json and assigning the category based off the upc key.

# Useful References
https://www.zyte.com/blog/how-to-scrape-the-web-without-getting-blocked/<br>
https://datadome.co/bot-management-protection/detecting-headless-chrome-puppeteer-extra-plugin-stealth/<br>
https://scrapeops.io/puppeteer-web-scraping-playbook/nodejs-puppeteer-make-puppeteer-undetectable/<br>
https://stackoverflow.com/questions/33225947/can-a-website-detect-when-you-are-using-selenium-with-chromedriver/41220267#41220267<br>
https://substack.thewebscraping.club/p/scraping-akamai-protected-website<br>
https://filipvitas.medium.com/how-to-set-user-agent-header-with-puppeteer-js-and-not-fail-28c7a02165da<br>
https://substack.thewebscraping.club/p/the-lab-30-how-to-bypass-akamai-protected<br>

# Bot Tests
https://deviceandbrowserinfo.com/http_headers<br>
https://www.browserscan.net<br>
https://www.browserscan.net/bot-detection<br>
https://bot.sannysoft.com/<br>
https://browserleaks.com/canvas<br>
https://antcpt.com/eng/information/demo-form/recaptcha-3-test-score.html<br>
https://bot-detector.rebrowser.net/<br>
https://fingerprintjs.github.io/BotD/main/
