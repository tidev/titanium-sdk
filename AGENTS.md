# Repository Guidelines

## Project Structure & Module Organization
Core platform code lives in `android/` and `iphone/`. For Android implementation work, start in `android/titanium/src/java/` and `android/modules/`. For iOS implementation work, start in `iphone/Classes/` and `iphone/TitaniumKit/TitaniumKit/Sources/`. JavaScript/CLI tooling is in `cli/`, shared logic in `common/`, and build orchestration in `build/` (SCons-based scripts). Integration/unit test assets and suites are in `tests/` (notably `tests/Resources/*.test.js`). API docs source files live in `apidoc/`, while release/maintainer workflows are documented in `maintainer-docs/`.

## Build, Test, and Development Commands
- `npm run cleanbuild`: clean + build + package + install local SDK.
- `npm run cleanbuild -- ios` / `npm run cleanbuild -- android`: platform-specific clean build.
- `npm run build`: compile SDK without full clean cycle.
- `npm run test`: iOS top-level sanity check plus lint gates.
- `npm run test:android`, `npm run test:iphone`, `npm run test:ipad`, `npm run test:mac`: full platform integration test runs.
- `npm run test:cli`: run CLI Mocha tests with `nyc` and JUnit output.
- `npm run lint`, `npm run lint:docs`, `npm run format`: lint/format JS, native code, and docs.

## Coding Style & Naming Conventions
Use tabs with width 4 for `*.js` and `*.java` (see `.editorconfig`), LF line endings, and final newlines. JS linting uses `oxlint`; Swift uses `swiftlint`; Objective-C uses `clang-format-lint`; Android Java style checks run through Gradle. Keep existing naming patterns: platform-specific files in their platform trees, tests as `*.test.js`, and CLI tests as `test-*.js`.

## Testing Guidelines
The main suite is TiMocha/should.js-based under `tests/Resources/`. Add or update tests with behavior changes. Run the narrowest relevant target first (for example `npm run test:iphone:onlyFailed`) before full matrix runs. There is no global coverage threshold configured, but `test:cli` publishes coverage via `nyc`.

## Commit & Pull Request Guidelines
Follow Conventional Commits (`feat:`, `fix(scope):`, `chore:`); `commitlint` enforces this and `npm run commit` (Commitizen) is available. PRs should:
- use a clear title prefixed with `[ID]` (see `.github/PULL_REQUEST_TEMPLATE.md`);
- link the related GitHub issue in the description;
- include tests for functional changes;
- keep history squashed/clean per `.github/CONTRIBUTING.md`.

## Security & Configuration Tips
Use Node.js `>=20.18.1` (`package.json` `vendorDependencies`). For Android builds, ensure `ANDROID_SDK` is set or pass SDK paths via build command arguments.
