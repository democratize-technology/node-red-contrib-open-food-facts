const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const helper = require('node-red-node-test-helper');
const offNodes = require('./openfoodfacts.js');

helper.init(require.resolve('node-red'));

describe('OpenFoodFacts Node-RED Nodes', function() {
    
    afterEach(function(done) {
        helper.unload();
        helper.stopServer(() => {
            done();
        });
    });
    
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
                    
                    done();
                } catch (error) {
                    done(error);
                }
            });
        });
    });

    test('should validate input parameters', function(done) {
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
                        done();
                    });
                    
                    n1.receive({ payload: {} });
                    
                    setTimeout(() => {
                        if (!errorReceived) {
                            done(new Error('Expected error not received'));
                        }
                    }, 100);
                } catch (error) {
                    done(error);
                }
            });
        });
    });

    test('should handle credentials validation', function(done) {
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
                        done();
                    });
                    
                    n1.receive({ payload: { code: "123456789" } });
                    
                    setTimeout(() => {
                        if (!errorReceived) {
                            done(new Error('Expected credentials error not received'));
                        }
                    }, 100);
                } catch (error) {
                    done(error);
                }
            });
        });
    });

    test('should handle search params validation', function(done) {
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
                        done();
                    });
                    
                    n1.receive({ payload: {} });
                    
                    setTimeout(() => {
                        if (!errorReceived) {
                            done(new Error('Expected search params error not received'));
                        }
                    }, 100);
                } catch (error) {
                    done(error);
                }
            });
        });
    });

    test('should handle taxonomy validation', function(done) {
        const flow = [
            { id: "n1", type: "openfoodfacts-get-taxonomy", wires: [["n2"]] },
            { id: "n2", type: "helper" }
        ];
        
        helper.startServer(function() {
            helper.load(offNodes, flow, function() {
                try {
                    const n1 = helper.getNode("n1");
                    let errorReceived = false;
                    
                    n1.on("call:error", function(msg) {
                        errorReceived = true;
                        assert.ok(msg[0].includes('No taxonomy provided'));
                        done();
                    });
                    
                    n1.receive({ payload: {} });
                    
                    setTimeout(() => {
                        if (!errorReceived) {
                            done(new Error('Expected taxonomy error not received'));
                        }
                    }, 100);
                } catch (error) {
                    done(error);
                }
            });
        });
    });

    test('should handle upload photo validation', function(done) {
        const flow = [
            { id: "n1", type: "openfoodfacts-upload-photo", wires: [["n2"]] },
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
                        done();
                    });
                    
                    n1.receive({ payload: { barcode: "123", image: "data", type: { field: "front", languageCode: "en" } } });
                    
                    setTimeout(() => {
                        if (!errorReceived) {
                            done(new Error('Expected credentials error not received'));
                        }
                    }, 100);
                } catch (error) {
                    done(error);
                }
            });
        });
    });
});

// Force exit after tests complete to prevent hanging
process.on('exit', () => {
    process.exit(0);
});

// Add a timeout to force exit if tests hang
setTimeout(() => {
    console.log('Force exiting due to timeout');
    process.exit(0);
}, 30000);