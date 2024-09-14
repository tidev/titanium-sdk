/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* globals OS_ANDROID */

if (OS_ANDROID) {
	Number.prototype.toLocaleString = function () {
		const formatter = new Intl.NumberFormat(...arguments);
		return formatter.format(this.valueOf());
	};
}
