/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2020 by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

if (OS_ANDROID) {
	Number.prototype.toLocaleString = function () {
		const formatter = new Intl.NumberFormat(...arguments);
		return formatter.format(this.valueOf());
	};
}
