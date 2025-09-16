# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.1] - 2025-09-16

### Security
- **CRITICAL**: Fixed credential leakage vulnerability between nodes (CVSS 8.8)
  - Isolated API client instances per node to prevent credential cross-contamination
  - Added comprehensive security tests for multi-tenant scenarios
  - Complete credential isolation between all 9 node types

### Performance
- Optimized magic byte validation for large file uploads
  - Only reads first 16 bytes instead of entire file
  - ~100% memory reduction for files over 10MB
  - Maintains backward compatibility with fallback

### Testing
- Added 5 new security-focused tests
- Verified credential isolation in multi-tenant environments
- All 65 tests passing

## [0.3.0] - 2025-06-01

### Security
- Implemented authentication for write operations (addProduct, uploadPhoto)
- Added comprehensive input validation and sanitization
- Upgraded XSS protection to use he.js library
- Enforced HTTPS for authenticated requests
- Added magic byte validation for uploaded images

### Added
- Comprehensive Node-RED node test suite
- Security policy (SECURITY.md)
- Development guidelines (CLAUDE.md)
- Automated PR review workflow
- Dependabot configuration

### Fixed
- Inconsistent error handling across nodes
- Missing authentication despite credential collection (Issue #2)

### Dependencies
- Added he.js for robust HTML entity encoding