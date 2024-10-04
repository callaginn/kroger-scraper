const puppeteer = require('puppeteer');
const fs = require('fs');

// Load credentials from config.json
const config = JSON.parse(fs.readFileSync('config.json'));

var options = {
	headless: false,
	args: [
		'--disable-features=SameSiteByDefaultCookies,CookiesWithoutSameSiteMustBeSecure',
		'--blink-settings=imagesEnabled=true'
	]
}

puppeteer.launch(options).then(async browser => {
	const page = await browser.newPage();

	// Set user agent and viewport to mimic a real browser
	await page.setViewport({ width: 1366, height: 768 });
	
	await page.setExtraHTTPHeaders({
		'Accept-Language': 'en-US,en;q=0.9',
		'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
		'Upgrade-Insecure-Requests': '1'
	});
	
	await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36');

	// Navigate to Kroger sign-in page
	await page.goto('https://www.kroger.com/signin', { waitUntil: 'networkidle2' });
	
	await page.waitForSelector('input#signInName', { visible: true });
});
