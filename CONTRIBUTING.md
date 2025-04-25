# Contributing to Node-RED Open Food Facts

First off, thank you for considering contributing to Node-RED Open Food Facts! It's people like you that make this integration better for everyone.

## Code of Conduct

By participating in this project, you are expected to uphold our code of conduct. Please report unacceptable behavior to hello@democratize.technology.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues as you might find out that you don't need to create one. When you are creating a bug report, please include as many details as possible. Fill out [the required template](.github/ISSUE_TEMPLATE/bug_report.md), the information it asks for helps us resolve issues faster.

**Note:** If you find a **Closed** issue that seems like it is the same thing that you're experiencing, open a new issue and include a link to the original issue in the body of your new one.

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please use [the template](.github/ISSUE_TEMPLATE/feature_request.md) and provide:

- A clear and descriptive title
- A detailed description of the proposed feature
- Explain why this enhancement would be useful
- List any similar features in other projects if applicable

### Pull Requests

1. Fork the repo and create your branch from `main`.
2. If you've added code that should be tested, add tests.
3. If you've changed APIs, update the documentation.
4. Ensure the test suite passes.
5. Make sure your code follows the existing code style.
6. Issue that pull request!

## Development Setup

1. Clone your fork of the repo:
   ```bash
   git clone https://github.com/your-username/node-red-contrib-open-food-facts.git
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a new branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Guidelines

### Code Style

- Use 2 spaces for indentation
- Use semicolons
- Use single quotes for strings
- Follow existing naming conventions:
  - camelCase for variables and functions
  - PascalCase for classes
  - UPPER_SNAKE_CASE for constants

### Node Naming

- Node names should be lowercase with spaces
- Use descriptive names that explain what the node does

### Error Handling

- Always handle errors appropriately
- Use the `OpenFoodFactsError` class for API-related errors
- Provide meaningful error messages

### Testing

- Write tests for all new functionality
- Use descriptive test names
- Mock external API calls
- Ensure tests are deterministic

### Documentation

- Update the README.md if you change functionality
- Use JSDoc comments for functions and classes
- Include examples where appropriate

## Testing

Run the test suite:
```bash
npm test
```

For specific tests:
```bash
npm test -- --test-name-pattern="pattern"
```

## Commit Messages

- Use the present tense ("Add feature" not "Added feature")
- Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit the first line to 72 characters or less
- Reference issues and pull requests liberally after the first line

Examples:
```
Add search by category filter
Fix barcode validation for short codes
Update documentation for new API parameters
```

## Release Process

1. Update version in package.json
2. Update CHANGELOG.md
3. Create a git tag
4. Push to main branch
5. GitHub Actions will handle the npm publish

## Getting Help

- Join the Node-RED forum: https://discourse.nodered.org/
- Open Food Facts API documentation: https://wiki.openfoodfacts.org/API
- Create an issue for questions

## Recognition

Contributors will be recognized in the README.md file.

Thank you for contributing!
