/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* globals OS_ANDROID */

if (OS_ANDROID) {
	const View = Titanium.UI.View;

	const _add = View.prototype.add;
	View.prototype.add = function (child) {

		if (child instanceof Titanium.TiWindow) {
			throw new Error('Cannot add window/tabGroup to a view.');
		}
		this._children = this._children || [];
		_add.call(this, child);
		// The children have to be retained by the view in the Javascript side
		// in order to let V8 know the relationship between children and the view.
		// Therefore, as long as its window is open, all its children won't be detached
		// or garbage collected and V8 will recoganize the closures and retain all
		// the related proxies.
		this._children.push(child);
	};

	const _remove = View.prototype.remove;
	View.prototype.remove = function (child) {
		_remove.call(this, child);

		// Remove the child in the Javascript side so it can be detached and garbage collected.
		const children = this._children || [];
		const childIndex = children.indexOf(child);
		if (childIndex !== -1) {
			children.splice(childIndex, 1);
		}
	};

	// Do not serialize the parent view. Doing so will result
	// in a circular reference loop.
	Object.defineProperty(Titanium.TiView.prototype, 'toJSON', {
		value: function () {
			const keys = Object.keys(this);
			const keyCount = keys.length;
			const serialized = {};

			for (let i = 0; i < keyCount; i++) {
				const k = keys[i];
				if (k === 'parent' || k.charAt(0) === '_') {
					continue;
				}
				serialized[k] = this[k];
			}

			return serialized;
		},
		enumerable: false
	});
}
