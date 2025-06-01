# Node-RED Open Food Facts

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js CI](https://github.com/democratize-technology/node-red-contrib-open-food-facts/actions/workflows/ci.yml/badge.svg)](https://github.com/democratize-technology/node-red-contrib-open-food-facts/actions/workflows/ci.yml)
[![npm version](https://badge.fury.io/js/node-red-contrib-open-food-facts.svg)](https://badge.fury.io/js/node-red-contrib-open-food-facts)

A Node-RED integration for the Open Food Facts API, providing easy access to food product information, nutrition facts, and ingredient details from the world's largest open food database.

## Features

- **Product Lookup**: Retrieve detailed product information by barcode
- **Product Search**: Search for products using various criteria (name, brand, category, etc.)
- **Taxonomy Access**: Access categorized data for additives, allergens, brands, and more
- **Product Management**: Add new products and upload product photos (requires authentication)
- **Insights Access**: Get random insights from Robotoff for product improvement
- **Asynchronous Operations**: All API calls are non-blocking
- **Error Handling**: Comprehensive error handling with custom error types
- **Type Safety**: Built with modern JavaScript features

## Installation

Install using the Node-RED palette manager or via npm:

```bash
npm install node-red-contrib-open-food-facts
```

## Nodes

### Basic Nodes

#### OpenFoodFacts Get Product
Retrieve product information by barcode.

**Inputs**:
- `msg.payload`: Barcode string (if not configured in node)

**Outputs**:
- `msg.payload`: Product object with details like name, brand, ingredients, nutrition facts

#### OpenFoodFacts Search Products
Search for products using various filters.

**Inputs**:
- `msg.payload`: Search parameters object

Example search parameters:
```javascript
{
  "search_terms": "chocolate",
  "brands": "Nestle",
  "categories": "snacks",
  "page": 1,
  "pageSize": 20
}
```

**Outputs**:
- `msg.payload`: Search results including count, page information, and products array

#### OpenFoodFacts Get Taxonomy
Access categorized data (additives, allergens, brands, etc.).

**Inputs**:
- `msg.payload`: Taxonomy type (e.g., "additives", "allergens", "brands")

**Outputs**:
- `msg.payload`: Taxonomy data object

### Extended Nodes

#### OpenFoodFacts Add Product
Add a new product to the OpenFoodFacts database (requires authentication).

**Configuration**:
- Username and password credentials required

**Inputs**:
- `msg.payload`: Product data object with `code`, `brands` (optional), `labels` (optional)

**Outputs**:
- `msg.payload`: API response

#### OpenFoodFacts Upload Photo
Upload a photo for a product (requires authentication).

**Configuration**:
- Username and password credentials required

**Inputs**:
- `msg.payload`: Object containing:
  - `barcode`: Product barcode
  - `image`: Image file
  - `type`: Object with `field` (front/ingredients/nutrition) and `languageCode`

**Outputs**:
- `msg.payload`: API response

#### OpenFoodFacts Get Additives
Retrieve the additives taxonomy.

**Outputs**:
- `msg.payload`: Additives taxonomy data

#### OpenFoodFacts Get Allergens
Retrieve the allergens taxonomy.

**Outputs**:
- `msg.payload`: Allergens taxonomy data

#### OpenFoodFacts Get Brands
Retrieve the brands taxonomy.

**Outputs**:
- `msg.payload`: Brands taxonomy data

#### OpenFoodFacts Get Random Insight
Get random insights from OpenFoodFacts Robotoff.

**Configuration**:
- `count`: Number of insights to retrieve (default: 1)
- `lang`: Language code for filtering (optional)

**Outputs**:
- `msg.payload`: Random insights from Robotoff

## Example Flows

### Basic Product Lookup

```json
[
    {
        "id": "inject-barcode",
        "type": "inject",
        "payload": "3017620422003",
        "payloadType": "str",
        "topic": "",
        "name": "Inject Barcode",
        "wires": [["get-product"]]
    },
    {
        "id": "get-product",
        "type": "openfoodfacts-get-product",
        "name": "",
        "wires": [["debug"]]
    },
    {
        "id": "debug",
        "type": "debug",
        "name": "",
        "active": true,
        "wires": []
    }
]
```

### Search by Category

```json
[
    {
        "id": "search-inject",
        "type": "inject",
        "payload": "{\"categories\": \"beverages\", \"page\": 1}",
        "payloadType": "json",
        "topic": "",
        "name": "Search Beverages",
        "wires": [["search-products"]]
    },
    {
        "id": "search-products",
        "type": "openfoodfacts-search-products",
        "name": "",
        "wires": [["debug"]]
    },
    {
        "id": "debug",
        "type": "debug",
        "name": "",
        "active": true,
        "wires": []
    }
]
```

## API Reference

### Product Object Structure

```javascript
{
  "code": "3017620422003",
  "product_name": "Nutella",
  "brands": "Ferrero",
  "categories": "Spreads, Sweet spreads, Chocolate spreads",
  "ingredients_text": "Sugar, Palm oil, Hazelnuts...",
  "nutriments": {
    "energy_100g": 2252,
    "fat_100g": 30.9,
    "carbohydrates_100g": 57.5,
    "proteins_100g": 6.3
  },
  // ... more fields
}
```

### Search Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| search_terms | string | General search query |
| brands | string | Filter by brand |
| categories | string | Filter by category |
| code | string | Filter by barcode |
| countries | string | Filter by country |
| page | number | Page number (default: 1) |
| pageSize | number | Results per page (default: 20) |

## Error Handling

The nodes emit errors that can be caught using a catch node. Common errors include:

- Product not found
- Invalid barcode format
- Network connectivity issues
- API rate limiting

## Testing

Run the test suite:

```bash
npm test
```

## Automated PR Reviews

This repository uses automated PR reviews powered by Amazon Bedrock and Claude AI via GitHub Actions. When you create a pull request, the workflow will automatically:

- Analyze your code changes
- Provide intelligent feedback and suggestions
- Check for potential issues and improvements

### Setup Requirements

To enable automated PR reviews, repository administrators need to configure the following secrets in Settings → Secrets and variables → Actions → Repository secrets:

- `AWS_ACCESS_KEY_ID`: Your AWS access key with Bedrock permissions
- `AWS_SECRET_ACCESS_KEY`: Your AWS secret access key

The workflow uses the `anthropic.claude-3-5-sonnet-20241022-v2:0` model in the `us-east-1` region.

## Contributing

Contributions are welcome! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Credits

This node uses the [Open Food Facts](https://world.openfoodfacts.org/) API. Open Food Facts is a collaborative project with contributors from around the world.

## Support

- For issues and feature requests, please use the [GitHub issue tracker](https://github.com/democratize-technology/node-red-contrib-open-food-facts/issues)
- For questions about the Open Food Facts API, visit their [documentation](https://wiki.openfoodfacts.org/API)

## Acknowledgments

- Open Food Facts team for maintaining the amazing food products database
- Node-RED community for the excellent IoT platform
