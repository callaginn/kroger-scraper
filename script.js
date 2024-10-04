const puppeteer = require('puppeteer');
const fs = require('fs');

// Load credentials from config.json
const config = JSON.parse(fs.readFileSync('config.json'));

// Function to generate a random integer between min (inclusive) and max (inclusive)
function getRandomInt(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

(async () => {
	var browser_options = {
		headless: false,
		ignoreHTTPSErrors: true,
		slowMo: 0,
		args: [
			'--disable-features=SameSiteByDefaultCookies,CookiesWithoutSameSiteMustBeSecure',
			'--blink-settings=imagesEnabled=true'
		],
		'executablePath': '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
	};
	
	var headers = {
		'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
		'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
		'Accept-Language': 'en-US,en;q=0.9'
	};
	
	const browser = await puppeteer.launch(browser_options);
	const page = await browser.newPage();

	// Set user agent and viewport to mimic a real browser
	const width = getRandomInt(1200, 1600); // Random width between 1200 and 1600
	const height = getRandomInt(800, 1000); // Random height between 800 and 1000
	await page.setViewport({ width: width, height: height });
	
	await page.setExtraHTTPHeaders(headers);
	
	await page.evaluateOnNewDocument(() => {
		Object.defineProperty(navigator, 'webdriver', {
			get: () => false,
		});
	});

	// Navigate to Kroger sign-in page
	await page.goto('https://www.kroger.com/signin', { waitUntil: 'networkidle2' });
	
	console.log('Signed in successfully!');
})();
