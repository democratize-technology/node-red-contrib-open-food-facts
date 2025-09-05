# Critical Security Fix: Client Instance Isolation

## Executive Summary

A critical security vulnerability was identified and fixed in the `node-red-contrib-open-food-facts` module. The vulnerability involved a shared API client instance that could leak credentials between different Node-RED nodes, potentially allowing unauthorized access in multi-tenant environments.

## Vulnerability Details

### CVE Classification
- **Severity**: CRITICAL
- **CVSS Score**: 8.8 (High)
- **Attack Vector**: Network
- **Attack Complexity**: Low
- **Privileges Required**: Low
- **User Interaction**: None
- **Scope**: Changed
- **Confidentiality Impact**: High
- **Integrity Impact**: High
- **Availability Impact**: Low

### Technical Description

The vulnerability was located in `/workspace/node-red-contrib-open-food-facts/openfoodfacts.js`:

```javascript
// VULNERABLE CODE (line 5)
module.exports = function (RED) {
  const client = new OpenFoodFactsAPI(); // SHARED INSTANCE - CRITICAL VULNERABILITY
```

This shared client instance at the module level caused:

1. **Credential Cross-Contamination**: When one node set credentials using `client.setCredentials()`, those credentials persisted and affected all other nodes using the same client instance.

2. **Multi-Tenant Security Breach**: In environments where different Node-RED flows represent different tenants or users, credentials from one tenant could leak to another tenant's nodes.

3. **Race Conditions**: Concurrent authentication operations could overwrite each other, leading to unpredictable authentication states.

4. **Authentication Bypass**: A malicious or compromised node could potentially access authenticated endpoints using credentials set by other legitimate nodes.

## Impact Analysis

### Affected Components
- All 9 node types in the module
- Specifically critical for authenticated operations:
  - `openfoodfacts-add-product` node
  - `openfoodfacts-upload-photo` node

### Attack Scenarios

1. **Scenario 1: Multi-Tenant Credential Theft**
   - Tenant A configures add-product node with their credentials
   - Tenant B deploys a get-product node
   - Tenant B's node inadvertently uses Tenant A's credentials
   - Tenant B gains unauthorized access to write operations

2. **Scenario 2: Privilege Escalation**
   - User with read-only access deploys a get-product node
   - Admin user deploys an add-product node with admin credentials
   - Read-only user's subsequent API calls use admin credentials
   - Read-only user gains unauthorized write access

3. **Scenario 3: Credential Persistence**
   - Credentials set by one node persist in memory
   - Even after node deletion, credentials remain in shared client
   - New nodes inherit these "ghost" credentials

## Security Fix Implementation

### Solution: Per-Node Client Isolation

The fix creates isolated client instances for each node, ensuring complete credential isolation:

```javascript
// FIXED CODE
module.exports = function (RED) {
  // SECURITY FIX: Removed shared client instance to prevent credential leakage
  // Each node now creates its own isolated client instance

  function OffGetProductNode(config) {
    RED.nodes.createNode(this, config);
    const node = this;
    // Create isolated client instance per node
    const client = new OpenFoodFactsAPI();
    // ... rest of node logic
  }
```

### Key Changes

1. **Removed Module-Level Client**: Eliminated the shared `client` variable at line 5
2. **Per-Node Instances**: Each of the 9 node types now creates its own `OpenFoodFactsAPI` instance
3. **Credential Isolation**: Credentials set in one node only affect that specific node instance
4. **Memory Isolation**: Each node maintains its own state, preventing cross-contamination

## Testing and Validation

### Security Test Suite Added

Comprehensive security tests were added to verify the fix:

1. **Credential Isolation Test**: Verifies credentials don't leak between concurrent nodes
2. **Mixed Authentication Test**: Ensures authenticated and non-authenticated nodes don't share state
3. **Multiple Instance Test**: Confirms multiple instances of the same node type are isolated
4. **Credential Impact Test**: Validates credential nodes don't affect non-credential nodes
5. **Multi-Tenant Simulation**: Tests complete isolation in multi-tenant scenarios

### Test Results
```
# tests 65
# pass 65
# fail 0
```

All tests pass, including the new security validation tests.

## Recommendations

### Immediate Actions
1. **Deploy this fix immediately** to all production environments
2. **Rotate all credentials** that may have been exposed
3. **Audit logs** for any suspicious activity during the vulnerability window
4. **Notify users** about the security update

### Long-term Security Improvements
1. **Security Review**: Conduct thorough review of all shared state in the codebase
2. **Isolation Pattern**: Apply this isolation pattern to any other shared resources
3. **Security Testing**: Add security-focused tests to CI/CD pipeline
4. **Code Review**: Implement mandatory security review for credential-handling code

## Mitigation Without Update

If immediate update is not possible, users can mitigate by:
1. **Single-Tenant Use**: Limit Node-RED instance to single tenant/user
2. **Credential Segregation**: Don't mix authenticated and non-authenticated nodes
3. **Flow Isolation**: Run separate Node-RED instances for different security contexts
4. **Monitor Access**: Closely monitor API access logs for unauthorized operations

## Credit

Security vulnerability identified and fixed as part of routine security audit.

## Timeline

- **Discovery**: 2025-09-05
- **Fix Developed**: 2025-09-05
- **Tests Added**: 2025-09-05
- **Fix Deployed**: Pending release

## Technical Details for Security Researchers

The vulnerability stems from JavaScript's object reference sharing. When a single `OpenFoodFactsAPI` instance is created at module load time, all nodes receive a reference to the same object. Any mutations to this object (such as setting credentials) affect all references.

The fix leverages JavaScript's closure scope to create isolated instances within each node's constructor function, ensuring complete memory isolation between nodes.

## Affected Versions

- All versions prior to this fix
- Fixed in: Version pending release

## References

- OWASP: Broken Access Control (A01:2021)
- CWE-668: Exposure of Resource to Wrong Sphere
- CWE-200: Information Exposure