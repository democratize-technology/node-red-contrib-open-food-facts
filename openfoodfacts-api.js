/**
 * OpenFoodFacts API client for Node-RED
 * A client library for interacting with the Open Food Facts API
 */

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
   * @param {string} [baseUrl='https://world.openfoodfacts.org'] - Base URL for the API
   */
  constructor(baseUrl = 'https://world.openfoodfacts.org') {
    this.baseUrl = baseUrl;
    this.credentials = null;
  }

  /**
   * Sets user credentials for authenticated requests
   * @param {string} userId - Open Food Facts user ID
   * @param {string} password - Open Food Facts password
   */
  setCredentials(userId, password) {
    this.credentials = { userId, password };
  }

  /**
   * Fetches product details by barcode
   * @param {string} barcode - Product barcode
   * @returns {Promise<Object>} Product details
   */
  async getProduct(barcode) {
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
        queryParams.append('search_terms', params.search_terms);
      }

      // Handle code search with different matching types
      if (params.code) {
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

    try {
      const formData = new FormData();
      formData.append('code', data.code);
      if (data.brands) formData.append('brands', data.brands);
      if (data.labels) formData.append('labels', data.labels);

      const response = await fetch(`${this.baseUrl}/cgi/product_jqm2.pl`, {
        method: 'POST',
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

    try {
      const formData = new FormData();
      formData.append('code', barcode);
      formData.append('imagefield', `${type.field}_${type.languageCode}`);
      formData.append(`imgupload_${type.field}_${type.languageCode}`, image);

      const response = await fetch(`${this.baseUrl}/cgi/product_image_upload.pl`, {
        method: 'POST',
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
