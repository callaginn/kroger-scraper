# Step 1
### Get all the receipt keys

```js
fetch("https://www.kroger.com/atlas/v1/post-order/v1/purchase-history-search?pageNo=1&pageSize=100", {
	credentials: 'include'
}).then(res => {
	if (!res.ok) {
		throw new Error('Network response was not ok');
	}
	
	return res.json();
}).then(response => {
	return response.data.postOrderSearch.data.map(receipt => receipt.receiptKey);
}).then(receipts => {
	console.log('Receipts:', receipts);
}).catch(err => {
	console.error('Error fetching purchase history:', err);
});
```	
