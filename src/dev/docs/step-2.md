# Scraper v1b

## Fetch a single receipt
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

var data = receiptKeyToData("XXX~XXXXX~YYYY-MM-DD~XXX~XXXXXX");

fetch('https://www.kroger.com/atlas/v1/purchase-history/v2/details', {
	method: 'POST',
	headers: {
		'Content-Type': 'application/json'
	},
	body: JSON.stringify(data)
}).then(res => {
	if (!res.ok) {
		throw new Error('Network response was not ok');
	}
	
	return res.json();
}).then(data => {
	console.log('Success:', data);
}).catch(error => {
	console.error('Error:', error);
});
```

## Fetch Multiple Receipts
<span style="font-weight: lighter; font-size: 21px; font-style: italic;">This partial version shows how multiple receipts can be requested at once:</span>

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

var data = [
	receiptKeyToData("XXX~XXXXX~YYYY-MM-DD~XXX~XXXXXX"),
	receiptKeyToData("XXX~XXXXX~YYYY-MM-DD~XXX~XXXXXX")
];

fetch('https://www.kroger.com/atlas/v1/purchase-history/v2/details', {
	method: 'POST',
	headers: {
		'Content-Type': 'application/json'
	},
	body: JSON.stringify(data)
}).then(response => {
	if (!response.ok) {
		throw new Error('Network response was not ok');
	}
	return response.json();
}).then(data => {
	console.log('Success:', data);
}).catch(error => {
	console.error('Error:', error);
});
```
