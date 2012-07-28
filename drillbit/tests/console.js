/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
describe("console tests", {

	consoleAPI: function() {
		valueOf(console).shouldBeObject();
		valueOf(console.log).shouldBeFunction();
		valueOf(console.warn).shouldBeFunction();
		valueOf(console.error).shouldBeFunction();
		valueOf(console.info).shouldBeFunction();
		valueOf(console.debug).shouldBeFunction();
	}
})