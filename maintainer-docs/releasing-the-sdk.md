# Releasing the SDK

This document outlines the steps that should be taken when drafting a new release.

The general flow of the release process is as follows:

1. Ensure all PRs for the milestone are merged
2. Generate the changelog entry and create a PR
3. Create a maintenance branch if required
4. Run the release job
5. Write the announcement while the release waits for approval
6. Post release validation

The website, [titaniumsdk.com](https://titaniumsdk.com), updates itself. The
only website work is step 5.

## Verify all PRs are merged

Check [the milestone](https://github.com/tidev/titanium-sdk/milestones) for the release. All PRs that are assigned to that milestone should be merged.

If there are any open PRs, either move them to the next milestone or ensure they get merged before proceeding.

## Preparing the changelog

The changelog can be generated using `npm run build:changelog`.

Changelogs are generated using the commit history, you most likely will need to hand edit the changelog as commit messages may not always correctly reflect the change.

Where possible, try to ensure the changelog entry links back to the relevant PR and issue are and that community contributions are attributed correctly.

It should then be PR'd to the correct branch, and merged before running the release job.

This section is also the release note published on titaniumsdk.com: the release job copies it into the website's pull request as it is. So the time to get it right is here, and in particular the **About this release** paragraph, which the generator can only fill with "a major release of the SDK". A branch without a section for the version still gets a release note, generated from the commits, with none of these edits.

## Creating a maintenance branch

If this is a patch release, you do not need to perform this step.

For all other releases you should create a branch for this minor version of the SDK following the `1_2_X` format and bump the version of the main branch to the next version.

The following steps are written from the perspective of a `11.0.0.GA` release.

1. Create the maintenance branch from `main` in the [GitHub UI](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/creating-and-deleting-branches-within-your-repository#creating-a-branch) or in the terminal
   * If using the terminal ensure you push to the correct remote
2. Bump the version on the `main` branch to the new minor version. If you are not an administrator on the repository, you should PR this change.
   1. `git checkout main`
   2. `npm --no-git-tag-version version minor`
   3. `git add package.json package-lock.json`
   4. `git commit -m "chore(release): bump version to 10.3.0`
   5. `git push origin main`

## Running the release job

When all the previous work is done, you can now run the release job for the SDK. This is partly covered in the [CI Setup documentation](./ci-setup.md#Release) but is also covered below:

1. Navigate to the [workflow page](https://github.com/tidev/titanium-sdk/actions/workflows/release.yml)
2. Click `Run workflow`
   * Leave `Use workflow from` as the default
   * Enter the branch to release from
   * Enter the release type
3. Wait for the build to run to the `Release` step
4. Ask someone else to approve the release on the run page

The release job checks the branch name: `main`, a maintenance branch like `14_0_X`, or a numbered one like `13_2_0`.

## Writing the announcement

As soon as the release job starts, it opens a **draft** pull request on [tidev/titaniumsdk.com](https://github.com/tidev/titaniumsdk.com/pulls) named `Add <version>.GA release notes and a draft announcement`. GA releases only. It holds:

* `registry/sdk/<version>/release-notes.md` - the changelog section from above
* `content/blog/sdk-<x-y-z>-ga.md` - the announcement, as a draft post

While the release waits for approval, write the announcement on that pull request: fill in every `TODO(release-post)`, trim the thanks line, run `node scripts/generate-social-posts.ts`, and set `draft: false`. The website's `docs/releases.md` has the details. It can also be finished in a later pull request; merging the release notes does not publish a draft post.

The pull request cannot be merged while it is a draft, because merging it publishes the release note. When the release job succeeds, the workflow sets its dates to the release day and marks it ready. Merge it then. If the release is rejected or cancelled, it stays a draft, and running the release again leaves it, and any edits on it, alone.

Everything else on the website happens without anyone: the release and its builds appear on the downloads pages, the API reference for the version is compiled, the compatibility page is regenerated, and for the first release of a new major (`15.0.0`) the guides become the new major's, with the previous major's kept as an archive.

## Post release validation

Once the release has been created, some validation should be done:

* Ensure the release is shown correctly on the [Releases tab](https://github.com/tidev/titanium-sdk/releases)
* Ensure `ti sdk list --releases` shows the SDK
* Ensure `ti sdk install latest` installs the correct SDK
* Ensure the release notes pull request on titaniumsdk.com was marked ready, and merge it
* Ensure the release appears on <https://titaniumsdk.com/downloads> and its API reference at `https://titaniumsdk.com/docs/sdk/<version>`
* For a new major, ensure <https://titaniumsdk.com/docs> shows the new major's guides
