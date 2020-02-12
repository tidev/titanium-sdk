# Releasing the SDK

## Cutting a maintenance branch

Typically before a release we generate a new maintenance branch for it, i.e. `9_0_X`

We need to do this for a few repositories: 
- appcelerator/titanium_mobile
- appcelerator/titanium-mobile-mocha-suite
- appcelerator/titanium_mobile_windows (for SDKs < 9)

The process typically is to create the branch off the `master` branch for new major relese, or off the 
previous maintenance branch for new minors.

Examples:

**Major bump**

	git checkout master
	git checkout -b 9_0_X
	git push origin 9_0_X
	git checkout master
	npm --no-git-tag-version version major
	git add package.json
	git add package-lock.json
	git commit -m "chore(release): bump version to 9.1.0"
	git push origin master

**Minor bump**

	git checkout 8_3_X
	git checkout -b 8_4_X
	npm --no-git-tag-version version minor
	git add package.json
	git add package-lock.json
	git commit -m "chore(release): bump version to 8.4.0"
	git push origin 8_4_X


### Updating milestones of PRs

It's important to take any existing PRs that are open against the master branch and re-assign the new milestone to them of the updated master target version. i.e. If we cut a `9_0_X` branch, assign all the open 9.0.0 PRs against master to have a new milestone of 9.1.0.

### Inform the team

Let everyone know the new branch was cut and that bugfixes will need backports on the master and maintenance branches. If there's still pending PRs on master that *should be* in the new maintenance branch, the PR will need to be "copied" on the maintenance branch.

## Generating Changelog

The changelogs can be generated with an npm script and are the raw input for generating the eventual Release Notes.

    npm run build:changelog

The CHANGELOG.md should be updated based on the commit history.
It will likely need some "massaging" to combine community contributions made by members using different logins/emails that are the same underlying user/contributor.

This updated file can be checked in and pushed up via git.

    git add CHANGELOG.md
	git commit -m "docs(changelog): updated for version 9.0.0"
	git push origin master

## Release Notes

Once the changelog has been generated, I typically open it in an editor like VSCode and open a markdown to HTML preview (Cmd+P, Markdown: Open Preview to Side). I then copy the new release's section to my clipboard and paste it into the Wiki. Note that this will only pick up changes that have been committed so far. If you're producing the release notes ahead of time the listing may be incomplete, the Community Contributions migh tbe incomplete, and the module versions may be outdated.

### Staging Release Notes

When we generate release notes in advance of a release, you need to be careful not to place it where our doc jobs will export it to docs.appcelerator.com yet. We typically place "staged" notes under https://wiki.appcelerator.org/display/DB/SDK+Releases 

Copy an existing page there, rename it to reflect the new release version and then paste the generated changelog HTML in as the contents.

### Cross-Referencing with JIRA

The changelog is generated from actual git commits. It gives us a good representation of what went in to a releease, who committed it, the PR/commit that underpins the fix/feature, etc. But we're not so good at adding JIRA ticket references into our commit messages/bodies, so it can often fail to link to the related JIRA ticket. Additionally, it uses the emssage fromt he commit, rather than the (possibly more useful) title from the ticket.

It's good to do a second-pass at the release notes by looking at the generated notes that JIRA produces for a release. Navigate to https://jira.appcelerator.org > Projects > TIMOB > Releases > Select the release. There will be a "Release notes" link at the top of the release version page. Clicking that will give you a listing of all the tickets resolved/closed for the release (i.e. https://jira.appcelerator.org/secure/ReleaseNote.jspa?projectId=10153&version=20033)

You can typically copy-paste that over as well and then try to merge the listings together for equivalent tickets/commits. (I tend to prefer to retain the JIRA ticket title over the commit subject/message)

### Ready to Publish

For the first major release in a series (i.e. 9.x), you'll likely need to copy another major's series parent first and rename it: i.e. https://wiki.appcelerator.org/display/guides2/Titanium+SDK+Release+Notes+8.x to https://wiki.appcelerator.org/display/guides2/Titanium+SDK+Release+Notes+9.x

Then copy the staged release note from the "Beta" doc space to the "Docs & Guides" space (with the correct "series" page as the parent).

Update the https://wiki.appcelerator.org/display/guides2/Titanium+SDK+Release+Notes page to include the latest release note page in it's include macro (think of the page as like a "symlink" for the "latest" release). This is the page that Studio will pull the "print version" of to display release notes.

### Publish the Wiki to the Docs site

Run the `wiki-export` job to force a new wiki export and eventual publish of the wiki into the docs.appcelerator.com guides: https://jenkins.appcelerator.org/job/docs/job/wiki-export/job/master/

(Note that this will happen automatically overnight if you forget. Also, this job will trigger appcelerator/doctools/docs job, which will then trigger the appc_web_docs).

#### Manually generate static release note html/landing

Follow the instructions at https://github.com/appcelerator/doctools#single-release to manually generate a static HTML page for the release notes that gets included in the doc site landing pages. (The landing page and note get shown here: http://docs.appcelerator.com/platform/latest/)

## Pushing out the SDK Release to the World

We have a Jenkins job set up at https://jenkins.appcelerator.org/job/release-scripts/job/titanium_mobile/ to push the actual release out to the world.

Run the job and it will "pause" at the first two steps ("Branch" and "Version") and allow you to select the branch to pull the build from (i.e. `9_0_X` or `8_3_X`); and then the exact build/version to use (i.e. `9.0.0.v20200211041947`) and the eventual type of release to cut (`GA`, `RC`, `Beta`, etc). The job should take care of pulling that build, modifying the version inside the zip, renaming the zip, pushing it out, closing the release on JIRA, etc.
