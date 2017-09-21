/* global danger, fail, warn, markdown, message */
'use strict';
const fs = require('fs-extra'),
	path = require('path'),
	DOMParser = require('xmldom').DOMParser;

// To spit out the raw data we can use:
// markdown(JSON.stringify(danger));

// Check if the user deleted more code than added, give a thumbs-up if so
if (danger.github.pr.deletions > danger.github.pr.additions) {
	message(':thumbsup: Hey!, You deleted more code than you added. That\'s awesome!');
}

// TODO Check for PRs above a certain threshold of changes and warn?

// Check that we have a JIRA Link in the body
const body = danger.github.pr.body;
const JIRARegexp = /https:\/\/jira\.appcelerator\.org\/browse\/[A-Z]+-\d+/;
const hasJIRALink = body.match(JIRARegexp);
if (!hasJIRALink) {
	warn('There is no linked JIRA ticket in the PR body. Please include the URL of the relevant JIRA ticket. If you need to, you may file a ticket on ' + danger.utils.href('https://jira.appcelerator.org/secure/CreateIssue!default.jspa', 'JIRA'));
}

// Check that package.json and package-lock.json stay in-sync
const hasPackageChanges = danger.git.modified_files.indexOf('package.json') !== -1;
const hasLockfileChanges = danger.git.modified_files.indexOf('package-lock.json') !== -1;
if (hasPackageChanges && !hasLockfileChanges) {
	const message = ':lock: Changes were made to package.json, but not to package-lock.json';
	const idea = 'Perhaps you need to run `npm install`?';
	warn(message + ' - <i>' + idea + '</i>');
}

// Check that if we modify the Android or iOS SDK, we also update the tests
const modified = danger.git.modified_files.concat(danger.git.created_files);
const modifiedAndroidFiles = modified.filter(function (p) {
	return p.startsWith('android/') && p.endsWith('.java');
});
const modifiedIOSFiles = modified.filter(function (p) {
	return p.startsWith('iphone/Classes/') && (p.endsWith('.h') || p.endsWith('.m'));
});
const hasAppChanges = (modifiedAndroidFiles.length + modifiedIOSFiles.length) > 0;

const testChanges = modified.filter(function (p) {
	return p.startsWith('tests/') && p.endsWith('.js');
});
const hasTestChanges = testChanges.length > 0;
if (hasAppChanges && !hasTestChanges) {
	warn(':microscope: There are library changes, but no changes to the unit tests. That\'s OK as long as you\'re refactoring existing code');
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
const failures_and_errors = [...failedAndroidTests, ...failedIOSTests];
if (failures_and_errors.length !== 0) {
	fail('Tests have failed, see below for more information.');
	let message = '### Tests: \n\n';
	const keys = Array.from(failures_and_errors[0].attributes).map(function (attr) {
		return attr.nodeName;
	});
	const attributes = keys.map(function (key) {
		return key.substr(0,1).toUpperCase() + key.substr(1).toLowerCase();
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
				row_values.push(errors.item(0).getAttribute('message'));
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
