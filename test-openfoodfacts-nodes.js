const { test, describe } = require('node:test');
const assert = require('node:assert');
const helper = require('node-red-node-test-helper');
const offNodes = require('./openfoodfacts.js');

helper.init(require.resolve('node-red'));

describe('OpenFoodFacts Node-RED Nodes', function() {
    
    test('should register all node types', function(done) {
        const flow = [
            { id: "n1", type: "openfoodfacts-get-product", name: "test-get-product" },
            { id: "n2", type: "openfoodfacts-search-products", name: "test-search" },
            { id: "n3", type: "openfoodfacts-get-taxonomy", name: "test-taxonomy" },
            { id: "n4", type: "openfoodfacts-add-product", name: "test-add" },
            { id: "n5", type: "openfoodfacts-upload-photo", name: "test-upload" },
            { id: "n6", type: "openfoodfacts-get-additives", name: "test-additives" },
            { id: "n7", type: "openfoodfacts-get-allergens", name: "test-allergens" },
            { id: "n8", type: "openfoodfacts-get-brands", name: "test-brands" },
            { id: "n9", type: "openfoodfacts-get-random-insight", name: "test-insight" }
        ];
        
        helper.startServer(function() {
            helper.load(offNodes, flow, function() {
                try {
                    const n1 = helper.getNode("n1");
                    const n2 = helper.getNode("n2");
                    const n3 = helper.getNode("n3");
                    const n4 = helper.getNode("n4");
                    const n5 = helper.getNode("n5");
                    const n6 = helper.getNode("n6");
                    const n7 = helper.getNode("n7");
                    const n8 = helper.getNode("n8");
                    const n9 = helper.getNode("n9");
                    
                    assert.ok(n1, 'get-product node should be loaded');
                    assert.ok(n2, 'search-products node should be loaded');
                    assert.ok(n3, 'get-taxonomy node should be loaded');
                    assert.ok(n4, 'add-product node should be loaded');
                    assert.ok(n5, 'upload-photo node should be loaded');
                    assert.ok(n6, 'get-additives node should be loaded');
                    assert.ok(n7, 'get-allergens node should be loaded');
                    assert.ok(n8, 'get-brands node should be loaded');
                    assert.ok(n9, 'get-random-insight node should be loaded');
                    
                    assert.strictEqual(n1.name, 'test-get-product');
                    assert.strictEqual(n2.name, 'test-search');
                    assert.strictEqual(n3.name, 'test-taxonomy');
                    
                    helper.unload();
                    helper.stopServer(done);
                } catch (error) {
                    helper.unload();
                    helper.stopServer(() => done(error));
                }
            });
        });
    });

    test('get-product should error when no productId provided', function(done) {
        const flow = [
            { id: "n1", type: "openfoodfacts-get-product", wires: [["n2"]] },
            { id: "n2", type: "helper" }
        ];
        
        helper.startServer(function() {
            helper.load(offNodes, flow, function() {
                try {
                    const n1 = helper.getNode("n1");
                    let errorReceived = false;
                    
                    n1.on("call:error", function(msg) {
                        errorReceived = true;
                        assert.ok(msg[0].includes('No productId provided'));
                        helper.unload();
                        helper.stopServer(done);
                    });
                    
                    n1.receive({ payload: {} });
                    
                    setTimeout(() => {
                        if (!errorReceived) {
                            helper.unload();
                            helper.stopServer(() => done(new Error('Expected error not received')));
                        }
                    }, 500);
                } catch (error) {
                    helper.unload();
                    helper.stopServer(() => done(error));
                }
            });
        });
    });

    test('search-products should error when no searchParams provided', function(done) {
        const flow = [
            { id: "n1", type: "openfoodfacts-search-products", wires: [["n2"]] },
            { id: "n2", type: "helper" }
        ];
        
        helper.startServer(function() {
            helper.load(offNodes, flow, function() {
                try {
                    const n1 = helper.getNode("n1");
                    let errorReceived = false;
                    
                    n1.on("call:error", function(msg) {
                        errorReceived = true;
                        assert.ok(msg[0].includes('No searchParams provided'));
                        helper.unload();
                        helper.stopServer(done);
                    });
                    
                    n1.receive({ payload: {} });
                    
                    setTimeout(() => {
                        if (!errorReceived) {
                            helper.unload();
                            helper.stopServer(() => done(new Error('Expected error not received')));
                        }
                    }, 500);
                } catch (error) {
                    helper.unload();
                    helper.stopServer(() => done(error));
                }
            });
        });
    });

    test('add-product should error when no credentials provided', function(done) {
        const flow = [
            { id: "n1", type: "openfoodfacts-add-product", wires: [["n2"]] },
            { id: "n2", type: "helper" }
        ];
        
        helper.startServer(function() {
            helper.load(offNodes, flow, function() {
                try {
                    const n1 = helper.getNode("n1");
                    let errorReceived = false;
                    
                    n1.on("call:error", function(msg) {
                        errorReceived = true;
                        assert.ok(msg[0].includes('Credentials required'));
                        helper.unload();
                        helper.stopServer(done);
                    });
                    
                    n1.receive({ payload: { code: "123456789" } });
                    
                    setTimeout(() => {
                        if (!errorReceived) {
                            helper.unload();
                            helper.stopServer(() => done(new Error('Expected error not received')));
                        }
                    }, 500);
                } catch (error) {
                    helper.unload();
                    helper.stopServer(() => done(error));
                }
            });
        });
    });

    test('get-product should use config productId when msg.payload.productId not provided', function(done) {
        const flow = [
            { id: "n1", type: "openfoodfacts-get-product", productId: "3017620422003", wires: [["n2"]] },
            { id: "n2", type: "helper" }
        ];
        
        helper.startServer(function() {
            helper.load(offNodes, flow, function() {
                try {
                    const n1 = helper.getNode("n1");
                    const n2 = helper.getNode("n2");
                    let responseReceived = false;
                    
                    n2.on("input", function(msg) {
                        responseReceived = true;
                        assert.ok(msg.payload, 'Should have payload');
                        helper.unload();
                        helper.stopServer(done);
                    });
                    
                    n1.on("call:error", function(msg) {
                        helper.unload();
                        helper.stopServer(() => done(new Error('Unexpected error: ' + msg[0])));
                    });
                    
                    n1.receive({ payload: {} });
                    
                    setTimeout(() => {
                        if (!responseReceived) {
                            helper.unload();
                            helper.stopServer(() => done(new Error('Expected response not received')));
                        }
                    }, 5000);
                } catch (error) {
                    helper.unload();
                    helper.stopServer(() => done(error));
                }
            });
        });
    });

    test('nodes should preserve original message properties', function(done) {
        const flow = [
            { id: "n1", type: "openfoodfacts-get-additives", wires: [["n2"]] },
            { id: "n2", type: "helper" }
        ];
        
        helper.startServer(function() {
            helper.load(offNodes, flow, function() {
                try {
                    const n1 = helper.getNode("n1");
                    const n2 = helper.getNode("n2");
                    let responseReceived = false;
                    
                    n2.on("input", function(msg) {
                        responseReceived = true;
                        assert.strictEqual(msg.topic, 'test-topic');
                        assert.strictEqual(msg.customProp, 'custom-value');
                        assert.ok(msg.payload, 'Should have payload');
                        helper.unload();
                        helper.stopServer(done);
                    });
                    
                    n1.on("call:error", function(msg) {
                        helper.unload();
                        helper.stopServer(() => done(new Error('Unexpected error: ' + msg[0])));
                    });
                    
                    n1.receive({ 
                        topic: 'test-topic',
                        customProp: 'custom-value',
                        payload: {}
                    });
                    
                    setTimeout(() => {
                        if (!responseReceived) {
                            helper.unload();
                            helper.stopServer(() => done(new Error('Expected response not received')));
                        }
                    }, 5000);
                } catch (error) {
                    helper.unload();
                    helper.stopServer(() => done(error));
                }
            });
        });
    });
});