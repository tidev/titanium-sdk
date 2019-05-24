/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2018 by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

// Add a toJSON() method to all Error objects needed to output non-enumerable properties.
// The JSON.stringify() will automatically call this method if it exists to provide custom output.
// Notes:
// - In V8, all Error properties are not enumerable. We need this or else stringify() will return "{}".
// - In JavaScriptCore, only the "stack" property is not enumerable. We want to reveal this.
if ((typeof Error.prototype.toJSON) !== 'function') {
	Error.prototype.toJSON = function () {
		var properties = {};
		Object.getOwnPropertyNames(this).forEach(function (name) {
			properties[name] = this[name];
		}, this);
		return properties;
	};
}
