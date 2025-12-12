# @recharts/devtools

Shared helper functions and devtools for Recharts projects.

Intended for development and debugging purpose only. We won't stop you from using this in prod but also we won't support it. Expect breaking changes in every release.

## Installation

```bash
npm install @recharts/devtools
```

## Usage

```typescript
import { random, generateMockData } from '@recharts/devtools';

const gen = random(123); // seeded random generator
const data = generateMockData(10, 123); // generates 10 mock data points
```

## Development

- `npm run build`: Build the package
- `npm run test`: Run tests with Vitest
- `npm run lint`: Lint code

## Publishing

To publish a new version:

1. Update the version in `package.json` (e.g., `1.0.1`).
2. Commit the change.
3. Create a git tag matching the version:
   ```bash
   git tag v1.0.1
   git push origin v1.0.1
   ```
4. The GitHub Action `Publish Package` will automatically publish to NPM.
