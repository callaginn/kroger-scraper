/*/
	Kroger Receipt Sweeper
	This script loads products.json and uses the Kroger api to request product
	information. These categorized products are saved to src/data/categories.json.
	Written by Stephen Ginn
/*/

import fs from 'fs';
import { item } from '@1password/op-js';
import { authorize1Password, batchArray } from './bin.js';

// Load products and return a unique array of UPC codes
const getUniqueUpcCodes = async () => {
	const products = JSON.parse(fs.readFileSync('src/data/products.json'));
	return [...new Set(products.map(product => product.upc))];
};

const fetchAuthToken = async () => {
	try {
		// Get client_id and client_secret from 1Password
		const credentials = await item.get("Kroger Receipt Sweeper", { fields: "client_id,client_secret" });
		const [clientId, clientSecret] = credentials.map(el => el.value);
		const AUTH_CODE = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
		
		// Fetch the auth token
		const response = await fetch("https://api.kroger.com/v1/connect/oauth2/token", {
			method: "POST",
			headers: {
				'Accept': 'application/json',
				"Content-Type": "application/x-www-form-urlencoded",
				"Authorization": `Basic ${AUTH_CODE}`
			},
			body: new URLSearchParams({
				grant_type: "client_credentials",
				scope: "product.compact"
			})
		});
		
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
		
		// Parse the response
		const data = await response.json();
		const TOKEN = data.access_token;
		const EXPIRES_AT = Date.now() + (data.expires_in * 1000);
		
		// Save the token and expiration to 1Password
		await item.edit("Kroger Receipt Sweeper", [
			['API.token', 'password', TOKEN],
			['API.expires_at', 'text', EXPIRES_AT.toString()]
		]);
		
		return TOKEN;
	} catch (err) {
		console.error('Error fetching auth token:', err.message);
	}
};

const getToken = async () => {
	try {
		const credentials = await item.get("Kroger Receipt Sweeper", { fields: "token,expires_at" });
		const token = credentials.find(field => field.label === 'token')?.value;
		const expires_at = credentials.find(field => field.label === 'expires_at')?.value || 0;
		const now = Date.now();
		
		// Return cached token if it's still valid
		if (token && expires_at > now) {
			console.log('Using cached token from 1Password');
			return token;
		}
	} catch (err) {
		console.log('Error fetching token from 1Password:', err.message);
	}
	
	// Refresh the token
	console.log('Token expired or missing, refreshing token...');
	return await fetchAuthToken();
};

// Function to fetch a batch of products
const fetchBatch = async (batch) => {
	const query = batch.join(',');
	const response = await fetch(`https://api.kroger.com/v1/products?filter.productId=${query}`, {
		method: "GET",
		headers: {
			'Accept': 'application/json',
			"Authorization": `Bearer ${global.token}`
		}
	});
	
	if (!response.ok) {
		throw new Error(`Failed to fetch batch: ${response.status}`);
	}
	
	const { data } = await response.json();
	return data;
};

// Fetch all batches concurrently
function fetchAllBatchesConcurrently(batches) {
	const batchPromises = batches.map(batch => fetchBatch(batch));

	// Wait for all batches to complete
	Promise.all(batchPromises).then(responses => {
		var productData = {};
		
		responses.flat().forEach(p => {
			productData[p.upc] = {
				description: p.description,
				categories: p.categories,
				brand: p.brand
			}
		});
		
		console.log(productData);
		
		fs.writeFile('src/data/categories.json', JSON.stringify(productData, null, 4), (err) => {
			if (err) {
				console.error('Error writing categories.json:', err);
				return;
			}
			console.log('Modified data has been saved to categories.json');
		});
	}).catch(err => {
		console.error('Error fetching one or more productData:', err);
	});
}

(async () => {
	// Authorize 1Password CLI
	authorize1Password();
	
	// Get an access token from 1Password
	global.token = await getToken();
	
	// Break request into batches of 50
	const batches = batchArray(await getUniqueUpcCodes(), 50);
	
	console.log(batches);
	
	// Start the batch fetching process
	console.log('Making API request with token!');
	// fetchAllBatchesConcurrently(batches);
})();
