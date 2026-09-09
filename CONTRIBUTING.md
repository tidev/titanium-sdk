# Contributing to the Titanium SDK

Thanks for your interest in improving Titanium. This guide covers everything you need to
work **on** the SDK: filing a good issue, building from source, the coding standards we
enforce, and how a pull request gets from your fork to `main`.

If you are looking for help *using* Titanium, try
[GitHub Discussions](https://github.com/tidev/titanium-sdk/discussions) or
[Ti.Slack](https://slack.tidev.io) instead.

- [Ways to contribute](#ways-to-contribute)
- [Code of conduct](#code-of-conduct)
- [Reporting bugs and requesting features](#reporting-bugs-and-requesting-features)
- [Signing the CLA](#signing-the-cla)
- [Setting up a development environment](#setting-up-a-development-environment)
- [Making your changes](#making-your-changes)
- [Coding standards](#coding-standards)
- [Tests](#tests)
- [API documentation](#api-documentation)
- [Commits](#commits)
- [Opening a pull request](#opening-a-pull-request)
- [Reviewing someone else's pull request](#reviewing-someone-elses-pull-request)
- [Contributing to Titanium modules](#contributing-to-titanium-modules)

## Ways to contribute

Titanium exists because of a very broad range of people, and code is only part of it. All
of the following genuinely help:

- Answering questions in [Discussions](https://github.com/tidev/titanium-sdk/discussions)
  and on [Ti.Slack](https://slack.tidev.io).
- Filing precise bug reports, and adding reproducible test cases to existing ones.
- Fixing bugs and implementing features.
- Testing pull requests and reporting whether they do what they claim.
- Writing, correcting and improving documentation — both the API docs in this repo and the
  guides in [tidev/titanium-docs](https://github.com/tidev/titanium-docs).
- Building and sharing modules with the community.
- [Sponsoring](https://github.com/sponsors/tidev) or [donating](https://tidev.io/donate),
  which pays the engineers who keep this project going.

## Code of conduct

TiDev wants a safe and welcoming community. The
[Code of Conduct](https://tidev.io/code-of-conduct) applies to everyone taking part.

## Reporting bugs and requesting features

We track everything in [GitHub Issues](https://github.com/tidev/titanium-sdk/issues).
Pick the right form from [New issue](https://github.com/tidev/titanium-sdk/issues/new/choose):
bug report, docs issue, or feature proposal.

A bug report is only actionable if someone else can reproduce it. Before you file:

- Search the existing issues, open and closed.
- Reproduce against the latest SDK release, and say which version you used.
- Include the smallest code sample that shows the problem, plus your platform, OS and CLI
  versions.
- Attach a trace-level log: `ti build -p [ios|android] -l trace`.

Leaving sections of the form blank tends to get an issue closed or moved to Discussions,
not because we're strict but because there is nothing to act on.

**Security issues are different.** Do not open a public issue. Email
[security@tidev.io](mailto:security@tidev.io) instead.

## Signing the CLA

Before we can merge anything from you — code, docs or otherwise — you need to sign the
TiDev Contributor License Agreement. It confirms that what you contribute is properly
licensed and that you have the authority to contribute it, which protects you, TiDev and
everyone using Titanium from later ownership disputes.

Sign it at **<https://tidev.io/contribute>**. You only ever do this once. A GitHub Action
checks every pull request and will tell you if your account isn't covered yet.

The CLA is written for an individual. If you are contributing as part of your job, check
that your employer allows you to sign it.

## Setting up a development environment

You need everything required to build Titanium apps, plus a few extras:

| Requirement | Notes |
| --- | --- |
| Node.js | 22.19.0 or newer. CI builds on Node 24. |
| Xcode | For iOS. CI builds with Xcode 26.2. |
| Android SDK | Set `ANDROID_SDK`, or pass `--android-sdk` to the build. |
| JDK | For Android. CI builds with Java 21. |

Fork [tidev/titanium-sdk](https://github.com/tidev/titanium-sdk), then clone your fork and
add the upstream repository as a second remote:

```bash
git clone git@github.com:YOUR_ACCOUNT/titanium-sdk.git
cd titanium-sdk
git remote add upstream https://github.com/tidev/titanium-sdk.git
```

Create a branch off `main` for each change:

```bash
git checkout main
git pull upstream main
git checkout -b short-description-of-change
```

### Building the SDK

```bash
npm ci
npm run cleanbuild
```

`cleanbuild` compiles, packages and installs the SDK locally, so you can immediately build
a test app against it. It targets every platform your host OS supports — Android and iOS on
macOS, Android on Windows and Linux. Limit it when you don't need both:

```bash
npm run cleanbuild -- ios
npm run cleanbuild -- android
```

Run `npm run cleanbuild -- -h` for the full set of options. Once you have a full build,
`npm run build` skips the clean cycle and is much faster.

Re-run `npm ci` after pulling, whenever the dependencies change.

The packaged SDK ends up in `dist/mobilesdk-<version>-<os>.zip`, and the build installs it
for you. To install one by hand, unzip it and copy the versioned folder from
`mobilesdk/<os>/` into your SDK directory — `~/Library/Application Support/Titanium` on
macOS, `%ProgramData%\Titanium` on Windows. Renaming that folder to something like
`14.0.0.my-fix` makes it easier to pick out later.

### Where things live

| Path | Contents |
| --- | --- |
| `android/` | Android platform code. Start in `android/titanium/src/java/` and `android/modules/`. |
| `iphone/` | iOS platform code. Start in `iphone/Classes/` and `iphone/TitaniumKit/TitaniumKit/Sources/`. |
| `cli/` | CLI commands and hooks. |
| `common/` | JavaScript shared across platforms. |
| `build/` | Build orchestration (`node ./build/scons`). |
| `apidoc/` | API documentation source. |
| `tests/` | Integration and unit test suites. |
| `maintainer-docs/` | Release and CI procedures for maintainers. |

## Making your changes

A few expectations beyond "it works":

- **Keep the platforms at parity.** If you add an API to one platform that could exist on
  the other, either implement both or open an issue for the missing side and link it from
  your pull request. Splitting the work is fine; leaving it undocumented is not.
- **Support the versions we support.** Check the minimum OS versions the SDK currently
  targets rather than assuming the latest. Where necessary use version guards for newer features.
- **Add tests.** See [Tests](#tests).
- **Update the API docs** if you changed anything public. See
  [API documentation](#api-documentation).

## Coding standards

Style is enforced by tooling, so the tools are the specification. Run everything with:

```bash
npm run lint      # JavaScript, Android and docs
npm run lint:ios  # Objective-C and Swift (macOS only)
npm run format    # apply automatic fixes
```

A pre-commit hook lints only the files you touched, so most problems surface before you
push. What each language uses:

| Language | Tool | Config |
| --- | --- | --- |
| JavaScript | [oxlint](https://oxc.rs/docs/guide/usage/linter) | `.oxlintrc.json` |
| Java | Gradle `checkJavaStyle` | `android/` Gradle config |
| Objective-C / C / C++ | `clang-format` | `.clang-format` in `android/`, `iphone/`, `iphone/TitaniumKit/` |
| Swift | [SwiftLint](https://github.com/realm/SwiftLint) | `.swiftlint.yml` |

Beyond what the linters check:

- Tabs for indentation, four columns wide, in `.js` and `.java`; LF line endings; a final
  newline on every file. `.editorconfig` covers this, so most editors handle it for you.
- Write identifiers and comments in English, and be consistent with the file you are in.
- Braces on every `if`, `for` and `while`, even single-statement ones.
- Java and JavaScript: `mixedCase` for methods and variables, `UPPER_CASE` for constants.
  Method names read as verbs — `getValue()`, `isEnabled()`. Don't capitalize acronyms inside
  a name: `resolveUrl`, not `resolveURL`. In JavaScript, prefix members that aren't part of
  the public API with an underscore.
- Objective-C: prefix class names with `Ti`, and follow Apple's
  [Cocoa coding guidelines](https://developer.apple.com/library/archive/documentation/Cocoa/Conceptual/CodingGuidelines/CodingGuidelines.html)
  where this guide is silent.
- Match the surrounding code when this guide and the file disagree. Readability wins over
  any rule here.

## Tests

The suite lives in `tests/` and runs on-device through ti-mocha and should.js. Each script
does a clean build, installs the SDK symlinked, launches the app on a simulator or emulator
and reports results.

```bash
npm run test            # iOS sanity check plus lint — fast, run this first
npm run test:android
npm run test:iphone
npm run test:ipad
npm run test:mac
npm run test:cli        # CLI unit tests under mocha + nyc
```

Each platform target has `:onlyFailed` and `:trace` variants — `npm run test:iphone:onlyFailed`
re-runs just what failed last time, which is the one you want while iterating.

Add or update tests in `tests/Resources/*.test.js` alongside any behavioral change. Anything
in `tests/` is copied over the generated test app, so new files land automatically.

## API documentation

The API docs at <https://titaniumsdk.com/api/> are generated from the YAML files in
`apidoc/`, written in [TDoc](https://github.com/tidev/titanium-docs/blob/main/docs/guide/Titanium_SDK/Titanium_SDK_Guide/Contributing_to_Titanium/Platform_Development/Specs/TDoc_Specification.md).
The directory mirrors the namespace, so `Titanium.UI.View` is `apidoc/Titanium/UI/View.yml`.

Add new members in alphabetical order within their section:

```yaml
  - name: myNewProperty
    summary: Useful new property for keeping track of stuff.
    description: |
        A fuller explanation of what the property does, when you'd use it,
        and anything surprising about it.
    type: String
    default: 'stuff'
```

Then validate and, if you want to read the result, build the HTML:

```bash
npm run lint:docs   # required — CI runs this on every apidoc change
npm run build:docs  # optional, writes to dist/apidoc/index.html
```

Prefix documentation-only commits with `docs:`.

Guides, tutorials and everything else on titaniumsdk.com live in
[tidev/titanium-docs](https://github.com/tidev/titanium-docs), not here.

## Commits

We use [Conventional Commits](https://www.conventionalcommits.org/), enforced by
`commitlint` on a commit-msg hook. The changelog and release notes are generated from these
messages, so the format matters:

```
fix(android): keyboard issues in BottomNavigation
feat(ios): support Icon Composer app icons
docs: updated textfield examples
chore(android): gradle 9.4.1
```

Common types are `feat`, `fix`, `perf`, `refactor`, `docs`, `test`, `ci` and `chore`. The
scope is usually `android`, `ios`, `cli`, `apidoc` or `all`. If you'd rather be prompted,
`npm run commit` walks you through it.

Keep the history clean — squash the noise out of your branch before asking for a review.

## Opening a pull request

Push your branch to your fork and open a pull request against `main`:

```bash
git push origin your-branch-name
```

Before you ask for a review, check that:

- [ ] You've signed the [CLA](https://tidev.io/contribute).
- [ ] The pull request title is a conventional commit message — it becomes the commit
      message when we squash and merge, and feeds the changelog.
- [ ] The description links the issue or discussion it addresses.
- [ ] The description says how to verify the change: a test app, steps, or the test that
      now covers it.
- [ ] Tests cover the new behavior, and `npm run lint` passes.
- [ ] API docs are updated if you changed a public API.

Backports go to the release branch, named like `13_4_X`, and say so in the title.

Opening the pull request runs the CLA check, an Android build, an iOS build, JavaScript
lint, and — if you touched `apidoc/` — doc validation. Get those green; a reviewer will
usually wait for them anyway.

### What happens next

A member of the core team will normally look at your pull request within a few days, longer
when there's a queue. Complete, well-described pull requests genuinely do get picked up
first, because they're the ones a reviewer can act on in one sitting.

**If changes are requested,** push more commits to the same branch — the pull request
updates itself. There's no need to open a new one.

**If it's rejected,** that's routine and it isn't personal. Usually it means functional
testing failed, the style needs work, or the reviewer couldn't tell how to verify the
change; the review should say which. Occasionally a feature is a genuinely bad fit for the
core SDK and belongs in a module instead. Ask if the reason isn't clear.

## Reviewing someone else's pull request

Testing other people's changes is one of the most useful things you can do here, and it
needs no special access. It's how changes get merged with confidence.

With the [GitHub CLI](https://cli.github.com):

```bash
gh pr checkout 1234
```

Or with git alone:

```bash
git fetch upstream pull/1234/head:pr-1234
git checkout pr-1234
```

Build the SDK from that branch, run whatever reproduction the issue describes, and confirm
it behaves as the pull request claims. Building one of your own apps against it is even
better — it catches things a minimal test case won't.

Then comment on the pull request. "Tested on Android 15, the crash is gone" is worth a lot.
If it fails, include the steps you ran, the SDK and OS versions, and the full error.

When you're done, `git checkout main` and delete the branch.

## Contributing to Titanium modules

Many modules live in their own repositories under [tidev](https://github.com/tidev/). The
process is the same as this repo — CLA, issue, fork, pull request — with a few extras:

- File the issue in that module's own repository.
- Bump the module version. Modules use `<major>.<minor>.<patch>`.
- Add a changelog entry.
- Record any third-party code or libraries you pulled in under `ATTRIBUTIONS.md`.

---

Questions about any of this? Ask on [Ti.Slack](https://slack.tidev.io) or in
[Discussions](https://github.com/tidev/titanium-sdk/discussions).

Code strong! 🚀
