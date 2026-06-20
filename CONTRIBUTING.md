# Contributing to Qmix TypeScript

Thank you for your interest in improving Qmix TypeScript! This project is a TypeScript port of a nonlinear-crystal phase-matching engine. Contributions are welcome under the GNU General Public License v3.0 (GPL-3.0).

## Maintainers

- Jesse Smith — jesse.smith@as-photonics.com
- Arlee Smith — arlee.smith@as-photonics.com

## Getting started

1. **Fork** the repository on GitHub and clone your fork locally.
2. **Install dependencies**:
   ```sh
   npm install
   ```
3. **Build, typecheck, and test** before opening a pull request:
   ```sh
   npm run typecheck
   npm test
   npm run build
   ```

All three checks must pass before a PR can be merged.

## What to contribute

Helpful contributions include:

- **Bug fixes** in phase-matching, Sellmeier evaluation, or QPM calculations.
- **New test fixtures** that expand the golden-test coverage.
- **Additional crystal metadata** such as citations, thermal properties, or crystal-class labels for built-in entries.
- **Documentation** improvements for the README, code comments, or TypeDoc.
- **Feature enhancements** that fit within the public-release scope.

## Submitting changes

1. Open an **issue** first for significant changes so we can discuss the approach.
2. Create a **feature branch** from `main`.
3. Make focused commits with clear messages.
4. Add or update **tests** for any changed behavior.
5. Ensure your changes follow the existing **coding style**:
   - `readonly` types and arrays where possible.
   - Explicit return types on exported functions.
   - No `any` unless absolutely necessary.
6. Open a **pull request** against `main` and link the related issue.

## Important restrictions

- **BMix-related code** is intentionally excluded from the public release; please do not add it.
- Citations added to crystal metadata should point to peer-reviewed literature, manufacturer data sheets, or well-known handbook references. Include enough detail for another developer to locate the original source.

## Questions?

Open an issue and tag it with `question`. For bug reports, please include:

- The crystal name and input parameters that trigger the issue.
- Expected vs. actual output.
- Node/Bun version and OS.

By contributing, you agree that your contributions will be licensed under the GPL-3.0 license in [LICENSE](LICENSE).
