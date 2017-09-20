/* global danger, warn, message */
'use strict';

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

// TODO Give details on failed tests if we can? Right now we don't run at the
// right stage to be able to report that. We can move danger to around the Depoy stage
// and then we can look at the junit report files... Basically a rewrite of https://github.com/orta/danger-junit for JS...

// TODO Pass along any warnings/errors from eslint in a readable way? Right now we don't have any way to get at the output of the eslint step of npm test
// May need to edit Jenkinsfile to do a try/catch to spit out the npm test output to some file this dangerfile can consume?
// Or port https://github.com/leonhartX/danger-eslint/blob/master/lib/eslint/plugin.rb to JS - have it run on any edited/added JS files?
