# Scraper v2b (Full Process, Class Edition)

```js
class ReceiptFetcher {
	constructor() {
		this.baseUrl = '/atlas/v1';
	}
	
	// Convert the receipt key into the required data structure
	receiptKeyToData(receiptKey) {
		const dataParts = receiptKey.split('~');
		return [
			{
				"divisionNumber": dataParts[0],
				"storeNumber": dataParts[1],
				"transactionDate": dataParts[2],
				"terminalNumber": dataParts[3],
				"transactionId": dataParts[4]
			}
		];
	}
	
	// Generate a random integer between min (inclusive) and max (inclusive)
	getRandomInt(min, max) {
		return Math.floor(Math.random() * (max - min + 1)) + min;
	}
	
	// Helper function to create a delay
	delay(ms) {
		return new Promise(resolve => setTimeout(resolve, ms));
	}
	
	// Fetch the purchase history receipts
	async fetchReceipts() {
		try {
			const receiptsUrl = `${this.baseUrl}/post-order/v1/purchase-history-search?pageNo=1&pageSize=10`;
			const response = await (await fetch(receiptsUrl, { method: 'GET' })).json();
			const receipts = response.data.postOrderSearch.data;
			console.log(receipts);
			
			// Process receipts one by one
			for (const receipt of receipts) {
				await this.fetchReceiptDetails(receipt.receiptKey);
				await this.delay(this.getRandomInt(3000, 8000)); // add delay
			}
			
			console.log('All receipts processed successfully.');
		} catch (err) {
			console.error('Error in main process:', err);
		}
	}
	
	// Fetch details for a single receipt
	async fetchReceiptDetails(receiptKey) {
		try {
			const data = this.receiptKeyToData(receiptKey);
			console.log(`Processing ${receiptKey}...`);
			
			const detailsResponse = await fetch(`${this.baseUrl}/purchase-history/v2/details`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(data)
			});
			
			if (! detailsResponse.ok) {
				throw new Error('Network response was not ok');
			}
			
			const receiptDetails = await detailsResponse.json();
			console.log('Receipt details:', receiptDetails);
		} catch (error) {
			console.error('Failed to fetch receipt details:', error);
		}
	}
}
```

### Create an instance of the ReceiptFetcher class and start fetching
``js
const fetcher = new ReceiptFetcher();
fetcher.fetchReceipts();
```
