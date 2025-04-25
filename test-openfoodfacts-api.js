/**
 * Unit tests for the OpenFoodFacts API client
 * Using Node.js built-in test runner (requires Node.js 20+)
 */

const { test, describe, mock } = require('node:test');
const assert = require('node:assert');
const { OpenFoodFactsAPI, OpenFoodFactsError } = require('./openfoodfacts-api');

// Create global fetch mock for tests
global.fetch = mock.fn();
global.FormData = class FormData {
  constructor() {
    this.data = {};
  }
  append(key, value) {
    this.data[key] = value;
  }
};

// Helper function to mock successful fetch responses
function mockSuccessResponse(data) {
  global.fetch.mock.resetCalls();
  global.fetch.mock.mockImplementation(async () => ({
    ok: true,
    status: 200,
    json: async () => data,
  }));
}

// Helper function to mock failed fetch responses
function mockErrorResponse(status = 404) {
  global.fetch.mock.resetCalls();
  global.fetch.mock.mockImplementation(async () => ({
    ok: false,
    status,
    json: async () => ({ status: 'error' }),
  }));
}

// Helper function to mock invalid JSON responses
function mockInvalidResponse() {
  global.fetch.mock.resetCalls();
  global.fetch.mock.mockImplementation(async () => ({
    ok: true,
    status: 200,
    json: async () => null,
  }));
}

// Start tests
describe('OpenFoodFactsAPI', () => {
  let api;

  test('should initialize with default URL', () => {
    api = new OpenFoodFactsAPI();
    assert.strictEqual(api.baseUrl, 'https://world.openfoodfacts.org');
    assert.strictEqual(api.credentials, null);
  });

  test('should initialize with custom URL', () => {
    api = new OpenFoodFactsAPI('https://custom.openfoodfacts.org');
    assert.strictEqual(api.baseUrl, 'https://custom.openfoodfacts.org');
  });

  test('should set credentials', () => {
    api = new OpenFoodFactsAPI();
    api.setCredentials('username', 'password');
    assert.deepStrictEqual(api.credentials, { userId: 'username', password: 'password' });
  });

  // Test getProduct method
  describe('getProduct', () => {
    test('should fetch product by barcode', async () => {
      api = new OpenFoodFactsAPI();

      const mockProduct = {
        product: {
          code: '123456789',
          product_name: 'Test Product',
          brands: 'Test Brand',
          quantity: '100g',
          serving_size: '10g',
          packaging: 'Plastic',
          storage_conditions: 'Cool and dry',
          conservation_conditions: 'Refrigerate after opening',
          expiration_date_format: 'DD/MM/YYYY',
          categories: 'Snacks',
          labels: 'Organic',
          food_groups: 'Processed foods',
        },
      };

      mockSuccessResponse(mockProduct);

      const result = await api.getProduct('123456789');

      assert.strictEqual(global.fetch.mock.calls.length, 1);
      assert.strictEqual(
        global.fetch.mock.calls[0].arguments[0],
        'https://world.openfoodfacts.org/api/v0/product/123456789',
      );

      assert.deepStrictEqual(result, {
        code: '123456789',
        product_name: 'Test Product',
        brands: 'Test Brand',
        quantity: '100g',
        serving_size: '10g',
        packaging: 'Plastic',
        storage_conditions: 'Cool and dry',
        conservation_conditions: 'Refrigerate after opening',
        expiration_date_format: 'DD/MM/YYYY',
        categories: 'Snacks',
        labels: 'Organic',
        food_groups: 'Processed foods',
      });
    });

    test('should handle fetch error in getProduct', async () => {
      api = new OpenFoodFactsAPI();
      mockErrorResponse(500);

      await assert.rejects(
        async () => {
          await api.getProduct('123456789');
        },
        { message: 'Failed to fetch product: HTTP error! status: 500' },
      );
    });

    test('should handle failed API response in getProduct', async () => {
      api = new OpenFoodFactsAPI();

      // Mock fetch to throw an error
      global.fetch = mock.fn(() => {
        throw new Error('Network error');
      });

      await assert.rejects(
        async () => {
          await api.getProduct('123456789');
        },
        { message: 'Failed to fetch product: Network error' },
      );
    });
  });

  // Test searchProducts method
  describe('searchProducts', () => {
    test('should search products with basic parameters', async () => {
      api = new OpenFoodFactsAPI();

      const mockResponse = {
        count: 1,
        page: 1,
        page_size: 20,
        products: [
          {
            code: '123456789',
            product_name: 'Test Product',
            brands: 'Test Brand',
          },
        ],
      };

      mockSuccessResponse(mockResponse);

      const result = await api.searchProducts({
        search_terms: 'chocolate',
        page: 1,
        pageSize: 20,
      });

      assert.strictEqual(global.fetch.mock.calls.length, 1);
      const url = new URL(global.fetch.mock.calls[0].arguments[0]);
      assert.strictEqual(url.searchParams.get('search_terms'), 'chocolate');
      assert.strictEqual(url.searchParams.get('page'), '1');
      assert.strictEqual(url.searchParams.get('page_size'), '20');

      assert.deepStrictEqual(result, mockResponse);
    });

    test('should search products with code parameters', async () => {
      api = new OpenFoodFactsAPI();
      mockSuccessResponse({ products: [] });

      await api.searchProducts({
        code: '123456',
        code_type: 'contains',
      });

      const url = new URL(global.fetch.mock.calls[0].arguments[0]);
      assert.strictEqual(url.searchParams.get('code'), '123456');
      assert.strictEqual(url.searchParams.get('code_type'), 'contains');
    });

    test('should search products with code_type=starts parameter', async () => {
      api = new OpenFoodFactsAPI();
      mockSuccessResponse({ products: [] });

      await api.searchProducts({
        code: '123456',
        code_type: 'starts',
      });

      const url = new URL(global.fetch.mock.calls[0].arguments[0]);
      assert.strictEqual(url.searchParams.get('code_type'), 'starts');
    });

    test('should search products with code_type=ends parameter', async () => {
      api = new OpenFoodFactsAPI();
      mockSuccessResponse({ products: [] });

      await api.searchProducts({
        code: '123456',
        code_type: 'ends',
      });

      const url = new URL(global.fetch.mock.calls[0].arguments[0]);
      assert.strictEqual(url.searchParams.get('code_type'), 'ends');
    });

    test('should search products with code parameter and default code_type', async () => {
      api = new OpenFoodFactsAPI();
      mockSuccessResponse({ products: [] });

      await api.searchProducts({
        code: '123456',
        code_type: 'unknown',
      });

      const url = new URL(global.fetch.mock.calls[0].arguments[0]);
      assert.strictEqual(url.searchParams.get('code_type'), 'exact');
    });

    test('should search products with tag parameters', async () => {
      api = new OpenFoodFactsAPI();
      mockSuccessResponse({ products: [] });

      await api.searchProducts({
        tagType: ['brands', 'categories'],
        tag: ['Nestle', 'Snacks'],
        tagContains: ['contains', 'exact'],
      });

      const url = new URL(global.fetch.mock.calls[0].arguments[0]);
      assert.strictEqual(url.searchParams.get('tagtype_0'), 'brands');
      assert.strictEqual(url.searchParams.get('tag_0'), 'Nestle');
      assert.strictEqual(url.searchParams.get('tag_contains_0'), 'contains');
      assert.strictEqual(url.searchParams.get('tagtype_1'), 'categories');
      assert.strictEqual(url.searchParams.get('tag_1'), 'Snacks');
      assert.strictEqual(url.searchParams.get('tag_contains_1'), 'exact');
    });

    test('should search products with additives and palm oil parameters', async () => {
      api = new OpenFoodFactsAPI();
      mockSuccessResponse({ products: [] });

      await api.searchProducts({
        additives: 'without',
        ingredientsFromPalmOil: 'without',
      });

      const url = new URL(global.fetch.mock.calls[0].arguments[0]);
      assert.strictEqual(url.searchParams.get('additives'), 'without');
      assert.strictEqual(url.searchParams.get('ingredients_from_palm_oil'), 'without');
    });

    test('should filter fields in search results', async () => {
      api = new OpenFoodFactsAPI();

      const mockResponse = {
        count: 1,
        products: [
          {
            code: '123456789',
            product_name: 'Test Product',
            brands: 'Test Brand',
            extra_field: 'Should be filtered',
          },
        ],
      };

      mockSuccessResponse(mockResponse);

      const result = await api.searchProducts({
        search_terms: 'test',
        fields: ['code', 'product_name'],
      });

      assert.deepStrictEqual(result.products[0], {
        code: '123456789',
        product_name: 'Test Product',
      });

      // Ensure brands is not included since it wasn't in fields
      assert.strictEqual(result.products[0].brands, undefined);
      assert.strictEqual(result.products[0].extra_field, undefined);
    });

    test('should handle HTTP error in searchProducts', async () => {
      api = new OpenFoodFactsAPI();
      mockErrorResponse(500);

      await assert.rejects(
        async () => {
          await api.searchProducts({ search_terms: 'test' });
        },
        (err) => {
          assert.strictEqual(err instanceof OpenFoodFactsError, true);
          assert.strictEqual(err.message, 'HTTP error! status: 500');
          assert.strictEqual(err.details, 'API request failed');
          assert.strictEqual(err.status, 500);
          return true;
        },
      );
    });

    test('should handle invalid response format in searchProducts', async () => {
      api = new OpenFoodFactsAPI();
      mockInvalidResponse();

      await assert.rejects(
        async () => {
          await api.searchProducts({ search_terms: 'test' });
        },
        { message: 'Invalid response format' },
      );
    });

    test('should handle fetch error in searchProducts', async () => {
      api = new OpenFoodFactsAPI();

      // Mock fetch to throw an error
      global.fetch = mock.fn(() => {
        throw new Error('Network error');
      });

      await assert.rejects(
        async () => {
          await api.searchProducts({ search_terms: 'test' });
        },
        { message: 'Failed to search products: Network error' },
      );
    });
  });

  // Test addProduct method
  describe('addProduct', () => {
    test('should require credentials for addProduct', async () => {
      api = new OpenFoodFactsAPI();

      await assert.rejects(
        async () => {
          await api.addProduct({ code: '123456789' });
        },
        { message: 'Credentials required for adding products' },
      );
    });

    test('should add product with minimum parameters', async () => {
      api = new OpenFoodFactsAPI();
      api.setCredentials('user', 'pass');

      mockSuccessResponse({ status: 'success' });

      await api.addProduct({ code: '123456789' });

      assert.strictEqual(global.fetch.mock.calls.length, 1);
      assert.strictEqual(
        global.fetch.mock.calls[0].arguments[0],
        'https://world.openfoodfacts.org/cgi/product_jqm2.pl',
      );
      assert.strictEqual(global.fetch.mock.calls[0].arguments[1].method, 'POST');
    });

    test('should add product with all parameters', async () => {
      api = new OpenFoodFactsAPI();
      api.setCredentials('user', 'pass');

      mockSuccessResponse({ status: 'success' });

      await api.addProduct({
        code: '123456789',
        brands: 'Test Brand',
        labels: 'Organic',
      });

      assert.strictEqual(global.fetch.mock.calls.length, 1);
    });

    test('should handle HTTP error in addProduct', async () => {
      api = new OpenFoodFactsAPI();
      api.setCredentials('user', 'pass');
      mockErrorResponse(400);

      await assert.rejects(
        async () => {
          await api.addProduct({ code: '123456789' });
        },
        { message: 'Failed to add product: HTTP error! status: 400' },
      );
    });

    test('should handle fetch error in addProduct', async () => {
      api = new OpenFoodFactsAPI();
      api.setCredentials('user', 'pass');

      // Mock fetch to throw an error
      global.fetch = mock.fn(() => {
        throw new Error('Network error');
      });

      await assert.rejects(
        async () => {
          await api.addProduct({ code: '123456789' });
        },
        { message: 'Failed to add product: Network error' },
      );
    });
  });

  // Test uploadPhoto method
  describe('uploadPhoto', () => {
    test('should require credentials for uploadPhoto', async () => {
      api = new OpenFoodFactsAPI();

      await assert.rejects(
        async () => {
          await api.uploadPhoto('123456789', {}, { field: 'front', languageCode: 'en' });
        },
        { message: 'Credentials required for uploading photos' },
      );
    });

    test('should upload photo successfully', async () => {
      api = new OpenFoodFactsAPI();
      api.setCredentials('user', 'pass');

      mockSuccessResponse({ status: 'success' });

      const mockImage = {}; // Mock File object
      await api.uploadPhoto('123456789', mockImage, { field: 'front', languageCode: 'en' });

      assert.strictEqual(global.fetch.mock.calls.length, 1);
      assert.strictEqual(
        global.fetch.mock.calls[0].arguments[0],
        'https://world.openfoodfacts.org/cgi/product_image_upload.pl',
      );
      assert.strictEqual(global.fetch.mock.calls[0].arguments[1].method, 'POST');
    });

    test('should handle HTTP error in uploadPhoto', async () => {
      api = new OpenFoodFactsAPI();
      api.setCredentials('user', 'pass');
      mockErrorResponse(400);

      await assert.rejects(
        async () => {
          await api.uploadPhoto('123456789', {}, { field: 'front', languageCode: 'en' });
        },
        { message: 'Failed to upload photo: HTTP error! status: 400' },
      );
    });

    test('should handle fetch error in uploadPhoto', async () => {
      api = new OpenFoodFactsAPI();
      api.setCredentials('user', 'pass');

      // Mock fetch to throw an error
      global.fetch = mock.fn(() => {
        throw new Error('Network error');
      });

      await assert.rejects(
        async () => {
          await api.uploadPhoto('123456789', {}, { field: 'front', languageCode: 'en' });
        },
        { message: 'Failed to upload photo: Network error' },
      );
    });
  });

  // Test getTaxonomy method
  describe('getTaxonomy', () => {
    test('should fetch taxonomy data', async () => {
      api = new OpenFoodFactsAPI();

      mockSuccessResponse({ taxonomy: 'data' });

      await api.getTaxonomy('additives');

      assert.strictEqual(global.fetch.mock.calls.length, 1);
      assert.strictEqual(
        global.fetch.mock.calls[0].arguments[0],
        'https://world.openfoodfacts.org/data/taxonomies/additives.json',
      );
    });

    test('should handle HTTP error in getTaxonomy', async () => {
      api = new OpenFoodFactsAPI();
      mockErrorResponse(404);

      await assert.rejects(
        async () => {
          await api.getTaxonomy('invalid_taxonomy');
        },
        { message: 'Failed to fetch taxonomy: HTTP error! status: 404' },
      );
    });

    test('should handle fetch error in getTaxonomy', async () => {
      api = new OpenFoodFactsAPI();

      // Mock fetch to throw an error
      global.fetch = mock.fn(() => {
        throw new Error('Network error');
      });

      await assert.rejects(
        async () => {
          await api.getTaxonomy('additives');
        },
        { message: 'Failed to fetch taxonomy: Network error' },
      );
    });
  });

  // Test convenience taxonomy methods
  describe('convenience taxonomy methods', () => {
    test('should call getTaxonomy for getAdditives', async () => {
      api = new OpenFoodFactsAPI();
      mockSuccessResponse({ additives: 'data' });

      await api.getAdditives();

      assert.strictEqual(global.fetch.mock.calls.length, 1);
      assert.strictEqual(
        global.fetch.mock.calls[0].arguments[0],
        'https://world.openfoodfacts.org/data/taxonomies/additives.json',
      );
    });

    test('should call getTaxonomy for getAllergens', async () => {
      api = new OpenFoodFactsAPI();
      mockSuccessResponse({ allergens: 'data' });

      await api.getAllergens();

      assert.strictEqual(global.fetch.mock.calls.length, 1);
      assert.strictEqual(
        global.fetch.mock.calls[0].arguments[0],
        'https://world.openfoodfacts.org/data/taxonomies/allergens.json',
      );
    });

    test('should call getTaxonomy for getBrands', async () => {
      api = new OpenFoodFactsAPI();
      mockSuccessResponse({ brands: 'data' });

      await api.getBrands();

      assert.strictEqual(global.fetch.mock.calls.length, 1);
      assert.strictEqual(
        global.fetch.mock.calls[0].arguments[0],
        'https://world.openfoodfacts.org/data/taxonomies/brands.json',
      );
    });
  });

  // Test getRandomInsight method
  describe('getRandomInsight', () => {
    test('should fetch random insight with default parameters', async () => {
      api = new OpenFoodFactsAPI();

      mockSuccessResponse({ insights: [] });

      await api.getRandomInsight();

      assert.strictEqual(global.fetch.mock.calls.length, 1);
      const url = new URL(global.fetch.mock.calls[0].arguments[0]);
      assert.strictEqual(url.searchParams.get('count'), '1');
      assert.strictEqual(url.searchParams.get('lang'), null);
    });

    test('should fetch random insight with custom parameters', async () => {
      api = new OpenFoodFactsAPI();

      mockSuccessResponse({ insights: [] });

      await api.getRandomInsight(5, 'en');

      assert.strictEqual(global.fetch.mock.calls.length, 1);
      const url = new URL(global.fetch.mock.calls[0].arguments[0]);
      assert.strictEqual(url.searchParams.get('count'), '5');
      assert.strictEqual(url.searchParams.get('lang'), 'en');
    });

    test('should handle HTTP error in getRandomInsight', async () => {
      api = new OpenFoodFactsAPI();
      mockErrorResponse(500);

      await assert.rejects(
        async () => {
          await api.getRandomInsight();
        },
        { message: 'Failed to fetch random insight: HTTP error! status: 500' },
      );
    });

    test('should handle fetch error in getRandomInsight', async () => {
      api = new OpenFoodFactsAPI();

      // Mock fetch to throw an error
      global.fetch = mock.fn(() => {
        throw new Error('Network error');
      });

      await assert.rejects(
        async () => {
          await api.getRandomInsight();
        },
        { message: 'Failed to fetch random insight: Network error' },
      );
    });
  });

  // Test OpenFoodFactsError class
  describe('OpenFoodFactsError', () => {
    test('should create error with details and status', () => {
      const error = new OpenFoodFactsError('Test error', 'Test details', 404);

      assert.strictEqual(error.name, 'OpenFoodFactsError');
      assert.strictEqual(error.message, 'Test error');
      assert.strictEqual(error.details, 'Test details');
      assert.strictEqual(error.status, 404);
    });
  });
});
