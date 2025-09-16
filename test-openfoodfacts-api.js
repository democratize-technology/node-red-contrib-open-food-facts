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

  test('should reject HTTP URLs in constructor', () => {
    assert.throws(() => {
      new OpenFoodFactsAPI('http://insecure.openfoodfacts.org');
    }, { message: 'HTTPS is required for secure API access. Use https:// URLs only.' });
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

    test('should reject HTTP connections when adding products', async () => {
      // Create API with mocked HTTP URL (bypass constructor validation for testing)
      api = new OpenFoodFactsAPI();
      api.baseUrl = 'http://insecure.openfoodfacts.org'; // Simulate HTTP URL
      api.setCredentials('user', 'pass');

      await assert.rejects(
        async () => {
          await api.addProduct({ code: '123456789' });
        },
        { message: 'Cannot send credentials over non-HTTPS connection. HTTPS is required for authenticated requests.' },
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

    test('should reject HTTP connections when uploading photos', async () => {
      // Create API with mocked HTTP URL (bypass constructor validation for testing)
      api = new OpenFoodFactsAPI();
      api.baseUrl = 'http://insecure.openfoodfacts.org'; // Simulate HTTP URL
      api.setCredentials('user', 'pass');

      await assert.rejects(
        async () => {
          await api.uploadPhoto('123456789', {}, { field: 'front', languageCode: 'en' });
        },
        { message: 'Cannot send credentials over non-HTTPS connection. HTTPS is required for authenticated requests.' },
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

  // Test Input Validation Methods
  describe('Input Validation', () => {
    test('should validate barcode format correctly', () => {
      api = new OpenFoodFactsAPI();
      
      // Test valid barcodes
      assert.doesNotThrow(() => api._validateBarcode('12345678'));
      assert.doesNotThrow(() => api._validateBarcode('1234567890123'));
      
      // Test invalid barcodes - non-string
      assert.throws(
        () => api._validateBarcode(123456789),
        { message: 'Barcode must be a string' }
      );
      
      // Test invalid barcodes - wrong format
      assert.throws(
        () => api._validateBarcode('abc123'),
        { message: 'Invalid barcode format. Must be 8-13 digits.' }
      );
      
      // Test invalid barcodes - too short
      assert.throws(
        () => api._validateBarcode('1234567'),
        { message: 'Invalid barcode format. Must be 8-13 digits.' }
      );
      
      // Test invalid barcodes - too long
      assert.throws(
        () => api._validateBarcode('12345678901234'),
        { message: 'Invalid barcode format. Must be 8-13 digits.' }
      );
    });

    test('should validate partial barcodes for search', () => {
      api = new OpenFoodFactsAPI();
      
      // Test valid partial barcodes
      assert.doesNotThrow(() => api._validateBarcode('123', true));
      assert.doesNotThrow(() => api._validateBarcode('123456', true));
      
      // Test invalid partial barcodes
      assert.throws(
        () => api._validateBarcode('abc', true),
        { message: 'Invalid barcode format. Must contain only digits.' }
      );
      
      assert.throws(
        () => api._validateBarcode('', true),
        { message: 'Invalid barcode format. Must contain only digits.' }
      );
    });

    test('should validate image files correctly', async () => {
      api = new OpenFoodFactsAPI();
      
      // Test valid image files
      const validJpeg = { type: 'image/jpeg', size: 1024 };
      const validPng = { type: 'image/png', size: 2048 };
      const validWebp = { type: 'image/webp', size: 4096 };
      
      await assert.doesNotReject(() => api._validateImageFile(validJpeg));
      await assert.doesNotReject(() => api._validateImageFile(validPng));
      await assert.doesNotReject(() => api._validateImageFile(validWebp));
      
      // Test null/undefined file
      await assert.rejects(
        () => api._validateImageFile(null),
        { message: 'Image file is required' }
      );
      
      await assert.rejects(
        () => api._validateImageFile(undefined),
        { message: 'Image file is required' }
      );
      
      // Test invalid file type
      const invalidFile = { type: 'text/plain', size: 1024 };
      await assert.rejects(
        () => api._validateImageFile(invalidFile),
        { message: 'Invalid file type. Only JPEG, PNG, and WebP images are allowed.' }
      );
      
      // Test oversized file
      const largeFile = { type: 'image/jpeg', size: 11 * 1024 * 1024 };
      await assert.rejects(
        () => api._validateImageFile(largeFile),
        { message: 'File size too large. Maximum size is 10MB.' }
      );
      
      // Test mock objects (no type/size properties) - should not throw
      const mockFile = {};
      await assert.doesNotReject(() => api._validateImageFile(mockFile));
    });

    test('should validate image files with magic bytes', async () => {
      api = new OpenFoodFactsAPI();
      
      // Create mock files with valid magic bytes
      const validJpegBuffer = new Uint8Array([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10]);
      const validPngBuffer = new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A]);
      const validWebpBuffer = new Uint8Array([0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50]);
      
      const validJpegFile = {
        type: 'image/jpeg',
        size: 1024,
        arrayBuffer: async () => validJpegBuffer.buffer
      };
      
      const validPngFile = {
        type: 'image/png',
        size: 1024,
        arrayBuffer: async () => validPngBuffer.buffer
      };
      
      const validWebpFile = {
        type: 'image/webp',
        size: 1024,
        arrayBuffer: async () => validWebpBuffer.buffer
      };
      
      // Test valid magic bytes
      await assert.doesNotReject(() => api._validateImageFile(validJpegFile));
      await assert.doesNotReject(() => api._validateImageFile(validPngFile));
      await assert.doesNotReject(() => api._validateImageFile(validWebpFile));
      
      // Test invalid magic bytes
      const invalidBuffer = new Uint8Array([0x50, 0x4B, 0x03, 0x04]); // ZIP header
      const invalidFile = {
        type: 'image/jpeg',
        size: 1024,
        arrayBuffer: async () => invalidBuffer.buffer
      };
      
      await assert.rejects(
        () => api._validateImageFile(invalidFile),
        { message: 'File content does not match allowed image formats' }
      );
      
      // Test RIFF header without WEBP identifier (should be rejected)
      const riffOnlyBuffer = new Uint8Array([0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x41, 0x56, 0x49, 0x20]); // RIFF + AVI
      const riffOnlyFile = {
        type: 'image/webp',
        size: 1024,
        arrayBuffer: async () => riffOnlyBuffer.buffer
      };
      
      await assert.rejects(
        () => api._validateImageFile(riffOnlyFile),
        { message: 'File content does not match allowed image formats' }
      );
      
      // Test file without arrayBuffer method (should not throw for backwards compatibility)
      const fileWithoutArrayBuffer = { type: 'image/jpeg', size: 1024 };
      await assert.doesNotReject(() => api._validateImageFile(fileWithoutArrayBuffer));
    });

    test('should efficiently validate large files with slice optimization', async () => {
      api = new OpenFoodFactsAPI();
      
      // Create a large buffer (5MB) but with valid JPEG magic bytes at the start
      const largeBuffer = new Uint8Array(5 * 1024 * 1024);
      // Set valid JPEG magic bytes at the beginning
      largeBuffer[0] = 0xFF;
      largeBuffer[1] = 0xD8;
      largeBuffer[2] = 0xFF;
      largeBuffer[3] = 0xE0;
      
      let sliceCalled = false;
      let fullBufferRead = false;
      
      // Mock file with slice() support (modern File API)
      const fileWithSlice = {
        type: 'image/jpeg',
        size: largeBuffer.length,
        slice: function(start, end) {
          sliceCalled = true;
          // Verify we're only reading 16 bytes
          assert.strictEqual(start, 0);
          assert.strictEqual(end, 16);
          
          // Return a mock object that provides arrayBuffer for the sliced portion
          return {
            arrayBuffer: async () => {
              // Only return the first 16 bytes
              return largeBuffer.slice(start, end).buffer;
            }
          };
        },
        // This should NOT be called when slice is available
        arrayBuffer: async () => {
          fullBufferRead = true;
          return largeBuffer.buffer;
        }
      };
      
      // Test that validation passes and uses slice
      await assert.doesNotReject(() => api._validateImageFile(fileWithSlice));
      assert.strictEqual(sliceCalled, true, 'slice() should be called for optimization');
      assert.strictEqual(fullBufferRead, false, 'Full arrayBuffer should not be read when slice is available');
      
      // Test fallback when slice is not available
      const fileWithoutSlice = {
        type: 'image/jpeg',
        size: 1024,
        arrayBuffer: async () => {
          const buffer = new Uint8Array([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01]);
          return buffer.buffer;
        }
      };
      
      await assert.doesNotReject(() => api._validateImageFile(fileWithoutSlice));
      
      // Test WebP with slice optimization
      const webpBuffer = new Uint8Array(16);
      // RIFF header
      webpBuffer[0] = 0x52; // R
      webpBuffer[1] = 0x49; // I
      webpBuffer[2] = 0x46; // F
      webpBuffer[3] = 0x46; // F
      // File size (4 bytes) - not important for validation
      webpBuffer[4] = 0x00;
      webpBuffer[5] = 0x00;
      webpBuffer[6] = 0x00;
      webpBuffer[7] = 0x00;
      // WEBP identifier
      webpBuffer[8] = 0x57;  // W
      webpBuffer[9] = 0x45;  // E
      webpBuffer[10] = 0x42; // B
      webpBuffer[11] = 0x50; // P
      
      const webpFileWithSlice = {
        type: 'image/webp',
        size: 100000,
        slice: (start, end) => ({
          arrayBuffer: async () => webpBuffer.slice(start, end).buffer
        })
      };
      
      await assert.doesNotReject(() => api._validateImageFile(webpFileWithSlice));
    });

    test('should sanitize search input correctly', () => {
      api = new OpenFoodFactsAPI();
      
      // Test normal input
      assert.strictEqual(api._sanitizeSearchInput('chocolate'), 'chocolate');
      
      // Test input with dangerous characters
      assert.strictEqual(
        api._sanitizeSearchInput('<script>alert("xss")</script>Chocolate'),
        '&#x3C;script&#x3E;alert(&#x22;xss&#x22;)&#x3C;/script&#x3E;Chocolate'
      );
      
      // Test input with quotes and ampersands
      assert.strictEqual(
        api._sanitizeSearchInput('Ben & Jerry\'s "Chunky Monkey"'),
        'Ben &#x26; Jerry&#x27;s &#x22;Chunky Monkey&#x22;'
      );
      
      // Test long input truncation
      const longInput = 'a'.repeat(150);
      const result = api._sanitizeSearchInput(longInput);
      assert.strictEqual(result.length, 100);
      
      // Test whitespace trimming
      assert.strictEqual(api._sanitizeSearchInput('  chocolate  '), 'chocolate');
      
      // Test non-string input
      assert.throws(
        () => api._sanitizeSearchInput(123),
        { message: 'Search input must be a string' }
      );
    });

    test('should create request headers correctly', () => {
      api = new OpenFoodFactsAPI();
      
      const headers = api._createRequestHeaders();
      assert.deepStrictEqual(headers, {
        'User-Agent': 'node-red-contrib-open-food-facts/0.2.2'
      });
    });

    test('should validate setCredentials input', () => {
      api = new OpenFoodFactsAPI();
      
      // Test valid credentials
      assert.doesNotThrow(() => api.setCredentials('user', 'pass'));
      
      // Test non-string inputs
      assert.throws(
        () => api.setCredentials(123, 'pass'),
        { message: 'User ID and password must be strings' }
      );
      
      assert.throws(
        () => api.setCredentials('user', 456),
        { message: 'User ID and password must be strings' }
      );
      
      // Test empty inputs
      assert.throws(
        () => api.setCredentials('', 'pass'),
        { message: 'User ID and password cannot be empty' }
      );
      
      assert.throws(
        () => api.setCredentials('user', ''),
        { message: 'User ID and password cannot be empty' }
      );
      
      // Test whitespace-only inputs
      assert.throws(
        () => api.setCredentials('   ', 'pass'),
        { message: 'User ID and password cannot be empty' }
      );
      
      assert.throws(
        () => api.setCredentials('user', '   '),
        { message: 'User ID and password cannot be empty' }
      );
    });
  });

  // Test Error Cases Integration
  describe('Error Cases Integration', () => {
    test('should reject invalid barcodes in getProduct', async () => {
      api = new OpenFoodFactsAPI();
      
      await assert.rejects(
        async () => await api.getProduct(123456789),
        { message: 'Barcode must be a string' }
      );
      
      await assert.rejects(
        async () => await api.getProduct('abc123'),
        { message: 'Invalid barcode format. Must be 8-13 digits.' }
      );
    });

    test('should reject invalid barcodes in addProduct', async () => {
      api = new OpenFoodFactsAPI();
      api.setCredentials('user', 'pass');
      
      await assert.rejects(
        async () => await api.addProduct({ code: 'invalid' }),
        { message: 'Invalid barcode format. Must be 8-13 digits.' }
      );
    });

    test('should reject invalid files in uploadPhoto', async () => {
      api = new OpenFoodFactsAPI();
      api.setCredentials('user', 'pass');
      
      // Test invalid file type
      const invalidFile = { type: 'text/plain', size: 1024 };
      await assert.rejects(
        async () => await api.uploadPhoto('123456789', invalidFile, { field: 'front', languageCode: 'en' }),
        { message: 'Invalid file type. Only JPEG, PNG, and WebP images are allowed.' }
      );
      
      // Test oversized file
      const largeFile = { type: 'image/jpeg', size: 11 * 1024 * 1024 };
      await assert.rejects(
        async () => await api.uploadPhoto('123456789', largeFile, { field: 'front', languageCode: 'en' }),
        { message: 'File size too large. Maximum size is 10MB.' }
      );
      
      // Test invalid field type
      const validFile = { type: 'image/jpeg', size: 1024 };
      await assert.rejects(
        async () => await api.uploadPhoto('123456789', validFile, { field: 'invalid', languageCode: 'en' }),
        { message: 'Invalid field type. Must be front, ingredients, or nutrition.' }
      );
      
      // Test missing type parameter
      await assert.rejects(
        async () => await api.uploadPhoto('123456789', validFile, {}),
        { message: 'Type with field and languageCode is required' }
      );
    });

    test('should sanitize search inputs in searchProducts', async () => {
      api = new OpenFoodFactsAPI();
      mockSuccessResponse({ products: [] });
      
      await api.searchProducts({
        search_terms: '<script>alert("xss")</script>Chocolate'
      });
      
      const url = new URL(global.fetch.mock.calls[0].arguments[0]);
      assert.strictEqual(url.searchParams.get('search_terms'), '&#x3C;script&#x3E;alert(&#x22;xss&#x22;)&#x3C;/script&#x3E;Chocolate');
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
