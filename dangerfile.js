/* global danger, fail, warn, message */

// requires
const debug = require('debug')('dangerfile');
const fs = require('fs-extra');
const eslint = require('@seadub/danger-plugin-eslint').default;
const junit = require('@seadub/danger-plugin-junit').default;
const dependencies = require('@seadub/danger-plugin-dependencies').default;
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

// Check that we have a JIRA Link in the body
async function checkJIRA() {
	const body = github.pr.body;
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
	const modified = danger.git.modified_files.concat(danger.git.created_files);
	const modifiedAndroidFiles = modified.filter(p => p.startsWith('android/') && p.endsWith('.java'));
	const modifiedIOSFiles = modified.filter(p => {
		return p.startsWith('iphone/') && (p.endsWith('.h') || p.endsWith('.m'));
	});

	// Auto-assign android/ios labels
	if (modifiedAndroidFiles.length > 0) {
		labelsToAdd.add(Label.ANDROID);
	}
	if (modifiedIOSFiles.length > 0) {
		labelsToAdd.add(Label.IOS);
	}
	// Check if apidoc was modified and apply 'docs' label?
	const modifiedApiDocs = modified.filter(p => p.startsWith('apidoc/'));
	if (modifiedApiDocs.length > 0) {
		labelsToAdd.add(Label.DOCS);
	}
	// Mark hasAppChanges if 'common' dir is changed too!
	const modifiedCommonJSAPI = modified.filter(p => p.startsWith('common/'));

	// Check if any tests were changed/added
	const hasAppChanges = (modifiedAndroidFiles.length + modifiedIOSFiles.length + modifiedCommonJSAPI.length) > 0;
	const testChanges = modified.filter(p => p.startsWith('tests/') && p.endsWith('.js'));
	const hasTestChanges = testChanges.length > 0;
	const hasNoTestsLabel = existingLabelNames.has(Label.NO_TESTS);
	// If we changed android/iOS source, but didn't change tests and didn't use the 'no tests' label
	// fail the PR
	if (hasAppChanges && !hasTestChanges && !hasNoTestsLabel) {
		labelsToAdd.add(Label.NEEDS_TESTS);
		const testDocLink = github.utils.fileLinks([ 'README.md#unit-tests' ]);
		fail(`:microscope: There are library changes, but no changes to the unit tests. That's OK as long as you're refactoring existing code, but will require an admin to merge this PR. Please see ${testDocLink} for docs on unit testing.`); // eslint-disable-line max-len
	} else {
		// If it has the "needs tests" label, remove it
		labelsToRemove.add(Label.NEEDS_TESTS);
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
	// Don't give special thanks to the greenkeeper bot account
	if (github.pr.user.login === 'greenkeeper[bot]') {
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
	await github.api.issues.addLabels({ owner: github.pr.base.repo.owner.login, repo: github.pr.base.repo.name, number: github.pr.number, labels: filteredLabels });
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
		await github.api.pullRequests.createReviewRequest({ owner: github.pr.base.repo.owner.login, repo: github.pr.base.repo.name, number: github.pr.number, team_reviewers: filtered });
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
}

// Auto assign milestone based on version in package.json
async function updateMilestone() {
	if (github.pr.milestone) {
		return;
	}
	const expected_milestone = packageJSON.version;
	const milestones = await github.api.issues.listMilestonesForRepo({ owner: github.pr.base.repo.owner.login, repo: github.pr.base.repo.name });
	const milestone_match = milestones.data.find(m => m.title === expected_milestone);
	if (!milestone_match) {
		debug('Unable to find a Github milestone matching the version in package.json');
		return;
	}
	await github.api.issues.update({ owner: github.pr.base.repo.owner.login, repo: github.pr.base.repo.name, number: github.pr.number, milestone: milestone_match.number });
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
