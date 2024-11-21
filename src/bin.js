import fs from 'fs';
import { execSync } from 'child_process';
import { emulation } from './data/emulation.js';
const { browsers, useragents } = emulation;

// Authorize a 1Password account
const authorize1Password = () => {
	try {
		execSync('op whoami', { stdio: 'ignore' });
		console.log('You are already signed in to 1Password.');
	} catch {
		console.log('Not signed in. Signing in to 1Password...');
		try {
			execSync('eval $(op signin)', { stdio: 'inherit' });
			console.log('Signed in successfully.');
		} catch (signinError) {
			console.error('Failed to sign in to 1Password:', signinError.message);
			process.exit(1);
		}
	}
};

function randomUserAgent(useragents) {
	return useragents[Math.floor(Math.random() * useragents.length)];
}

// Select a user agent based on weights
const selectUserAgent = (userAgents) => {
	const weights = userAgents.map(agent => parseInt(agent.times_seen, 10));
	const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);

	// Generate a random number between 0 and totalWeight
	const randomNum = Math.random() * totalWeight;
	
	let cumulativeWeight = 0;

	for (let i = 0; i < userAgents.length; i++) {
		cumulativeWeight += weights[i];
		if (randomNum <= cumulativeWeight) {
			return userAgents[i]; // Return the selected user agent
		}
	}
};

// Helper function to split an array into batches (similar to chunkArray)
function batchArray(array, batchSize) {
	const result = [];
	for (let i = 0; i < array.length; i += batchSize) {
		result.push(array.slice(i, i + batchSize));
	}
	return result;
}

// Helper function to write data to a file
const writeToFile = async (filePath, data) => {
	try {
		await fs.writeFile(filePath, JSON.stringify(data, null, '\t'));
		console.log(`Data has been saved to ${filePath}`);
	} catch (err) {
		console.error(`Error writing to ${filePath}:`, err);
	}
};

const saveCookies = async (context, cookiePath = './cookies.json') => {
	const cookies = await context.cookies();
	fs.writeFileSync(cookiePath, JSON.stringify(cookies, null, '\t'));
	console.log('Cookies saved to cookies.json');
	return cookies;
};

const loadCookies = async (context, cookiePath = './cookies.json') => {
	try {
		const cookies = JSON.parse(fs.readFileSync(cookiePath));
		await context.addCookies(cookies);
		console.log('Cookies loaded from cookies.json and set on page');
		return cookies;
	} catch (err) {
		console.error('Error loading cookies:', err.message);
		return null;
	}
};

// Load the user agents from the JSON file
const loadJsonFile = (filePath) => {
	const data = fs.readFileSync(filePath);
	return JSON.parse(data);
};

const fetchWithTimeout = async (url, options, timeout = 5000) => {
	const controller = new AbortController();
	const signal = controller.signal;
	
	const fetchPromise = fetch(url, { ...options, signal });
	const timeoutPromise = new Promise((_, reject) =>
		setTimeout(() => {
			controller.abort();
			reject(new Error('Fetch request timed out'));
		}, timeout)
	);
	
	return Promise.race([fetchPromise, timeoutPromise]);
};

// Generate a random integer between min and max
function getRandomInt(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Helper function to create a delay
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Function to simulate smooth mouse movement in a curve
const moveMouseCurved = async (page, startX, startY, endX, endY) => {
	const controlX = (startX + endX) / 2 + getRandomInt(-100, 100); // Control point for curve
	const controlY = (startY + endY) / 2 - getRandomInt(-50, 100); // Control point for curve
	const steps = 30;
	
	for (let i = 0; i <= steps; i++) {
		const t = i / steps; // Normalize i to [0, 1]
		const curveX = Math.pow(1 - t, 2) * startX + 2 * (1 - t) * t * controlX + Math.pow(t, 2) * endX;
		const curveY = Math.pow(1 - t, 2) * startY + 2 * (1 - t) * t * controlY + Math.pow(t, 2) * endY;
		
		await page.mouse.move(curveX, curveY);
		await delay(getRandomInt(50, 100)); // Small delay for movement
	}
};

// Function to scroll the page slightly
const scrollPage = async (page, amount) => {
	await page.evaluate((scrollAmount) => {
		window.scrollBy(0, scrollAmount);
	}, amount);
	await delay(getRandomInt(100, 300)); // Delay after scrolling
};

// Main function to perform actions
const performActions = async (page) => {
	const windowWidth = await page.evaluate(() => window.innerWidth);
	const windowHeight = await page.evaluate(() => window.innerHeight);
	
	while (true) {
		// Generate random start and end points for mouse movement
		const randomStartX = getRandomInt(0, windowWidth);
		const randomStartY = getRandomInt(0, windowHeight);
		const randomEndX = getRandomInt(0, windowWidth);
		const randomEndY = getRandomInt(0, windowHeight);
		const randomScrollY = getRandomInt(50, 100);
		
		// Move mouse in a curve
		await moveMouseCurved(page, randomStartX, randomStartY, randomEndX, randomEndY);
		
		// Scroll down slightly
		await scrollPage(page, randomScrollY);
		
		// Random delay between 1-2 seconds
		await delay(getRandomInt(1000, 2000));
		
		// Scroll up slightly
		await scrollPage(page, randomScrollY * -1);
		
		// Move mouse in a curve again
		await moveMouseCurved(page, randomEndX, randomEndY, randomStartX, randomStartY);
		
		// Random delay before next iteration
		await delay(getRandomInt(1000, 2000));
	}
};

const scrollToRandomPosition = async (page) => {
	await page.evaluate(() => {
		// Get the maximum scrollable height and width
		const maxHeight = document.body.scrollHeight - window.innerHeight;
		const maxWidth = document.body.scrollWidth - window.innerWidth;
		
		// Generate random scroll positions
		const randomX = Math.floor(Math.random() * maxWidth);
		const randomY = Math.floor(Math.random() * maxHeight);
		
		// Scroll to the random position smoothly
		window.scrollTo({
			top: randomY,
			left: randomX,
			behavior: 'smooth' // This enables smooth scrolling
		});
	});
};

// Export all functions
export {
	browsers,
	useragents,
	authorize1Password,
	randomUserAgent,
	selectUserAgent,
	batchArray,
	writeToFile,
	saveCookies,
	loadCookies,
	loadJsonFile,
	fetchWithTimeout,
	getRandomInt,
	delay,
	moveMouseCurved,
	scrollPage,
	performActions,
	scrollToRandomPosition
};
