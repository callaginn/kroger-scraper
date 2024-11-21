/*
	Kroger Receipt Sweeper v3b
	This experimental script logs into a Kroger user's account and fetches all
	their itemized receipts using Playwright.
	Written by Stephen Ginn
	
	I believe this version attempts to fix the login from v3
*/

import fs from 'fs';
import { chromium, firefox, webkit } from 'playwright';
import { item } from '@1password/op-js';
import {
	authorize1Password,
	selectUserAgent,
	batchArray,
	saveCookies,
	loadCookies,
	loadJsonFile,
	fetchWithTimeout,
	getRandomInt,
	delay,
	scrollToRandomPosition
} from './bin.js';
const telemetry = fs.readFileSync('telemetry.txt', 'utf8').trim();

let browsers = {
	chrome: {
		instance: chromium,
		path: '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
		data: `${process.env.HOME}/Library/Application Support/BraveSoftware/Default`
	},
	firefox: {
		instance: firefox
	},
	safari: {
		instance: webkit
	},
	edge: {
		instance: chromium
	},
	opera: {
		instance: chromium
	}
};

// Fetch login details from 1Password
const [USERNAME, PASSWORD] = item.get("Kroger Receipt Sweeper", {
	fields: "username,password"
}).map(el => el.value);

const loginToKroger = async (page) => {
	console.log("Cookies not found. Attempting login...");
	
	var inputUsername = 'input[aria-label="Email Address"]',
		inputPassword = 'input[aria-label="Password"]',
		submitButton = 'button[type="submit"]';
	
	// Navigate to Kroger sign-in page
	await page.goto('https://www.kroger.com/', { waitUntil: 'networkidle' });
	await delay(getRandomInt(1000, 2000));
	await page.goto('https://www.kroger.com/signin', { waitUntil: 'networkidle' });
	
	// Wait for username field and type username with random delays between characters
	await page.waitForSelector(inputUsername, { visible: true });
	await delay(getRandomInt(1000, 2000));
	await page.type(inputUsername, USERNAME, { delay: getRandomInt(100, 200) });
	
	// Wait for password field and type password with random delays between characters
	await page.waitForSelector(inputPassword, { visible: true });
	await delay(getRandomInt(1000, 2000));
	await page.type(inputPassword, PASSWORD, { delay: getRandomInt(100, 200) });
	
	// Insert another random delay...
	await delay(getRandomInt(1000, 2000));
	
	// Click the sign-in button and wait for navigation to finish
	await Promise.all([
		page.click(submitButton),
		page.waitForNavigation({ waitUntil: 'networkidle' })
	]);
	
	// Get cookies after login and save
	return await saveCookies(page.context());
};

const receiptKeyToData = (receiptKey) => {
	const dataParts = receiptKey.split('~');
	
	return {
		"divisionNumber": dataParts[0],
		"storeNumber": dataParts[1],
		"transactionDate": dataParts[2],
		"terminalNumber": dataParts[3],
		"transactionId": dataParts[4]
	};
};

// Process a single batch of receipts
const processBatch = async (batches, index, cookieString) => {
	console.log(`Processing batch #${index + 1}:`);
	const batch = batches[index];
	
	try {
		const response = await fetchWithTimeout('https://www.kroger.com/atlas/v1/purchase-history/v2/details', {
			method: 'POST',
			credentials: 'include',
			headers: {
				'Accept': 'application/json, text/plain, */*',
				'Accept-Encoding': 'gzip, deflate, br, zstd',
				'Accept-Language': 'en-US,en;q=0.9',
				'Content-Type': 'application/json',
				'Cookie': cookieString,
				'Referer': 'https://www.kroger.com/mypurchases', // might want to adjust this further?...
				'X-Kroger-Channel': 'WEB'
			},
			body: JSON.stringify(batch)
		});
		
		console.log("FETCH_RESPONSE", response);
		console.log(`Potential HTTP error! status: ${response.status}`);
		
		const responseText = await response.text();
		console.log("Response body:", responseText);
		
		// Check for HTTP errors
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
		
		const receiptDetails = await response.json();
		console.log(`Got receipt #${index + 1}`);
		
		// Return receipt details for further processing
		return receiptDetails.data.purchaseHistoryDetails;
	} catch (err) {
		console.error('Fetch error:', err.message);
		throw err;
	}
};

(async () => {
	// Authorize 1Password CLI
	authorize1Password();
	
	// Select a random browser
	const userAgents = loadJsonFile('src/data/user_agents_filtered.json');
	const randomUserAgent = selectUserAgent(userAgents);
	const selectedBrowser = browsers[randomUserAgent.id];
	
	console.log('Selected Agent:', randomUserAgent.id);
	console.log('Selected Browser:', randomUserAgent.software);
	
	// Launch the selected browser
	const browser = await selectedBrowser.instance.launch({
		headless: false,
		ignoreHTTPSErrors: true,
		args: [
			'--disable-blink-features=AutomationControlled',
			'--blink-settings=imagesEnabled=false',
			'--disable-web-security',
			'--disable-infobars'
		]
	});
	
	const context = await browser.newContext({
		userAgent: randomUserAgent.user_agent,
		viewport: { width: getRandomInt(1200, 2000), height: getRandomInt(800, 1200) }
	});
	
	const page = await context.newPage();
	
	const logEvent = (event, obj, url) => {
		let title = event.replace(/(^|\s)\S/g, t => t.toUpperCase()) + " Headers: ";
		
		if (obj.url() == url) {
			console.log(url);
			console.log(title, obj.headers());
		}
	};
	
	// Listen for responses and requests
	page.on('request', e => logEvent('request', e, 'https://www.kroger.com/'));
	page.on('response', e => logEvent('response', e, 'https://www.kroger.com/'));
	
	// Load cookies if available
	let cookies = await loadCookies(context);
	
	if (!cookies) {
		// If no cookies found, log in
		cookies = await loginToKroger(page);
	}
	
	console.log(cookies);
	
	let cookieString = cookies.map(cookie => `${cookie.name}=${cookie.value}`).join('; '),
		accountDropdown = "#WelcomeButton-A11Y-FOCUS-ID";
	
	// Navigate to Kroger purchases page
	await page.goto('https://www.kroger.com/mypurchases', { waitUntil: 'networkidle', referer: 'https://www.kroger.com/' });
	
	// performActions(page);
	console.log("Got past perform actions...");
	
	// Fetch the purchase history, attaching cookies for authentication
	const response = await page.evaluate(async (cookieString) => {
		try {
			const res = await fetch("https://www.kroger.com/atlas/v1/post-order/v1/purchase-history-search?pageNo=1&pageSize=50", {
				method: 'GET',
				credentials: 'include',
				headers: {
					'Content-Type': 'application/json',
					'Cookie': cookieString
				}
			});
			
			console.log(`HTTP status: ${res.status}`);
			
			if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
			
			return await res.json();
		} catch (err) {
			return { error: err.message };
		}
	}, cookieString);
	
	if (response.error) {
		console.error('Error in response:', response.error);
		process.exit(1);
	}
	
	const receipts = response.data.postOrderSearch.data;
	const receiptData = receipts.map(receipt => receiptKeyToData(receipt.receiptKey));
	
	// Split receiptData into batches
	let batches = batchArray(receiptData, 25);
	console.log("We got the batchArray!");
	
	// Process the batches
	const batchResponse = []; // Create an array to hold results
	
	for (let index = 0; index < batches.length; index++) {
		// Attempt to bypass bot detection by scrolling and clicking randomly
		await scrollToRandomPosition(page);
		await page.waitForSelector(accountDropdown, { visible: true });
		await page.click(accountDropdown);
		await delay(getRandomInt(500, 1500));
		
		try {
			const batchDetails = await processBatch(batches, index, cookieString);
			if (batchDetails) {
				batchResponse.push(batchDetails);
			}
			
			await delay(getRandomInt(3000, 6000));
		} catch (error) {
			console.error(`Failed to process batch #${index + 1}:`, error.message);
		}
	}
	
	console.log("All Batch Results:", batchResponse);
	
	await browser.close();
})();
