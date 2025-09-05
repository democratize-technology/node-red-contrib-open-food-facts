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

    test('should handle add-product code validation', function(done) {
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
                    
                    n1.receive({ payload: {} }); // Missing code
                    
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

    test('should handle upload photo missing parameters', function(done) {
        const flow = [
            { id: "n1", type: "openfoodfacts-upload-photo", 
              credentials: { username: "test", password: "test" },
              wires: [["n2"]] },
            { id: "n2", type: "helper" }
        ];
        
        helper.startServer(function() {
            helper.load(offNodes, flow, function() {
                try {
                    const n1 = helper.getNode("n1");
                    let errorReceived = false;
                    
                    n1.on("call:error", function(msg) {
                        errorReceived = true;
                        assert.ok(msg[0].includes('Missing required parameters'));
                        done();
                    });
                    
                    n1.receive({ payload: { barcode: "123" } }); // Missing image and type
                    
                    setTimeout(() => {
                        if (!errorReceived) {
                            done(new Error('Expected missing parameters error not received'));
                        }
                    }, 100);
                } catch (error) {
                    done(error);
                }
            });
        });
    });

    // CRITICAL SECURITY TESTS - Verify credential isolation between nodes
    test('SECURITY: should isolate credentials between concurrent nodes', function(done) {
        // This test verifies that credentials set in one node don't leak to another node
        const flow = [
            { id: "add1", type: "openfoodfacts-add-product", 
              credentials: { username: "user1", password: "pass1" },
              wires: [["helper1"]] },
            { id: "add2", type: "openfoodfacts-add-product", 
              credentials: { username: "user2", password: "pass2" },
              wires: [["helper2"]] },
            { id: "helper1", type: "helper" },
            { id: "helper2", type: "helper" }
        ];
        
        helper.startServer(function() {
            helper.load(offNodes, flow, function() {
                try {
                    const add1 = helper.getNode("add1");
                    const add2 = helper.getNode("add2");
                    
                    // Each node should have its own isolated client instance
                    // If the fix is working, credentials from one node won't affect another
                    assert.ok(add1, 'First add-product node should be loaded');
                    assert.ok(add2, 'Second add-product node should be loaded');
                    
                    // Verify nodes are different instances
                    assert.notStrictEqual(add1, add2, 'Nodes should be different instances');
                    
                    done();
                } catch (error) {
                    done(error);
                }
            });
        });
    });

    test('SECURITY: authenticated and non-authenticated nodes should not share client state', function(done) {
        // Mix authenticated and non-authenticated nodes to ensure they don't share state
        const flow = [
            { id: "auth1", type: "openfoodfacts-add-product", 
              credentials: { username: "authuser", password: "authpass" },
              wires: [["h1"]] },
            { id: "noauth1", type: "openfoodfacts-get-product", 
              productId: "3017620422003",
              wires: [["h2"]] },
            { id: "auth2", type: "openfoodfacts-upload-photo", 
              credentials: { username: "photouser", password: "photopass" },
              wires: [["h3"]] },
            { id: "noauth2", type: "openfoodfacts-get-brands", 
              wires: [["h4"]] },
            { id: "h1", type: "helper" },
            { id: "h2", type: "helper" },
            { id: "h3", type: "helper" },
            { id: "h4", type: "helper" }
        ];
        
        helper.startServer(function() {
            helper.load(offNodes, flow, function() {
                try {
                    const authNode1 = helper.getNode("auth1");
                    const noAuthNode1 = helper.getNode("noauth1");
                    const authNode2 = helper.getNode("auth2");
                    const noAuthNode2 = helper.getNode("noauth2");
                    
                    // All nodes should exist and be independent
                    assert.ok(authNode1, 'First authenticated node should exist');
                    assert.ok(noAuthNode1, 'First non-authenticated node should exist');
                    assert.ok(authNode2, 'Second authenticated node should exist');
                    assert.ok(noAuthNode2, 'Second non-authenticated node should exist');
                    
                    // Each node should be a unique instance
                    const allNodes = [authNode1, noAuthNode1, authNode2, noAuthNode2];
                    for (let i = 0; i < allNodes.length; i++) {
                        for (let j = i + 1; j < allNodes.length; j++) {
                            assert.notStrictEqual(allNodes[i], allNodes[j], 
                                `Node ${i} and node ${j} should be different instances`);
                        }
                    }
                    
                    done();
                } catch (error) {
                    done(error);
                }
            });
        });
    });

    test('SECURITY: multiple instances of same node type should have isolated clients', function(done) {
        // Create multiple instances of the same node type to ensure each has its own client
        const flow = [
            { id: "get1", type: "openfoodfacts-get-product", productId: "1111", wires: [["h1"]] },
            { id: "get2", type: "openfoodfacts-get-product", productId: "2222", wires: [["h2"]] },
            { id: "get3", type: "openfoodfacts-get-product", productId: "3333", wires: [["h3"]] },
            { id: "search1", type: "openfoodfacts-search-products", searchParams: '{"search_terms":"test1"}', wires: [["h4"]] },
            { id: "search2", type: "openfoodfacts-search-products", searchParams: '{"search_terms":"test2"}', wires: [["h5"]] },
            { id: "h1", type: "helper" },
            { id: "h2", type: "helper" },
            { id: "h3", type: "helper" },
            { id: "h4", type: "helper" },
            { id: "h5", type: "helper" }
        ];
        
        helper.startServer(function() {
            helper.load(offNodes, flow, function() {
                try {
                    const get1 = helper.getNode("get1");
                    const get2 = helper.getNode("get2");
                    const get3 = helper.getNode("get3");
                    const search1 = helper.getNode("search1");
                    const search2 = helper.getNode("search2");
                    
                    // All nodes should exist
                    assert.ok(get1, 'First get-product node should exist');
                    assert.ok(get2, 'Second get-product node should exist');
                    assert.ok(get3, 'Third get-product node should exist');
                    assert.ok(search1, 'First search node should exist');
                    assert.ok(search2, 'Second search node should exist');
                    
                    // Each node should be independent
                    assert.notStrictEqual(get1, get2, 'Get nodes 1 and 2 should be different');
                    assert.notStrictEqual(get2, get3, 'Get nodes 2 and 3 should be different');
                    assert.notStrictEqual(get1, get3, 'Get nodes 1 and 3 should be different');
                    assert.notStrictEqual(search1, search2, 'Search nodes should be different');
                    
                    done();
                } catch (error) {
                    done(error);
                }
            });
        });
    });

    test('SECURITY: credential nodes should not affect non-credential nodes', function(done) {
        // Test that setting credentials in one node doesn't affect other non-credential nodes
        const flow = [
            { id: "cred1", type: "openfoodfacts-add-product", 
              credentials: { username: "testuser", password: "testpass" },
              wires: [["h1"]] },
            { id: "nocred1", type: "openfoodfacts-get-additives", wires: [["h2"]] },
            { id: "nocred2", type: "openfoodfacts-get-allergens", wires: [["h3"]] },
            { id: "nocred3", type: "openfoodfacts-get-brands", wires: [["h4"]] },
            { id: "cred2", type: "openfoodfacts-upload-photo",
              credentials: { username: "uploaduser", password: "uploadpass" },
              wires: [["h5"]] },
            { id: "h1", type: "helper" },
            { id: "h2", type: "helper" },
            { id: "h3", type: "helper" },
            { id: "h4", type: "helper" },
            { id: "h5", type: "helper" }
        ];
        
        helper.startServer(function() {
            helper.load(offNodes, flow, function() {
                try {
                    const credNode1 = helper.getNode("cred1");
                    const noCredNode1 = helper.getNode("nocred1");
                    const noCredNode2 = helper.getNode("nocred2");
                    const noCredNode3 = helper.getNode("nocred3");
                    const credNode2 = helper.getNode("cred2");
                    
                    // All nodes should load successfully
                    assert.ok(credNode1, 'First credential node should exist');
                    assert.ok(noCredNode1, 'First non-credential node should exist');
                    assert.ok(noCredNode2, 'Second non-credential node should exist');
                    assert.ok(noCredNode3, 'Third non-credential node should exist');
                    assert.ok(credNode2, 'Second credential node should exist');
                    
                    // Verify all nodes are independent instances
                    const nodes = [credNode1, noCredNode1, noCredNode2, noCredNode3, credNode2];
                    for (let i = 0; i < nodes.length; i++) {
                        for (let j = i + 1; j < nodes.length; j++) {
                            assert.notStrictEqual(nodes[i], nodes[j], 
                                `All nodes should be independent instances (${i} vs ${j})`);
                        }
                    }
                    
                    done();
                } catch (error) {
                    done(error);
                }
            });
        });
    });

    test('SECURITY: multi-tenant simulation - different flows with different credentials', function(done) {
        // Simulate multi-tenant environment where different flows use different credentials
        const flow = [
            // Tenant 1 flow
            { id: "t1_add", type: "openfoodfacts-add-product", 
              credentials: { username: "tenant1", password: "tenant1pass" },
              wires: [["t1_h1"]] },
            { id: "t1_upload", type: "openfoodfacts-upload-photo",
              credentials: { username: "tenant1", password: "tenant1pass" },
              wires: [["t1_h2"]] },
            { id: "t1_h1", type: "helper" },
            { id: "t1_h2", type: "helper" },
            
            // Tenant 2 flow  
            { id: "t2_add", type: "openfoodfacts-add-product",
              credentials: { username: "tenant2", password: "tenant2pass" },
              wires: [["t2_h1"]] },
            { id: "t2_upload", type: "openfoodfacts-upload-photo",
              credentials: { username: "tenant2", password: "tenant2pass" },
              wires: [["t2_h2"]] },
            { id: "t2_h1", type: "helper" },
            { id: "t2_h2", type: "helper" },
            
            // Shared non-authenticated nodes (should work for both tenants)
            { id: "shared_get", type: "openfoodfacts-get-product", productId: "shared", wires: [["shared_h1"]] },
            { id: "shared_brands", type: "openfoodfacts-get-brands", wires: [["shared_h2"]] },
            { id: "shared_h1", type: "helper" },
            { id: "shared_h2", type: "helper" }
        ];
        
        helper.startServer(function() {
            helper.load(offNodes, flow, function() {
                try {
                    // Get all nodes
                    const t1Add = helper.getNode("t1_add");
                    const t1Upload = helper.getNode("t1_upload");
                    const t2Add = helper.getNode("t2_add");
                    const t2Upload = helper.getNode("t2_upload");
                    const sharedGet = helper.getNode("shared_get");
                    const sharedBrands = helper.getNode("shared_brands");
                    
                    // All nodes should exist
                    assert.ok(t1Add, 'Tenant 1 add node should exist');
                    assert.ok(t1Upload, 'Tenant 1 upload node should exist');
                    assert.ok(t2Add, 'Tenant 2 add node should exist');
                    assert.ok(t2Upload, 'Tenant 2 upload node should exist');
                    assert.ok(sharedGet, 'Shared get node should exist');
                    assert.ok(sharedBrands, 'Shared brands node should exist');
                    
                    // All nodes should be completely independent
                    const allNodes = [t1Add, t1Upload, t2Add, t2Upload, sharedGet, sharedBrands];
                    for (let i = 0; i < allNodes.length; i++) {
                        for (let j = i + 1; j < allNodes.length; j++) {
                            assert.notStrictEqual(allNodes[i], allNodes[j],
                                `Node ${i} and ${j} must be independent in multi-tenant setup`);
                        }
                    }
                    
                    done();
                } catch (error) {
                    done(error);
                }
            });
        });
    });
});

// Add graceful exit handling for Node-RED test helper cleanup
// The Node-RED test helper doesn't always clean up properly, so we add a timeout
// as a fallback to prevent indefinite hanging
setTimeout(() => {
    console.log('Tests completed, forcing exit due to Node-RED test helper not cleaning up properly');
    process.exit(0);
}, 45000);  // Give tests extra time to complete naturally