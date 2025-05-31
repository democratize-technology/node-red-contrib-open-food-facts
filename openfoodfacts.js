const { retry, handleType, ExponentialBackoff } = require('cockatiel');
const { OpenFoodFactsAPI, OpenFoodFactsError } = require('./openfoodfacts-api');

module.exports = function (RED) {
  const client = new OpenFoodFactsAPI();

  /**
   * OFF getProduct node
   */
  function OffGetProductNode(config) {
    RED.nodes.createNode(this, config);
    const node = this;

    node.on('input', async function (msg) {
      try {
        const productId = config.productId || msg.payload.productId;
        if (!productId) {
          node.error('No productId provided', msg);
          return;
        }

        const payload = await client.getProduct(productId);
        node.send({ ...msg, payload });
      } catch (error) {
        node.error(error.message, msg);
      }
    });
  }
  RED.nodes.registerType('openfoodfacts-get-product', OffGetProductNode);

  /**
   * OFF SearchProducts node
   */
  function OffSearchProductsNode(config) {
    RED.nodes.createNode(this, config);
    const node = this;

    node.on('input', async function (msg) {
      try {
        const searchParams = msg.payload.searchParams || config.searchParams;
        if (!searchParams) {
          node.error('No searchParams provided', msg);
          return;
        }

        const payload = await retry(handleType(OpenFoodFactsError), {
          maxAttempts: 3,
          backoff: new ExponentialBackoff(),
        }).execute(() => client.searchProducts(JSON.parse(searchParams)));

        node.send({ ...msg, payload });
      } catch (error) {
        node.error(error.message, msg);
      }
    });
  }
  RED.nodes.registerType('openfoodfacts-search-products', OffSearchProductsNode);

  /**
   * OFF GetTaxonomy node
   */
  function OffGetTaxonomyNode(config) {
    RED.nodes.createNode(this, config);
    const node = this;

    node.on('input', async function (msg) {
      try {
        const taxonomy = config.taxonomy || msg.payload.taxonomy;
        if (!taxonomy) {
          node.error('No taxonomy provided', msg);
          return;
        }

        const payload = await client.getTaxonomy(taxonomy);
        node.send({ ...msg, payload });
      } catch (error) {
        node.error(error.message, msg);
      }
    });
  }
  RED.nodes.registerType('openfoodfacts-get-taxonomy', OffGetTaxonomyNode);

  /**
   * OFF Add Product node
   */
  function OffAddProductNode(config) {
    RED.nodes.createNode(this, config);
    const node = this;

    node.on('input', async function (msg) {
      const data = msg.payload || {};

      // Check for credentials
      if (!config.credentials || !config.credentials.username || !config.credentials.password) {
        node.error('Credentials required for adding products', msg);
        return;
      }

      // Set credentials
      client.setCredentials(config.credentials.username, config.credentials.password);

      if (!data.code) {
        node.error('Product code is required', msg);
        return;
      }

      try {
        const payload = await client.addProduct(data);
        node.send({ ...msg, payload });
      } catch (error) {
        node.error(error.message, msg);
      }
    });
  }
  RED.nodes.registerType('openfoodfacts-add-product', OffAddProductNode, {
    credentials: {
      username: { type: 'text' },
      password: { type: 'password' },
    },
  });

  /**
   * OFF Upload Photo node
   */
  function OffUploadPhotoNode(config) {
    RED.nodes.createNode(this, config);
    const node = this;

    node.on('input', async function (msg) {
      const { barcode, image, type } = msg.payload || {};

      // Check for credentials
      if (!config.credentials || !config.credentials.username || !config.credentials.password) {
        node.error('Credentials required for uploading photos', msg);
        return;
      }

      // Set credentials
      client.setCredentials(config.credentials.username, config.credentials.password);

      if (!barcode || !image || !type || !type.field || !type.languageCode) {
        node.error('Missing required parameters: barcode, image, type.field, or type.languageCode', msg);
        return;
      }

      try {
        const payload = await client.uploadPhoto(barcode, image, type);
        node.send({ ...msg, payload });
      } catch (error) {
        node.error(error.message, msg);
      }
    });
  }
  RED.nodes.registerType('openfoodfacts-upload-photo', OffUploadPhotoNode, {
    credentials: {
      username: { type: 'text' },
      password: { type: 'password' },
    },
  });

  /**
   * OFF Get Additives node
   */
  function OffGetAdditivesNode(config) {
    RED.nodes.createNode(this, config);
    const node = this;

    node.on('input', async function (msg) {
      try {
        const payload = await client.getAdditives();
        node.send({ ...msg, payload });
      } catch (error) {
        node.error(error.message, msg);
      }
    });
  }
  RED.nodes.registerType('openfoodfacts-get-additives', OffGetAdditivesNode);

  /**
   * OFF Get Allergens node
   */
  function OffGetAllergensNode(config) {
    RED.nodes.createNode(this, config);
    const node = this;

    node.on('input', async function (msg) {
      try {
        const payload = await client.getAllergens();
        node.send({ ...msg, payload });
      } catch (error) {
        node.error(error.message, msg);
      }
    });
  }
  RED.nodes.registerType('openfoodfacts-get-allergens', OffGetAllergensNode);

  /**
   * OFF Get Brands node
   */
  function OffGetBrandsNode(config) {
    RED.nodes.createNode(this, config);
    const node = this;

    node.on('input', async function (msg) {
      try {
        const payload = await client.getBrands();
        node.send({ ...msg, payload });
      } catch (error) {
        node.error(error.message, msg);
      }
    });
  }
  RED.nodes.registerType('openfoodfacts-get-brands', OffGetBrandsNode);

  /**
   * OFF Get Random Insight node
   */
  function OffGetRandomInsightNode(config) {
    RED.nodes.createNode(this, config);
    const node = this;

    node.on('input', async function (msg) {
      const count = msg.payload?.count || config.count || 1;
      const lang = msg.payload?.lang || config.lang;

      try {
        const payload = await client.getRandomInsight(count, lang);
        node.send({ ...msg, payload });
      } catch (error) {
        node.error(error.message, msg);
      }
    });
  }
  RED.nodes.registerType('openfoodfacts-get-random-insight', OffGetRandomInsightNode);
};
