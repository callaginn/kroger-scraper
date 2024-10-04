const puppeteer = require('puppeteer');
const fs = require('fs');

// Load credentials from config.json
const config = JSON.parse(fs.readFileSync('config.json'));

(async () => {
	var browser_options = {
		headless: false,
		args: [
			'--blink-settings=imagesEnabled=true'
		]
	};
	
	var headers = {
		'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.129 Safari/537.36',
		'Accept-Language': 'en-US,en;q=0.9'
	};
	
	const browser = await puppeteer.launch(browser_options);
	const page = await browser.newPage();

	// Set user agent and viewport to mimic a real browser
	await page.setViewport({ width: 1366, height: 768 });
	
	await page.setExtraHTTPHeaders(headers);
	
	await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36');

	// Navigate to Kroger sign-in page
	await page.goto('https://www.kroger.com/signin', { waitUntil: 'networkidle2' });
	
	console.log('Signed in successfully!');
})();
