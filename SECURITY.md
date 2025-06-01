# Security Policy

## Supported Versions

We actively support the latest version of this Node-RED node. Security updates will be applied to the current major version.

| Version | Supported          |
| ------- | ------------------ |
| Latest  | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability in this project, please report it by:

1. **DO NOT** open a public issue
2. Use GitHub's private vulnerability reporting feature at https://github.com/democratize-technology/node-red-contrib-open-food-facts/security/advisories/new
3. Include a detailed description of the vulnerability
4. Provide steps to reproduce if possible

We will acknowledge receipt of your report within 48 hours and provide a timeline for addressing the issue.

## Security Considerations

This Node-RED node:
- Communicates with the Open Food Facts API over HTTPS
- Does not store or cache sensitive data
- Supports optional authentication for write operations (credentials managed by Node-RED's credential system)
- Processes publicly available food product data

## Dependencies

We regularly monitor and update dependencies to address known security vulnerabilities. The project uses minimal dependencies to reduce the attack surface.
