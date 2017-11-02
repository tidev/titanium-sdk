/* global danger, fail, warn, markdown, message */
'use strict';
// requires
const fs = require('fs-extra');
const path = require('path');
const DOMParser = require('xmldom').DOMParser;
// constants
const JIRARegexp = /https:\/\/jira\.appcelerator\.org\/browse\/[A-Z]+-\d+/;
const github = danger.github;
// Array to gather up the labels we want to auto-apply to the PR
const labels = [];

// To spit out the raw data we can use:
// markdown(JSON.stringify(github));

// Check if the user deleted more code than added, give a thumbs-up if so
if (github.pr.deletions > github.pr.additions) {
	message(':thumbsup: Hey!, You deleted more code than you added. That\'s awesome!');
}

// TODO Check for PRs above a certain threshold of changes and warn?

// Check that we have a JIRA Link in the body
const body = github.pr.body;
const hasJIRALink = body.match(JIRARegexp);
if (!hasJIRALink) {
	labels.push('needs jira');
	warn('There is no linked JIRA ticket in the PR body. Please include the URL of the relevant JIRA ticket. If you need to, you may file a ticket on ' + danger.utils.href('https://jira.appcelerator.org/secure/CreateIssue!default.jspa', 'JIRA'));
}

// Check that package.json and package-lock.json stay in-sync
const hasPackageChanges = danger.git.modified_files.indexOf('package.json') !== -1;
const hasLockfileChanges = danger.git.modified_files.indexOf('package-lock.json') !== -1;
if (hasPackageChanges && !hasLockfileChanges) {
	warn(':lock: Changes were made to package.json, but not to package-lock.json - <i>Perhaps you need to run `npm install`?</i>');
}

// Check that if we modify the Android or iOS SDK, we also update the tests
const modified = danger.git.modified_files.concat(danger.git.created_files);
const modifiedAndroidFiles = modified.filter(function (p) {
	return p.startsWith('android/') && p.endsWith('.java');
});
const modifiedIOSFiles = modified.filter(function (p) {
	return p.startsWith('iphone/Classes/') && (p.endsWith('.h') || p.endsWith('.m'));
});

// Auto-assign android/ios labels
if (modifiedAndroidFiles.length > 0) {
	labels.push('android');
}
if (modifiedIOSFiles.length > 0) {
	labels.push('ios');
}
// Check if apidoc was modified and apply 'docs' label?
const modifiedApiDocs = modified.filter(function (p) {
	return p.startsWith('apidoc/');
});
if (modifiedApiDocs.length > 0) {
	labels.push('docs');
}

// Check PR author to see if it's community, etc
if (github.pr.author_association === 'FIRST_TIMER') {
	labels.push('community');
	labels.push('needs cla');
	// Thank them profusely! This is their first ever github commit!
	message(`:rocket: Wow, ${github.pr.user.login}, your first contribution to GitHub and it's to help us make Titanium better! You rock! :guitar:`);
} else if (github.pr.author_association === 'FIRST_TIME_CONTRIBUTOR') {
	labels.push('community');
	labels.push('needs cla');
	// Thank them, this is their first contribution to this repo!
	message(`:confetti_ball: Welcome to the Titanium SDK community, ${github.pr.user.login}! Thank you so much for your PR, you're helping us make Titanium better. :gift:`);
} else if (github.pr.author_association === 'CONTRIBUTOR') {
	labels.push('community');
	// Be nice, this is a community member who has landed PRs before!
	message(`:tada: Another contribution from our awesome community member, ${github.pr.user.login}! Thanks again for helping us make Titanium SDK better. :thumbsup:`);
}
// Now apply our labels
github.api.issues.addLabels({ owner: github.pr.base.repo.owner.login, repo: github.pr.base.repo.name, number: github.pr.number, labels: labels });

// Check if any tests were changed/added
const hasAppChanges = (modifiedAndroidFiles.length + modifiedIOSFiles.length) > 0;
const testChanges = modified.filter(function (p) {
	return p.startsWith('tests/') && p.endsWith('.js');
});
const hasTestChanges = testChanges.length > 0;
if (hasAppChanges && !hasTestChanges) {
	const link = github.utils.fileLinks([ 'README.md#unit-tests' ]);
	// TODO: Apply 'needs tests' label?
	fail(`:microscope: There are library changes, but no changes to the unit tests. That's OK as long as you're refactoring existing code, but will require an admin to merge this PR. Please see ${link} for docs on unit testing.`); // eslint-disable-line max-len
}

function gatherFailedTestcases(reportPath) {
	if (!fs.existsSync(reportPath)) {
		return [];
	}
	const contents = fs.readFileSync(reportPath);
	const doc = new DOMParser().parseFromString(contents.toString(), 'text/xml');
	const suite_root = doc.documentElement.firstChild.tagName === 'testsuites' ? doc.documentElement.firstChild : doc.documentElement;
	const suites = Array.from(suite_root.getElementsByTagName('testsuite'));

	// We need to get the 'testcase' elements that have an 'error' or 'failure' child node
	const failed_suites = suites.filter(function (suite) {
		const hasFailures = suite.hasAttribute('failures') && parseInt(suite.getAttribute('failures')) !== 0;
		const hasErrors = suite.hasAttribute('errors') && parseInt(suite.getAttribute('errors')) !== 0;
		return hasFailures || hasErrors;
	});
	// Gather all the testcase nodes from each failed suite properly.
	let failed_suites_all_tests = [];
	failed_suites.forEach(function (suite) {
		failed_suites_all_tests = failed_suites_all_tests.concat(Array.from(suite.getElementsByTagName('testcase')));
	});
	return failed_suites_all_tests.filter(function (test) {
		return test.hasChildNodes() && (test.getElementsByTagName('failure').length > 0 || test.getElementsByTagName('error').length > 0);
	});
}

// Give details on failed mocha suite tests
const failedAndroidTests = gatherFailedTestcases(path.join(__dirname, 'junit.android.xml'));
const failedIOSTests = gatherFailedTestcases(path.join(__dirname, 'junit.ios.xml'));
const failures_and_errors = [ ...failedAndroidTests, ...failedIOSTests ];
if (failures_and_errors.length !== 0) {
	fail('Tests have failed, see below for more information.');
	let message = '### Tests: \n\n';
	const keys = Array.from(failures_and_errors[0].attributes).map(function (attr) {
		return attr.nodeName;
	});
	const attributes = keys.map(function (key) {
		return key.substr(0, 1).toUpperCase() + key.substr(1).toLowerCase();
	});
	attributes.push('Error');

	// TODO Include stderr/stdout, or full test stack too?
	// Create the headers
	message += '| ' + attributes.join(' | ') + ' |\n';
	message += '| ' + attributes.map(function () {
		return '---';
	}).join(' | ') + ' |\n';

	// Map out the keys to the tests
	failures_and_errors.forEach(function (test) {
		const row_values = keys.map(function (key) {
			return test.getAttribute(key);
		});
		// push error/failure message too
		const errors = test.getElementsByTagName('error');
		if (errors.length !== 0) {
			row_values.push(errors.item(0).getAttribute('message'));
		} else {
			const failures = test.getElementsByTagName('failure');
			if (failures.length !== 0) {
				row_values.push(failures.item(0).getAttribute('message'));
			} else {
				row_values.push(''); // This shouldn't ever happen
			}
		}
		message += '| ' + row_values.join(' | ') + ' |\n';
	});

	markdown(message);
}
// TODO Pass along any warnings/errors from eslint in a readable way? Right now we don't have any way to get at the output of the eslint step of npm test
// May need to edit Jenkinsfile to do a try/catch to spit out the npm test output to some file this dangerfile can consume?
// Or port https://github.com/leonhartX/danger-eslint/blob/master/lib/eslint/plugin.rb to JS - have it run on any edited/added JS files?
