/* global danger, warn, markdown, message */
'use strict';
// import { danger, fail, warn } from "danger"
// const danger = require('danger');

// Check that package.json and package-lock.json stay in-sync
const hasPackageChanges = danger.git.modified_files.indexOf('package.json') !== -1;
const hasLockfileChanges = danger.git.modified_files.indexOf('package-lock.json') !== -1;
if (hasPackageChanges && !hasLockfileChanges) {
	warn('There are package.json changes with no corresponding lockfile changes');
}

markdown('Testing, 1, 2, 3!');
message('Yeah this is a message');
//
// const filesOnly = (file: string) => file.endsWith("/")
// const modifiedAppFiles = modified.filter(p => p.includes("lib/")).filter(p => filesOnly(p) && typescriptOnly(p))
// const hasAppChanges = modifiedAppFiles.length > 0;
//
// const testChanges = modifiedAppFiles.filter(filepath =>
//   filepath.includes('test'),
// );
// const hasTestChanges = testChanges.length > 0;
//
// // Warn if there are library changes, but not tests
// if (hasAppChanges && !hasTestChanges) {
//   warn(
//     "There are library changes, but not tests. That's OK as long as you're refactoring existing code",
//   );
// }
