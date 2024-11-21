/*/
	Kroger Receipt Fetcher
	This script grabs a simplified array of products from receipts.json
	and exports them to products.json.
	Written by Stephen Ginn
/*/

import fs from 'fs/promises';
import { writeToFile } from './bin.js';
const inputFilePath = 'src/data/receipts.json';
const outputFilePath = 'src/data/products.json';

// Main function to process receipts
const processReceipts = async () => {
	try {
		// Load the receipts from receipts.json
		const data = await fs.readFile(inputFilePath, 'utf8');
		const receipts = JSON.parse(data);
		
		// Convert receipts to simplified products
		const products = receipts.flatMap(receipt => 
			receipt.items.map(item => {
				const { displayInfo, upc, pricingInfo, quantityInfo } = item.purchasedData;
				return {
					upc,
					description: displayInfo.description,
					size: displayInfo.customerFacingSize,
					qty: quantityInfo.received,
					cost: pricingInfo.totalPricePaid.replace("USD ", ""),
					receiptID: receipt.purchaseId.receiptId,
					receiptDate: new Date(receipt.receiptCreateDateTime.value).toLocaleString('en-US', {
						year: 'numeric',
						month: '2-digit',
						day: '2-digit',
						hour: '2-digit',
						minute: '2-digit',
						second: '2-digit',
						hour12: true
					}),
					receiptLocation: receipt.storeInfo.vanityName
				};
			})
		);
		
		writeToFile(outputFilePath, products);
	} catch (err) {
		console.error('Error processing receipts:', err);
	}
};

processReceipts();
