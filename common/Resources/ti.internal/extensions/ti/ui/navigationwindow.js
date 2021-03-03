/* globals OS_ANDROID */
if (OS_ANDROID) {
	// Avoid circular references in JSON structure
	Object.defineProperty(Titanium.UI.NavigationWindow.prototype, 'toJSON', {
		value: function () {
			const keys = Object.keys(this);
			const keyCount = keys.length;
			const serialized = {};

			for (let i = 0; i < keyCount; i++) {
				const k = keys[i];
				if (k === 'parent' || k === 'window' || k.charAt(0) === '_') {
					continue;
				}
				serialized[k] = this[k];
			}

			return serialized;
		},
		enumerable: false
	});
}
