/* global danger, fail, warn, message */

// requires
const debug = require('debug')('dangerfile');
const fs = require('fs-extra');
const eslint = require('@seadub/danger-plugin-eslint').default;
const junit = require('@seadub/danger-plugin-junit').default;
const dependencies = require('@seadub/danger-plugin-dependencies').default;
const load = require('@commitlint/load').default;
const lint = require('@commitlint/lint').default;
const packageJSON = require('./package.json');
// Due to bug in danger, we hack env variables in build process.
const ENV = fs.existsSync('./env.json') ? require('./env.json') : process.env;
// constants
const github = danger.github;
// Currently used PR-labels
const Label = {
	NEEDS_JIRA: 'needs jira 🚨',
	NEEDS_TESTS: 'needs tests 🚨',
	NO_TESTS: 'no tests',
	IOS: 'ios',
	ANDROID: 'android',
	COMMUNITY: 'community 🔥',
	DOCS: 'docs 📔',
	MERGE_CONFLICTS: 'merge conflicts 🚨',
	IN_QE_TESTING: 'in-qe-testing 🕵'
};
// Sets of existing labels, labels we want to add/exist, labels we want to remove (if they exist)
const existingLabelNames = new Set(github.issue.labels.map(l => l.name));
const labelsToAdd = new Set();
const labelsToRemove = new Set();

async function checkStats(pr) {
	// Check if the user deleted more code than added, give a thumbs-up if so
	if (pr.deletions > pr.additions) {
		message(':thumbsup: Hey!, You deleted more code than you added. That\'s awesome!');
	}
	// TODO: Check for PRs above a certain threshold of changes and warn?
}

// Check npm test output
async function checkNPMTestOutput() {
	const exists = await fs.pathExists('./npm_test.log');
	if (!exists) {
		return;
	}
	const npmTestOutput = await fs.readFile('./npm_test.log', 'utf8');
	if (npmTestOutput.includes('Test failed.  See above for more details.')) {
		fail(':disappointed_relieved: `npm test` failed. See below for details.');
		message('```' + npmTestOutput + '\n```');
	}
}

// Check that the commit messages adhere to our conventions!
async function checkCommitMessages() {
	const { rules, parserPreset } = await load();
	const allWarnings = await Promise.all(danger.git.commits.map(async commit => {
		const report = await lint(commit.message, rules, parserPreset ? { parserOpts: parserPreset.parserOpts } : {});
		// Bunch warnings/errors together for same commit!
		const errorCount = report.errors.length;
		const warningCount = report.warnings.length;
		if ((errorCount + warningCount) === 0) {
			return [];
		}

		let msg = `Commit ${danger.utils.href(commit.url, commit.sha)} has a message "${commit.message}" giving `;
		if (errorCount > 0) {
			msg += `${errorCount} errors`;
			if (warningCount > 0) {
				msg += ' and ';
			}
		}
		if (warningCount > 0) {
			msg += `${warningCount} warnings`;
		}
		msg += ':\n- ';
		if (errorCount > 0) {
			msg += report.errors.map(e => e.message).join('\n- ');
		}
		if (warningCount > 0) {
			msg += report.warnings.map(w => w.message).join('\n- ');
		}

		return [ msg ];
	}));
	const flattened = [].concat(...allWarnings);
	flattened.forEach(w => warn(w)); // propagate warnings/errors about commit conventions
	if (flattened.length > 0) {
		// at least one bad commit message, better to squash this one
		message(':rotating_light: This PR has one or more commits with warnings/errors for commit messages not matching our configuration. You may want to squash merge this PR and edit the message to match our conventions, or ask the original developer to modify their history.');
	} else {
		// all commits are good, should be good to rebase this one
		message(':fist: The commits in this PR match our conventions! Feel free to Rebase and Merge this PR when ready.');
	}
}

// Check that we have a JIRA Link in the body
async function checkJIRA() {
	// Don't require dependabot dependency updates require a JIRA ticket
	if (github.pr.user.login === 'dependabot-preview[bot]') {
		return;
	}

	const body = github.pr.body;
	// TODO: Cross-reference JIRA tickets linked in PR body versus in commit messages!
	const hasJIRALink = body.match(/https:\/\/jira\.appcelerator\.org\/browse\/[A-Z]+-\d+/);
	if (!hasJIRALink) {
		labelsToAdd.add(Label.NEEDS_JIRA);
		warn('There is no linked JIRA ticket in the PR body. Please include the URL of the relevant JIRA ticket. If you need to, you may file a ticket on ' + danger.utils.href('https://jira.appcelerator.org/secure/CreateIssue!default.jspa', 'JIRA'));
	} else {
		labelsToRemove.add(Label.NEEDS_JIRA);
	}
}

// Check that if we modify the Android or iOS SDK, we also update the tests
// Also, assign labels based on changes to different dir paths
async function checkChangedFileLocations() {
	const android = danger.git.fileMatch('android/**/*.java');
	const ios = danger.git.fileMatch('iphone/**/*.h', 'iphone/**/*.m');
	const topTiModule = danger.git.fileMatch('iphone/TitaniumKit/**/TopTiModule.m');

	// Auto-assign android/ios labels
	if (android.edited) {
		labelsToAdd.add(Label.ANDROID);
	}
	if (ios.edited) {
		labelsToAdd.add(Label.IOS);
	}
	// Check if apidoc was modified and apply 'docs' label?
	const docs = danger.git.fileMatch('apidoc/**');
	if (docs.edited) {
		labelsToAdd.add(Label.DOCS);
	}
	// Mark hasAppChanges if 'common' dir is changed too!
	const common = danger.git.fileMatch('common/**');
	// TODO: Should we add ios/android labels if common dir is changed?
	const hasAppChanges = android.edited || ios.edited || common.edited;

	// Check if any tests were changed/added
	const tests = danger.git.fileMatch('tests/**/*.js');
	const hasNoTestsLabel = existingLabelNames.has(Label.NO_TESTS);
	// If we changed android/iOS source, but didn't change tests and didn't use the 'no tests' label
	// fail the PR
	if (hasAppChanges && !tests.edited && !hasNoTestsLabel) {
		labelsToAdd.add(Label.NEEDS_TESTS);
		const testDocLink = github.utils.fileLinks([ 'README.md#unit-tests' ]);
		fail(`:microscope: There are library changes, but no changes to the unit tests. That's OK as long as you're refactoring existing code, but will require an admin to merge this PR. Please see ${testDocLink} for docs on unit testing.`); // eslint-disable-line max-len
	} else {
		// If it has the "needs tests" label, remove it
		labelsToRemove.add(Label.NEEDS_TESTS);
	}

	if (topTiModule.edited) {
		warn('It looks like you have modified the TopTiModule.m file. Are you sure you meant to do that?');
	}

}

// Does the PR have merge conflicts?
async function checkMergeable() {
	if (github.pr.mergeable_state === 'dirty') {
		labelsToAdd.add(Label.MERGE_CONFLICTS);
	} else {
		// assume it has no conflicts
		labelsToRemove.add(Label.MERGE_CONFLICTS);
	}
}

// Check PR author to see if it's community, etc
async function checkCommunity() {
	// Don't give special thanks to bot accounts
	if (github.pr.user.login === 'dependabot-preview[bot]') {
		return;
	}

	if (github.pr.author_association === 'FIRST_TIMER') {
		labelsToAdd.add(Label.COMMUNITY);
		// Thank them profusely! This is their first ever github commit!
		message(`:rocket: Wow, ${github.pr.user.login}, your first contribution to GitHub and it's to help us make Titanium better! You rock! :guitar:`);
	} else if (github.pr.author_association === 'FIRST_TIME_CONTRIBUTOR') {
		labelsToAdd.add(Label.COMMUNITY);
		// Thank them, this is their first contribution to this repo!
		message(`:confetti_ball: Welcome to the Titanium SDK community, ${github.pr.user.login}! Thank you so much for your PR, you're helping us make Titanium better. :gift:`);
	} else if (github.pr.author_association === 'CONTRIBUTOR') {
		labelsToAdd.add(Label.COMMUNITY);
		// Be nice, this is a community member who has landed PRs before!
		message(`:tada: Another contribution from our awesome community member, ${github.pr.user.login}! Thanks again for helping us make Titanium SDK better. :thumbsup:`);
	}
}

/**
 * Given the `labelsToAdd` Set, add any labels that aren't already on the PR.
 */
async function addMissingLabels() {
	const filteredLabels = [ ...labelsToAdd ].filter(l => !existingLabelNames.has(l));
	if (filteredLabels.length === 0) {
		return;
	}
	await github.api.issues.addLabels({ owner: github.pr.base.repo.owner.login, repo: github.pr.base.repo.name, issue_number: github.pr.number, labels: filteredLabels });
}

async function requestReviews() {
	// someone already started reviewing this PR, move along...
	if (github.reviews.length !== 0) {
		debug('Already has a review, skipping auto-assignment of requests');
		return;
	}

	// Based on the labels, auto-assign review requests to given teams
	const teamsToReview = [];
	if (labelsToAdd.has(Label.IOS)) {
		teamsToReview.push('ios');
	}
	if (labelsToAdd.has(Label.ANDROID)) {
		teamsToReview.push('android');
	}
	if (labelsToAdd.has(Label.DOCS)) {
		teamsToReview.push('docs');
	}
	if (teamsToReview.length === 0) {
		debug('Does not appear to have changes to iOS, Android or docs. Not auto-assigning reviews to teams');
		return;
	}

	const existingReviewers = github.requested_reviewers.teams;
	debug(`Existing review requests for this PR: ${JSON.stringify(existingReviewers)}`);
	const teamSlugs = existingReviewers.map(t => t.slug);

	// filter to the set of teams not already assigned to review (add only those missing)
	const filtered = teamsToReview.filter(t => !teamSlugs.includes(t));
	if (filtered.length > 0) {
		debug(`Assigning PR reviews to teams: ${filtered}`);
		await github.api.pullRequests.createReviewRequest({ owner: github.pr.base.repo.owner.login, repo: github.pr.base.repo.name, pull_number: github.pr.number, team_reviewers: filtered });
	}
}

// If a PR has a completed review that is approved, and does not have the in-qe-testing label, add it
async function checkPRisApproved() {
	const reviews = github.reviews;
	if (reviews.length === 0) {
		debug('There are no reviews, skipping auto-assignment check for in-qe-testing label');
		return;
	}

	// What about 'COMMENT' reviews?
	const blockers = reviews.filter(r => r.state === 'CHANGES_REQUESTED' || r.state === 'PENDING');
	const good = reviews.filter(r => r.state === 'APPROVED' || r.state === 'DISMISSED');
	if (good.length > 0 && blockers.length === 0) {
		labelsToAdd.add(Label.IN_QE_TESTING);
	}
	// TODO: Can we also check JIRA ticket and move it to In QE Testing?
}

// TODO: Can we check comments from a QE team member with "FR Passed"?

// Auto assign milestone based on version in package.json
async function updateMilestone() {
	const expected_milestone = packageJSON.version;
	// If there's a milestone assigned to the PR and it doesn't match up with expected version, emit warning
	if (github.pr.milestone && github.pr.milestone.title !== expected_milestone) {
		// Typically this is because:
		// - The milestone got out of date once we did some branch/version bumping
		// - The milestone was set wrong
		// - The milestone is for a future version on a maintenance branch (i.e. 8.1.1 on 8_1_X branch where we haven't released 8.1.0 yet)
		warn(`This PR has milestone set to ${github.pr.milestone.title}, but the version defined in package.json is ${packageJSON.version}
Please either:
- Update the milestone on the PR
- Update the version in package.json
- Hold the PR to be merged later after a release and version bump on this branch`);
		return;
	}
	const milestones = await github.api.issues.listMilestonesForRepo({ owner: github.pr.base.repo.owner.login, repo: github.pr.base.repo.name });
	const milestone_match = milestones.data.find(m => m.title === expected_milestone);
	if (!milestone_match) {
		debug('Unable to find a Github milestone matching the version in package.json');
		return;
	}
	await github.api.issues.update({ owner: github.pr.base.repo.owner.login, repo: github.pr.base.repo.name, issue_number: github.pr.number, milestone: milestone_match.number });
}

/**
 * Removes the set of labels from an issue (if they already existed on it)
 */
async function removeLabels() {
	for (const label of labelsToRemove) {
		if (existingLabelNames.has(label)) {
			await github.api.issues.removeLabel({ owner: github.pr.base.repo.owner.login, repo: github.pr.base.repo.name, number: github.pr.number, name: label });
		}
	}
}

// Check for iOS crash file
async function checkForIOSCrash() {
	const files = await fs.readdir(__dirname);
	const crashFiles = files.filter(p => p.startsWith('mocha_') && p.endsWith('.crash'));
	if (crashFiles.length > 0) {
		const crashLink = danger.utils.href(`${ENV.BUILD_URL}artifact/${crashFiles[0]}`, 'the crash log');
		fail(`Test suite crashed on iOS simulator. Please see ${crashLink} for more details.`);
	}
}

// Add link to built SDK zipfile!
async function linkToSDK() {
	if (ENV.BUILD_STATUS === 'SUCCESS' || ENV.BUILD_STATUS === 'UNSTABLE') {
		const sdkLink = danger.utils.href(`${ENV.BUILD_URL}artifact/${ENV.ZIPFILE}`, 'Here\'s the generated SDK zipfile');
		message(`:floppy_disk: ${sdkLink}.`);
	}
}

async function main() {
	// do a bunch of things in parallel
	// Specifically, anything that collects what labels to add or remove has to be done first before...
	await Promise.all([
		checkNPMTestOutput(),
		checkCommitMessages(),
		checkStats(github.pr),
		checkJIRA(),
		linkToSDK(),
		checkForIOSCrash(),
		junit({ pathToReport: './junit.*.xml' }),
		checkChangedFileLocations(),
		checkCommunity(),
		checkMergeable(),
		checkPRisApproved(),
		updateMilestone(),
		eslint(),
		dependencies({ type: 'npm' }),
	]);

	// ...once we've gathered what labels to add/remove, do that last
	await requestReviews();
	await removeLabels();
	await addMissingLabels();
}
main()
	.then(() => process.exit(0))
	.catch(err => {
		fail(err.toString());
		process.exit(1);
	});
