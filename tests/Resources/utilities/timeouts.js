'use strict';

// Timeout constants (milliseconds) for the integration test suite.
// Use these named constants in test files instead of literal
// `this.timeout(<number>)` so timeouts are tunable in one place and
// the category of each timeout is legible at the call site.
//
// Categories:
//   DEFAULT           — the baseline for ordinary unit-style tests.
//   LONG              — for tests that do non-trivial setup or wait on
//                       a single async round-trip.
//   NETWORK           — for tests that hit postman-echo.com (endpoints
//                       in tests/Resources/utilities/endpoints.js).
//   UI_ANIMATION       — for tests that wait on an animation completing
//                       (e.g. window open/close, listview scroll).
//   PERMISSION_PROMPT  — for tests that trigger an OS permission dialog
//                       (camera, location, photo library). The user (or
//                       the test harness) must accept the dialog.
//   SNAPSHOT           — for image-snapshot capture + pixel diffing.
//   DEVICE_OPERATION   — for slow device-only flows: simulator boot,
//                       app install, first launch, or pulling a file
//                       off a real device via adb/ios-deploy.
const DEFAULT = 10000;
const LONG = 30000;
const NETWORK = 60000;
const UI_ANIMATION = 20000;
const PERMISSION_PROMPT = 30000;
const SNAPSHOT = 30000;
const DEVICE_OPERATION = 120000;

module.exports = {
	DEFAULT,
	LONG,
	NETWORK,
	UI_ANIMATION,
	PERMISSION_PROMPT,
	SNAPSHOT,
	DEVICE_OPERATION,
};
