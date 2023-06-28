# Releasing the SDK

This document outlines the steps that should be taken when drafting a new release.

The general flow of the release process is as follows:

1. Ensure all PRs for the milestone are merged
2. Generate the changelog entry and create a PR
3. Create a maintenance branch if required
4. Run the release job
5. Post release validation

## Verify all PRs are merged

Check [the milestone](https://github.com/tidev/titanium-sdk/milestones) for the release. All PRs that are assigned to that milestone should be merged.

If there are any open PRs, either move them to the next milestone or ensure they get merged before proceeding.

## Preparing the changelog

The changelog can be generated using `npm run build:changelog`.

Changelogs are generated using the commit history, you most likely will need to hand edit the changelog as commit messages may not always correctly reflect the change.

Where possible, try to ensure the changelog entry links back to the relevant PR and issue are and that community contributions are attributed correctly.

It should then be PR'd to the correct branch.

## Creating a maintenance branch

If this is a patch release, you do not need to perform this step.

For all other releases you should create a branch for this minor version of the SDK following the `1_2_X` format and bump the version of the master branch to the next version.

The following steps are written from the perspective of a `11.0.0.GA` release.

1. Create the maintenance branch from `master` in the [GitHub UI](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/creating-and-deleting-branches-within-your-repository#creating-a-branch) or in the terminal
   * If using the terminal ensure you push to the correct remote
2. Bump the version on the `master` branch to the new minor version. If you are not an administrator on the repository, you should PR this change.
   1. `git checkout master`
   2. `npm --no-git-tag-version version minor`
   3. `git add package.json package-lock.json`
   4. `git commit -m "chore(release): bump version to 10.3.0`
   5. `git push origin master`

## Running the release job

When all the previous work is done, you can now run the release job for the SDK. This is partly covered in the [CI Setup documentation](./ci-setup.md#Release) but is also covered below:

1. Navigate to the [workflow page](https://github.com/tidev/titanium-sdk/actions/workflows/release.yml)
2. Click `Run workflow`
   * Leave `Use workflow from` as the default
   * Enter the branch to release from
   * Enter the release type
3. Wait for the build to run to the `Release` step
4. Ask someone else to approve the release on the run page

## Post release validation

Once the release has been created, some validation should be done:

* Ensure the release is shown correctly on the [Releases tab](https://github.com/tidev/titanium-sdk/releases)
* Ensure `ti sdk list --releases` shows the SDK
* Ensure `ti sdk install latest` installs the correct SDK
