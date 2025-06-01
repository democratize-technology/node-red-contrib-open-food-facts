# Claude Memory for node-red-contrib-open-food-facts

## Pull Request Guidelines

- **Always tag `democratize-technology-code-reviewer` as reviewer** when creating pull requests
- Follow the existing commit message style seen in git log
- Run `npm test` to verify all tests pass before committing
- No lint/typecheck commands are configured in this project

## Development Workflow

- Create feature branches for all changes
- Use descriptive branch names (e.g., `fix/use-proper-xss-protection-library`)
- Include comprehensive commit messages with context
- All tests must pass before creating pull requests

## Project Structure

- `openfoodfacts-api.js` - Main API client library
- `openfoodfacts.js` - Node-RED node implementation  
- `test-openfoodfacts-api.js` - API client tests
- `test-openfoodfacts-nodes.js` - Node-RED node tests
- Uses Node.js built-in test runner (not Jest/Mocha)

## Dependencies

- `he` - HTML entity encoding library (added for XSS protection)
- `cockatiel` - Resilience library
- Node.js >= 20.0.0 required