/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* globals OS_ANDROID */

if (OS_ANDROID) {
	const TabGroup = Titanium.UI.TabGroup;

	// Avoid circular loops in toJSON()
	Object.defineProperty(TabGroup.prototype, 'toJSON', {
		value: function () {
			const keys = Object.keys(this);
			const keyCount = keys.length;
			const serialized = {};

			for (let i = 0; i < keyCount; i++) {
				const k = keys[i];
				if (k === 'activity' || k.charAt(0) === '_') {
					continue;
				}
				serialized[k] = this[k];
			}

			return serialized;
		},
		enumerable: false
	});

	Object.defineProperty(Titanium.UI.Tab.prototype, 'toJSON', {
		value: function () {
			const keys = Object.keys(this);
			const keyCount = keys.length;
			const serialized = {};

			for (let i = 0; i < keyCount; i++) {
				const k = keys[i];
				if (k === 'window' || k === 'tabGroup' || k.charAt(0) === '_') {
					continue;
				}
				serialized[k] = this[k];
			}

			return serialized;
		},
		enumerable: false
	});
}
