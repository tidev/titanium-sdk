# CI Setup

Titanium uses GitHub Actions as its CI solution. The different workflows can be found under the `./github/workflows` folder.

## CI Workflows

### Backport

This workflow is to backport pull requests onto specific branches at the request of a contributor.

To use this workflow:

1. Label the pull request with required label, for example if requesting a backport to `10_0_X`, then label with `backport 10_0_X`. This can be done before or after merging
2. Once the pull request has been merged (or on applying the label if already merged), the action will run automatically.
3. If the backport is successful then a PR will be created and the label removed. If the backport fails, then the `backport <branch> failed` label will be applied and a comment added with a link to the failed run and the steps to perform the backport yourself.

This workflow requires a user that has a copy of the repository and ability to create a PR to the repo. This requirement could probably be removed.

It also requires that an admin has created the required `backport <branch>` label.

### Build

This is the main workflow, it will run for branches and pull requests. It will use the common `build-android` and `build-ios` actions to build the SDK, and then the common `package` action to package up the SDK.

This is ran automatically on pull requests and on pushes to branches. There is no way to (and no need to) trigger this outside of those actions.

This has no requirements.

### Docs

This validates the documentation contained in `apidoc` using the `tdoc` tooling.

This is ran automatically on pull requests and on pushes to branches. There is no way to (and no need to) trigger this outside of those actions.

This has no requirements.

### Release

This is the release workflow that will automatically build and create a new release on the repository. Before running this step you have completed all the required steps in the [release guide](./releasing-the-sdk.md)

1. Navigate to the [workflow page](https://github.com/tidev/titanium-sdk/actions/workflows/release.yml)
2. Click `Run workflow`
   * Leave `Use workflow from` as the default
   * Enter the branch to release from
   * Enter the release type
3. Wait for the build to run to the `Release` step
4. Ask someone else to approve the release on the run page

The job will perform the following:

1. Validate that the requested release does not exist
2. Build the Android and iOS portions of the SDK
3. Package the Android and iOS artifacts into a SDK zip for Linux, MacOS, and Windows
4. Create a tag, create a release with the SDK zips, bump the patch version and push back to the repository.

This requires a GitHub token to perform the required actions, this token is automatically provided to the workflow however so it does not need setting up.

It also requires a [environment](https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment) to be created named `Release`, this environment should have `Required Reviewers` set with the release team.

## Shared Actions

To avoid repeating the same steps, the workflows uses [composite actions](https://docs.github.com/en/actions/creating-actions/creating-a-composite-action) for the SDK build and packaging steps. To use these, you must first checkout the repository.

### Build Android

This installs all dependencies, lints the Java source, runs the Android build, and uploads the output as an artifact to be used later.

To use this action you must provide a `node-version` and `java-version` input.

For example:

```yml
      - name: Android build
        uses: ./.github/actions/build-android
        with:
          node-version: '16.x'
          java-version: '11'
```

### Build iOS

This installs all dependencies, lints the Java source, runs the Android build, and uploads the output as an artifact to be used later.

To use this action you must provide a `node-version` input.

For example:

```yml
      - name: iOS build
        uses: ./.github/actions/build-ios
        with:
          node-version: '16.x'
```

### Package

This retrieves the artifacts produced by the `build-android` and `build-ios` actions and then produces SDK zips for Linux, MacOS, and Windows.

To use this action you must provide `node-version`, `java-version`, and `vtag` inputs.

For example:

```yml
    - name: Package
      uses: ./.github/actions/package
      with:
        node-version: '16.x'
        java-version: '11'
        vtag: ${{ env.vtag }}
```
