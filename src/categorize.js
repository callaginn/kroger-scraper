/*/
	Kroger Receipt Sweeper
	This script matches each purchased product with data from the Kroger api,
	as well as custom mappings and cleanups
	Written by Stephen Ginn
/*/

import { promises as fs } from 'fs';
import { createObjectCsvWriter as csvWriter } from 'csv-writer';
import { writeToFile } from './bin.js';
import mappings from './data/mappings.json' assert { type: 'json' };
Object.assign(global, mappings);

const paths = {
	input: {
		products: 'src/data/products.json',
		categories: 'src/data/categories.json'
	},
	output: {
		products: 'src/data/products-mapped.json',
		descriptions: 'src/data/descriptions.json',
		productsCSV: 'src/data/products.csv'
	}
};

// Precompile unwanted text and category regexes
const unwantedTextRegexes = unwantedText.map(text => new RegExp(text, 'gi'));
const descriptionCategoryRegexes = Object.entries(descriptionCategories).map(
	([keyword, category]) => ({ regex: new RegExp(keyword, 'i'), category })
);

// Generate CSV headers from the mapping
const csvHeaders = Object.entries(csvColumns).map(([id, title]) => ({ id, title }));

// Sanitize product description by removing unwanted text and trimming excess spaces
const sanitizeDescription = (description) => {
	for (const regex of unwantedTextRegexes) {
		description = description.replace(regex, '').trim();
	}
	return description.replace(/\s+/g, ' ').trim(); // Remove multiple spaces
};

// Get categories array based on description
const getCategories = (description) => {
	for (const { regex, category } of descriptionCategoryRegexes) {
		if (regex.test(description)) {
			return [category];
		}
	}
	return ["N/A"];
};

// Get product name based on description
const getProductName = (description) => {
	for (const [key, keywords] of Object.entries(names)) {
		const hasKeyword = Array.isArray(keywords)
			? keywords.some(keyword => description.includes(keyword))
			: description.includes(keywords);
		if (hasKeyword) {
			return key; // Return the first matching product name
		}
	}
	return null;
};

// Process products in chunks for better performance with large datasets
(async () => {
	try {
		// Read products and related data
		const products = JSON.parse(await fs.readFile(paths.input.products, 'utf8'));
		const lookup = JSON.parse(await fs.readFile(paths.input.categories, 'utf8'));
		let allDescriptions = [];
		
		// Process products in parallel (in chunks if necessary)
		const chunkSize = 100;
		
		for (let i = 0; i < products.length; i += chunkSize) {
			const productChunk = products.slice(i, i + chunkSize);
			
			await Promise.all(productChunk.map(async (product) => {
				let description = sanitizeDescription(product.description);
				let details = lookup[product.upc];
				
				// Assign product name based on description
				product.name = getProductName(description);
				if (!product.name) {
					allDescriptions.push(description);
				}
				
				// Populate data from previous Kroger product lookup
				product.categories = details?.categories ? [...new Set(details.categories)] : getCategories(description);
				product.brand = details?.brand || "Unknown Brand";
				
				// Assign main category based on categories
				product.collection = Object.keys(collections).find(category =>
					collections[category].some(cat => product.categories.includes(cat))
				) || "Unknown Category";
				
				// Assign category string and matching subcategory
				product.categoryString = product.categories.join(', ');
				product.subcategory = subcategories.find(subcategory =>
					description.toLowerCase().includes(subcategory.toLowerCase())
				) || "Unknown Subcategory";
			}));
		}
		
		// Deduplicate descriptions
		allDescriptions = [...new Set(allDescriptions)].sort((a, b) => a.localeCompare(b));
		
		// Write products and descriptions to JSON and CSV files
		await Promise.all([
			writeToFile(paths.output.products, products),
			writeToFile(paths.output.descriptions, allDescriptions),
			csvWriter({
				path: paths.output.productsCSV,
				header: csvHeaders
			}).writeRecords(products)
		]);
		
		console.log("Data has been saved to " + paths.output.productsCSV);
	} catch (err) {
		console.error("Error processing products:", err);
	}
})();
