# Scraper v2a (Full Process)

```js
function receiptKeyToData(receiptKey) {
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

// Helper function to create a delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

fetch("https://www.kroger.com/atlas/v1/post-order/v1/purchase-history-search?pageNo=1&pageSize=100", {
	credentials: 'include'
}).then(res => res.json()).then(response => {
	return response.data.postOrderSearch.data;
}).then(receipts => {
	// Use Promise.all to handle multiple fetch calls
	return Promise.all(receipts.map(receipt => {
		var data = receiptKeyToData(receipt.receiptKey);
		
		return new Promise((resolve, reject) => {
			fetch('https://www.kroger.com/atlas/v1/purchase-history/v2/details', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(data)
			}).then(response => {
				if (!response.ok) {
					reject(new Error('Network response was not ok'));
				}
				return response.json();
			}).then(receiptDetails => {
				console.log(receiptDetails);
				resolve(receiptDetails);
			}).catch(error => {
				reject(error);
			});
		});
	}));
}).then(dataArray => {
	// Handle the success case for all responses
	console.log('Success:', dataArray);
}).catch(err => {
	console.error('Error:', err);
});
```
