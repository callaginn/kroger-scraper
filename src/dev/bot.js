import puppeteer from 'puppeteer';
import { browsers, useragents, randomUserAgent, getRandomInt } from '../bin.js';
import { select } from '@inquirer/prompts';

// Ask the user which endpoint they want to test
const endpoint = await select({
	message: 'Which endpoint do you want to test?',
	choices: [
		{
			name: 'Device and Browser Info (HTTP Headers)',
			value: 'https://deviceandbrowserinfo.com/http_headers',
			description: 'Get HTTP headers information'
		},
		{
			name: 'BrowserScan Browser Info',
			value: 'https://www.browserscan.net',
			description: 'Get browser information'
		},
		{
			name: 'BrowserScan Bot Detection',
			value: 'https://www.browserscan.net/bot-detection',
			description: 'Detect if the browser is a bot'
		},
		{
			name: 'Rebrowser Bot Detector',
			value: 'https://bot-detector.rebrowser.net',
			description: 'Detect if the browser is a bot'
		},
		{
			name: 'Sannysoft Fingerprint Scanner',
			value: 'https://bot.sannysoft.com/',
			description: 'Scan browser fingerprint'
		},
		{
			name: 'BrowserLeaks Canvas Fingerprinting',
			value: 'https://browserleaks.com/canvas',
			description: 'Test canvas fingerprinting'
		},
		{
			name: 'Antcpt ReCaptcha v3 Score',
			value: 'https://antcpt.com/eng/information/demo-form/recaptcha-3-test-score.html',
			description: 'Test ReCaptcha v3 score'
		}
	],
});

(async () => {
	var thisBrowser = browsers.chrome;
	
	var browserOptions = {
		headless: false,
		ignoreHTTPSErrors: true,
		args: [],
		executablePath: thisBrowser.path,
		userDataDir: thisBrowser.data,
		viewport: null
	};
	
	const browser = await puppeteer.launch(browserOptions);
	const page = await browser.newPage();
	
	// Set user agent and viewport to mimic a real browser
	await page.setViewport({
		width: getRandomInt(1200, 1600),
		height: getRandomInt(800, 1000),
	});
	
	await page.setExtraHTTPHeaders({
		'User-Agent': randomUserAgent(useragents.chromium),
		'Referer': 'https://example.com'
	});
	
	await page.evaluateOnNewDocument(() => {
		console.debug = console.log = ()=>{}
	});
	
	await page.goto(endpoint, { waitUntil: 'networkidle2' });
})();
