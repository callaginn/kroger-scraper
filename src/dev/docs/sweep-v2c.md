# Scraper v2c (Full Process, Batch Edition)

```js
function receiptKeyToData(receiptKey) {
	const dataParts = receiptKey.split('~');
	
	return {
		"divisionNumber": dataParts[0],
		"storeNumber": dataParts[1],
		"transactionDate": dataParts[2],
		"terminalNumber": dataParts[3],
		"transactionId": dataParts[4]
	};
}

// Helper function to split the array into batches
function batchArray(array, batchSize) {
	const result = [];
	for (let i = 0; i < array.length; i += batchSize) {
		result.push(array.slice(i, i + batchSize));
	}
	return result;
}

// Generate a random integer between min and max
function getRandomInt(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Helper function to create a delay
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

function scrollToRandomPosition() {
	// Generate a random duration between 2-4 seconds
	const duration = getRandomInt(2000, 4000);
	
	// Get the maximum scrollable height and width
	const maxHeight = document.body.scrollHeight - window.innerHeight;
	const maxWidth = document.body.scrollWidth - window.innerWidth;

	// Generate random scroll positions
	const targetX = getRandomInt(0, maxWidth);
	const targetY = getRandomInt(0, maxHeight);
	const startX = window.scrollX;
	const startY = window.scrollY;
	const distanceX = targetX - startX;
	const distanceY = targetY - startY;
	const startTime = performance.now();

	function easeInOutQuad(t) {
		return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
	}

	function scrollStep(currentTime) {
		const elapsed = currentTime - startTime;
		const progress = Math.min(elapsed / duration, 1);
		const easedProgress = easeInOutQuad(progress);

		window.scrollTo(
			startX + distanceX * easedProgress,
			startY + distanceY * easedProgress
		);

		if (progress < 1) {
			requestAnimationFrame(scrollStep);
		} else {
			// Click at the target position after scrolling
			clickAtPosition(getRandomInt(5, 30), getRandomInt(250, 450));
		}
	}

	function clickAtPosition(x, y) {
		// Log the coordinates for debugging
		console.log(`Clicking at viewport coordinates: (${x}, ${y})`);

		// Ensure the coordinates are within the viewport
		if (x < 0 || x > window.innerWidth || y < 0 || y > window.innerHeight) {
			console.log('Coordinates are out of the viewport bounds.');
			return;
		}

		// Get the element at the specified coordinates
		const element = document.elementFromPoint(x, y);

		if (element) {
			console.log('Element found:', element);

			// Create and dispatch a click event
			const event = new MouseEvent('click', {
				view: window,
				bubbles: true,
				cancelable: true,
				clientX: x,
				clientY: y
			});

			element.dispatchEvent(event);
		} else {
			console.log('No element found at the specified coordinates.');
		}
	}

	requestAnimationFrame(scrollStep);
}

// Function to process a single batch of receipts
function processBatch(batches, index) {
	var batch = batches[index];
	
	// document.querySelector("#WelcomeButton-A11Y-FOCUS-ID").click();
	// document.querySelector("#SearchMyPurchasesPage [role=tablist] button [aria-selected=false]").click();
	scrollToRandomPosition();
	
	return fetch('https://www.kroger.com/atlas/v1/purchase-history/v2/details', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(batch),
		credentials: 'include'
	}).then(response => {
		if (!response.ok) {
			throw new Error('Network response was not ok');
		}
		return response.json();
	}).then(receiptDetails => {
		console.log(`Receipt #${index + 1}:`, receiptDetails.data.purchaseHistoryDetails);
		
		// Return receipt details for further processing if needed
		return receiptDetails.data.purchaseHistoryDetails;
	}).catch(err => {
		console.error(`Error processing batch #${index + 1}:`, err.message);
	});
}

async function processBatchRetry(batches, index) {
	if (!Array.isArray(batches) || typeof index !== 'number') {
		throw new Error('Invalid input');
	}

	const batch = batches[index];
	const maxRetries = 3;
	let attempt = 0;

	while (attempt < maxRetries) {
		try {
			scrollToRandomPosition();

			// Replace with your actual fetch request
			const response = await fetch('https://www.kroger.com/atlas/v1/purchase-history/v2/details', {
				method: 'POST',
				headers: {
					'Accept': 'application/json, text/plain, */*',
					'Accept-Encoding': 'gzip, deflate, br, zstd',
					'Accept-Language': 'en-US,en;q=0.9',
					'Content-Type': 'application/json',
					'Referer': 'https://www.kroger.com/mypurchases',
					'X-Kroger-Channel': 'WEB'
				},
				body: JSON.stringify(batch),
				credentials: 'include'
			});
			
			if (!response.ok) {
				throw new Error(`Server error: ${response.status}`);
			}
			
			// Process the response
			const receiptDetails = await response.json();
			console.log(`Receipt #${index + 1}:`, receiptDetails.data.purchaseHistoryDetails);
			break; // Exit the loop if the request is successful

		} catch (error) {
			attempt++;
			console.error(`Error processing batch #${index + 1} (attempt ${attempt}):`, error);
			
			if (attempt >= maxRetries) {
				console.error('Max retries reached. Failed to process batch:', batch);
				throw error; // Rethrow the error after max retries
			}

			// Exponential backoff delay
			await delay(Math.pow(2, attempt) * 1000);
		}
	}
}

var batches;

// Main function to fetch receipts and process them in batches
fetch("https://www.kroger.com/atlas/v1/post-order/v1/purchase-history-search?pageNo=1&pageSize=200", {
	credentials: 'include'
}).then(res => res.json()).then(response => {
	const receipts = response.data.postOrderSearch.data;
	const receiptData = receipts.map(receipt => receiptKeyToData(receipt.receiptKey));
	
	// Split receiptData into batches of 25
	batches = batchArray(receiptData, 25);
	
	console.log("Batches: ", batches);

	// Process each batch sequentially. Add a delay between each request to
	// reduce relate limiting
	return batches.reduce((promiseChain, batch, index) => {
		return promiseChain.then(() => {
			return processBatchRetry(batches, index).then(() => {
				return delay(getRandomInt(4000, 8000));
			});
		});
	}, Promise.resolve());
}).then(() => {
	console.log('All batches processed successfully.');
}).catch(err => {
	console.error('Error processing batches:', err);
});
```

### Manually request specific batches:
```js
processBatch(batches, 0);
processBatch(batches, 1);
processBatch(batches, 2);
processBatch(batches, 3);
processBatch(batches, 4);
processBatch(batches, 5);
processBatch(batches, 6);
processBatch(batches, 7);
```
