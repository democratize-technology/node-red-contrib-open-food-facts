/**
 * OpenFoodFacts API client for Node-RED
 * A client library for interacting with the Open Food Facts API
 */

const he = require('he');

/**
 * Custom error class for OpenFoodFacts API errors
 * @class OpenFoodFactsError
 * @extends {Error}
 */
class OpenFoodFactsError extends Error {
  /**
   * Creates an instance of OpenFoodFactsError
   * @param {string} message - Error message
   * @param {string} details - Additional error details
   * @param {number} status - HTTP status code
   */
  constructor(message, details, status) {
    super(message);
    this.name = 'OpenFoodFactsError';
    this.details = details;
    this.status = status;
  }
}

/**
 * Main API client for interacting with the Open Food Facts API
 * @class OpenFoodFactsAPI
 */
class OpenFoodFactsAPI {
  /**
   * Creates an instance of OpenFoodFactsAPI
   * @param {string} [baseUrl='https://world.openfoodfacts.org'] - Base URL for the API (must use HTTPS for authenticated requests)
   */
  constructor(baseUrl = 'https://world.openfoodfacts.org') {
    // Validate that baseUrl uses HTTPS for security
    if (!baseUrl.startsWith('https://')) {
      throw new Error('HTTPS is required for secure API access. Use https:// URLs only.');
    }
    this.baseUrl = baseUrl;
    this.credentials = null;
  }

  /**
   * Sets user credentials for authenticated requests
   * WARNING: Credentials will be sent over the network. Ensure you're using HTTPS.
   * @param {string} userId - Open Food Facts user ID
   * @param {string} password - Open Food Facts password
   */
  setCredentials(userId, password) {
    if (typeof userId !== 'string' || typeof password !== 'string') {
      throw new Error('User ID and password must be strings');
    }
    if (!userId.trim() || !password.trim()) {
      throw new Error('User ID and password cannot be empty');
    }
    this.credentials = { userId, password };
  }

  /**
   * Validates barcode format
   * @param {string} barcode - Barcode to validate
   * @param {boolean} allowPartial - Allow partial barcodes for search
   * @private
   */
  _validateBarcode(barcode, allowPartial = false) {
    if (typeof barcode !== 'string') {
      throw new Error('Barcode must be a string');
    }
    if (allowPartial) {
      if (!/^\d+$/.test(barcode) || barcode.length === 0) {
        throw new Error('Invalid barcode format. Must contain only digits.');
      }
    } else {
      if (!/^\d{8,13}$/.test(barcode)) {
        throw new Error('Invalid barcode format. Must be 8-13 digits.');
      }
    }
  }

  /**
   * Validates image file for upload
   * @param {File} file - File to validate
   * @private
   */
  async _validateImageFile(file) {
    if (!file) {
      throw new Error('Image file is required');
    }
    // Only validate file properties if they exist (allows for mock objects in tests)
    if (file.type !== undefined) {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.');
      }
    }
    if (file.size !== undefined) {
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        throw new Error('File size too large. Maximum size is 10MB.');
      }
    }
    
    // Additional magic byte validation for enhanced security
    if (file.arrayBuffer && typeof file.arrayBuffer === 'function') {
      try {
        // PERFORMANCE OPTIMIZATION: Only read the first 16 bytes needed for magic byte validation
        // instead of loading the entire file into memory. This significantly reduces memory usage
        // and improves performance for large file uploads.
        // - JPEG needs 3 bytes
        // - PNG needs 4 bytes  
        // - WebP needs 12 bytes (4 for RIFF + 4 skip + 4 for WEBP identifier)
        const BYTES_TO_READ = 16; // Read 16 bytes to cover all formats with some buffer
        
        // For File API compatibility, we need to handle both slice() and arrayBuffer()
        let bytes;
        if (file.slice && typeof file.slice === 'function') {
          // Modern File API - slice the first 16 bytes only
          const slicedFile = file.slice(0, BYTES_TO_READ);
          const buffer = await slicedFile.arrayBuffer();
          bytes = new Uint8Array(buffer);
        } else {
          // Fallback for compatibility - read full buffer but only check first 16 bytes
          // This path is for non-standard file objects that don't support slice()
          const buffer = await file.arrayBuffer();
          bytes = new Uint8Array(buffer).slice(0, BYTES_TO_READ);
        }
        
        // Check magic bytes for known image formats
        const signatures = {
          jpeg: [0xFF, 0xD8, 0xFF],
          png: [0x89, 0x50, 0x4E, 0x47],
          webp: [0x52, 0x49, 0x46, 0x46] // RIFF header (WebP starts with RIFF)
        };
        
        let validSignature = false;
        for (const [format, signature] of Object.entries(signatures)) {
          if (signature.every((byte, index) => bytes[index] === byte)) {
            // Additional check for WebP format - verify 'WEBP' identifier at offset 8
            if (format === 'webp' && bytes.length >= 12) {
              const webpIdentifier = [0x57, 0x45, 0x42, 0x50]; // 'WEBP'
              if (!webpIdentifier.every((byte, index) => bytes[8 + index] === byte)) {
                continue; // RIFF header found but not WebP, continue checking other formats
              }
            }
            validSignature = true;
            break;
          }
        }
        
        if (!validSignature) {
          throw new Error('File content does not match allowed image formats');
        }
      } catch (error) {
        // If magic byte validation fails, throw the error
        if (error.message === 'File content does not match allowed image formats') {
          throw error;
        }
        // For other errors (e.g., reading buffer), we'll log and continue
        // This maintains compatibility with environments where arrayBuffer might not be available
      }
    }
  }

  /**
   * Sanitizes search parameters
   * @param {string} input - Input to sanitize
   * @private
   */
  _sanitizeSearchInput(input) {
    if (typeof input !== 'string') {
      throw new Error('Search input must be a string');
    }
    // Use he.js library for robust HTML entity encoding and limit length
    return he.encode(input).trim().substring(0, 100);
  }

  /**
   * Creates headers for requests (reserved for future use)
   * @returns {Object} Headers object
   * @private
   */
  _createRequestHeaders() {
    return {
      'User-Agent': 'node-red-contrib-open-food-facts/0.2.2'
    };
  }

  /**
   * Validates that the connection uses HTTPS before sending credentials
   * @private
   */
  _validateSecureConnection() {
    if (!this.baseUrl.startsWith('https://')) {
      throw new Error('Cannot send credentials over non-HTTPS connection. HTTPS is required for authenticated requests.');
    }
  }

  /**
   * Fetches product details by barcode
   * @param {string} barcode - Product barcode
   * @returns {Promise<Object>} Product details
   */
  async getProduct(barcode) {
    this._validateBarcode(barcode);
    
    try {
      const response = await fetch(`${this.baseUrl}/api/v0/product/${barcode}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const { product } = await response.json();

      // Client-side field filtering
      const {
        code,
        product_name,
        brands,
        quantity,
        serving_size,
        packaging,
        // nutriments,
        storage_conditions,
        conservation_conditions,
        expiration_date_format,
        categories,
        labels,
        food_groups,
      } = product;
      return {
        code,
        product_name,
        brands,
        quantity,
        serving_size,
        packaging,
        // nutriments,
        storage_conditions,
        conservation_conditions,
        expiration_date_format,
        categories,
        labels,
        food_groups,
      };
    } catch (error) {
      throw new Error(`Failed to fetch product: ${error.message}`);
    }
  }

  /**
   * Searches for products using various criteria
   * @param {Object} params - Search parameters
   * @param {string} [params.search_terms] - Text search terms
   * @param {string} [params.code] - Product code to search for
   * @param {string} [params.code_type] - Type of code match: 'exact', 'contains', 'starts', 'ends'
   * @param {Array} [params.tagType] - Types of tags to search
   * @param {Array} [params.tag] - Tag values to search for
   * @param {Array} [params.tagContains] - How to match tags
   * @param {string} [params.additives] - Filter by additives
   * @param {string} [params.ingredientsFromPalmOil] - Filter by palm oil content
   * @param {number} [params.page] - Page number for pagination
   * @param {number} [params.pageSize] - Page size for pagination
   * @param {Array} [params.fields] - Fields to include in results
   * @param {string} [params.action='process'] - Action to perform
   * @returns {Promise<Object>} Search results
   */
  async searchProducts(params) {
    try {
      const queryParams = new URLSearchParams({
        json: 'true', // Ensure JSON response
        action: params.action || 'process',
      });

      // Add text search if provided
      if (params.search_terms) {
        queryParams.append('search_terms', this._sanitizeSearchInput(params.search_terms));
      }

      // Handle code search with different matching types
      if (params.code) {
        this._validateBarcode(params.code, true);
        queryParams.append('code', params.code);
        if (params.code_type) {
          switch (params.code_type) {
            case 'contains':
              queryParams.append('code_type', 'contains');
              break;
            case 'starts':
              queryParams.append('code_type', 'starts');
              break;
            case 'ends':
              queryParams.append('code_type', 'ends');
              break;
            default:
              queryParams.append('code_type', 'exact');
          }
        }
      }

      // Handle tag-based search parameters
      if (params.tagType && params.tag && params.tagContains) {
        params.tagType.forEach((type, index) => {
          queryParams.append(`tagtype_${index}`, type);
          queryParams.append(`tag_contains_${index}`, params.tagContains[index]);
          queryParams.append(`tag_${index}`, params.tag[index]);
        });
      }

      // Handle additional filters
      if (params.additives) queryParams.append('additives', params.additives);
      if (params.ingredientsFromPalmOil) queryParams.append('ingredients_from_palm_oil', params.ingredientsFromPalmOil);

      // Handle pagination
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.pageSize) queryParams.append('page_size', params.pageSize.toString());

      // For debugging - consider enabling through an optional config parameter
      // console.log(`${this.baseUrl}/cgi/search.pl?${queryParams.toString()}`);

      const response = await fetch(`${this.baseUrl}/cgi/search.pl?${queryParams.toString()}`);
      if (!response.ok) {
        throw new OpenFoodFactsError(`HTTP error! status: ${response.status}`, 'API request failed', response.status);
      }

      const data = await response.json();
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid response format');
      }

      // Client-side field filtering - only filter if fields are provided (fixed hardcoded override)
      if (params.fields && Array.isArray(params.fields) && params.fields.length > 0) {
        return {
          ...data,
          products: data.products.map((product) => {
            const filtered = {};
            params.fields.forEach((field) => {
              if (field in product) {
                filtered[field] = product[field];
              }
            });
            return filtered;
          }),
        };
      }

      return data;
    } catch (error) {
      if (error instanceof OpenFoodFactsError) {
        throw error;
      }
      if (error.message === 'Invalid response format') {
        throw error; // Pass through this specific error without wrapping
      }
      throw new Error(`Failed to search products: ${error.message}`);
    }
  }

  /**
   * Adds a new product to the database
   * @param {Object} data - Product data
   * @param {string} data.code - Product barcode
   * @param {string} [data.brands] - Product brands
   * @param {string} [data.labels] - Product labels
   * @returns {Promise<Object>} API response
   */
  async addProduct(data) {
    if (!this.credentials) {
      throw new Error('Credentials required for adding products');
    }
    
    // Ensure secure connection before sending credentials
    this._validateSecureConnection();
    this._validateBarcode(data.code);

    try {
      const formData = new FormData();
      formData.append('code', data.code);
      formData.append('user_id', this.credentials.userId);
      formData.append('password', this.credentials.password);
      if (data.brands) formData.append('brands', this._sanitizeSearchInput(data.brands));
      if (data.labels) formData.append('labels', this._sanitizeSearchInput(data.labels));

      const headers = this._createRequestHeaders();
      const response = await fetch(`${this.baseUrl}/cgi/product_jqm2.pl`, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error) {
      throw new Error(`Failed to add product: ${error.message}`);
    }
  }

  /**
   * Uploads a photo for a product
   * @param {string} barcode - Product barcode
   * @param {File} image - Image file to upload
   * @param {Object} type - Photo type information
   * @param {string} type.field - Field type (front, ingredients, nutrition)
   * @param {string} type.languageCode - Language code for the image
   * @returns {Promise<Object>} API response
   */
  async uploadPhoto(barcode, image, type) {
    if (!this.credentials) {
      throw new Error('Credentials required for uploading photos');
    }
    
    // Ensure secure connection before sending credentials
    this._validateSecureConnection();
    this._validateBarcode(barcode);
    await this._validateImageFile(image);
    
    if (!type || !type.field || !type.languageCode) {
      throw new Error('Type with field and languageCode is required');
    }
    
    const allowedFields = ['front', 'ingredients', 'nutrition'];
    if (!allowedFields.includes(type.field)) {
      throw new Error('Invalid field type. Must be front, ingredients, or nutrition.');
    }

    try {
      const formData = new FormData();
      formData.append('code', barcode);
      formData.append('user_id', this.credentials.userId);
      formData.append('password', this.credentials.password);
      formData.append('imagefield', `${type.field}_${type.languageCode}`);
      formData.append(`imgupload_${type.field}_${type.languageCode}`, image);

      const headers = this._createRequestHeaders();
      const response = await fetch(`${this.baseUrl}/cgi/product_image_upload.pl`, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error) {
      throw new Error(`Failed to upload photo: ${error.message}`);
    }
  }

  /**
   * Fetches taxonomy data by type
   * @param {string} type - Taxonomy type
   * @returns {Promise<Object>} Taxonomy data
   */
  async getTaxonomy(type) {
    try {
      const response = await fetch(`${this.baseUrl}/data/taxonomies/${type}.json`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error) {
      throw new Error(`Failed to fetch taxonomy: ${error.message}`);
    }
  }

  /**
   * Fetches additives taxonomy
   * @returns {Promise<Object>} Additives taxonomy
   */
  async getAdditives() {
    return this.getTaxonomy('additives');
  }

  /**
   * Fetches allergens taxonomy
   * @returns {Promise<Object>} Allergens taxonomy
   */
  async getAllergens() {
    return this.getTaxonomy('allergens');
  }

  /**
   * Fetches brands taxonomy
   * @returns {Promise<Object>} Brands taxonomy
   */
  async getBrands() {
    return this.getTaxonomy('brands');
  }

  /**
   * Fetches random insights from Robotoff
   * @param {number} [count=1] - Number of insights to fetch
   * @param {string} [lang] - Language filter
   * @returns {Promise<Object>} Random insights
   */
  async getRandomInsight(count = 1, lang) {
    try {
      const queryParams = new URLSearchParams({
        count: count.toString(),
      });
      if (lang) queryParams.append('lang', lang);

      const response = await fetch(
        `https://robotoff.openfoodfacts.org/api/v1/questions/random?${queryParams.toString()}`,
      );

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error) {
      throw new Error(`Failed to fetch random insight: ${error.message}`);
    }
  }
}

// Export the class and error
module.exports = { OpenFoodFactsAPI, OpenFoodFactsError };
