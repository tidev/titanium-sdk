/* globals OS_ANDROID */
if (OS_ANDROID) {
	// Avoid circular references in JSON structure
	Object.defineProperty(Titanium.Activity.prototype, 'toJSON', {
		value: function () {
			const keys = Object.keys(this);
			const keyCount = keys.length;
			const serialized = {};

			for (let i = 0; i < keyCount; i++) {
				const k = keys[i];
				if (k === 'window' || k === 'intent' || k.charAt(0) === '_') {
					continue;
				}
				serialized[k] = this[k];
			}

			return serialized;
		},
		enumerable: false
	});
}
